/**
 * Admin endpoints for damage cases management
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findOne } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// All routes require admin auth
app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /all
 * Get all damage cases (including deleted) for admin
 */
app.get('/all', async (c) => {
	try {
		const page = parseInt(c.req.query('page') || '1')
		const limit = parseInt(c.req.query('limit') || '20')
		const status = c.req.query('status')
		const category = c.req.query('category')
		const severity = c.req.query('severity')
		const sort_by = c.req.query('sort_by') || 'created_at'
		const order = c.req.query('order') || 'desc'

		const offset = (page - 1) * limit

		console.log(`[Admin] Fetching all damage cases (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM damage_cases WHERE 1=1'
		let countText = 'SELECT COUNT(*) as count FROM damage_cases WHERE 1=1'
		const params: unknown[] = []

		// Filters
		if (status) {
			params.push(status)
			queryText += ` AND status = $${params.length}`
			countText += ` AND status = $${params.length}`
		}
		if (category) {
			params.push(category)
			queryText += ` AND category = $${params.length}`
			countText += ` AND category = $${params.length}`
		}
		if (severity) {
			params.push(severity)
			queryText += ` AND severity = $${params.length}`
			countText += ` AND severity = $${params.length}`
		}

		// Sorting
		const validSortFields = ['created_at', 'severity', 'category', 'title']
		const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at'
		const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
		queryText += ` ORDER BY ${sortField} ${sortOrder}`

		// Pagination
		queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

		// Execute queries
		const [dataRows, countRows] = await Promise.all([
			query(c.env.DATABASE_URL, queryText, [...params, limit, offset]),
			query(c.env.DATABASE_URL, countText, params)
		])

		const count = countRows[0] ? parseInt((countRows[0] as any).count) : 0

		console.log(`[Admin] Found ${dataRows.length} damage cases (total: ${count})`)

		return c.json({
			data: dataRows,
			pagination: {
				page,
				limit,
				total: count || 0,
				total_pages: Math.ceil((count || 0) / limit)
			}
		})
	} catch (error) {
		console.error('[Admin] Get all damage cases error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /:id/status
 * Update damage case status (admin only)
 */
app.patch('/:id/status', async (c) => {
	try {
		const id = c.req.param('id')
		const { status } = await c.req.json<{ status: string }>()

		// Validate status
		const validStatuses = ['open', 'in_progress', 'resolved', 'deleted']
		if (!status || !validStatuses.includes(status)) {
			return c.json({ error: '올바른 상태값이 필요합니다. (open, in_progress, resolved, deleted)' }, 400)
		}

		console.log(`[Admin] Updating damage case ${id} status to ${status}`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE damage_cases
			SET status = $1, updated_at = NOW()
			WHERE id = $2
			RETURNING *`,
			[status, id]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '피해사례를 찾을 수 없습니다.' }, 404)
		}

		console.log(`[Admin] Damage case status updated: ${id}`)

		return c.json({
			success: true,
			message: '피해사례 상태가 변경되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update status error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * DELETE /:id
 * Permanently delete damage case (admin only)
 */
app.delete('/:id', async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`[Admin] Permanently deleting damage case ${id}`)

		// Get images to clean up from R2
		const existing = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT images FROM damage_cases WHERE id = $1',
			[id]
		)

		const rows = await query(
			c.env.DATABASE_URL,
			'DELETE FROM damage_cases WHERE id = $1 RETURNING *',
			[id]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '피해사례를 찾을 수 없습니다.' }, 404)
		}

		// Clean up R2 images
		if (existing) {
			try {
				const imageKeys = JSON.parse(existing.images || '[]')
				if (Array.isArray(imageKeys)) {
					for (const key of imageKeys) {
						try { await c.env.R2.delete(key) } catch {}
					}
					if (imageKeys.length > 0) console.log(`[Admin] Cleaned up ${imageKeys.length} R2 images`)
				}
			} catch {}
		}

		console.log(`[Admin] Damage case permanently deleted: ${id}`)

		return c.json({
			success: true,
			message: '피해사례가 완전히 삭제되었습니다.'
		})
	} catch (error) {
		console.error('[Admin] Delete damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /:id
 * Update damage case content (admin only)
 */
app.patch('/:id', async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`[Admin] Updating damage case ${id}`)

		const body = await c.req.json()

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: unknown[] = []
		let paramIndex = 1

		const allowedFields: Record<string, string> = {
			'title': 'title',
			'description': 'description',
			'category': 'category',
			'severity': 'severity',
			'status': 'status',
			'company_name': 'company_name',
			'verified': 'verified'
		}

		for (const [bodyField, dbField] of Object.entries(allowedFields)) {
			if (body[bodyField] !== undefined) {
				updateFields.push(`${dbField} = $${paramIndex}`)
				updateValues.push(body[bodyField])
				paramIndex++
			}
		}

		// Add updated_at
		updateFields.push(`updated_at = NOW()`)

		if (updateFields.length === 1) { // Only updated_at
			return c.json({ error: '수정할 내용이 없습니다.' }, 400)
		}

		// Add id to params
		updateValues.push(id)

		const updateQuery = `
			UPDATE damage_cases
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`

		const rows = await query(c.env.DATABASE_URL, updateQuery, updateValues)

		if (!rows || rows.length === 0) {
			throw new Error('Failed to update damage case')
		}

		console.log(`[Admin] Damage case updated: ${id}`)

		return c.json({
			success: true,
			message: '피해사례가 수정되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

export default app
