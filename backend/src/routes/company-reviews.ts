import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../lib/supabase'
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

		// Base query
		let query = supabase
			.from('company_reviews')
			.select('*', { count: 'exact' })
			.eq('status', 'published')
			.range(offset, offset + Number(limit) - 1)

		// Filters
		if (region) {
			query = query.eq('region', region)
		}
		if (company_type) {
			query = query.eq('company_type', company_type)
		}
		if (rating) {
			query = query.eq('rating', Number(rating))
		}

		// Sorting
		const validSortFields = ['created_at', 'rating', 'like_count', 'view_count']
		const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at'
		const sortOrder = order === 'asc'
		query = query.order(sortField as string, { ascending: sortOrder })

		const { data, error, count } = await query

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} reviews (total: ${count})`)

		res.json({
			data,
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

		const { data, error } = await supabase
			.from('company_reviews')
			.select('*')
			.eq('id', id)
			.eq('status', 'published')
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				return res.status(404).json({ error: '후기를 찾을 수 없습니다.' })
			}
			throw error
		}

		// Increment view count
		await supabase
			.from('company_reviews')
			.update({ view_count: (data.view_count || 0) + 1 })
			.eq('id', id)

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
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		const {
			company_name,
			company_type,
			region,
			title,
			content,
			rating,
			project_type,
			project_size,
			project_cost,
			project_period,
			project_date,
			quality_rating,
			price_rating,
			communication_rating,
			schedule_rating,
			is_recommended
		} = req.body

		// Validation
		if (!company_name || !title || !content || !rating) {
			return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
		}

		// Get user info
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('name, email')
			.eq('id', userId)
			.single()

		if (userError || !userData) {
			return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
		}

		console.log(`📝 Creating new company review: ${company_name} by ${userData.name}`)

		// Handle image uploads
		let imageUrls: string[] = []
		const files = req.files as Express.Multer.File[]

		if (files && files.length > 0) {
			console.log(`📸 Uploading ${files.length} images...`)
			const uploadResults = await uploadImages(files, 'reviews')
			imageUrls = uploadResults.map((r) => r.url)
			console.log(`✅ Uploaded ${imageUrls.length} images`)
		}

		// Insert review
		const { data, error } = await supabase
			.from('company_reviews')
			.insert({
				user_id: userId,
				author_name: userData.name,
				author_email: userData.email,
				company_name,
				company_type,
				region,
				title,
				content,
				rating: Number(rating),
				project_type,
				project_size: project_size ? Number(project_size) : null,
				project_cost: project_cost ? Number(project_cost) : null,
				project_period: project_period ? Number(project_period) : null,
				project_date,
				quality_rating: quality_rating ? Number(quality_rating) : null,
				price_rating: price_rating ? Number(price_rating) : null,
				communication_rating: communication_rating ? Number(communication_rating) : null,
				schedule_rating: schedule_rating ? Number(schedule_rating) : null,
				is_recommended: is_recommended === 'true' || is_recommended === true,
				images: imageUrls,
				status: 'published'
			})
			.select()
			.single()

		if (error) {
			console.error('Database insert error:', error)
			throw error
		}

		console.log(`✅ Review created: ${data.id}`)

		res.json({
			success: true,
			message: '후기가 등록되었습니다.',
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
		const { data: existingReview, error: fetchError } = await supabase
			.from('company_reviews')
			.select('*')
			.eq('id', id)
			.eq('user_id', userId)
			.single()

		if (fetchError || !existingReview) {
			return res.status(404).json({ error: '후기를 찾을 수 없거나 수정 권한이 없습니다.' })
		}

		// Handle image uploads
		let imageUrls: string[] = []

		// Get existing images from request body
		const existingImages = req.body.existing_images
		if (existingImages) {
			// If existing_images is a string, convert to array
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

		// Update fields
		const updateData: any = { updated_at: new Date().toISOString() }
		const allowedFields = [
			'title',
			'content',
			'rating',
			'project_type',
			'project_size',
			'project_cost',
			'project_period',
			'quality_rating',
			'price_rating',
			'communication_rating',
			'schedule_rating',
			'is_recommended'
		]

		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updateData[field] = req.body[field]
			}
		})

		// Update images if there are any
		if (imageUrls.length > 0) {
			updateData.images = imageUrls
		}

		const { data, error } = await supabase
			.from('company_reviews')
			.update(updateData)
			.eq('id', id)
			.eq('user_id', userId)
			.select()
			.single()

		if (error) {
			console.error('Database update error:', error)
			throw error
		}

		console.log(`✅ Review updated: ${id}`)

		res.json({
			success: true,
			message: '후기가 수정되었습니다.',
			data
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
		const { data, error } = await supabase
			.from('company_reviews')
			.update({ status: 'deleted' })
			.eq('id', id)
			.eq('user_id', userId)
			.select()
			.single()

		if (error || !data) {
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

		const { data, error } = await supabase
			.from('company_reviews')
			.select('*')
			.eq('user_id', userId)
			.neq('status', 'deleted')
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} reviews`)

		res.json(data)
	} catch (error) {
		console.error('Get my reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
