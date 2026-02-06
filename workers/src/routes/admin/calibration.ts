/**
 * Admin endpoints for Benchmark Calibration
 * Mount: /api/admin/calibration
 *
 * 실제 분석 데이터 기반 벤치마크 가격 보정 제안 시스템
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * POST /run
 * 최근 30일 분석 데이터 vs 벤치마크 비교, 10%+ 차이 시 보정 제안 생성
 */
app.post('/run', async (c) => {
	try {
		// 최근 30일 분석 항목에서 벤치마크 매칭된 것만 추출
		const analysisItems = await findMany(
			c.env.DATABASE_URL,
			`SELECT
				ai.std_category,
				ai.std_item,
				ai.original_unit_price,
				ai.original_total_price,
				ai.original_quantity,
				ai.benchmark_unit_price,
				ai.adjusted_benchmark_price,
				a.region
			FROM analysis_items ai
			JOIN analyses a ON a.id = ai.analysis_id
			WHERE a.created_at > NOW() - INTERVAL '30 days'
				AND a.status = 'completed'
				AND ai.std_category IS NOT NULL
				AND ai.benchmark_unit_price IS NOT NULL
				AND ai.original_unit_price IS NOT NULL
				AND ai.is_bundled = false
			ORDER BY ai.std_category, ai.std_item`
		)

		if (!analysisItems || analysisItems.length === 0) {
			return c.json({ message: '최근 30일 분석 데이터가 없습니다.', suggestions: [] })
		}

		// 카테고리+항목별 그룹화
		const groups = new Map<string, Array<{ quoted: number; benchmark: number }>>()
		for (const item of analysisItems) {
			const key = `${item.std_category}::${item.std_item}`
			if (!groups.has(key)) groups.set(key, [])
			const unitPrice = Number(item.original_unit_price)
			if (unitPrice > 0) {
				groups.get(key)!.push({
					quoted: unitPrice,
					benchmark: Number(item.benchmark_unit_price),
				})
			}
		}

		// 벤치마크 로드
		const benchmarks = await findMany(
			c.env.DATABASE_URL,
			`SELECT id, std_category, std_item, grade, unit_price
			 FROM benchmark_prices WHERE is_active = true`
		)

		const suggestions: Array<Record<string, unknown>> = []

		for (const [key, samples] of groups) {
			if (samples.length < 3) continue // 최소 3건 이상

			const [stdCategory, stdItem] = key.split('::')
			const quotedPrices = samples.map(s => s.quoted).sort((a, b) => a - b)
			const avgQuoted = Math.round(quotedPrices.reduce((a, b) => a + b, 0) / quotedPrices.length)
			const medianQuoted = quotedPrices[Math.floor(quotedPrices.length / 2)]

			// 해당 벤치마크 찾기
			const matchingBenchmarks = benchmarks.filter(
				(b: Record<string, unknown>) => b.std_category === stdCategory && b.std_item === stdItem
			)

			for (const bench of matchingBenchmarks) {
				const benchPrice = Number(bench.unit_price)
				const changePercent = ((avgQuoted - benchPrice) / benchPrice) * 100

				if (Math.abs(changePercent) < 10) continue // 10% 미만 차이 = 무시

				const confidence = samples.length >= 10 ? 'high'
					: samples.length >= 5 ? 'medium' : 'low'

				// 중복 체크
				const existing = await query(
					c.env.DATABASE_URL,
					`SELECT id FROM benchmark_calibration_log
					 WHERE std_category = $1 AND std_item = $2 AND grade = $3
					 AND status = 'suggested'`,
					[stdCategory, stdItem, bench.grade]
				)

				if (existing.length > 0) continue

				const suggestedPrice = Math.round(avgQuoted)

				await query(
					c.env.DATABASE_URL,
					`INSERT INTO benchmark_calibration_log (
						benchmark_price_id, std_category, std_item, grade,
						old_unit_price, new_unit_price, change_percent,
						sample_count, avg_quoted_price, median_quoted_price,
						confidence, status
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'suggested')`,
					[
						bench.id, stdCategory, stdItem, bench.grade,
						benchPrice, suggestedPrice, Math.round(changePercent * 100) / 100,
						samples.length, avgQuoted, medianQuoted,
						confidence,
					]
				)

				suggestions.push({
					std_category: stdCategory,
					std_item: stdItem,
					grade: bench.grade,
					old_price: benchPrice,
					suggested_price: suggestedPrice,
					change_percent: Math.round(changePercent * 100) / 100,
					sample_count: samples.length,
					confidence,
				})
			}
		}

		return c.json({
			success: true,
			message: `${suggestions.length}건의 보정 제안이 생성되었습니다.`,
			suggestions,
		})
	} catch (error) {
		console.error('[Calibration] Run error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * GET /
 * 보정 제안 목록 (status 필터)
 */
app.get('/', async (c) => {
	try {
		const status = c.req.query('status') || 'suggested'
		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM benchmark_calibration_log
			 WHERE status = $1
			 ORDER BY created_at DESC
			 LIMIT 100`,
			[status]
		)
		return c.json({ data: rows })
	} catch (error) {
		console.error('[Calibration] List error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id/approve
 * 보정 승인 → benchmark_prices 업데이트
 */
app.put('/:id/approve', async (c) => {
	try {
		const id = c.req.param('id')

		// 보정 로그 조회
		const rows = await query(
			c.env.DATABASE_URL,
			`SELECT * FROM benchmark_calibration_log WHERE id = $1 AND status = 'suggested'`,
			[id]
		)
		if (!rows.length) {
			return c.json({ error: '보정 제안을 찾을 수 없거나 이미 처리되었습니다.' }, 404)
		}

		const log = rows[0] as Record<string, unknown>

		// benchmark_prices 업데이트
		if (log.benchmark_price_id) {
			await query(
				c.env.DATABASE_URL,
				`UPDATE benchmark_prices SET unit_price = $1, updated_at = NOW() WHERE id = $2`,
				[log.new_unit_price, log.benchmark_price_id]
			)
		}

		// 보정 로그 승인 처리
		await query(
			c.env.DATABASE_URL,
			`UPDATE benchmark_calibration_log
			 SET status = 'approved', approved_by = 'admin', applied_at = NOW()
			 WHERE id = $1`,
			[id]
		)

		return c.json({
			success: true,
			message: `${log.std_category} > ${log.std_item} (${log.grade}) 보정 승인 완료`,
		})
	} catch (error) {
		console.error('[Calibration] Approve error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id/reject
 * 보정 거부
 */
app.put('/:id/reject', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json().catch(() => ({})) as Record<string, unknown>

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE benchmark_calibration_log
			 SET status = 'rejected', notes = $2
			 WHERE id = $1 AND status = 'suggested'
			 RETURNING id`,
			[id, body.notes || null]
		)

		if (!rows.length) {
			return c.json({ error: '보정 제안을 찾을 수 없거나 이미 처리되었습니다.' }, 404)
		}

		return c.json({ success: true, message: '보정 제안이 거부되었습니다.' })
	} catch (error) {
		console.error('[Calibration] Reject error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

export default app
