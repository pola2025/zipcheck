/**
 * Admin endpoints for Market Price Crawler
 * Mount: /api/admin/market-prices
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import {
	runMarketPriceCrawl,
	getAllSearchQueries,
	getTotalQueryCount,
	getDefaultMarginRates,
	setMarginRates,
} from '../../services/market-price-crawler'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * POST /crawl
 * 수동 크롤 트리거
 * Body: { category?: string, maxQueries?: number, resume?: boolean }
 */
app.post('/crawl', async (c) => {
	try {
		const body = await c.req.json().catch(() => ({})) as {
			category?: string
			maxQueries?: number
			resume?: boolean
		}

		const summary = await runMarketPriceCrawl(c.env, {
			category: body.category,
			maxQueries: body.maxQueries || 10,
			resumeFromProgress: body.resume || false,
		})

		return c.json({
			success: true,
			...summary,
		})
	} catch (error) {
		console.error('[MarketPrices] Crawl error:', error)
		return c.json({
			error: error instanceof Error ? error.message : 'Unknown error',
		}, 500)
	}
})

/**
 * GET /results
 * 구글 검색 기반 벤치마크 결과 조회
 * Query: category, confidence, page, limit
 */
app.get('/results', async (c) => {
	try {
		const category = c.req.query('category')
		const confidence = c.req.query('confidence')
		const page = parseInt(c.req.query('page') || '1')
		const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200)
		const offset = (page - 1) * limit

		let where = `WHERE source = 'google_search'`
		const params: unknown[] = []
		let idx = 1

		if (category) {
			where += ` AND std_category = $${idx++}`
			params.push(category)
		}
		if (confidence) {
			where += ` AND model = $${idx++}`
			params.push(confidence)
		}

		const countResult = await query(
			c.env.DATABASE_URL,
			`SELECT COUNT(*) as total FROM benchmark_prices ${where}`,
			params,
		)
		const total = parseInt(String(countResult[0]?.total || '0'))

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT id, std_category, std_item, unit_price, unit, grade,
				brand as search_query, model as confidence, material as market_price,
				source, region, reference_date, is_active,
				created_at, updated_at
			FROM benchmark_prices ${where}
			ORDER BY created_at DESC, std_category, std_item
			LIMIT $${idx++} OFFSET $${idx++}`,
			[...params, limit, offset],
		)

		return c.json({
			data: rows,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		})
	} catch (error) {
		console.error('[MarketPrices] Results error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * GET /stats
 * 크롤링 통계 — 카테고리별 커버리지, 신뢰도 분포
 */
app.get('/stats', async (c) => {
	try {
		// 카테고리별 구글 벤치마크 수
		const categoryStats = await query(
			c.env.DATABASE_URL,
			`SELECT std_category, model as confidence, COUNT(*) as count,
				AVG(unit_price) as avg_cost, AVG(CAST(material AS numeric)) as avg_market_price
			FROM benchmark_prices
			WHERE source = 'google_search' AND is_active = true
			GROUP BY std_category, model
			ORDER BY std_category`,
		)

		// 전체 벤치마크 대비 구글 비율
		const totalStats = await query(
			c.env.DATABASE_URL,
			`SELECT
				COUNT(*) FILTER (WHERE source = 'google_search') as google_count,
				COUNT(*) FILTER (WHERE source != 'google_search' OR source IS NULL) as manual_count,
				COUNT(*) as total_count
			FROM benchmark_prices
			WHERE is_active = true`,
		)

		// 검색 쿼리 목록
		const allQueries = getAllSearchQueries()
		const totalQueries = getTotalQueryCount()

		// KV에서 오늘 API 사용량
		const today = new Date().toISOString().slice(0, 10)
		const dailyApiCount = await c.env.KV.get(`market_price_api_count_${today}`)

		// 마진율 설정
		const marginRates = getDefaultMarginRates()

		return c.json({
			categoryStats,
			totalStats: totalStats[0],
			queryInfo: {
				totalQueries,
				categories: Object.keys(allQueries).length,
				queriesPerCategory: Object.fromEntries(
					Object.entries(allQueries).map(([k, v]) => [k, v.length])
				),
			},
			apiUsage: {
				today: parseInt(dailyApiCount || '0'),
				dailyLimit: 90,
			},
			marginRates,
		})
	} catch (error) {
		console.error('[MarketPrices] Stats error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id/approve
 * 구글 벤치마크 승인/비승인 토글
 * Body: { is_active: boolean }
 */
app.put('/:id/approve', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json() as { is_active?: boolean }

		if (body.is_active === undefined) {
			return c.json({ error: 'is_active 필드가 필요합니다.' }, 400)
		}

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE benchmark_prices
			SET is_active = $1, updated_at = NOW()
			WHERE id = $2 AND source = 'google_search'
			RETURNING *`,
			[body.is_active, id],
		)

		if (!rows.length) {
			return c.json({ error: '구글 벤치마크를 찾을 수 없습니다.' }, 404)
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[MarketPrices] Approve error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /margin-rates
 * 카테고리별 마진율 커스텀 설정
 * Body: { rates: { "바닥": 0.20, "욕실": 0.18, ... } }
 */
app.post('/margin-rates', async (c) => {
	try {
		const body = await c.req.json() as { rates?: Record<string, number> }

		if (!body.rates || typeof body.rates !== 'object') {
			return c.json({ error: 'rates 객체가 필요합니다.' }, 400)
		}

		// 유효성 검증: 0~1 범위
		for (const [cat, rate] of Object.entries(body.rates)) {
			if (typeof rate !== 'number' || rate < 0 || rate > 1) {
				return c.json({ error: `${cat}의 마진율이 유효하지 않습니다 (0~1 범위).` }, 400)
			}
		}

		await setMarginRates(c.env, body.rates)

		return c.json({
			success: true,
			message: '마진율이 업데이트되었습니다.',
			rates: body.rates,
		})
	} catch (error) {
		console.error('[MarketPrices] Margin rates error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

export default app
