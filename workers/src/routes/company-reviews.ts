import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { query, findOne, findMany, insertOne } from '../lib/db'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { getClientIp, generateSlug } from '../lib/utils'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================
// Public Endpoints
// ============================================

/**
 * GET /my/list
 * Get current user's reviews
 * (Registered before the parameterized /:id route to avoid collision)
 */
app.get('/my/list', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Fetching reviews by user: ${userId}`)

		const rows = await findMany<any>(
			c.env.DATABASE_URL,
			`SELECT * FROM company_reviews
			WHERE user_id = $1 AND status != 'deleted'
			ORDER BY created_at DESC`,
			[userId]
		)

		console.log(`Found ${rows.length} reviews`)

		return c.json(rows)
	} catch (error) {
		console.error('Get my reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /
 * Get all published company reviews with pagination and filtering
 */
app.get('/', optionalAuth(), async (c) => {
	try {
		const page = parseInt(c.req.query('page') || '1')
		const limit = parseInt(c.req.query('limit') || '20')
		const search = c.req.query('search')
		const sort_by = c.req.query('sort_by') || 'created_at'
		const order = c.req.query('order') || 'desc'

		const offset = (page - 1) * limit

		console.log(`Fetching company reviews (page: ${page}, limit: ${limit})`)

		// Build query dynamically
		let queryText = 'SELECT * FROM company_reviews WHERE status = $1'
		let countText = 'SELECT COUNT(*) as count FROM company_reviews WHERE status = $1'
		const params: unknown[] = ['published']

		// Search filter
		if (search) {
			params.push(search)
			const searchClause = ` AND (
				company_name ILIKE '%' || $${params.length} || '%' OR
				region ILIKE '%' || $${params.length} || '%' OR
				project_type ILIKE '%' || $${params.length} || '%' OR
				company_phone ILIKE '%' || $${params.length} || '%' OR
				review_text ILIKE '%' || $${params.length} || '%'
			)`
			queryText += searchClause
			countText += searchClause
		}

		// Sorting
		const validSortFields = ['created_at', 'rating', 'like_count', 'view_count']
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

		console.log(`Found ${dataRows.length} reviews (total: ${count})`)

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
		console.error('Get reviews error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /slug/:slug
 * Get a single review by slug (for SEO pages)
 */
app.get('/slug/:slug', optionalAuth(), async (c) => {
	try {
		const slug = c.req.param('slug')

		const data = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM company_reviews WHERE slug = $1 AND status = $2',
			[slug, 'published']
		)

		if (!data) {
			return c.json({ error: '후기를 찾을 수 없습니다.' }, 404)
		}

		// Increment view count
		await query(
			c.env.DATABASE_URL,
			'UPDATE company_reviews SET view_count = $1 WHERE id = $2',
			[(data.view_count || 0) + 1, data.id]
		)

		return c.json(data)
	} catch (error) {
		console.error('Get review by slug error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /:id
 * Get a single review by ID (increments view count)
 */
app.get('/:id', optionalAuth(), async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`Fetching review: ${id}`)

		const data = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM company_reviews WHERE id = $1 AND status = $2',
			[id, 'published']
		)

		if (!data) {
			return c.json({ error: '후기를 찾을 수 없습니다.' }, 404)
		}

		// Increment view count
		await query(
			c.env.DATABASE_URL,
			'UPDATE company_reviews SET view_count = $1 WHERE id = $2',
			[(data.view_count || 0) + 1, id]
		)

		return c.json(data)
	} catch (error) {
		console.error('Get review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// ============================================
// Authenticated User Endpoints
// ============================================

/**
 * POST /
 * Create a new company review (requires authentication)
 * Supports multipart/form-data with images uploaded to R2
 */
app.post('/', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '로그인이 필요합니다.' }, 401)
		}

		const formData = await c.req.formData()

		const company_name = formData.get('company_name') as string | null
		const company_phone = formData.get('company_phone') as string | null
		const business_number = formData.get('business_number') as string | null
		const region = formData.get('region') as string | null
		const project_type = formData.get('project_type') as string | null
		const project_size = formData.get('project_size') as string | null
		const project_cost = formData.get('project_cost') as string | null
		const rating = formData.get('rating') as string | null
		const review_text = formData.get('review_text') as string | null

		// Validation - required fields
		if (!company_name || !company_phone || !business_number) {
			return c.json({
				error: '업체명, 연락처, 사업자번호를 모두 입력해주세요.'
			}, 400)
		}

		if (!rating || !review_text) {
			return c.json({
				error: '별점과 후기 내용을 입력해주세요.'
			}, 400)
		}

		if (review_text.trim().length < 10) {
			return c.json({
				error: '후기는 최소 10자 이상 작성해주세요.'
			}, 400)
		}

		console.log(`Creating new company review: ${company_name} by user ${userId}`)

		// Handle image uploads to R2
		let imageUrls: string[] = []
		const imageEntries = formData.getAll('images') as unknown as (string | File)[]
		const imageFiles = imageEntries.filter((entry): entry is File => typeof entry !== 'string' && entry instanceof File)

		if (imageFiles.length > 0) {
			console.log(`Uploading ${imageFiles.length} images...`)
			for (const file of imageFiles) {
				if (file.size > 0) {
					if (file.size > 2 * 1024 * 1024) {
						return c.json({ error: '이미지 파일 크기는 2MB 이하여야 합니다.' }, 400)
					}
					if (!file.type.startsWith('image/')) {
						return c.json({ error: '이미지 파일만 업로드 가능합니다.' }, 400)
					}

					const ext = file.name.split('.').pop() || 'jpg'
					const key = `reviews/${crypto.randomUUID()}.${ext}`
					const arrayBuffer = await file.arrayBuffer()

					await c.env.R2.put(key, arrayBuffer, {
						httpMetadata: { contentType: file.type }
					})

					imageUrls.push(key)
				}
			}
			console.log(`Uploaded ${imageUrls.length} images`)
		}

		// Generate slug
		const slug = generateSlug({
			region: region,
			type: project_type,
			company: company_name,
			suffix: '후기'
		})

		// Get client IP
		const ipAddress = getClientIp(c)

		// Get optional sub-ratings and extra fields
		const quality_rating = formData.get('quality_rating') as string | null
		const price_rating = formData.get('price_rating') as string | null
		const communication_rating = formData.get('communication_rating') as string | null
		const schedule_rating = formData.get('schedule_rating') as string | null
		const title = formData.get('title') as string | null
		const is_recommended = formData.get('is_recommended') as string | null

		// Separate before/after images
		const beforeImagesRaw = formData.getAll('before_images') as unknown as (string | File)[]
		const afterImagesRaw = formData.getAll('after_images') as unknown as (string | File)[]
		const beforeFiles = beforeImagesRaw.filter((entry): entry is File => typeof entry !== 'string' && entry instanceof File)
		const afterFiles = afterImagesRaw.filter((entry): entry is File => typeof entry !== 'string' && entry instanceof File)

		let beforeKeys: string[] = []
		let afterKeys: string[] = []

		for (const file of beforeFiles) {
			if (file.size > 0 && file.size <= 2 * 1024 * 1024 && file.type.startsWith('image/')) {
				const ext = file.name.split('.').pop() || 'webp'
				const key = `reviews/before/${crypto.randomUUID()}.${ext}`
				await c.env.R2.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
				beforeKeys.push(key)
			}
		}

		for (const file of afterFiles) {
			if (file.size > 0 && file.size <= 2 * 1024 * 1024 && file.type.startsWith('image/')) {
				const ext = file.name.split('.').pop() || 'webp'
				const key = `reviews/after/${crypto.randomUUID()}.${ext}`
				await c.env.R2.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
				afterKeys.push(key)
			}
		}

		// Insert review
		const data = await insertOne<any>(c.env.DATABASE_URL, 'company_reviews', {
			user_id: userId,
			company_name,
			company_phone: company_phone || null,
			business_number: business_number || null,
			region: region || null,
			project_type: project_type || null,
			project_size: project_size ? Number(project_size) : null,
			project_cost: project_cost ? Number(project_cost) : null,
			rating: Number(rating),
			quality_rating: quality_rating ? Number(quality_rating) : null,
			price_rating: price_rating ? Number(price_rating) : null,
			communication_rating: communication_rating ? Number(communication_rating) : null,
			schedule_rating: schedule_rating ? Number(schedule_rating) : null,
			title: title || `${company_name} ${project_type || ''} 후기`,
			review_text,
			images: JSON.stringify(imageUrls),
			before_images: JSON.stringify(beforeKeys),
			after_images: JSON.stringify(afterKeys),
			is_recommended: is_recommended !== 'false',
			verified: false,
			status: 'pending',
			slug,
			ip_address: ipAddress
		})

		if (!data) {
			throw new Error('Failed to insert review')
		}

		console.log(`Review created: ${data.id}`)

		return c.json({
			success: true,
			message: '후기가 등록되었습니다! 관리자 승인 후 게시됩니다.',
			data
		})
	} catch (error) {
		console.error('Create review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /:id
 * Update a review (only by author)
 */
app.patch('/:id', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const id = c.req.param('id')

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Updating review ${id} by user ${userId}`)

		// Check if user is the author
		const existingReview = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM company_reviews WHERE id = $1 AND user_id = $2',
			[id, userId]
		)

		if (!existingReview) {
			return c.json({ error: '후기를 찾을 수 없거나 수정 권한이 없습니다.' }, 404)
		}

		const formData = await c.req.formData()

		// Handle image uploads
		let imageUrls: string[] = []

		// Get existing images from request body
		const existingImages = formData.getAll('existing_images') as string[]
		if (existingImages && existingImages.length > 0) {
			imageUrls = existingImages
		}

		// Upload new images if any
		const imageEntries = formData.getAll('images') as unknown as (string | File)[]
		const imageFiles = imageEntries.filter((entry): entry is File => typeof entry !== 'string' && entry instanceof File)
		if (imageFiles.length > 0) {
			console.log(`Uploading ${imageFiles.length} new images...`)
			for (const file of imageFiles) {
				if (file.size > 0) {
					if (file.size > 2 * 1024 * 1024) {
						return c.json({ error: '이미지 파일 크기는 2MB 이하여야 합니다.' }, 400)
					}
					if (!file.type.startsWith('image/')) {
						return c.json({ error: '이미지 파일만 업로드 가능합니다.' }, 400)
					}

					const ext = file.name.split('.').pop() || 'jpg'
					const key = `reviews/${crypto.randomUUID()}.${ext}`
					const arrayBuffer = await file.arrayBuffer()

					await c.env.R2.put(key, arrayBuffer, {
						httpMetadata: { contentType: file.type }
					})

					imageUrls.push(key)
				}
			}
			console.log(`Total images: ${imageUrls.length}`)
		}

		// Build update query dynamically
		const updateFields: string[] = []
		const updateValues: unknown[] = []
		let paramIndex = 1

		const allowedFields: Record<string, string> = {
			'rating': 'rating',
			'review_text': 'review_text',
			'pros': 'pros',
			'cons': 'cons',
			'work_type': 'work_type',
			'work_date': 'work_date'
		}

		for (const [bodyField, dbField] of Object.entries(allowedFields)) {
			const value = formData.get(bodyField)
			if (value !== null) {
				updateFields.push(`${dbField} = $${paramIndex}`)
				updateValues.push(value)
				paramIndex++
			}
		}

		// Update images if there are any
		if (imageUrls.length > 0) {
			updateFields.push(`images = $${paramIndex}`)
			updateValues.push(JSON.stringify(imageUrls))
			paramIndex++
		}

		// Add updated_at
		updateFields.push(`updated_at = NOW()`)

		if (updateFields.length === 1) { // Only updated_at
			return c.json({ error: '수정할 내용이 없습니다.' }, 400)
		}

		// Add id and user_id to params
		updateValues.push(id, userId)

		const updateQuery = `
			UPDATE company_reviews
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
			RETURNING *
		`

		const rows = await query(c.env.DATABASE_URL, updateQuery, updateValues)

		if (!rows || rows.length === 0) {
			throw new Error('Failed to update review')
		}

		console.log(`Review updated: ${id}`)

		return c.json({
			success: true,
			message: '후기가 수정되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('Update review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * DELETE /:id
 * Delete a review (only by author)
 */
app.delete('/:id', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const id = c.req.param('id')

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Deleting review ${id} by user ${userId}`)

		// Soft delete (change status to 'deleted')
		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE company_reviews
			SET status = 'deleted', updated_at = NOW()
			WHERE id = $1 AND user_id = $2
			RETURNING *`,
			[id, userId]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '후기를 찾을 수 없거나 삭제 권한이 없습니다.' }, 404)
		}

		console.log(`Review deleted: ${id}`)

		return c.json({
			success: true,
			message: '후기가 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete review error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

export default app
