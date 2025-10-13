/**
 * Admin endpoints for damage cases management
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
 * GET /api/damage-cases/admin/all
 * Get all damage cases (including deleted) for admin
 */
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			status,
			category,
			severity,
			sort_by = 'created_at',
			order = 'desc'
		} = req.query

		const offset = (Number(page) - 1) * Number(limit)

		console.log(`🔍 [Admin] Fetching all damage cases (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM damage_cases WHERE 1=1'
		let countText = 'SELECT COUNT(*) FROM damage_cases WHERE 1=1'
		const params: any[] = []

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

		console.log(`✅ [Admin] Found ${dataResult.rows.length} damage cases (total: ${count})`)

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
		console.error('[Admin] Get all damage cases error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/damage-cases/admin/:id/status
 * Update damage case status (admin only)
 */
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { status } = req.body

		// Validate status
		const validStatuses = ['open', 'in_progress', 'resolved', 'deleted']
		if (!status || !validStatuses.includes(status)) {
			return res.status(400).json({ error: '올바른 상태값이 필요합니다. (open, in_progress, resolved, deleted)' })
		}

		console.log(`📝 [Admin] Updating damage case ${id} status to ${status}`)

		const result = await query(
			`UPDATE damage_cases
			SET status = $1, updated_at = NOW()
			WHERE id = $2
			RETURNING *`,
			[status, id]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '피해사례를 찾을 수 없습니다.' })
		}

		console.log(`✅ [Admin] Damage case status updated: ${id}`)

		res.json({
			success: true,
			message: '피해사례 상태가 변경되었습니다.',
			data: result.rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update status error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * DELETE /api/damage-cases/admin/:id
 * Permanently delete damage case (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🗑️  [Admin] Permanently deleting damage case ${id}`)

		const result = await query(
			'DELETE FROM damage_cases WHERE id = $1 RETURNING *',
			[id]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '피해사례를 찾을 수 없습니다.' })
		}

		console.log(`✅ [Admin] Damage case permanently deleted: ${id}`)

		res.json({
			success: true,
			message: '피해사례가 완전히 삭제되었습니다.'
		})
	} catch (error) {
		console.error('[Admin] Delete damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/damage-cases/admin/:id
 * Update damage case content (admin only)
 */
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`📝 [Admin] Updating damage case ${id}`)

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: any[] = []
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
			UPDATE damage_cases
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`

		const result = await query(updateQuery, updateValues)

		if (result.rows.length === 0) {
			throw new Error('Failed to update damage case')
		}

		console.log(`✅ [Admin] Damage case updated: ${id}`)

		res.json({
			success: true,
			message: '피해사례가 수정되었습니다.',
			data: result.rows[0]
		})
	} catch (error) {
		console.error('[Admin] Update damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
