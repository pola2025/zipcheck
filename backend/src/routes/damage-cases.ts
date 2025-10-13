import { Router } from 'express'
import multer from 'multer'
import { query, findOne, insertOne } from '../lib/db'
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth'
import { uploadImages, ensureStorageBucket } from '../services/image-upload'

const router = Router()

// Ensure storage bucket exists on startup
ensureStorageBucket()

// Multer configuration for damage case images
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 2 * 1024 * 1024, // 2MB limit per file
		files: 20 // Max 20 files
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true)
		} else {
			cb(new Error('Only image files are allowed'))
		}
	}
})

// ============================================
// Public Endpoints
// ============================================

/**
 * GET /api/damage-cases
 * Get all published damage cases with pagination and filtering
 */
router.get('/', optionalAuthenticateToken, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			region,
			damage_type,
			resolution_status,
			sort_by = 'created_at',
			order = 'desc'
		} = req.query

		const offset = (Number(page) - 1) * Number(limit)

		console.log(`🔍 Fetching damage cases (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM damage_cases WHERE status != $1'
		let countText = 'SELECT COUNT(*) FROM damage_cases WHERE status != $1'
		const params: any[] = ['deleted']

		// Filters
		if (region) {
			params.push(region)
			queryText += ` AND region = $${params.length}`
			countText += ` AND region = $${params.length}`
		}
		if (damage_type) {
			params.push(damage_type)
			queryText += ` AND category = $${params.length}`
			countText += ` AND category = $${params.length}`
		}
		if (resolution_status) {
			params.push(resolution_status)
			queryText += ` AND status = $${params.length}`
			countText += ` AND status = $${params.length}`
		}

		// Sorting
		const validSortFields = ['created_at', 'severity']
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

		console.log(`✅ Found ${dataResult.rows.length} damage cases (total: ${count})`)

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
		console.error('Get damage cases error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/damage-cases/:id
 * Get a single damage case by ID (increments view count)
 */
router.get('/:id', optionalAuthenticateToken, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🔍 Fetching damage case: ${id}`)

		const result = await query(
			'SELECT * FROM damage_cases WHERE id = $1 AND status != $2',
			[id, 'deleted']
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '피해 사례를 찾을 수 없습니다.' })
		}

		const data = result.rows[0]

		res.json(data)
	} catch (error) {
		console.error('Get damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// ============================================
// Authenticated User Endpoints
// ============================================

/**
 * POST /api/damage-cases
 * Create a new damage case (requires authentication)
 */
router.post('/', authenticateToken, upload.array('evidence_images', 20), async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '로그인이 필요합니다.' })
		}

		const {
			company_name,
			company_phone,
			business_number,
			damage_type,
			damage_amount,
			case_description
		} = req.body

		// Validation - 업체명, 연락처, 사업자번호 모두 필수
		if (!company_name || !company_phone || !business_number) {
			return res.status(400).json({
				error: '업체명, 연락처, 사업자번호를 모두 입력해주세요.'
			})
		}

		// Validation - 피해 유형, 피해 내용 필수
		if (!damage_type || !case_description) {
			return res.status(400).json({
				error: '피해 유형과 피해 내용은 필수입니다.'
			})
		}

		// 피해 내용 최소 길이 체크
		if (case_description.trim().length < 20) {
			return res.status(400).json({
				error: '피해 내용은 최소 20자 이상 작성해주세요.'
			})
		}

		console.log(`📝 Creating new damage case: ${company_name} (${damage_type}) by user ${userId}`)

		// Handle image uploads
		let imageUrls: string[] = []
		const files = req.files as Express.Multer.File[]

		if (files && files.length > 0) {
			console.log(`📸 Uploading ${files.length} images...`)
			const uploadResults = await uploadImages(files, 'damage-cases')
			imageUrls = uploadResults.map((r) => r.url)
			console.log(`✅ Uploaded ${imageUrls.length} images`)
		}

		// 추가 정보를 설명에 포함
		let fullDescription = case_description
		if (company_phone) {
			fullDescription += `\n\n**업체 연락처**: ${company_phone}`
		}
		if (business_number) {
			fullDescription += `\n**사업자번호**: ${business_number}`
		}
		if (damage_amount) {
			fullDescription += `\n**피해 금액**: ${damage_amount}`
		}

		// Generate title from available info
		const titlePrefix = company_name || company_phone || business_number || '업체 정보 미상'

		// Insert damage case
		const data = await insertOne<any>('damage_cases', {
			user_id: userId,
			title: `${titlePrefix} - ${damage_type}`,
			description: fullDescription,
			images: JSON.stringify(imageUrls),
			category: damage_type,
			severity: 'medium',
			status: 'pending' // 관리자 승인 대기
		})

		if (!data) {
			throw new Error('Failed to insert damage case')
		}

		console.log(`✅ Damage case created: ${data.id}`)

		res.json({
			success: true,
			message: '피해사례가 등록되었습니다! 관리자 승인 후 게시됩니다.',
			data
		})
	} catch (error) {
		console.error('Create damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/damage-cases/:id
 * Update a damage case (only by author)
 */
router.patch('/:id', authenticateToken, upload.array('images', 20), async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { id } = req.params

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`📝 Updating damage case ${id} by user ${userId}`)

		// Check if user is the author
		const existingCase = await query(
			'SELECT * FROM damage_cases WHERE id = $1 AND user_id = $2',
			[id, userId]
		)

		if (existingCase.rows.length === 0) {
			return res.status(404).json({ error: '피해 사례를 찾을 수 없거나 수정 권한이 없습니다.' })
		}

		// Handle image uploads
		let imageUrls: string[] = []

		// Get existing images from request body
		const existingImages = req.body.existing_images
		if (existingImages) {
			imageUrls = Array.isArray(existingImages) ? existingImages : [existingImages]
		}

		// Upload new images if any
		const files = req.files as Express.Multer.File[]
		if (files && files.length > 0) {
			console.log(`📸 Uploading ${files.length} new images...`)
			const uploadResults = await uploadImages(files, 'damage-cases')
			const newImageUrls = uploadResults.map((r) => r.url)
			imageUrls = [...imageUrls, ...newImageUrls]
			console.log(`✅ Total images: ${imageUrls.length}`)
		}

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: any[] = []
		let paramIndex = 1

		const allowedFields: Record<string, string> = {
			'title': 'title',
			'description': 'description',
			'category': 'category',
			'severity': 'severity',
			'status': 'status'
		}

		Object.entries(allowedFields).forEach(([bodyField, dbField]) => {
			if (req.body[bodyField] !== undefined) {
				updateFields.push(`${dbField} = $${paramIndex}`)
				updateValues.push(req.body[bodyField])
				paramIndex++
			}
		})

		// Update images if there are any
		if (imageUrls.length > 0) {
			updateFields.push(`images = $${paramIndex}`)
			updateValues.push(JSON.stringify(imageUrls))
			paramIndex++
		}

		// Add updated_at
		updateFields.push(`updated_at = NOW()`)

		if (updateFields.length === 1) { // Only updated_at
			return res.status(400).json({ error: '수정할 내용이 없습니다.' })
		}

		// Add id and user_id to params
		updateValues.push(id, userId)

		const updateQuery = `
			UPDATE damage_cases
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
			RETURNING *
		`

		const result = await query(updateQuery, updateValues)

		if (result.rows.length === 0) {
			throw new Error('Failed to update damage case')
		}

		console.log(`✅ Damage case updated: ${id}`)

		res.json({
			success: true,
			message: '피해 사례가 수정되었습니다.',
			data: result.rows[0]
		})
	} catch (error) {
		console.error('Update damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * DELETE /api/damage-cases/:id
 * Delete a damage case (only by author)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { id } = req.params

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`🗑️  Deleting damage case ${id} by user ${userId}`)

		// Soft delete (change status to 'deleted')
		const result = await query(
			`UPDATE damage_cases
			SET status = 'closed', updated_at = NOW()
			WHERE id = $1 AND user_id = $2
			RETURNING *`,
			[id, userId]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '피해 사례를 찾을 수 없거나 삭제 권한이 없습니다.' })
		}

		console.log(`✅ Damage case deleted: ${id}`)

		res.json({
			success: true,
			message: '피해 사례가 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/damage-cases/my/list
 * Get current user's damage cases
 */
router.get('/my/list', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`🔍 Fetching damage cases by user: ${userId}`)

		const result = await query(
			`SELECT * FROM damage_cases
			WHERE user_id = $1 AND status != 'closed'
			ORDER BY created_at DESC`,
			[userId]
		)

		console.log(`✅ Found ${result.rows.length} damage cases`)

		res.json(result.rows)
	} catch (error) {
		console.error('Get my damage cases error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/damage-cases/stats/summary
 * Get damage case statistics
 */
router.get('/stats/summary', async (req, res) => {
	try {
		console.log('📊 Fetching damage case statistics')

		// Total cases
		const totalResult = await query(
			`SELECT COUNT(*) as count FROM damage_cases WHERE status != 'closed'`
		)
		const totalCount = parseInt(totalResult.rows[0].count)

		// By status
		const statusResult = await query(
			`SELECT status, COUNT(*) as count
			FROM damage_cases
			WHERE status != 'closed'
			GROUP BY status`
		)
		const byStatus = statusResult.rows.reduce((acc: any, row) => {
			acc[row.status] = parseInt(row.count)
			return acc
		}, {})

		// By severity
		const severityResult = await query(
			`SELECT severity, COUNT(*) as count
			FROM damage_cases
			WHERE status != 'closed'
			GROUP BY severity`
		)
		const bySeverity = severityResult.rows.reduce((acc: any, row) => {
			acc[row.severity] = parseInt(row.count)
			return acc
		}, {})

		res.json({
			total: totalCount,
			by_status: byStatus,
			by_severity: bySeverity
		})
	} catch (error) {
		console.error('Get stats error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
