/**
 * Admin endpoints for company reviews management
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
 * Get all reviews (including deleted) for admin
 */
app.get('/all', async (c) => {
	try {
		const page = parseInt(c.req.query('page') || '1')
		const limit = parseInt(c.req.query('limit') || '20')
		const status = c.req.query('status')
		const sort_by = c.req.query('sort_by') || 'created_at'
		const order = c.req.query('order') || 'desc'

		const offset = (page - 1) * limit

		console.log(`[Admin] Fetching all company reviews (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM company_reviews WHERE 1=1'
		let countText = 'SELECT COUNT(*) as count FROM company_reviews WHERE 1=1'
		const params: unknown[] = []

		// Filters
		if (status) {
			params.push(status)
			queryText += ` AND status = $${params.length}`
			countText += ` AND status = $${params.length}`
		}

		// Sorting
		const validSortFields = ['created_at', 'rating', 'company_name']
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

		console.log(`[Admin] Found ${dataRows.length} reviews (total: ${count})`)

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
		console.error('[Admin] Get all reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /:id/status
 * Update review status (admin only)
 */
app.patch('/:id/status', async (c) => {
	try {
		const id = c.req.param('id')
		const { status } = await c.req.json<{ status: string }>()

		// Validate status
		const validStatuses = ['published', 'pending', 'deleted']
		if (!status || !validStatuses.includes(status)) {
			return c.json({ error: '올바른 상태값이 필요합니다. (published, pending, deleted)' }, 400)
		}

		console.log(`[Admin] Updating review ${id} status to ${status}`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE company_reviews
			SET status = $1, updated_at = NOW()
			WHERE id = $2
			RETURNING *`,
			[status, id]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '후기를 찾을 수 없습니다.' }, 404)
		}

		console.log(`[Admin] Review status updated: ${id}`)

		return c.json({
			success: true,
			message: '후기 상태가 변경되었습니다.',
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
 * Permanently delete review (admin only)
 */
app.delete('/:id', async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`[Admin] Permanently deleting review ${id}`)

		// Get images to clean up from R2
		const existing = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT images, before_images, after_images FROM company_reviews WHERE id = $1',
			[id]
		)

		const rows = await query(
			c.env.DATABASE_URL,
			'DELETE FROM company_reviews WHERE id = $1 RETURNING *',
			[id]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '후기를 찾을 수 없습니다.' }, 404)
		}

		// Clean up R2 images
		if (existing) {
			const allKeys: string[] = []
			for (const field of ['images', 'before_images', 'after_images']) {
				try {
					const parsed = JSON.parse(existing[field] || '[]')
					if (Array.isArray(parsed)) allKeys.push(...parsed)
				} catch {}
			}
			for (const key of allKeys) {
				try { await c.env.R2.delete(key) } catch {}
			}
			if (allKeys.length > 0) console.log(`[Admin] Cleaned up ${allKeys.length} R2 images`)
		}

		console.log(`[Admin] Review permanently deleted: ${id}`)

		return c.json({
			success: true,
			message: '후기가 완전히 삭제되었습니다.'
		})
	} catch (error) {
		console.error('[Admin] Delete review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /:id
 * Update review content (admin only)
 */
app.patch('/:id', async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`[Admin] Updating review ${id}`)

		const body = await c.req.json()

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: unknown[] = []
		let paramIndex = 1

		const allowedFields: Record<string, string> = {
			'company_name': 'company_name',
			'company_phone': 'company_phone',
			'business_number': 'business_number',
			'rating': 'rating',
			'review_text': 'review_text',
			'pros': 'pros',
			'cons': 'cons',
			'work_type': 'work_type',
			'work_date': 'work_date',
			'verified': 'verified',
			'status': 'status'
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
			UPDATE company_reviews
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`

		const rows = await query(c.env.DATABASE_URL, updateQuery, updateValues)

		if (!rows || rows.length === 0) {
			throw new Error('Failed to update review')
		}

		console.log(`[Admin] Review updated: ${id}`)

		return c.json({
			success: true,
			message: '후기가 수정되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

export default app
