/**
 * Admin endpoints for company reviews management
 */

import { Router } from 'express'
import { query } from '../../lib/db'
import { authenticateToken } from '../../middleware/auth'

const router = Router()

// Admin check middleware
const requireAdmin = (req: any, res: any, next: any) => {
	const userRole = req.user?.role
	if (userRole !== 'admin') {
		return res.status(403).json({ error: '관리자 권한이 필요합니다.' })
	}
	next()
}

/**
 * GET /api/company-reviews/admin/all
 * Get all reviews (including deleted) for admin
 */
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			status,
			sort_by = 'created_at',
			order = 'desc'
		} = req.query

		const offset = (Number(page) - 1) * Number(limit)

		console.log(`🔍 [Admin] Fetching all company reviews (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM company_reviews WHERE 1=1'
		let countText = 'SELECT COUNT(*) FROM company_reviews WHERE 1=1'
		const params: any[] = []

		// Filters
		if (status) {
			params.push(status)
			queryText += ` AND status = $${params.length}`
			countText += ` AND status = $${params.length}`
		}

		// Sorting
		const validSortFields = ['created_at', 'rating', 'company_name']
		const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at'
		const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
		queryText += ` ORDER BY ${sortField} ${sortOrder}`

		// Pagination
		queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

		// Execute queries
		const [dataResult, countResult] = await Promise.all([
			query(queryText, [...params, Number(limit), offset]),
			query(countText, params)
		])

		const count = parseInt(countResult.rows[0].count)

		console.log(`✅ [Admin] Found ${dataResult.rows.length} reviews (total: ${count})`)

		res.json({
			data: dataResult.rows,
			pagination: {
				page: Number(page),
				limit: Number(limit),
				total: count || 0,
				total_pages: Math.ceil((count || 0) / Number(limit))
			}
		})
	} catch (error) {
		console.error('[Admin] Get all reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/company-reviews/admin/:id/status
 * Update review status (admin only)
 */
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { status } = req.body

		// Validate status
		const validStatuses = ['published', 'pending', 'deleted']
		if (!status || !validStatuses.includes(status)) {
			return res.status(400).json({ error: '올바른 상태값이 필요합니다. (published, pending, deleted)' })
		}

		console.log(`📝 [Admin] Updating review ${id} status to ${status}`)

		const result = await query(
			`UPDATE company_reviews
			SET status = $1, updated_at = NOW()
			WHERE id = $2
			RETURNING *`,
			[status, id]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '후기를 찾을 수 없습니다.' })
		}

		console.log(`✅ [Admin] Review status updated: ${id}`)

		res.json({
			success: true,
			message: '후기 상태가 변경되었습니다.',
			data: result.rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update status error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * DELETE /api/company-reviews/admin/:id
 * Permanently delete review (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🗑️  [Admin] Permanently deleting review ${id}`)

		const result = await query(
			'DELETE FROM company_reviews WHERE id = $1 RETURNING *',
			[id]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '후기를 찾을 수 없습니다.' })
		}

		console.log(`✅ [Admin] Review permanently deleted: ${id}`)

		res.json({
			success: true,
			message: '후기가 완전히 삭제되었습니다.'
		})
	} catch (error) {
		console.error('[Admin] Delete review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/company-reviews/admin/:id
 * Update review content (admin only)
 */
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`📝 [Admin] Updating review ${id}`)

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: any[] = []
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

		Object.entries(allowedFields).forEach(([bodyField, dbField]) => {
			if (req.body[bodyField] !== undefined) {
				updateFields.push(`${dbField} = $${paramIndex}`)
				updateValues.push(req.body[bodyField])
				paramIndex++
			}
		})

		// Add updated_at
		updateFields.push(`updated_at = NOW()`)

		if (updateFields.length === 1) { // Only updated_at
			return res.status(400).json({ error: '수정할 내용이 없습니다.' })
		}

		// Add id to params
		updateValues.push(id)

		const updateQuery = `
			UPDATE company_reviews
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`

		const result = await query(updateQuery, updateValues)

		if (result.rows.length === 0) {
			throw new Error('Failed to update review')
		}

		console.log(`✅ [Admin] Review updated: ${id}`)

		res.json({
			success: true,
			message: '후기가 수정되었습니다.',
			data: result.rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
