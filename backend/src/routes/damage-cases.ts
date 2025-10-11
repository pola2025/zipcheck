import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../lib/supabase'
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

		// Base query
		let query = supabase
			.from('damage_cases')
			.select('*', { count: 'exact' })
			.eq('status', 'published')
			.range(offset, offset + Number(limit) - 1)

		// Filters
		if (region) {
			query = query.eq('region', region)
		}
		if (damage_type) {
			query = query.eq('damage_type', damage_type)
		}
		if (resolution_status) {
			query = query.eq('resolution_status', resolution_status)
		}

		// Sorting
		const validSortFields = ['created_at', 'damage_amount', 'like_count', 'view_count']
		const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at'
		const sortOrder = order === 'asc'
		query = query.order(sortField as string, { ascending: sortOrder })

		const { data, error, count } = await query

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} damage cases (total: ${count})`)

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

		const { data, error } = await supabase
			.from('damage_cases')
			.select('*')
			.eq('id', id)
			.eq('status', 'published')
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				return res.status(404).json({ error: '피해 사례를 찾을 수 없습니다.' })
			}
			throw error
		}

		// Increment view count
		await supabase
			.from('damage_cases')
			.update({ view_count: (data.view_count || 0) + 1 })
			.eq('id', id)

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
router.post('/', authenticateToken, upload.array('images', 20), async (req, res) => {
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
			damage_type,
			damage_amount,
			project_type,
			project_size,
			contract_amount,
			incident_date,
			resolution_status,
			resolution_details,
			legal_action,
			legal_details
		} = req.body

		// Validation
		if (!title || !content || !damage_type) {
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

		console.log(`📝 Creating new damage case: ${title} by ${userData.name}`)

		// Handle image uploads
		let imageUrls: string[] = []
		const files = req.files as Express.Multer.File[]

		if (files && files.length > 0) {
			console.log(`📸 Uploading ${files.length} images...`)
			const uploadResults = await uploadImages(files, 'damage-cases')
			imageUrls = uploadResults.map((r) => r.url)
			console.log(`✅ Uploaded ${imageUrls.length} images`)
		}

		// Insert damage case
		const { data, error } = await supabase
			.from('damage_cases')
			.insert({
				user_id: userId,
				author_name: userData.name,
				author_email: userData.email,
				company_name: company_name || null,
				company_type,
				region,
				title,
				content,
				damage_type,
				damage_amount: damage_amount ? Number(damage_amount) : null,
				project_type,
				project_size: project_size ? Number(project_size) : null,
				contract_amount: contract_amount ? Number(contract_amount) : null,
				incident_date,
				resolution_status: resolution_status || 'unresolved',
				resolution_details,
				legal_action: legal_action === 'true' || legal_action === true,
				legal_details,
				images: imageUrls,
				documents: [], // Documents handled separately via URL input
				status: 'published'
			})
			.select()
			.single()

		if (error) {
			console.error('Database insert error:', error)
			throw error
		}

		console.log(`✅ Damage case created: ${data.id}`)

		res.json({
			success: true,
			message: '피해 사례가 등록되었습니다.',
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
		const { data: existingCase, error: fetchError } = await supabase
			.from('damage_cases')
			.select('*')
			.eq('id', id)
			.eq('user_id', userId)
			.single()

		if (fetchError || !existingCase) {
			return res.status(404).json({ error: '피해 사례를 찾을 수 없거나 수정 권한이 없습니다.' })
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
			const uploadResults = await uploadImages(files, 'damage-cases')
			const newImageUrls = uploadResults.map((r) => r.url)
			imageUrls = [...imageUrls, ...newImageUrls]
			console.log(`✅ Total images: ${imageUrls.length}`)
		}

		// Update fields
		const updateData: any = { updated_at: new Date().toISOString() }
		const allowedFields = [
			'title',
			'content',
			'damage_type',
			'damage_amount',
			'resolution_status',
			'resolution_details',
			'legal_action',
			'legal_details'
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
			.from('damage_cases')
			.update(updateData)
			.eq('id', id)
			.eq('user_id', userId)
			.select()
			.single()

		if (error) {
			console.error('Database update error:', error)
			throw error
		}

		console.log(`✅ Damage case updated: ${id}`)

		res.json({
			success: true,
			message: '피해 사례가 수정되었습니다.',
			data
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
		const { data, error } = await supabase
			.from('damage_cases')
			.update({ status: 'deleted' })
			.eq('id', id)
			.eq('user_id', userId)
			.select()
			.single()

		if (error || !data) {
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

		const { data, error } = await supabase
			.from('damage_cases')
			.select('*')
			.eq('user_id', userId)
			.neq('status', 'deleted')
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} damage cases`)

		res.json(data)
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
		const { count: totalCount } = await supabase
			.from('damage_cases')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'published')

		// By resolution status
		const { data: byResolution } = await supabase
			.from('damage_cases')
			.select('resolution_status')
			.eq('status', 'published')

		const resolutionStats = byResolution?.reduce((acc: any, item) => {
			acc[item.resolution_status] = (acc[item.resolution_status] || 0) + 1
			return acc
		}, {})

		// By damage type
		const { data: byDamageType } = await supabase
			.from('damage_cases')
			.select('damage_type')
			.eq('status', 'published')

		const damageTypeStats = byDamageType?.reduce((acc: any, item) => {
			acc[item.damage_type] = (acc[item.damage_type] || 0) + 1
			return acc
		}, {})

		res.json({
			total: totalCount || 0,
			by_resolution: resolutionStats || {},
			by_damage_type: damageTypeStats || {}
		})
	} catch (error) {
		console.error('Get stats error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
