/**
 * Admin endpoints for Unmapped Terms
 * Mount: /api/admin/unmapped-terms
 *
 * matchCategory() 실패 용어 자동 수집 → 관리자 매핑 생성
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findMany, findOne } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /
 * 미매핑 용어 목록 (빈도순 정렬, status 필터)
 */
app.get('/', async (c) => {
	try {
		const status = c.req.query('status') || 'pending'
		const page = parseInt(c.req.query('page') || '1')
		const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
		const offset = (page - 1) * limit

		const countResult = await query(
			c.env.DATABASE_URL,
			`SELECT COUNT(*) as total FROM unmapped_terms WHERE status = $1`,
			[status]
		)
		const total = parseInt(String(countResult[0]?.total || '0'))

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM unmapped_terms
			 WHERE status = $1
			 ORDER BY frequency DESC, last_seen_at DESC
			 LIMIT $2 OFFSET $3`,
			[status, limit, offset]
		)

		return c.json({
			data: rows,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		})
	} catch (error) {
		console.error('[UnmappedTerms] List error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * GET /stats
 * 요약 통계
 */
app.get('/stats', async (c) => {
	try {
		const stats = await query(
			c.env.DATABASE_URL,
			`SELECT
				COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
				COUNT(*) FILTER (WHERE status = 'mapped') as mapped_count,
				COUNT(*) FILTER (WHERE status = 'ignored') as ignored_count,
				SUM(frequency) FILTER (WHERE status = 'pending') as total_occurrences,
				MAX(last_seen_at) as latest_seen
			FROM unmapped_terms`
		)

		return c.json({ data: stats[0] || {} })
	} catch (error) {
		console.error('[UnmappedTerms] Stats error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /:id/map
 * 매핑 생성: category_mappings에 추가 + status='mapped'
 */
app.post('/:id/map', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json()

		if (!body.std_category || !body.std_item) {
			return c.json({ error: 'std_category와 std_item은 필수입니다.' }, 400)
		}

		// 미매핑 용어 조회
		const term = await findOne(
			c.env.DATABASE_URL,
			`SELECT * FROM unmapped_terms WHERE id = $1 AND status = 'pending'`,
			[id]
		)
		if (!term) {
			return c.json({ error: '미매핑 용어를 찾을 수 없거나 이미 처리되었습니다.' }, 404)
		}

		// category_mappings에 추가 (중복 무시)
		const originalName = (term as Record<string, unknown>).combined_search_text as string
		await query(
			c.env.DATABASE_URL,
			`INSERT INTO category_mappings (original_name, std_category, std_item, aliases, is_verified)
			 VALUES ($1, $2, $3, $4, true)
			 ON CONFLICT (original_name) DO UPDATE SET
				std_category = $2, std_item = $3, is_verified = true, updated_at = NOW()`,
			[originalName, body.std_category, body.std_item, JSON.stringify(body.aliases || [])]
		)

		// unmapped_terms 상태 업데이트
		await query(
			c.env.DATABASE_URL,
			`UPDATE unmapped_terms SET
				status = 'mapped',
				mapped_to_category = $2,
				mapped_to_item = $3,
				resolved_by = 'admin',
				resolved_at = NOW()
			WHERE id = $1`,
			[id, body.std_category, body.std_item]
		)

		return c.json({
			success: true,
			message: `"${originalName}" → ${body.std_category} > ${body.std_item} 매핑 완료`,
		})
	} catch (error) {
		console.error('[UnmappedTerms] Map error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id/ignore
 * 무시 처리
 */
app.put('/:id/ignore', async (c) => {
	try {
		const id = c.req.param('id')

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE unmapped_terms SET
				status = 'ignored',
				resolved_by = 'admin',
				resolved_at = NOW()
			WHERE id = $1 AND status = 'pending'
			RETURNING id`,
			[id]
		)

		if (!rows.length) {
			return c.json({ error: '미매핑 용어를 찾을 수 없거나 이미 처리되었습니다.' }, 404)
		}

		return c.json({ success: true, message: '무시 처리 완료' })
	} catch (error) {
		console.error('[UnmappedTerms] Ignore error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

export default app
