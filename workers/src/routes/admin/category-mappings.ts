/**
 * Admin endpoints for Category Mappings (정규화 매핑)
 * Mount: /api/admin/category-mappings
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /
 * 매핑 목록 (카테고리 필터, 자동완성용 검색)
 */
app.get('/', async (c) => {
	try {
		const category = c.req.query('category')
		const search = c.req.query('search')
		const limit = Math.min(parseInt(c.req.query('limit') || '100'), 500)

		let where = 'WHERE 1=1'
		const params: unknown[] = []
		let idx = 1

		if (category) {
			where += ` AND std_category = $${idx++}`
			params.push(category)
		}
		if (search) {
			where += ` AND (original_name ILIKE $${idx} OR std_item ILIKE $${idx})`
			params.push(`%${search}%`)
			idx++
		}

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM category_mappings ${where}
			 ORDER BY frequency DESC, std_category, std_item
			 LIMIT $${idx}`,
			[...params, limit]
		)

		return c.json({ data: rows })
	} catch (error) {
		console.error('[CategoryMappings] List error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /
 * 매핑 추가
 */
app.post('/', async (c) => {
	try {
		const body = await c.req.json()

		if (!body.original_name || !body.std_category || !body.std_item) {
			return c.json({ error: '원본명, 카테고리, 표준항목명은 필수입니다.' }, 400)
		}

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO category_mappings (
				original_name, std_category, std_item, aliases,
				frequency, is_verified, verified_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT (original_name, std_category, std_item)
			 DO UPDATE SET
				aliases = COALESCE($4, category_mappings.aliases),
				frequency = category_mappings.frequency + 1,
				updated_at = NOW()
			 RETURNING *`,
			[
				body.original_name,
				body.std_category,
				body.std_item,
				body.aliases || [],
				body.frequency || 1,
				body.is_verified || false,
				body.verified_by || null,
			]
		)

		return c.json({ success: true, data: rows[0] }, 201)
	} catch (error) {
		console.error('[CategoryMappings] Create error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id
 */
app.put('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json()

		const allowed = [
			'original_name', 'std_category', 'std_item', 'aliases',
			'frequency', 'is_verified', 'verified_by'
		]

		const updates: string[] = []
		const values: unknown[] = []
		let idx = 1

		for (const key of allowed) {
			if (body[key] !== undefined) {
				updates.push(`${key} = $${idx++}`)
				values.push(body[key])
			}
		}

		if (updates.length === 0) {
			return c.json({ error: '업데이트할 필드가 없습니다.' }, 400)
		}

		updates.push(`updated_at = NOW()`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE category_mappings SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
			[...values, id]
		)

		if (!rows.length) {
			return c.json({ error: '매핑을 찾을 수 없습니다.' }, 404)
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[CategoryMappings] Update error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * DELETE /:id
 */
app.delete('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const rows = await query(
			c.env.DATABASE_URL,
			'DELETE FROM category_mappings WHERE id = $1 RETURNING id',
			[id]
		)
		if (!rows.length) {
			return c.json({ error: '매핑을 찾을 수 없습니다.' }, 404)
		}
		return c.json({ success: true })
	} catch (error) {
		console.error('[CategoryMappings] Delete error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * GET /suggest
 * 자동 제안 (원본 항목명 기반)
 */
app.get('/suggest', async (c) => {
	try {
		const name = c.req.query('name')
		if (!name) {
			return c.json({ data: [] })
		}

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT DISTINCT std_category, std_item, frequency
			 FROM category_mappings
			 WHERE original_name ILIKE $1
			    OR $2 = ANY(aliases)
			 ORDER BY frequency DESC
			 LIMIT 10`,
			[`%${name}%`, name]
		)

		return c.json({ data: rows })
	} catch (error) {
		console.error('[CategoryMappings] Suggest error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

export default app
