/**
 * Admin endpoints for Conflict Rules (Rulebook)
 * Mount: /api/admin/conflict-rules
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findOne, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /
 * 규칙 목록 (scope/category 필터)
 */
app.get('/', async (c) => {
	try {
		const scope = c.req.query('scope')
		const category = c.req.query('category')
		const activeOnly = c.req.query('active') !== 'false'

		let where = 'WHERE 1=1'
		const params: unknown[] = []
		let idx = 1

		if (activeOnly) {
			where += ` AND is_active = true`
		}
		if (scope) {
			where += ` AND scope = $${idx++}`
			params.push(scope)
		}
		if (category) {
			where += ` AND category = $${idx++}`
			params.push(category)
		}

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM conflict_rules ${where} ORDER BY scope, priority DESC, created_at`,
			params
		)

		return c.json({ data: rows })
	} catch (error) {
		console.error('[ConflictRules] List error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /
 * 새 규칙 생성 + 충돌 체크
 */
app.post('/', async (c) => {
	try {
		const body = await c.req.json()

		// 충돌 체크: 같은 scope+category에 동일 이름 존재 여부
		const existing = await findOne(
			c.env.DATABASE_URL,
			`SELECT id, rule_name FROM conflict_rules
			 WHERE rule_name = $1 AND is_active = true`,
			[body.rule_name]
		)

		if (existing) {
			return c.json({
				error: '동일한 이름의 규칙이 이미 존재합니다.',
				conflict: existing
			}, 409)
		}

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO conflict_rules (
				rule_name, description, scope, category,
				conditions, actions, priority, supersedes,
				is_active, created_by
			) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10) RETURNING *`,
			[
				body.rule_name,
				body.description,
				body.scope || 'GLOBAL',
				body.category || null,
				JSON.stringify(body.conditions || {}),
				JSON.stringify(body.actions || {}),
				body.priority ?? 0,
				body.supersedes || [],
				body.is_active !== false,
				body.created_by || null,
			]
		)

		return c.json({ success: true, data: rows[0] }, 201)
	} catch (error) {
		console.error('[ConflictRules] Create error:', error)
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

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE conflict_rules SET
				rule_name = COALESCE($1, rule_name),
				description = COALESCE($2, description),
				scope = COALESCE($3, scope),
				category = $4,
				conditions = COALESCE($5::jsonb, conditions),
				actions = COALESCE($6::jsonb, actions),
				priority = COALESCE($7, priority),
				supersedes = COALESCE($8, supersedes),
				is_active = COALESCE($9, is_active),
				updated_at = NOW()
			 WHERE id = $10 RETURNING *`,
			[
				body.rule_name || null,
				body.description || null,
				body.scope || null,
				body.category !== undefined ? body.category : null,
				body.conditions ? JSON.stringify(body.conditions) : null,
				body.actions ? JSON.stringify(body.actions) : null,
				body.priority ?? null,
				body.supersedes || null,
				body.is_active ?? null,
				id,
			]
		)

		if (!rows.length) {
			return c.json({ error: '규칙을 찾을 수 없습니다.' }, 404)
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[ConflictRules] Update error:', error)
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
			'DELETE FROM conflict_rules WHERE id = $1 RETURNING id',
			[id]
		)
		if (!rows.length) {
			return c.json({ error: '규칙을 찾을 수 없습니다.' }, 404)
		}
		return c.json({ success: true })
	} catch (error) {
		console.error('[ConflictRules] Delete error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /check-conflicts
 * 충돌 체크 (새 규칙 생성 전 호출)
 */
app.post('/check-conflicts', async (c) => {
	try {
		const body = await c.req.json()
		const { scope, category, rule_name } = body

		// 같은 scope+category의 활성 규칙 조회
		const conflicts = await findMany(
			c.env.DATABASE_URL,
			`SELECT id, rule_name, scope, category, priority
			 FROM conflict_rules
			 WHERE is_active = true
			   AND (scope = $1 OR scope = 'GLOBAL')
			   AND ($2::text IS NULL OR category = $2 OR category IS NULL)
			   AND rule_name != $3
			 ORDER BY scope, priority DESC`,
			[scope || 'GLOBAL', category || null, rule_name || '']
		)

		return c.json({
			data: conflicts,
			has_conflicts: conflicts.length > 0
		})
	} catch (error) {
		console.error('[ConflictRules] Check error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

export default app
