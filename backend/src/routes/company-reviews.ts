import { Router } from 'express'
import multer from 'multer'
import { query, findOne, insertOne } from '../lib/db'
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth'
import { uploadImages, ensureStorageBucket } from '../services/image-upload'

const router = Router()

// Ensure storage bucket exists on startup
ensureStorageBucket()

// Multer configuration for review images
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
 * GET /api/company-reviews
 * Get all published company reviews with pagination and filtering
 */
router.get('/', optionalAuthenticateToken, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			region,
			company_type,
			rating,
			sort_by = 'created_at',
			order = 'desc'
		} = req.query

		const offset = (Number(page) - 1) * Number(limit)

		console.log(`🔍 Fetching company reviews (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM company_reviews WHERE status = $1'
		let countText = 'SELECT COUNT(*) FROM company_reviews WHERE status = $1'
		const params: any[] = ['published']

		// Filters
		if (region) {
			params.push(region)
			queryText += ` AND region = $${params.length}`
			countText += ` AND region = $${params.length}`
		}
		if (company_type) {
			params.push(company_type)
			queryText += ` AND company_type = $${params.length}`
			countText += ` AND company_type = $${params.length}`
		}
		if (rating) {
			params.push(Number(rating))
			queryText += ` AND rating = $${params.length}`
			countText += ` AND rating = $${params.length}`
		}

		// Sorting
		const validSortFields = ['created_at', 'rating', 'like_count', 'view_count']
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

		console.log(`✅ Found ${dataResult.rows.length} reviews (total: ${count})`)

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
		console.error('Get reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/company-reviews/:id
 * Get a single review by ID (increments view count)
 */
router.get('/:id', optionalAuthenticateToken, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🔍 Fetching review: ${id}`)

		const result = await query(
			'SELECT * FROM company_reviews WHERE id = $1 AND status = $2',
			[id, 'published']
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '후기를 찾을 수 없습니다.' })
		}

		const data = result.rows[0]

		// Increment view count
		await query(
			'UPDATE company_reviews SET view_count = $1 WHERE id = $2',
			[(data.view_count || 0) + 1, id]
		)

		res.json(data)
	} catch (error) {
		console.error('Get review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// ============================================
// Authenticated User Endpoints
// ============================================

/**
 * POST /api/company-reviews
 * Create a new company review (requires authentication)
 */
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '로그인이 필요합니다.' })
		}

		const {
			company_name,
			company_phone,
			business_number,
			rating,
			review_text
		} = req.body

		// Validation - 필수 항목: 업체명, 연락처, 사업자번호
		if (!company_name || !company_phone || !business_number) {
			return res.status(400).json({
				error: '업체명, 연락처, 사업자번호를 모두 입력해주세요.'
			})
		}

		if (!rating || !review_text) {
			return res.status(400).json({
				error: '별점과 후기 내용을 입력해주세요.'
			})
		}

		// 후기 내용 최소 길이 체크
		if (review_text.trim().length < 10) {
			return res.status(400).json({
				error: '후기는 최소 10자 이상 작성해주세요.'
			})
		}

		console.log(`📝 Creating new company review: ${company_name} by user ${userId}`)

		// Handle image uploads
		let imageUrls: string[] = []
		const files = req.files as Express.Multer.File[]

		if (files && files.length > 0) {
			console.log(`📸 Uploading ${files.length} images...`)
			const uploadResults = await uploadImages(files, 'reviews')
			imageUrls = uploadResults.map((r) => r.url)
			console.log(`✅ Uploaded ${imageUrls.length} images`)
		}

		// 추가 정보를 후기에 포함
		let fullReviewText = review_text
		if (company_phone) {
			fullReviewText += `\n\n**업체 연락처**: ${company_phone}`
		}
		if (business_number) {
			fullReviewText += `\n**사업자번호**: ${business_number}`
		}

		// Insert review
		const data = await insertOne<any>('company_reviews', {
			user_id: userId,
			company_name,
			company_phone: company_phone || null,
			business_number: business_number || null,
			rating: Number(rating),
			review_text: fullReviewText,
			images: JSON.stringify(imageUrls),
			verified: false,
			status: 'pending' // 관리자 승인 대기
		})

		if (!data) {
			throw new Error('Failed to insert review')
		}

		console.log(`✅ Review created: ${data.id}`)

		res.json({
			success: true,
			message: '후기가 등록되었습니다! 관리자 승인 후 게시됩니다.',
			data
		})
	} catch (error) {
		console.error('Create review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/company-reviews/:id
 * Update a review (only by author)
 */
router.patch('/:id', authenticateToken, upload.array('images', 20), async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { id } = req.params

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`📝 Updating review ${id} by user ${userId}`)

		// Check if user is the author
		const existingReview = await query(
			'SELECT * FROM company_reviews WHERE id = $1 AND user_id = $2',
			[id, userId]
		)

		if (existingReview.rows.length === 0) {
			return res.status(404).json({ error: '후기를 찾을 수 없거나 수정 권한이 없습니다.' })
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
			const uploadResults = await uploadImages(files, 'reviews')
			const newImageUrls = uploadResults.map((r) => r.url)
			imageUrls = [...imageUrls, ...newImageUrls]
			console.log(`✅ Total images: ${imageUrls.length}`)
		}

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: any[] = []
		let paramIndex = 1

		const allowedFields: Record<string, string> = {
			'rating': 'rating',
			'review_text': 'review_text',
			'pros': 'pros',
			'cons': 'cons',
			'work_type': 'work_type',
			'work_date': 'work_date'
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
			UPDATE company_reviews
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
			RETURNING *
		`

		const result = await query(updateQuery, updateValues)

		if (result.rows.length === 0) {
			throw new Error('Failed to update review')
		}

		console.log(`✅ Review updated: ${id}`)

		res.json({
			success: true,
			message: '후기가 수정되었습니다.',
			data: result.rows[0]
		})
	} catch (error) {
		console.error('Update review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * DELETE /api/company-reviews/:id
 * Delete a review (only by author)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { id } = req.params

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`🗑️  Deleting review ${id} by user ${userId}`)

		// Soft delete (change status to 'deleted')
		const result = await query(
			`UPDATE company_reviews
			SET status = 'deleted', updated_at = NOW()
			WHERE id = $1 AND user_id = $2
			RETURNING *`,
			[id, userId]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: '후기를 찾을 수 없거나 삭제 권한이 없습니다.' })
		}

		console.log(`✅ Review deleted: ${id}`)

		res.json({
			success: true,
			message: '후기가 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/company-reviews/my/list
 * Get current user's reviews
 */
router.get('/my/list', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`🔍 Fetching reviews by user: ${userId}`)

		const result = await query(
			`SELECT * FROM company_reviews
			WHERE user_id = $1 AND status != 'deleted'
			ORDER BY created_at DESC`,
			[userId]
		)

		console.log(`✅ Found ${result.rows.length} reviews`)

		res.json(result.rows)
	} catch (error) {
		console.error('Get my reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
