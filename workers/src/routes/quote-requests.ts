import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { query, findOne, insertOne, deleteOne } from '../lib/db'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { enqueueAnalysis } from '../services/ai-analysis'
import { runAutoAnalysis } from '../services/auto-analysis'
import { sendQuoteReceivedEmail, sendQuoteCompletedEmail, sendAdminNewQuoteEmail, sendAnalysisResultEmail } from '../services/google-gmail'
import { notifyNewQuote, notifyAnalysisComplete, notifyError } from '../services/slack'
import { notifyNewQuoteViaTelegram } from '../services/telegram'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================
// Helper: parse multipart files from FormData
// ============================================

interface UploadedFile {
	name: string
	size: number
	type: string
	stream: () => ReadableStream
	arrayBuffer: () => Promise<ArrayBuffer>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validateImageFile(file: File): string | null {
	if (!file.type.startsWith('image/')) {
		return 'Only image files are allowed'
	}
	if (file.size > MAX_FILE_SIZE) {
		return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
	}
	return null
}

async function uploadToR2(
	r2: R2Bucket,
	file: File,
	prefix: string
): Promise<{ key: string; url: string }> {
	const ext = file.name.split('.').pop() || 'jpg'
	const key = `${prefix}/${crypto.randomUUID()}.${ext}`

	await r2.put(key, file.stream(), {
		httpMetadata: { contentType: file.type },
	})

	return { key, url: key }
}

// ============================================
// User Endpoints
// ============================================

// Upload floor plan images only (public endpoint - no analysis)
app.post('/upload-floor-plan', async (c) => {
	try {
		const formData = await c.req.formData()
		const files = formData.getAll('images') as unknown as File[]

		if (!files || files.length === 0) {
			return c.json({ error: '도면 이미지가 필요합니다.' }, 400)
		}

		if (files.length > 10) {
			return c.json({ error: '최대 10개의 이미지만 업로드할 수 있습니다.' }, 400)
		}

		// Validate all files
		for (const file of files) {
			const error = validateImageFile(file)
			if (error) {
				return c.json({ error }, 400)
			}
		}

		console.log(`Uploading ${files.length} floor plan image(s)`)

		// Upload images to R2
		const uploadResults = await Promise.all(
			files.map((file) => uploadToR2(c.env.R2, file, 'floor-plans'))
		)
		const imageUrls = uploadResults.map((r) => r.url)

		console.log(`${imageUrls.length} images uploaded to R2`)

		return c.json({
			success: true,
			message: `${files.length}장의 도면 이미지가 업로드되었습니다.`,
			imageUrls,
		})
	} catch (error) {
		console.error('Floor plan upload endpoint error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Parse quote image with AI Vision (public endpoint) - supports multiple images
app.post('/parse-image', async (c) => {
	try {
		const formData = await c.req.formData()
		const files = formData.getAll('images') as unknown as File[]

		if (!files || files.length === 0) {
			return c.json({ error: '이미지 파일이 필요합니다.' }, 400)
		}

		if (files.length > 5) {
			return c.json({ error: '최대 5개의 이미지만 업로드할 수 있습니다.' }, 400)
		}

		// Validate all files
		for (const file of files) {
			const error = validateImageFile(file)
			if (error) {
				return c.json({ error }, 400)
			}
		}

		console.log(`Parsing ${files.length} quote image(s)`)

		// Upload images to R2 and return keys (actual parsing is done during analysis)
		const uploadResults = await Promise.all(
			files.map((file) => uploadToR2(c.env.R2, file, 'quote-images'))
		)

		const imageKeys = uploadResults.map((r) => r.key)

		console.log(`${imageKeys.length} images uploaded for later parsing`)

		// For now, return uploaded image keys. The actual AI vision parsing
		// will happen server-side when admin triggers analysis.
		// On Workers we cannot run heavy image parsing synchronously.
		return c.json({
			success: true,
			items: [],
			imageKeys,
			message: `${files.length}장의 이미지가 업로드되었습니다. 분석 시 이미지를 활용합니다.`,
		})
	} catch (error) {
		console.error('Image parse endpoint error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message, items: [] }, 500)
	}
})

// Check for existing active group (before quote submission)
app.post('/check-group', async (c) => {
	try {
		const { customer_phone, property_type, property_size, region } =
			await c.req.json<{
				customer_phone: string
				property_type?: string
				property_size?: string
				region?: string
			}>()

		if (!customer_phone) {
			return c.json({ error: '전화번호가 필요합니다.' }, 400)
		}

		console.log(`Checking for active group: ${customer_phone}`)

		// 48-hour active group search
		const activeGroupRows = await query(
			c.env.DATABASE_URL,
			`SELECT * FROM quote_groups
			 WHERE customer_phone = $1
			   AND expires_at > NOW()
			   AND ($2::text IS NULL OR property_type = $2)
			   AND ($3::text IS NULL OR region = $3)
			 ORDER BY created_at DESC
			 LIMIT 1`,
			[customer_phone, property_type || null, region || null]
		)

		const activeGroup = activeGroupRows[0] as Record<string, unknown> | undefined

		if (!activeGroup) {
			return c.json({
				hasActiveGroup: false,
				message: '새로운 견적 비교를 시작합니다.',
				pricing: {
					quoteCount: 1,
					totalPrice: 30000,
					additionalPrice: 0,
					canAddMore: false,
				},
			})
		}

		// Group pricing info
		const quoteCount = (activeGroup.quote_count as number) || 1
		const pricing = {
			quoteCount: quoteCount + 1,
			totalPrice: 30000 + quoteCount * 10000,
			additionalPrice: 10000,
			canAddMore: quoteCount < 3,
		}

		// Hours remaining
		const expiresAt = new Date(activeGroup.expires_at as string)
		const now = new Date()
		const hoursRemaining = Math.max(
			0,
			Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
		)

		return c.json({
			hasActiveGroup: true,
			group: {
				id: activeGroup.id,
				group_name: activeGroup.group_name,
				quote_count: activeGroup.quote_count,
				expires_at: activeGroup.expires_at,
				hours_remaining: hoursRemaining,
			},
			pricing,
			message: `기존 프로젝트에 추가하시겠습니까? (${hoursRemaining}시간 남음)`,
		})
	} catch (error) {
		console.error('Group check error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Submit a new quote request (public endpoint)
app.post('/submit', async (c) => {
	try {
		const body = await c.req.json<{
			customer_name: string
			customer_phone: string
			customer_email?: string
			property_type: string
			property_size?: string
			region: string
			address?: string
			items: unknown[]
			group_id?: string
			group_name?: string
			floor_plan_images?: string[]
			room_areas?: Record<string, number>
			floor_plan_analysis_result?: unknown
		}>()

		const {
			customer_name,
			customer_phone,
			customer_email,
			property_type,
			property_size,
			region,
			address,
			items,
			group_id,
			group_name,
			floor_plan_images,
			room_areas,
			floor_plan_analysis_result,
		} = body

		// Validation
		if (!customer_name || !customer_phone || !property_type || !region || !items) {
			return c.json({ error: '필수 정보가 누락되었습니다.' }, 400)
		}

		if (!Array.isArray(items) || items.length === 0) {
			return c.json({ error: '견적 항목이 필요합니다.' }, 400)
		}

		console.log(`New quote request from ${customer_name} (${customer_phone})`)

		// Validate quote detail (simple check)
		const hasEnoughDetail = items.length >= 3
		let initialStatus: 'pending' | 'rejected' = 'pending'
		let validationStatus = hasEnoughDetail ? 'passed' : 'pending'
		let validationNotes = hasEnoughDetail
			? null
			: '항목 수가 적어 관리자 검토가 필요합니다.'

		if (items.length < 2) {
			initialStatus = 'rejected'
			validationStatus = 'rejected'
			validationNotes = '세부 항목이 부족합니다.'
		}

		let finalGroupId = group_id || null
		let sequence = 1
		let pricing = {
			quoteCount: 1,
			totalPrice: 30000,
			additionalPrice: 0,
		}

		// Group handling
		if (group_id) {
			// Add to existing group
			console.log(`Adding to existing group: ${group_id}`)
			const groupRows = await query(
				c.env.DATABASE_URL,
				`UPDATE quote_groups
				 SET quote_count = quote_count + 1,
				     total_price = total_price + 10000,
				     updated_at = NOW()
				 WHERE id = $1
				 RETURNING *`,
				[group_id]
			)
			const group = groupRows[0] as Record<string, unknown> | undefined
			if (group) {
				finalGroupId = group_id
				sequence = (group.quote_count as number) || 1
				pricing = {
					quoteCount: group.quote_count as number,
					totalPrice: group.total_price as number,
					additionalPrice: 10000,
				}
			}
		} else {
			// Create new group
			console.log(`Creating new quote group`)
			const newGroup = await insertOne<Record<string, unknown>>(
				c.env.DATABASE_URL,
				'quote_groups',
				{
					customer_name,
					customer_phone,
					customer_email: customer_email || null,
					group_name:
						group_name || `${property_type} ${property_size || ''}평 - ${region}`,
					property_type,
					property_size: property_size || null,
					region,
					address: address || null,
					quote_count: 1,
					total_price: 30000,
					expires_at: new Date(
						Date.now() + 48 * 60 * 60 * 1000
					).toISOString(),
				}
			)
			finalGroupId = newGroup.id as string
			sequence = 1
		}

		// Insert quote request
		const insertData: Record<string, unknown> = {
			customer_name,
			customer_phone,
			customer_email: customer_email || null,
			property_type,
			property_size: property_size || null,
			region,
			address: address || null,
			items: JSON.stringify(items),
			status: initialStatus,
			validation_status: validationStatus,
			validation_notes: validationNotes,
			group_id: finalGroupId,
			sequence_in_group: sequence,
		}

		// Add floor plan data if provided
		if (floor_plan_images && Array.isArray(floor_plan_images)) {
			insertData.floor_plan_images = JSON.stringify(floor_plan_images)
			console.log(`Floor plan images attached: ${floor_plan_images.length}`)
		}
		if (room_areas) {
			insertData.room_areas = JSON.stringify(room_areas)
			const roomCount = Object.keys(room_areas).length
			const totalArea = Object.values(room_areas).reduce(
				(sum: number, area) => sum + area,
				0
			)
			console.log(
				`Room areas attached: ${roomCount} rooms, ${totalArea.toFixed(1)}평`
			)
		}
		if (floor_plan_analysis_result) {
			insertData.floor_plan_analysis_result = JSON.stringify(
				floor_plan_analysis_result
			)
		}

		const data = await insertOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'quote_requests',
			insertData
		)

		if (!data) {
			throw new Error('Failed to insert quote request')
		}

		console.log(
			`Quote request created: ${data.id} (Group: ${finalGroupId}, Sequence: ${sequence})`
		)

		// Fire-and-forget notifications via waitUntil (non-blocking)
		c.executionCtx.waitUntil(
			Promise.allSettled([
				notifyNewQuote(c.env, {
					id: String(data.id),
					name: customer_name,
					phone: customer_phone,
					planName: `${property_type} ${region}`,
				}).catch(err => console.error('Failed to notify Slack:', err)),
				notifyNewQuoteViaTelegram(c.env, {
					id: String(data.id),
					name: customer_name,
					phone: customer_phone,
					propertyType: property_type,
					region,
					itemCount: items.length,
				}).catch(err => console.error('Failed to notify Telegram:', err)),
				...(customer_email ? [
					sendQuoteReceivedEmail(c.env, customer_email, String(data.id), customer_name)
						.catch(err => console.error('Failed to send confirmation email:', err)),
				] : []),
				sendAdminNewQuoteEmail(c.env, {
					id: String(data.id),
					name: customer_name,
					phone: customer_phone,
					planName: `${property_type} ${region}`,
				}).catch(err => console.error('Failed to send admin email:', err)),
			])
		)

		// Return appropriate message based on validation status
		let responseMessage = '견적 신청이 접수되었습니다.'
		if (initialStatus === 'rejected') {
			responseMessage = '견적서 등록이 거부되었습니다. 세부 항목이 부족합니다.'
		} else if (!hasEnoughDetail) {
			responseMessage =
				'견적 신청이 접수되었습니다. 관리자 검토 후 분석이 진행됩니다.'
		}

		return c.json({
			success: initialStatus !== 'rejected',
			message: responseMessage,
			request_id: data.id,
			group_id: finalGroupId,
			sequence,
			pricing,
			validation_status: validationStatus,
			validation_notes: validationNotes,
		})
	} catch (error) {
		console.error('Quote submission error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Get quote requests by phone number (for users to view their submissions)
// Protected: requires matching phone token or admin auth
app.get('/by-phone/:phone', async (c) => {
	try {
		const phone = c.req.param('phone')

		// Require phone-token header (SHA-256 of phone+date) or admin JWT
		const phoneToken = c.req.header('X-Phone-Token')
		const authHeader = c.req.header('Authorization')
		const isAdmin = authHeader?.startsWith('Bearer ')

		if (!isAdmin && !phoneToken) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		// Validate phone token (simple hash: phone + YYYY-MM-DD)
		if (!isAdmin && phoneToken) {
			const today = new Date().toISOString().slice(0, 10)
			const encoder = new TextEncoder()
			const data = encoder.encode(phone + today)
			const hashBuffer = await crypto.subtle.digest('SHA-256', data)
			const hashArray = Array.from(new Uint8Array(hashBuffer))
			const expectedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
			if (phoneToken !== expectedToken) {
				return c.json({ error: '잘못된 인증 토큰입니다.' }, 403)
			}
		}

		console.log(`Looking up quote requests for phone: ${phone}`)

		// Return only safe fields (exclude internal admin notes, PII of other customers)
		const rows = await query(
			c.env.DATABASE_URL,
			`SELECT id, customer_name, property_type, property_size, region, status,
				validation_status, created_at, updated_at, analysis_result, group_id, sequence_in_group
			 FROM quote_requests WHERE customer_phone = $1 ORDER BY created_at DESC`,
			[phone]
		)

		console.log(`Found ${rows.length} quote requests`)

		return c.json(rows)
	} catch (error) {
		console.error('Quote lookup error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Get quote requests by user ID (for authenticated users to view their submissions)
app.get('/user/:userId', async (c) => {
	try {
		const userId = c.req.param('userId')

		console.log(`Looking up quote requests for user: ${userId}`)

		const userData = await findOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'SELECT phone, email FROM users WHERE id = $1',
			[userId]
		)

		if (!userData) {
			return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)
		}

		let rows: unknown[]
		if (userData.phone) {
			rows = await query(
				c.env.DATABASE_URL,
				'SELECT * FROM quote_requests WHERE customer_phone = $1 OR customer_email = $2 ORDER BY created_at DESC',
				[userData.phone, userData.email]
			)
		} else {
			rows = await query(
				c.env.DATABASE_URL,
				'SELECT * FROM quote_requests WHERE customer_email = $1 ORDER BY created_at DESC',
				[userData.email]
			)
		}

		console.log(`Found ${rows.length} quote requests for user`)

		return c.json(rows)
	} catch (error) {
		console.error('User quote lookup error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Get a single quote request result (only if status is 'completed')
app.get('/result/:id', async (c) => {
	try {
		const id = c.req.param('id')

		const data = await findOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'SELECT * FROM quote_requests WHERE id = $1',
			[id]
		)

		if (!data) {
			return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
		}

		// Only return analysis if status is completed
		if (data.status !== 'completed') {
			return c.json(
				{
					error: '분석이 아직 완료되지 않았습니다.',
					status: data.status,
				},
				403
			)
		}

		return c.json(data)
	} catch (error) {
		console.error('Quote result error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// ============================================
// Admin Endpoints
// ============================================

// Get all quote requests (admin only)
app.get('/admin/all', authenticateToken(), requireAdmin(), async (c) => {
	try {
		const { status, limit: limitStr, offset: offsetStr } = c.req.query()
		const limit = Number(limitStr) || 50
		const offset = Number(offsetStr) || 0

		console.log(`Admin: Fetching quote requests (status: ${status || 'all'})`)

		let dataQuery = 'SELECT * FROM quote_requests'
		let countQuery = 'SELECT COUNT(*)::int as count FROM quote_requests'
		const params: unknown[] = []

		// Filter by status if provided
		if (status && status !== 'all') {
			dataQuery += ' WHERE status = $1'
			countQuery += ' WHERE status = $1'
			params.push(status)
		}

		dataQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

		const [dataRows, countRows] = await Promise.all([
			query(c.env.DATABASE_URL, dataQuery, [...params, limit, offset]),
			query(c.env.DATABASE_URL, countQuery, params),
		])

		const count = (countRows[0] as Record<string, unknown>)?.count as number || 0

		console.log(`Found ${dataRows.length} quote requests (total: ${count})`)

		return c.json({
			data: dataRows,
			count,
			limit,
			offset,
		})
	} catch (error) {
		console.error('Admin quote list error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Get a single quote request detail (admin only)
app.get('/admin/:id', authenticateToken(), requireAdmin(), async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`Admin: Fetching quote request ${id}`)

		const data = await findOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'SELECT * FROM quote_requests WHERE id = $1',
			[id]
		)

		if (!data) {
			return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
		}

		return c.json(data)
	} catch (error) {
		console.error('Admin quote detail error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Run AI analysis on a quote request (admin only)
// Enqueues the analysis job instead of running synchronously
app.post('/admin/:id/analyze', authenticateToken(), requireAdmin(), async (c) => {
	try {
		const id = c.req.param('id')
		const { analyzed_by = 'admin' } = await c.req.json<{ analyzed_by?: string }>().catch(() => ({ analyzed_by: 'admin' }))

		console.log(`Admin: Starting analysis for quote request ${id}`)

		// Verify quote request exists
		const quoteRequest = await findOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'SELECT * FROM quote_requests WHERE id = $1',
			[id]
		)

		if (!quoteRequest) {
			return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
		}

		// Check for quote_sets
		const quoteSets = await query(
			c.env.DATABASE_URL,
			'SELECT * FROM quote_sets WHERE request_id = $1 ORDER BY set_id',
			[id]
		)

		// Collect items to verify there are items to analyze
		let allItems: unknown[] = []

		if (quoteSets.length > 0) {
			for (const qs of quoteSets) {
				const quoteSet = qs as Record<string, unknown>
				if (quoteSet.items && Array.isArray(quoteSet.items)) {
					allItems.push(...(quoteSet.items as unknown[]))
				}
			}
		} else {
			allItems = (quoteRequest.items as unknown[]) || []
		}

		if (allItems.length === 0) {
			return c.json({ error: '분석할 견적 항목이 없습니다.' }, 400)
		}

		// Update status to analyzing
		await query(
			c.env.DATABASE_URL,
			'UPDATE quote_requests SET status = $1, analyzed_by = $2, updated_at = NOW() WHERE id = $3',
			['analyzing', analyzed_by, id]
		)

		// Enqueue analysis job
		const jobId = await enqueueAnalysis(c.env, String(id), 'standard')

		console.log(`Analysis job enqueued: ${jobId}`)

		return c.json({
			success: true,
			message: '집첵 시스템 분석이 시작되었습니다.',
			jobId,
			data: { ...quoteRequest, status: 'analyzing' },
		})
	} catch (error) {
		console.error('Analysis error:', error)
		const id = c.req.param('id')

		// Revert status on error
		await query(
			c.env.DATABASE_URL,
			'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
			['pending', id]
		).catch(() => {})

		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Run auto analysis on a quote request (admin only)
// This actually executes the scoring engine instead of just enqueueing
app.post('/admin/:id/auto-analyze', authenticateToken(), requireAdmin(), async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`Admin: Running auto-analysis for quote request ${id}`)

		// Verify quote request exists
		const quoteRequest = await findOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'SELECT * FROM quote_requests WHERE id = $1',
			[id]
		)

		if (!quoteRequest) {
			return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
		}

		// Race condition guard: prevent duplicate analysis
		if (quoteRequest.status === 'analyzing' || quoteRequest.status === 'completed') {
			return c.json({
				error: quoteRequest.status === 'analyzing'
					? '이미 분석이 진행 중입니다.'
					: '이미 분석이 완료된 견적입니다. 재분석하려면 상태를 먼저 초기화하세요.',
			}, 409)
		}

		// Check for quote_sets
		const quoteSets = await query(
			c.env.DATABASE_URL,
			'SELECT * FROM quote_sets WHERE request_id = $1 ORDER BY set_id',
			[id]
		)

		// Collect items
		let allItems: unknown[] = []

		if (quoteSets.length > 0) {
			for (const qs of quoteSets) {
				const quoteSet = qs as Record<string, unknown>
				if (quoteSet.items && Array.isArray(quoteSet.items)) {
					allItems.push(...(quoteSet.items as unknown[]))
				}
			}
		} else {
			allItems = (quoteRequest.items as unknown[]) || []
		}

		if (allItems.length === 0) {
			return c.json({ error: '분석할 견적 항목이 없습니다.' }, 400)
		}

		// Update status to analyzing
		await query(
			c.env.DATABASE_URL,
			'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
			['analyzing', id]
		)

		// Run the auto analysis engine
		const result = await runAutoAnalysis(c.env, {
			quoteRequestId: String(id),
			items: allItems as Array<Record<string, unknown>>,
			propertySizeSqm: (quoteRequest.property_size as number) || null,
			region: (quoteRequest.region as string) || '서울',
			propertyType: (quoteRequest.property_type as string) || '',
			quoteDate: (quoteRequest.created_at as string) || null,
			constructionStartMonth: null,
			grade: null,
			isExclusive: false,
			customerName: (quoteRequest.customer_name as string) || null,
			customerEmail: (quoteRequest.customer_email as string) || null,
		})

		console.log(`Auto-analysis completed: score=${result.totalScore}, grade=${result.grade.label}`)

		// Send analysis result email if customer has email
		const customerEmail = quoteRequest.customer_email as string | undefined
		if (customerEmail) {
			try {
				await sendAnalysisResultEmail(c.env, customerEmail, String(quoteRequest.customer_name || ''), result)
			} catch (emailErr) {
				console.error('Failed to send analysis result email:', emailErr)
			}
		}

		return c.json({
			success: true,
			message: `자동 분석이 완료되었습니다. (${result.grade.label}등급, ${result.totalScore}점)`,
			data: {
				analysisId: result.analysisId,
				totalScore: result.totalScore,
				grade: result.grade,
				scoreBreakdown: result.scoreBreakdown,
				adjustmentFactors: result.adjustmentFactors,
				itemsSummary: {
					total: result.items.length,
					mapped: result.items.filter(i => i.std_category).length,
					benchmarked: result.items.filter(i => i.benchmark_unit_price != null).length,
				},
			},
		})
	} catch (error) {
		console.error('Auto-analysis error:', error)
		const id = c.req.param('id')

		// Revert status on error
		await query(
			c.env.DATABASE_URL,
			'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
			['pending', id]
		).catch(() => {})

		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Update quote request status (admin only)
app.patch('/admin/:id/status', authenticateToken(), requireAdmin(), async (c) => {
	try {
		const id = c.req.param('id')
		const { status, admin_notes } = await c.req.json<{
			status: string
			admin_notes?: string
		}>()

		console.log(`Admin: Updating status for quote request ${id} to ${status}`)

		let updateQuery: string
		let params: unknown[]

		if (admin_notes !== undefined) {
			updateQuery =
				'UPDATE quote_requests SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *'
			params = [status, admin_notes, id]
		} else {
			updateQuery =
				'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *'
			params = [status, id]
		}

		const rows = await query(c.env.DATABASE_URL, updateQuery, params)
		const data = rows[0] as Record<string, unknown> | undefined

		if (!data) {
			return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
		}

		console.log(`Quote request status updated`)

		return c.json({
			success: true,
			message: '상태가 업데이트되었습니다.',
			data,
		})
	} catch (error) {
		console.error('Status update error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// Update expert item notes (admin only)
app.patch(
	'/admin/:id/expert-notes',
	authenticateToken(),
	requireAdmin(),
	async (c) => {
		try {
			const id = c.req.param('id')
			const { expert_item_notes } = await c.req.json<{
				expert_item_notes: unknown
			}>()

			console.log(`Admin: Updating expert notes for quote request ${id}`)

			const rows = await query(
				c.env.DATABASE_URL,
				'UPDATE quote_requests SET expert_item_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
				[JSON.stringify(expert_item_notes), id]
			)

			const data = rows[0] as Record<string, unknown> | undefined

			if (!data) {
				return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
			}

			console.log(`Expert notes updated`)

			return c.json({
				success: true,
				message: '전문가 의견이 저장되었습니다.',
				data,
			})
		} catch (error) {
			console.error('Expert notes update error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return c.json({ error: message }, 500)
		}
	}
)

// Update analysis result manually (admin only)
app.patch(
	'/admin/:id/analysis-result',
	authenticateToken(),
	requireAdmin(),
	async (c) => {
		try {
			const id = c.req.param('id')
			const { analysis_result } = await c.req.json<{
				analysis_result: Record<string, unknown>
			}>()

			console.log(
				`Admin: Manually updating analysis result for quote request ${id}`
			)

			if (!analysis_result) {
				return c.json({ error: '분석 결과 데이터가 필요합니다.' }, 400)
			}

			// Validate analysis_result structure
			const requiredFields = [
				'overallScore',
				'totalAmount',
				'averageMarketPrice',
				'priceRating',
				'summary',
				'categoryAnalysis',
				'recommendations',
				'marketComparison',
				'expertNotes',
			]
			const missingFields = requiredFields.filter(
				(field) => !(field in analysis_result)
			)

			if (missingFields.length > 0) {
				return c.json(
					{
						error: `분석 결과에 필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
					},
					400
				)
			}

			// Update analysis result
			const rows = await query(
				c.env.DATABASE_URL,
				'UPDATE quote_requests SET analysis_result = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
				[JSON.stringify(analysis_result), id]
			)

			const data = rows[0] as Record<string, unknown> | undefined

			if (!data) {
				return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
			}

			console.log(`Analysis result manually updated`)

			return c.json({
				success: true,
				message: '분석 결과가 수정되었습니다.',
				data,
			})
		} catch (error) {
			console.error('Analysis result update error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return c.json({ error: message }, 500)
		}
	}
)

// Delete quote request (admin only)
app.delete('/admin/:id', authenticateToken(), requireAdmin(), async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`Admin: Deleting quote request ${id}`)

		const deleted = await deleteOne(c.env.DATABASE_URL, 'quote_requests', id)

		if (!deleted) {
			return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
		}

		console.log(`Quote request deleted`)

		return c.json({
			success: true,
			message: '견적 신청이 삭제되었습니다.',
		})
	} catch (error) {
		console.error('Delete error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// ============================================
// Multiple Quote Submission Endpoint
// ============================================

app.post('/submit-multiple', async (c) => {
	try {
		const body = await c.req.json<{
			// Payment info
			payment_id?: string
			plan_id?: string
			plan_name?: string
			quantity?: number
			original_amount?: number
			discount_amount?: number
			paid_amount?: number
			// Customer info
			customer_name: string
			customer_phone: string
			customer_email?: string
			// Property info
			property_type: string
			property_size?: string
			region: string
			address?: string
			// Quote sets (SET_A, SET_B, SET_C)
			quote_sets: Array<{
				set_id: string
				vendor_name: string
				vendor_phone?: string
				vendor_representative?: string
				vendor_business_number?: string
				vendor_license_status?: string
				vendor_warranty_insurance?: string
				upload_type: string
				images?: string[]
				items: Array<Record<string, unknown>>
			}>
		}>()

		const {
			payment_id,
			plan_name,
			paid_amount,
			customer_name,
			customer_phone,
			customer_email,
			property_type,
			property_size,
			region,
			address,
			quote_sets,
		} = body

		// Validation
		if (!customer_name || !customer_phone || !property_type || !region) {
			return c.json({ error: '필수 정보가 누락되었습니다.' }, 400)
		}

		if (!Array.isArray(quote_sets) || quote_sets.length === 0) {
			return c.json({ error: '최소 1개의 견적서가 필요합니다.' }, 400)
		}

		if (quote_sets.length > 3) {
			return c.json(
				{ error: '최대 3개의 견적서만 제출할 수 있습니다.' },
				400
			)
		}

		console.log(
			`Multiple quote submission from ${customer_name} (${customer_phone})`
		)
		console.log(`   - Quote sets: ${quote_sets.length}`)
		console.log(`   - Payment: ${plan_name} (${paid_amount}원)`)

		// Validate each quote set
		for (let i = 0; i < quote_sets.length; i++) {
			const set = quote_sets[i]
			if (!set.vendor_name || !set.upload_type || !Array.isArray(set.items)) {
				return c.json(
					{
						error: `견적서 ${i + 1}번: 업체명, 업로드 타입, 견적 항목이 필요합니다.`,
					},
					400
				)
			}

			if (!['SET_A', 'SET_B', 'SET_C'].includes(set.set_id)) {
				return c.json(
					{
						error: `견적서 ${i + 1}번: set_id는 SET_A, SET_B, SET_C 중 하나여야 합니다.`,
					},
					400
				)
			}

			if (!['image', 'excel'].includes(set.upload_type)) {
				return c.json(
					{
						error: `견적서 ${i + 1}번: upload_type은 image 또는 excel이어야 합니다.`,
					},
					400
				)
			}

			if (set.items.length === 0) {
				return c.json(
					{
						error: `견적서 ${i + 1}번: 최소 1개의 견적 항목이 필요합니다.`,
					},
					400
				)
			}
		}

		// Find or create quote group
		let finalGroupId: string | null = null
		let sequence = 1

		// Check for existing active group
		const activeGroupRows = await query(
			c.env.DATABASE_URL,
			`SELECT * FROM quote_groups
			 WHERE customer_phone = $1
			   AND expires_at > NOW()
			   AND property_type = $2
			   AND ($3::text IS NULL OR region = $3)
			 ORDER BY created_at DESC
			 LIMIT 1`,
			[customer_phone, property_type, region || null]
		)

		const activeGroup = activeGroupRows[0] as Record<string, unknown> | undefined

		if (activeGroup) {
			console.log(`Adding to existing group: ${activeGroup.id}`)
			const groupRows = await query(
				c.env.DATABASE_URL,
				`UPDATE quote_groups
				 SET quote_count = quote_count + 1,
				     total_price = total_price + 10000,
				     updated_at = NOW()
				 WHERE id = $1
				 RETURNING *`,
				[activeGroup.id]
			)
			const group = groupRows[0] as Record<string, unknown>
			finalGroupId = group.id as string
			sequence = group.quote_count as number
		} else {
			console.log(`Creating new quote group`)
			const newGroup = await insertOne<Record<string, unknown>>(
				c.env.DATABASE_URL,
				'quote_groups',
				{
					customer_name,
					customer_phone,
					customer_email: customer_email || null,
					group_name: `${property_type} ${property_size ? property_size + '㎡' : ''} - ${region}`,
					property_type,
					property_size: property_size || null,
					region,
					address: address || null,
					quote_count: 1,
					total_price: 30000,
					expires_at: new Date(
						Date.now() + 48 * 60 * 60 * 1000
					).toISOString(),
				}
			)
			finalGroupId = newGroup.id as string
			sequence = 1
		}

		// Create the main quote request (without items - items are in quote_sets)
		const quoteRequest = await insertOne<Record<string, unknown>>(
			c.env.DATABASE_URL,
			'quote_requests',
			{
				customer_name,
				customer_phone,
				customer_email: customer_email || null,
				property_type,
				property_size: property_size || null,
				region,
				address: address || null,
				items: JSON.stringify([]),
				status: 'pending',
				validation_status: 'pending',
				group_id: finalGroupId,
				sequence_in_group: sequence,
			}
		)

		if (!quoteRequest) {
			throw new Error('Failed to insert quote request')
		}

		console.log(`Quote request created: ${quoteRequest.id}`)

		// Create quote sets with images and items
		const createdSets: Record<string, unknown>[] = []
		let totalAmountAllSets = 0

		for (const set of quote_sets) {
			// Calculate total amount from items
			const totalAmount = set.items.reduce((sum: number, item) => {
				return sum + ((item.total_price as number) || 0)
			}, 0)

			// Simple validation
			const isValid = set.items.length >= 2

			// Create quote set
			const quoteSet = await insertOne<Record<string, unknown>>(
				c.env.DATABASE_URL,
				'quote_sets',
				{
					request_id: quoteRequest.id,
					set_id: set.set_id,
					vendor_name: set.vendor_name,
					vendor_phone: set.vendor_phone || null,
					vendor_representative: set.vendor_representative || null,
					vendor_business_number: set.vendor_business_number || null,
					vendor_license_status: set.vendor_license_status || 'unknown',
					vendor_warranty_insurance: set.vendor_warranty_insurance || 'unknown',
					upload_type: set.upload_type,
					images: JSON.stringify(set.images || []),
					items: JSON.stringify(set.items),
					total_amount: totalAmount,
					item_count: set.items.length,
					validation_status: isValid ? 'passed' : 'failed',
					validation_errors: JSON.stringify(
						isValid ? [] : ['항목 수가 부족합니다.']
					),
					validation_warnings: JSON.stringify([]),
				}
			)

			if (!quoteSet) {
				throw new Error(`Failed to insert quote set ${set.set_id}`)
			}

			console.log(
				`Quote set created: ${set.set_id} (${set.vendor_name}, ${totalAmount}원)`
			)
			createdSets.push(quoteSet)
			totalAmountAllSets += totalAmount
		}

		// Fire-and-forget notifications via waitUntil (non-blocking)
		c.executionCtx.waitUntil(
			Promise.allSettled([
				notifyNewQuote(c.env, {
					id: String(quoteRequest.id),
					name: customer_name,
					phone: customer_phone,
					planName: plan_name || `${property_type} ${region}`,
				}).catch(err => console.error('Failed to notify Slack:', err)),
				notifyNewQuoteViaTelegram(c.env, {
					id: String(quoteRequest.id),
					name: customer_name,
					phone: customer_phone,
					propertyType: property_type,
					region,
					quoteSetCount: quote_sets.length,
					itemCount: quote_sets.reduce((sum, s) => sum + s.items.length, 0),
				}).catch(err => console.error('Failed to notify Telegram:', err)),
				...(customer_email ? [
					sendQuoteReceivedEmail(c.env, customer_email, String(quoteRequest.id), customer_name)
						.catch(err => console.error('Failed to send confirmation email:', err)),
				] : []),
				sendAdminNewQuoteEmail(c.env, {
					id: String(quoteRequest.id),
					name: customer_name,
					phone: customer_phone,
					planName: plan_name || `${property_type} ${region}`,
				}).catch(err => console.error('Failed to send admin email:', err)),
			])
		)

		return c.json({
			success: true,
			message: '견적서가 제출되었습니다. 집첵 시스템 분석을 진행합니다.',
			request_id: quoteRequest.id,
			group_id: finalGroupId,
			sequence,
			quote_sets: createdSets.map((set) => ({
				id: set.id,
				set_id: set.set_id,
				vendor_name: set.vendor_name,
				total_amount: set.total_amount,
				validation_status: set.validation_status,
			})),
		})
	} catch (error) {
		console.error('Multiple quote submission error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// ============================================
// GPT-5 Pro Comprehensive Analysis (Admin Only)
// ============================================

app.post(
	'/admin/:id/analyze-comprehensive',
	authenticateToken(),
	requireAdmin(),
	async (c) => {
		try {
			const id = c.req.param('id')
			const { analyzed_by = 'admin', user_id } = await c.req
				.json<{ analyzed_by?: string; user_id?: string }>()
				.catch(() => ({ analyzed_by: 'admin', user_id: undefined }))

			console.log(
				`Admin: Starting GPT-5 Pro comprehensive analysis for quote request ${id}`
			)

			// Verify quote request exists
			const quoteRequest = await findOne<Record<string, unknown>>(
				c.env.DATABASE_URL,
				'SELECT * FROM quote_requests WHERE id = $1',
				[id]
			)

			if (!quoteRequest) {
				return c.json({ error: '견적을 찾을 수 없습니다.' }, 404)
			}

			// Check for quote_sets
			const quoteSets = await query(
				c.env.DATABASE_URL,
				'SELECT * FROM quote_sets WHERE request_id = $1 ORDER BY set_id',
				[id]
			)

			let allItems: unknown[] = []

			if (quoteSets.length > 0) {
				console.log(`Found ${quoteSets.length} quote sets`)
				for (const qs of quoteSets) {
					const quoteSet = qs as Record<string, unknown>
					if (quoteSet.items && Array.isArray(quoteSet.items)) {
						allItems.push(...(quoteSet.items as unknown[]))
					}
				}
			} else {
				allItems = (quoteRequest.items as unknown[]) || []
			}

			if (allItems.length === 0) {
				return c.json({ error: '분석할 견적 항목이 없습니다.' }, 400)
			}

			console.log(`Total items collected: ${allItems.length}`)

			// Update status to analyzing
			await query(
				c.env.DATABASE_URL,
				'UPDATE quote_requests SET status = $1, analyzed_by = $2, updated_at = NOW() WHERE id = $3',
				['analyzing', analyzed_by, id]
			)

			// Enqueue comprehensive analysis job
			const jobId = await enqueueAnalysis(c.env, String(id), 'comprehensive')

			console.log(`Comprehensive analysis job enqueued: ${jobId}`)

			return c.json({
				success: true,
				message: 'GPT-5 Pro 종합 분석이 시작되었습니다.',
				jobId,
				data: { ...quoteRequest, status: 'analyzing' },
			})
		} catch (error) {
			console.error('GPT-5 Pro comprehensive analysis error:', error)
			const id = c.req.param('id')

			// Revert status on error
			await query(
				c.env.DATABASE_URL,
				'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
				['pending', id]
			).catch(() => {})

			const message = error instanceof Error ? error.message : 'Unknown error'
			return c.json({ error: message }, 500)
		}
	}
)

// Cancel analysis job
app.post(
	'/admin/analysis-job/:jobId/cancel',
	authenticateToken(),
	requireAdmin(),
	async (c) => {
		try {
			const jobId = c.req.param('jobId')

			console.log(`Admin: Canceling analysis job ${jobId}`)

			await query(
				c.env.DATABASE_URL,
				`UPDATE analysis_jobs SET status = 'cancelled', completed_at = NOW() WHERE id = $1 AND status IN ('queued', 'processing')`,
				[jobId]
			)

			return c.json({
				success: true,
				message: '분석 작업이 취소되었습니다.',
			})
		} catch (error) {
			console.error('Job cancel error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return c.json({ error: message }, 500)
		}
	}
)

// Get analysis job status
app.get(
	'/admin/analysis-job/:jobId',
	authenticateToken(),
	requireAdmin(),
	async (c) => {
		try {
			const jobId = c.req.param('jobId')

			const rows = await query(
				c.env.DATABASE_URL,
				`SELECT
					aj.*,
					(SELECT json_agg(ajo.* ORDER BY ajo.step)
					FROM analysis_job_outputs ajo
					WHERE ajo.job_id = aj.id) as outputs,
					(SELECT json_agg(aju.* ORDER BY aju.step)
					FROM analysis_job_usage aju
					WHERE aju.job_id = aj.id) as usage_logs
				FROM analysis_jobs aj
				WHERE aj.id = $1`,
				[jobId]
			)

			if (rows.length === 0) {
				return c.json({ error: '분석 작업을 찾을 수 없습니다.' }, 404)
			}

			return c.json({
				success: true,
				data: rows[0],
			})
		} catch (error) {
			console.error('Job status query error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return c.json({ error: message }, 500)
		}
	}
)

// Get analysis jobs list (monitoring)
app.get(
	'/admin/analysis-jobs',
	authenticateToken(),
	requireAdmin(),
	async (c) => {
		try {
			const { status, limit: limitStr, offset: offsetStr } = c.req.query()
			const limit = Number(limitStr) || 20
			const offset = Number(offsetStr) || 0

			let jobsQuery = `
				SELECT
					aj.*,
					qr.customer_name,
					qr.property_type,
					qr.region
				FROM analysis_jobs aj
				LEFT JOIN quote_requests qr ON aj.quote_request_id = qr.id
			`
			const params: unknown[] = []

			if (status && status !== 'all') {
				jobsQuery += ' WHERE aj.status = $1'
				params.push(status)
			}

			jobsQuery += ` ORDER BY aj.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
			params.push(limit, offset)

			const dataRows = await query(c.env.DATABASE_URL, jobsQuery, params)

			// Statistics for last 7 days
			const statsRows = await query(
				c.env.DATABASE_URL,
				`SELECT status, COUNT(*)::int as count, AVG(actual_tokens_used)::int as avg_tokens, SUM(actual_cost_usd)::numeric as total_cost
				FROM analysis_jobs
				WHERE created_at > NOW() - INTERVAL '7 days'
				GROUP BY status`
			)

			return c.json({
				success: true,
				data: dataRows,
				stats: statsRows,
				pagination: {
					limit,
					offset,
					total: dataRows.length,
				},
			})
		} catch (error) {
			console.error('Jobs list query error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return c.json({ error: message }, 500)
		}
	}
)

export default app
