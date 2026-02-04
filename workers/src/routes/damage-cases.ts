import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { query, findOne, findMany, insertOne } from '../lib/db'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { getClientIp, generateSlug } from '../lib/utils'
import { isBlacklisted } from '../lib/blacklist'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================
// Public Endpoints
// ============================================

/**
 * GET /stats/summary
 * Get damage case statistics
 * (Registered before parameterized /:id route to avoid collision)
 */
app.get('/stats/summary', async (c) => {
	try {
		console.log('Fetching damage case statistics')

		// Total cases
		const totalRows = await query(
			c.env.DATABASE_URL,
			`SELECT COUNT(*) as count FROM damage_cases WHERE status != 'closed'`
		)
		const totalCount = totalRows[0] ? parseInt((totalRows[0] as any).count) : 0

		// By status
		const statusRows = await findMany<{ status: string; count: string }>(
			c.env.DATABASE_URL,
			`SELECT status, COUNT(*) as count
			FROM damage_cases
			WHERE status != 'closed'
			GROUP BY status`
		)
		const byStatus = statusRows.reduce((acc: Record<string, number>, row) => {
			acc[row.status] = parseInt(row.count)
			return acc
		}, {})

		// By severity
		const severityRows = await findMany<{ severity: string; count: string }>(
			c.env.DATABASE_URL,
			`SELECT severity, COUNT(*) as count
			FROM damage_cases
			WHERE status != 'closed'
			GROUP BY severity`
		)
		const bySeverity = severityRows.reduce((acc: Record<string, number>, row) => {
			acc[row.severity] = parseInt(row.count)
			return acc
		}, {})

		return c.json({
			total: totalCount,
			by_status: byStatus,
			by_severity: bySeverity
		})
	} catch (error) {
		console.error('Get stats error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /my/list
 * Get current user's damage cases
 * (Registered before parameterized /:id route to avoid collision)
 */
app.get('/my/list', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Fetching damage cases by user: ${userId}`)

		const rows = await findMany<any>(
			c.env.DATABASE_URL,
			`SELECT * FROM damage_cases
			WHERE user_id = $1 AND status != 'closed'
			ORDER BY created_at DESC`,
			[userId]
		)

		console.log(`Found ${rows.length} damage cases`)

		return c.json(rows)
	} catch (error) {
		console.error('Get my damage cases error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /
 * Get all published damage cases with pagination and filtering
 */
app.get('/', optionalAuth(), async (c) => {
	try {
		const page = parseInt(c.req.query('page') || '1')
		const limit = parseInt(c.req.query('limit') || '20')
		const search = c.req.query('search')
		const sort_by = c.req.query('sort_by') || 'created_at'
		const order = c.req.query('order') || 'desc'

		const offset = (page - 1) * limit

		console.log(`Fetching damage cases (page: ${page}, limit: ${limit})`)

		// Build query dynamically - only show approved posts (not pending/deleted/closed)
		let queryText = "SELECT * FROM damage_cases WHERE status IN ('open', 'in_progress', 'resolved')"
		let countText = "SELECT COUNT(*) as count FROM damage_cases WHERE status IN ('open', 'in_progress', 'resolved')"
		const params: unknown[] = []

		// Unified search
		if (search) {
			params.push(search)
			const searchClause = ` AND (
				title ILIKE '%' || $${params.length} || '%' OR
				description ILIKE '%' || $${params.length} || '%' OR
				category ILIKE '%' || $${params.length} || '%' OR
				region ILIKE '%' || $${params.length} || '%'
			)`
			queryText += searchClause
			countText += searchClause
		}

		// Sorting
		const validSortFields = ['created_at', 'severity']
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

		console.log(`Found ${dataRows.length} damage cases (total: ${count})`)

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
		console.error('Get damage cases error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /slug/:slug
 * Get a single damage case by slug (for SEO pages)
 */
app.get('/slug/:slug', optionalAuth(), async (c) => {
	try {
		const slug = c.req.param('slug')

		const data = await findOne<any>(
			c.env.DATABASE_URL,
			"SELECT * FROM damage_cases WHERE slug = $1 AND status IN ('open', 'in_progress', 'resolved')",
			[slug]
		)

		if (!data) {
			return c.json({ error: '피해 사례를 찾을 수 없습니다.' }, 404)
		}

		// Increment view count
		await query(
			c.env.DATABASE_URL,
			'UPDATE damage_cases SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
			[data.id]
		)

		return c.json(data)
	} catch (error) {
		console.error('Get damage case by slug error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /:id
 * Get a single damage case by ID
 */
app.get('/:id', optionalAuth(), async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`Fetching damage case: ${id}`)

		const data = await findOne<any>(
			c.env.DATABASE_URL,
			"SELECT * FROM damage_cases WHERE id = $1 AND status IN ('open', 'in_progress', 'resolved')",
			[id]
		)

		if (!data) {
			return c.json({ error: '피해 사례를 찾을 수 없습니다.' }, 404)
		}

		return c.json(data)
	} catch (error) {
		console.error('Get damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// ============================================
// Authenticated User Endpoints
// ============================================

/**
 * POST /
 * Create a new damage case (requires authentication)
 * Supports multipart/form-data with evidence images uploaded to R2
 */
app.post('/', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '로그인이 필요합니다.' }, 401)
		}

		// Check IP blacklist
		const clientIp = getClientIp(c)
		if (await isBlacklisted(c.env.DATABASE_URL, clientIp)) {
			return c.json({ error: '차단된 IP입니다. 관리자에게 문의하세요.' }, 403)
		}

		const formData = await c.req.formData()

		const company_name = formData.get('company_name') as string | null
		const company_phone = formData.get('company_phone') as string | null
		const business_number = formData.get('business_number') as string | null
		const damage_type = formData.get('damage_type') as string | null
		const damage_amount = formData.get('damage_amount') as string | null
		const case_description = formData.get('case_description') as string | null

		// Validation - required fields
		if (!company_name || !company_phone || !business_number) {
			return c.json({
				error: '업체명, 연락처, 사업자번호를 모두 입력해주세요.'
			}, 400)
		}

		if (!damage_type || !case_description) {
			return c.json({
				error: '피해 유형과 피해 내용은 필수입니다.'
			}, 400)
		}

		if (case_description.trim().length < 20) {
			return c.json({
				error: '피해 내용은 최소 20자 이상 작성해주세요.'
			}, 400)
		}

		console.log(`Creating new damage case: ${company_name} (${damage_type}) by user ${userId}`)

		// Handle image uploads to R2
		let imageUrls: string[] = []
		const imageEntries = formData.getAll('evidence_images') as unknown as (string | File)[]
		const imageFiles = imageEntries.filter((entry): entry is File => typeof entry !== 'string' && entry instanceof File)

		if (imageFiles.length > 10) {
			return c.json({ error: '이미지는 최대 10장까지 업로드 가능합니다.' }, 400)
		}

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
					const key = `damage-cases/${crypto.randomUUID()}.${ext}`
					const arrayBuffer = await file.arrayBuffer()

					await c.env.R2.put(key, arrayBuffer, {
						httpMetadata: { contentType: file.type }
					})

					imageUrls.push(key)
				}
			}
			console.log(`Uploaded ${imageUrls.length} images`)
		}

		// Get extra fields
		const title = formData.get('title') as string | null
		const resolution_status = formData.get('resolution_status') as string | null
		const legal_action = formData.get('legal_action') as string | null
		const disclaimer_agreed = formData.get('disclaimer_agreed') as string | null
		const region = formData.get('region') as string | null
		const severity = formData.get('severity') as string | null

		// Disclaimer must be agreed for damage cases
		if (disclaimer_agreed !== 'true') {
			return c.json({ error: '면책 조항에 동의해주세요.' }, 400)
		}

		// Build full description with extra info
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

		// Generate title and slug
		const titlePrefix = company_name || company_phone || business_number || '업체 정보 미상'
		const finalTitle = title || `${titlePrefix} - ${damage_type}`
		const slug = generateSlug({
			region: region,
			type: damage_type,
			suffix: '피해사례'
		})

		const ipAddress = getClientIp(c)

		// Insert damage case
		const data = await insertOne<any>(c.env.DATABASE_URL, 'damage_cases', {
			user_id: userId,
			title: finalTitle,
			description: fullDescription,
			images: JSON.stringify(imageUrls),
			category: damage_type,
			severity: severity || 'medium',
			status: 'pending',
			company_name: company_name,
			region: region,
			damage_type: damage_type,
			damage_amount: damage_amount ? Number(damage_amount) : null,
			resolution_status: resolution_status || 'unresolved',
			legal_action: legal_action === 'true',
			slug,
			ip_address: ipAddress,
			disclaimer_agreed: true,
			disclaimer_agreed_at: new Date().toISOString()
		})

		if (!data) {
			throw new Error('Failed to insert damage case')
		}

		console.log(`Damage case created: ${data.id}`)

		return c.json({
			success: true,
			message: '피해사례가 등록되었습니다! 관리자 승인 후 게시됩니다.',
			data
		})
	} catch (error) {
		console.error('Create damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /:id
 * Update a damage case (only by author)
 */
app.patch('/:id', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const id = c.req.param('id')

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Updating damage case ${id} by user ${userId}`)

		// Check if user is the author
		const existingCase = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM damage_cases WHERE id = $1 AND user_id = $2',
			[id, userId]
		)

		if (!existingCase) {
			return c.json({ error: '피해 사례를 찾을 수 없거나 수정 권한이 없습니다.' }, 404)
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
					const key = `damage-cases/${crypto.randomUUID()}.${ext}`
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
			'title': 'title',
			'description': 'description',
			'category': 'category',
			'severity': 'severity',
			'status': 'status'
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
			UPDATE damage_cases
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
			RETURNING *
		`

		const rows = await query(c.env.DATABASE_URL, updateQuery, updateValues)

		if (!rows || rows.length === 0) {
			throw new Error('Failed to update damage case')
		}

		console.log(`Damage case updated: ${id}`)

		return c.json({
			success: true,
			message: '피해 사례가 수정되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('Update damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * DELETE /:id
 * Delete a damage case (only by author)
 */
app.delete('/:id', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const id = c.req.param('id')

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Deleting damage case ${id} by user ${userId}`)

		// Get existing case to clean up R2 images
		const existing = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT images FROM damage_cases WHERE id = $1 AND user_id = $2',
			[id, userId]
		)

		// Soft delete (change status to 'closed')
		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE damage_cases
			SET status = 'closed', updated_at = NOW()
			WHERE id = $1 AND user_id = $2
			RETURNING *`,
			[id, userId]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '피해 사례를 찾을 수 없거나 삭제 권한이 없습니다.' }, 404)
		}

		// Clean up R2 images
		if (existing) {
			try {
				const imageKeys = JSON.parse(existing.images || '[]')
				if (Array.isArray(imageKeys)) {
					for (const key of imageKeys) {
						try { await c.env.R2.delete(key) } catch {}
					}
					if (imageKeys.length > 0) console.log(`Cleaned up ${imageKeys.length} R2 images`)
				}
			} catch {}
		}

		console.log(`Damage case deleted: ${id}`)

		return c.json({
			success: true,
			message: '피해 사례가 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete damage case error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

export default app
