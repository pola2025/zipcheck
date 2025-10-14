import { Router } from 'express'
import multer from 'multer'
import { query, insertOne, updateOne, findOne, findMany, deleteOne } from '../lib/db'
import { analyzeQuote } from '../services/ai-analysis'
import {
	findActiveGroup,
	createQuoteGroup,
	addQuoteToGroup,
	getGroupPricing
} from '../services/quote-group'
import { validateQuoteDetail, needsAdminReview } from '../services/quote-validation'
import { parseQuoteImage } from '../services/image-parser'
import { analyzeFloorPlan, analyzeMultipleFloorPlans } from '../services/floor-plan-analysis'
import { uploadImages } from '../services/image-upload'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { comprehensiveAnalysis, cancelAnalysisJob } from '../services/comprehensive-analysis'
import { logQuoteRequest, logPaymentComplete, logAnalysisComplete, logQuoteDelivery } from '../services/notion-customer-log'

const router = Router()

// Multer configuration for image upload
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true)
		} else {
			cb(new Error('Only image files are allowed'))
		}
	}
})

// ============================================
// User Endpoints
// ============================================

// Upload floor plan images only (public endpoint - no analysis)
router.post('/upload-floor-plan', upload.array('images', 10), async (req, res) => {
	try {
		const files = req.files as Express.Multer.File[]

		if (!files || files.length === 0) {
			return res.status(400).json({ error: '도면 이미지가 필요합니다.' })
		}

		console.log(`📐 Uploading ${files.length} floor plan image(s)`)

		// Upload images to storage (no analysis yet)
		const uploadResults = await uploadImages(files, 'floor-plans')
		const imageUrls = uploadResults.map(r => r.url)

		console.log(`✅ ${imageUrls.length} images uploaded to storage`)

		res.json({
			success: true,
			message: `${files.length}장의 도면 이미지가 업로드되었습니다.`,
			imageUrls
		})
	} catch (error) {
		console.error('Floor plan upload endpoint error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Parse quote image with AI Vision (public endpoint) - supports multiple images
router.post('/parse-image', upload.array('images', 5), async (req, res) => {
	try {
		const files = req.files as Express.Multer.File[]

		if (!files || files.length === 0) {
			return res.status(400).json({ error: '이미지 파일이 필요합니다.' })
		}

		console.log(`🖼️  Parsing ${files.length} quote image(s)`)

		// Parse all images in parallel
		const parsePromises = files.map(file => {
			console.log(`  - ${file.originalname} (${(file.size / 1024).toFixed(2)}KB)`)
			return parseQuoteImage(file.buffer)
		})

		const results = await Promise.all(parsePromises)

		// Log compression statistics
		results.forEach((result, index) => {
			if (result.success && result.compressionStats) {
				const stats = result.compressionStats
				console.log(`  📦 Image ${index + 1} compression:`)
				console.log(`     Original: ${(stats.originalSize / 1024).toFixed(2)}KB`)
				console.log(`     Compressed: ${(stats.compressedSize / 1024).toFixed(2)}KB`)
				console.log(`     Saved: ${stats.compressionRatio.toFixed(1)}%`)
			}
		})

		// Calculate total compression savings
		const totalOriginal = results.reduce((sum, r) => sum + (r.compressionStats?.originalSize || 0), 0)
		const totalCompressed = results.reduce((sum, r) => sum + (r.compressionStats?.compressedSize || 0), 0)
		const totalSavings = totalOriginal - totalCompressed
		if (totalOriginal > 0) {
			console.log(`📊 Total compression: ${(totalOriginal / 1024).toFixed(2)}KB → ${(totalCompressed / 1024).toFixed(2)}KB (saved ${(totalSavings / 1024).toFixed(2)}KB)`)
		}

		// Combine all items from all images
		const allItems = results.flatMap(result => {
			if (!result.success) {
				console.warn(`⚠️  Image parsing failed: ${result.message}`)
				return []
			}
			return result.items
		})

		// Check if at least one image was successfully parsed
		const successCount = results.filter(r => r.success).length
		if (successCount === 0) {
			return res.status(500).json({
				error: '모든 이미지 분석에 실패했습니다.',
				items: []
			})
		}

		console.log(`✅ Successfully extracted ${allItems.length} items from ${successCount}/${files.length} images`)

		res.json({
			success: true,
			items: allItems,
			message: `${files.length}장의 이미지에서 ${allItems.length}개 항목을 추출했습니다.`
		})
	} catch (error) {
		console.error('Image parse endpoint error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message, items: [] })
	}
})

// Check for existing active group (before quote submission)
router.post('/check-group', async (req, res) => {
	try {
		const { customer_phone, property_type, property_size, region } = req.body

		if (!customer_phone) {
			return res.status(400).json({ error: '전화번호가 필요합니다.' })
		}

		console.log(`🔍 Checking for active group: ${customer_phone}`)

		// 48시간 내 활성 그룹 찾기
		const activeGroup = await findActiveGroup(customer_phone, {
			property_type,
			property_size,
			region
		})

		if (!activeGroup) {
			return res.json({
				hasActiveGroup: false,
				message: '새로운 견적 비교를 시작합니다.',
				pricing: {
					quoteCount: 1,
					totalPrice: 30000,
					additionalPrice: 0,
					canAddMore: false
				}
			})
		}

		// 그룹 가격 정보 조회
		const pricing = await getGroupPricing(activeGroup.id)

		// 48시간 남은 시간 계산
		const expiresAt = new Date(activeGroup.expires_at)
		const now = new Date()
		const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

		return res.json({
			hasActiveGroup: true,
			group: {
				id: activeGroup.id,
				group_name: activeGroup.group_name,
				quote_count: activeGroup.quote_count,
				expires_at: activeGroup.expires_at,
				hours_remaining: hoursRemaining
			},
			pricing,
			message: `기존 프로젝트에 추가하시겠습니까? (${hoursRemaining}시간 남음)`
		})
	} catch (error) {
		console.error('Group check error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Submit a new quote request (public endpoint)
router.post('/submit', async (req, res) => {
	try {
		const {
			customer_name,
			customer_phone,
			customer_email,
			property_type,
			property_size,
			region,
			address,
			items,
			group_id, // Optional: 기존 그룹에 추가할 경우
			group_name, // Optional: 새 그룹 이름
			floor_plan_images, // Optional: 도면 이미지 URL 배열
			room_areas, // Optional: 공간별 면적 { "주방": 5.5, "거실": 15.3 }
			floor_plan_analysis_result // Optional: 전체 분석 결과
		} = req.body

		// Validation
		if (!customer_name || !customer_phone || !property_type || !region || !items) {
			return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
		}

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: '견적 항목이 필요합니다.' })
		}

		console.log(`📝 New quote request from ${customer_name} (${customer_phone})`)

		// Validate quote detail
		const validationResult = validateQuoteDetail(items)
		console.log(`🔍 Validation result: ${validationResult.status}`)

		let finalGroupId = group_id
		let sequence = 1
		let pricing = {
			quoteCount: 1,
			totalPrice: 30000,
			additionalPrice: 0
		}

		// Determine initial status based on validation
		let initialStatus: 'pending' | 'rejected' = 'pending'
		let validationStatus: string = validationResult.status
		let validationNotes = validationResult.validationNotes

		if (!validationResult.isValid) {
			initialStatus = 'rejected'
			console.log(`⚠️  Quote rejected: Insufficient detail`)
		} else if (needsAdminReview(items)) {
			validationStatus = 'pending'
			validationNotes = '항목 수가 적거나 평균 금액이 높아 관리자 검토가 필요합니다.'
			console.log(`⚠️  Quote needs admin review`)
		}

		// 그룹 처리
		if (group_id) {
			// 기존 그룹에 추가
			console.log(`➕ Adding to existing group: ${group_id}`)
			const groupUpdate = await addQuoteToGroup(group_id)
			finalGroupId = group_id
			sequence = groupUpdate.sequence
			pricing = {
				quoteCount: groupUpdate.group.quote_count,
				totalPrice: groupUpdate.group.total_price,
				additionalPrice: groupUpdate.additionalPrice
			}
		} else {
			// 새 그룹 생성
			console.log(`🆕 Creating new quote group`)
			const newGroup = await createQuoteGroup({
				customer_name,
				customer_phone,
				customer_email,
				group_name: group_name || `${property_type} ${property_size}평 - ${region}`,
				property_type,
				property_size,
				region,
				address
			})
			finalGroupId = newGroup.id
			sequence = 1
		}

		// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
		// OLD: const { data, error } = await supabase.from('quote_requests').insert({...}).select().single()
		const insertData: any = {
			customer_name,
			customer_phone,
			customer_email,
			property_type,
			property_size,
			region,
			address,
			items,
			status: initialStatus,
			validation_status: validationStatus,
			validation_notes: validationNotes,
			group_id: finalGroupId,
			sequence_in_group: sequence
		}

		// Add floor plan data if provided
		if (floor_plan_images && Array.isArray(floor_plan_images)) {
			insertData.floor_plan_images = floor_plan_images
			console.log(`📐 Floor plan images attached: ${floor_plan_images.length}`)
		}
		if (room_areas) {
			insertData.room_areas = room_areas
			const roomCount = Object.keys(room_areas).length
			const totalArea = Object.values(room_areas).reduce((sum: number, area: any) => sum + area, 0)
			console.log(`🏠 Room areas attached: ${roomCount} rooms, ${totalArea.toFixed(1)}평`)
		}
		if (floor_plan_analysis_result) {
			insertData.floor_plan_analysis_result = floor_plan_analysis_result
		}

		const data = await insertOne<any>('quote_requests', insertData)

		if (!data) {
			throw new Error('Failed to insert quote request')
		}

		console.log(`✅ Quote request created: ${data.id} (Group: ${finalGroupId}, Sequence: ${sequence})`)

		// Log to Notion
		try {
			const totalAmount = items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
			await logQuoteRequest({
				requestId: data.id,
				customerName: customer_name,
				customerPhone: customer_phone,
				propertyType: property_type,
				propertySize: property_size,
				region: region,
				itemCount: items.length,
				totalAmount: totalAmount
			})
		} catch (notionError) {
			console.error('Failed to log to Notion:', notionError)
		}

		// Return appropriate message based on validation status
		let responseMessage = '견적 신청이 접수되었습니다.'
		if (initialStatus === 'rejected') {
			responseMessage = '견적서 등록이 거부되었습니다. 세부 항목이 부족합니다.'
		} else if (needsAdminReview(items)) {
			responseMessage = '견적 신청이 접수되었습니다. 관리자 검토 후 분석이 진행됩니다.'
		}

		res.json({
			success: initialStatus !== 'rejected',
			message: responseMessage,
			request_id: data.id,
			group_id: finalGroupId,
			sequence: sequence,
			pricing: pricing,
			validation_status: validationStatus,
			validation_notes: validationNotes
		})
	} catch (error) {
		console.error('Quote submission error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Get quote requests by phone number (for users to view their submissions)
router.get('/by-phone/:phone', async (req, res) => {
	try {
		const { phone } = req.params

		console.log(`🔍 Looking up quote requests for phone: ${phone}`)

		// ✅ CONVERTED: Supabase SELECT → PostgreSQL query
		// OLD: const { data, error } = await supabase.from('quote_requests').select('*').eq('customer_phone', phone).order('created_at', { ascending: false })
		const result = await query(
			'SELECT * FROM quote_requests WHERE customer_phone = $1 ORDER BY created_at DESC',
			[phone]
		)

		console.log(`✅ Found ${result.rows.length} quote requests`)

		res.json(result.rows)
	} catch (error) {
		console.error('Quote lookup error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Get quote requests by user ID (for authenticated users to view their submissions)
router.get('/user/:userId', async (req, res) => {
	try {
		const { userId } = req.params

		console.log(`🔍 Looking up quote requests for user: ${userId}`)

		// ✅ CONVERTED: Supabase SELECT user → PostgreSQL findOne
		// OLD: const { data: userData, error: userError } = await supabase.from('users').select('phone, email').eq('id', userId).single()
		const userData = await findOne<any>('users', { id: userId })

		if (!userData) {
			return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
		}

		// ✅ CONVERTED: Supabase OR query → PostgreSQL query with OR
		// OLD: Complex Supabase OR query
		let result
		if (userData.phone) {
			result = await query(
				'SELECT * FROM quote_requests WHERE customer_phone = $1 OR customer_email = $2 ORDER BY created_at DESC',
				[userData.phone, userData.email]
			)
		} else {
			result = await query(
				'SELECT * FROM quote_requests WHERE customer_email = $1 ORDER BY created_at DESC',
				[userData.email]
			)
		}

		console.log(`✅ Found ${result.rows.length} quote requests for user`)

		res.json(result.rows)
	} catch (error) {
		console.error('User quote lookup error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Get a single quote request result (only if status is 'completed')
router.get('/result/:id', async (req, res) => {
	try {
		const { id } = req.params

		// ✅ CONVERTED: Supabase SELECT by id → PostgreSQL findOne
		// OLD: const { data, error } = await supabase.from('quote_requests').select('*').eq('id', id).single()
		const data = await findOne<any>('quote_requests', { id })

		if (!data) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		// Only return analysis if status is completed
		if (data.status !== 'completed') {
			return res.status(403).json({
				error: '분석이 아직 완료되지 않았습니다.',
				status: data.status
			})
		}

		// Log quote delivery to Notion (web view)
		try {
			const totalAmount = data.analysis_result?.totalAmount || 0
			const overallScore = data.analysis_result?.overallScore || 0

			await logQuoteDelivery({
				quoteRequestId: parseInt(id),
				customerName: data.customer_name,
				customerPhone: data.customer_phone,
				deliveryMethod: 'web',
				overallScore: overallScore,
				totalAmount: totalAmount
			})
		} catch (notionError) {
			console.error('Failed to log quote delivery to Notion:', notionError)
		}

		res.json(data)
	} catch (error) {
		console.error('Quote result error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// ============================================
// Admin Endpoints
// ============================================

// Get all quote requests (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { status, limit = 50, offset = 0 } = req.query

		console.log(`🔍 Admin: Fetching quote requests (status: ${status || 'all'})`)

		// ✅ CONVERTED: Supabase SELECT with pagination → PostgreSQL query + COUNT
		// OLD: Complex Supabase query with count
		let queryText = 'SELECT * FROM quote_requests'
		let countText = 'SELECT COUNT(*) FROM quote_requests'
		const params: any[] = []

		// Filter by status if provided
		if (status && status !== 'all') {
			queryText += ' WHERE status = $1'
			countText += ' WHERE status = $1'
			params.push(status)
		}

		queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)

		const [dataResult, countResult] = await Promise.all([
			query(queryText, [...params, Number(limit), Number(offset)]),
			query(countText, params)
		])

		const count = parseInt(countResult.rows[0].count)

		console.log(`✅ Found ${dataResult.rows.length} quote requests (total: ${count})`)

		res.json({
			data: dataResult.rows,
			count,
			limit: Number(limit),
			offset: Number(offset)
		})
	} catch (error) {
		console.error('Admin quote list error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Get a single quote request detail (admin only)
router.get('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🔍 Admin: Fetching quote request ${id}`)

		// ✅ CONVERTED: Supabase SELECT by id → PostgreSQL findOne
		// OLD: const { data, error } = await supabase.from('quote_requests').select('*').eq('id', id).single()
		const data = await findOne<any>('quote_requests', { id })

		if (!data) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		res.json(data)
	} catch (error) {
		console.error('Admin quote detail error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Run AI analysis on a quote request (admin only)
router.post('/admin/:id/analyze', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { analyzed_by = 'admin' } = req.body

		console.log(`🤖 Admin: Starting 집첵 시스템 analysis for quote request ${id}`)

		// ✅ CONVERTED: Supabase SELECT by id → PostgreSQL findOne
		// OLD: const { data: quoteRequest, error: fetchError } = await supabase.from('quote_requests').select('*').eq('id', id).single()
		const quoteRequest = await findOne<any>('quote_requests', { id })

		if (!quoteRequest) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		// ============================================
		// Floor Plan Analysis (if floor plan images exist)
		// ============================================
		if (quoteRequest.floor_plan_images && Array.isArray(quoteRequest.floor_plan_images) && quoteRequest.floor_plan_images.length > 0) {
			// Only analyze if not already analyzed
			if (!quoteRequest.room_areas || Object.keys(quoteRequest.room_areas).length === 0) {
				console.log(`🏠 Analyzing ${quoteRequest.floor_plan_images.length} floor plan image(s)...`)

				try {
					let floorPlanAnalysis

					if (quoteRequest.floor_plan_images.length === 1) {
						// Single floor plan image
						floorPlanAnalysis = await analyzeFloorPlan(quoteRequest.floor_plan_images[0])
					} else {
						// Multiple floor plan images - merge results
						floorPlanAnalysis = await analyzeMultipleFloorPlans(quoteRequest.floor_plan_images)
					}

					console.log(`✅ Floor plan analysis completed:`)
					console.log(`   - Total area: ${floorPlanAnalysis.totalArea.toFixed(1)}평`)
					console.log(`   - Rooms found: ${Object.keys(floorPlanAnalysis.roomAreas).length}`)
					console.log(`   - Confidence: ${(floorPlanAnalysis.confidence * 100).toFixed(1)}%`)

					// Display extracted room areas
					Object.entries(floorPlanAnalysis.roomAreas).forEach(([room, area]) => {
						console.log(`     • ${room}: ${(area as number).toFixed(1)}평`)
					})

					// Store floor plan analysis results in database
					await query(
						`UPDATE quote_requests
						SET room_areas = $1,
							floor_plan_analysis_result = $2,
							updated_at = NOW()
						WHERE id = $3`,
						[
							floorPlanAnalysis.roomAreas,
							{
								totalArea: floorPlanAnalysis.totalArea,
								confidence: floorPlanAnalysis.confidence,
								rawText: floorPlanAnalysis.rawText
							},
							id
						]
					)

					console.log(`✅ Floor plan analysis results saved to database`)

					// Log floor plan analysis to Notion
					try {
						const quoteData = await query('SELECT customer_name FROM quote_requests WHERE id = $1', [id])
						const customerName = quoteData.rows[0]?.customer_name || `견적 #${id}`

						await logAnalysisComplete({
							quoteRequestId: parseInt(id),
							customerName: customerName,
							analysisType: '도면분석',
							status: 'succeeded'
						})
					} catch (notionError) {
						console.error('Failed to log floor plan analysis to Notion:', notionError)
					}

					// Update quoteRequest object with new data for use in quote analysis
					quoteRequest.room_areas = floorPlanAnalysis.roomAreas
					quoteRequest.floor_plan_analysis_result = {
						totalArea: floorPlanAnalysis.totalArea,
						confidence: floorPlanAnalysis.confidence,
						rawText: floorPlanAnalysis.rawText
					}
				} catch (floorPlanError) {
					console.error(`⚠️  Floor plan analysis failed:`, floorPlanError)
					console.log(`   Continuing with quote analysis without floor plan data...`)
					// Don't fail the entire analysis - just continue without floor plan data
				}
			} else {
				console.log(`✅ Floor plan already analyzed - using existing room areas`)
				const roomCount = Object.keys(quoteRequest.room_areas).length
				const totalArea = Object.values(quoteRequest.room_areas).reduce((sum: number, area: any) => sum + area, 0)
				console.log(`   - Rooms: ${roomCount}, Total: ${totalArea.toFixed(1)}평`)
			}
		} else {
			console.log(`ℹ️  No floor plan images attached`)
		}

		// Check if this quote has quote_sets with stored images
		const quoteSetsResult = await query(
			'SELECT * FROM quote_sets WHERE request_id = $1 ORDER BY set_id',
			[id]
		)

		const quoteSets = quoteSetsResult.rows

		// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
		// OLD: await supabase.from('quote_requests').update({ status: 'analyzing' }).eq('id', id)
		await query(
			'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
			['analyzing', id]
		)

		console.log(`📊 Running 집첵 시스템 analysis...`)

		let allItems = []

		// If there are quote_sets, process them
		if (quoteSets.length > 0) {
			console.log(`📦 Found ${quoteSets.length} quote sets`)

			for (const quoteSet of quoteSets) {
				console.log(`   - ${quoteSet.set_id}: ${quoteSet.vendor_name}`)

				// Parse images if present and not yet parsed
				if (quoteSet.images && Array.isArray(quoteSet.images) && quoteSet.images.length > 0 && quoteSet.upload_type === 'image') {
					console.log(`      🖼️  Parsing ${quoteSet.images.length} stored images...`)

					try {
						// Convert base64 to Buffer and parse
						for (const base64Image of quoteSet.images) {
							// Remove data URL prefix if present
							const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
							const imageBuffer = Buffer.from(base64Data, 'base64')

							const parseResult = await parseQuoteImage(imageBuffer)

							if (parseResult.success && parseResult.items) {
								console.log(`      ✅ Extracted ${parseResult.items.length} items from image`)
								allItems.push(...parseResult.items)
							} else {
								console.warn(`      ⚠️  Image parsing failed: ${parseResult.message}`)
							}
						}
					} catch (parseError) {
						console.error(`      ❌ Error parsing images for ${quoteSet.set_id}:`, parseError)
					}
				}

				// Add manually entered items from quote_set
				if (quoteSet.items && Array.isArray(quoteSet.items)) {
					console.log(`      📝 Adding ${quoteSet.items.length} manual items`)
					allItems.push(...quoteSet.items)
				}
			}

			console.log(`✅ Total items collected: ${allItems.length}`)
		} else {
			// Legacy: use items from quote_requests table directly
			allItems = quoteRequest.items || []
			console.log(`📝 Using ${allItems.length} items from quote_requests`)
		}

		// If no items found, can't analyze
		if (allItems.length === 0) {
			throw new Error('분석할 견적 항목이 없습니다.')
		}

		// Run AI analysis on collected items (with floor plan data if available)
		const analysisResult = await analyzeQuote({
			items: allItems,
			propertyType: quoteRequest.property_type,
			propertySize: quoteRequest.property_size,
			region: quoteRequest.region,
			roomAreas: quoteRequest.room_areas // Pass floor plan analysis results if available
		})

		console.log(`✅ 집첵 시스템 analysis completed`)

		// ✅ CONVERTED: Supabase UPDATE with multiple fields → PostgreSQL query
		// OLD: const { data: updatedRequest, error: updateError} = await supabase.from('quote_requests').update({...}).eq('id', id).select().single()
		const updateResult = await query(
			`UPDATE quote_requests
			SET analysis_result = $1,
				analyzed_at = $2,
				analyzed_by = $3,
				status = $4,
				updated_at = NOW()
			WHERE id = $5
			RETURNING *`,
			[analysisResult, new Date().toISOString(), analyzed_by, 'completed', id]
		)

		const updatedRequest = updateResult.rows[0]

		if (!updatedRequest) {
			throw new Error('Failed to update quote request')
		}

		console.log(`✅ Quote request updated with analysis result`)

		// Log GPT quote analysis to Notion
		try {
			const totalAmount = allItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
			await logAnalysisComplete({
				quoteRequestId: parseInt(id),
				customerName: quoteRequest.customer_name,
				analysisType: 'GPT분석',
				totalAmount: totalAmount,
				overallScore: analysisResult.overallScore,
				status: 'succeeded'
			})
		} catch (notionError) {
			console.error('Failed to log GPT analysis to Notion:', notionError)
		}

		res.json({
			success: true,
			message: '집첵 시스템 분석이 완료되었습니다.',
			data: updatedRequest
		})
	} catch (error) {
		console.error('Analysis error:', error)

		// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
		// OLD: await supabase.from('quote_requests').update({ status: 'pending' }).eq('id', req.params.id)
		await query(
			'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
			['pending', req.params.id]
		)

		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Update quote request status (admin only)
router.patch('/admin/:id/status', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { status, admin_notes } = req.body

		console.log(`📝 Admin: Updating status for quote request ${id} to ${status}`)

		// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query with conditional fields
		// OLD: const { data, error } = await supabase.from('quote_requests').update(updateData).eq('id', id).select().single()
		let updateQuery = 'UPDATE quote_requests SET status = $1, updated_at = NOW()'
		const params: any[] = [status]

		if (admin_notes !== undefined) {
			updateQuery += ', admin_notes = $2 WHERE id = $3 RETURNING *'
			params.push(admin_notes, id)
		} else {
			updateQuery += ' WHERE id = $2 RETURNING *'
			params.push(id)
		}

		const result = await query(updateQuery, params)
		const data = result.rows[0]

		if (!data) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		console.log(`✅ Quote request status updated`)

		res.json({
			success: true,
			message: '상태가 업데이트되었습니다.',
			data
		})
	} catch (error) {
		console.error('Status update error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Update expert item notes (admin only)
router.patch('/admin/:id/expert-notes', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { expert_item_notes } = req.body

		console.log(`📝 Admin: Updating expert notes for quote request ${id}`)

		// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
		// OLD: const { data, error } = await supabase.from('quote_requests').update({ expert_item_notes }).eq('id', id).select().single()
		const result = await query(
			'UPDATE quote_requests SET expert_item_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
			[expert_item_notes, id]
		)

		const data = result.rows[0]

		if (!data) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		console.log(`✅ Expert notes updated`)

		res.json({
			success: true,
			message: '전문가 의견이 저장되었습니다.',
			data
		})
	} catch (error) {
		console.error('Expert notes update error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Update analysis result manually (admin only)
router.patch('/admin/:id/analysis-result', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { analysis_result } = req.body

		console.log(`📝 Admin: Manually updating analysis result for quote request ${id}`)

		if (!analysis_result) {
			return res.status(400).json({ error: '분석 결과 데이터가 필요합니다.' })
		}

		// Validate analysis_result structure
		const requiredFields = ['overallScore', 'totalAmount', 'averageMarketPrice', 'priceRating', 'summary', 'categoryAnalysis', 'recommendations', 'marketComparison', 'expertNotes']
		const missingFields = requiredFields.filter(field => !(field in analysis_result))

		if (missingFields.length > 0) {
			return res.status(400).json({
				error: `분석 결과에 필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
			})
		}

		// Update analysis result
		const result = await query(
			'UPDATE quote_requests SET analysis_result = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
			[analysis_result, id]
		)

		const data = result.rows[0]

		if (!data) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		console.log(`✅ Analysis result manually updated`)

		res.json({
			success: true,
			message: '분석 결과가 수정되었습니다.',
			data
		})
	} catch (error) {
		console.error('Analysis result update error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// Delete quote request (admin only)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🗑️  Admin: Deleting quote request ${id}`)

		// ✅ CONVERTED: Supabase DELETE → PostgreSQL deleteOne
		// OLD: const { error } = await supabase.from('quote_requests').delete().eq('id', id)
		const deletedRow = await deleteOne('quote_requests', id)

		if (!deletedRow) {
			return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
		}

		console.log(`✅ Quote request deleted`)

		res.json({
			success: true,
			message: '견적 신청이 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// ============================================
// Multiple Quote Submission Endpoint
// ============================================

/**
 * Submit multiple quotes (up to 3) with images stored as base64
 * Frontend sends quote_sets with base64 images - no API calls on upload
 * Admin will trigger analysis later in admin panel
 */
router.post('/submit-multiple', async (req, res) => {
	try {
		const {
			// Payment info
			payment_id,
			plan_id,
			plan_name,
			quantity,
			original_amount,
			discount_amount,
			paid_amount,

			// Customer info
			customer_name,
			customer_phone,
			customer_email,

			// Property info
			property_type,
			property_size,
			region,
			address,

			// Quote sets (SET_A, SET_B, SET_C)
			quote_sets
		} = req.body

		// Validation
		if (!customer_name || !customer_phone || !property_type || !region) {
			return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
		}

		if (!Array.isArray(quote_sets) || quote_sets.length === 0) {
			return res.status(400).json({ error: '최소 1개의 견적서가 필요합니다.' })
		}

		if (quote_sets.length > 3) {
			return res.status(400).json({ error: '최대 3개의 견적서만 제출할 수 있습니다.' })
		}

		console.log(`📝 Multiple quote submission from ${customer_name} (${customer_phone})`)
		console.log(`   - Quote sets: ${quote_sets.length}`)
		console.log(`   - Payment: ${plan_name} (${paid_amount}원)`)

		// Validate each quote set
		for (let i = 0; i < quote_sets.length; i++) {
			const set = quote_sets[i]
			if (!set.vendor_name || !set.upload_type || !Array.isArray(set.items)) {
				return res.status(400).json({
					error: `견적서 ${i + 1}번: 업체명, 업로드 타입, 견적 항목이 필요합니다.`
				})
			}

			if (!['SET_A', 'SET_B', 'SET_C'].includes(set.set_id)) {
				return res.status(400).json({
					error: `견적서 ${i + 1}번: set_id는 SET_A, SET_B, SET_C 중 하나여야 합니다.`
				})
			}

			if (!['image', 'excel'].includes(set.upload_type)) {
				return res.status(400).json({
					error: `견적서 ${i + 1}번: upload_type은 image 또는 excel이어야 합니다.`
				})
			}

			if (set.items.length === 0) {
				return res.status(400).json({
					error: `견적서 ${i + 1}번: 최소 1개의 견적 항목이 필요합니다.`
				})
			}
		}

		// Find or create quote group
		let finalGroupId = null
		let sequence = 1

		// Check for existing active group
		const activeGroup = await findActiveGroup(customer_phone, {
			property_type,
			property_size,
			region
		})

		if (activeGroup) {
			console.log(`➕ Adding to existing group: ${activeGroup.id}`)
			const groupUpdate = await addQuoteToGroup(activeGroup.id)
			finalGroupId = activeGroup.id
			sequence = groupUpdate.sequence
		} else {
			console.log(`🆕 Creating new quote group`)
			const newGroup = await createQuoteGroup({
				customer_name,
				customer_phone,
				customer_email,
				group_name: `${property_type} ${property_size ? property_size + '㎡' : ''} - ${region}`,
				property_type,
				property_size,
				region,
				address
			})
			finalGroupId = newGroup.id
			sequence = 1
		}

		// Create the main quote request (without items - items are in quote_sets)
		const quoteRequest = await insertOne<any>('quote_requests', {
			customer_name,
			customer_phone,
			customer_email,
			property_type,
			property_size,
			region,
			address,
			items: [], // Items are stored in quote_sets
			status: 'pending', // Admin will trigger analysis later
			validation_status: 'pending',
			group_id: finalGroupId,
			sequence_in_group: sequence
		})

		if (!quoteRequest) {
			throw new Error('Failed to insert quote request')
		}

		console.log(`✅ Quote request created: ${quoteRequest.id}`)

		// Create quote sets with images and items
		const createdSets = []
		let totalAmountAllSets = 0
		for (const set of quote_sets) {
			// Calculate total amount from items
			const totalAmount = set.items.reduce((sum: number, item: any) => {
				return sum + (item.total_price || 0)
			}, 0)

			// Validate quote detail
			const validationResult = validateQuoteDetail(set.items)

			// Create quote set
			const quoteSet = await insertOne<any>('quote_sets', {
				request_id: quoteRequest.id,
				set_id: set.set_id,
				vendor_name: set.vendor_name,
				vendor_phone: set.vendor_phone || null,
				vendor_representative: set.vendor_representative || null,
				vendor_business_number: set.vendor_business_number || null,
				upload_type: set.upload_type,
				images: set.images || [], // Store base64 images
				items: set.items,
				total_amount: totalAmount,
				item_count: set.items.length,
				validation_status: validationResult.isValid ? 'passed' : 'failed',
				validation_errors: validationResult.validationNotes ? [validationResult.validationNotes] : [],
				validation_warnings: []
			})

			if (!quoteSet) {
				throw new Error(`Failed to insert quote set ${set.set_id}`)
			}

			console.log(`✅ Quote set created: ${set.set_id} (${set.vendor_name}, ${totalAmount}원)`)
			createdSets.push(quoteSet)
			totalAmountAllSets += totalAmount
		}

		// Log to Notion
		try {
			// Payment log
			if (paid_amount && plan_name) {
				await logPaymentComplete({
					orderId: payment_id || quoteRequest.id.toString(),
					customerName: customer_name,
					customerPhone: customer_phone,
					planName: plan_name,
					amount: paid_amount,
					paymentMethod: 'unknown'
				})
			}

			// Quote request log
			const totalItemCount = quote_sets.reduce((sum, set) => sum + set.items.length, 0)
			await logQuoteRequest({
				requestId: quoteRequest.id,
				customerName: customer_name,
				customerPhone: customer_phone,
				propertyType: property_type,
				propertySize: property_size,
				region: region,
				itemCount: totalItemCount,
				totalAmount: totalAmountAllSets
			})
		} catch (notionError) {
			console.error('Failed to log to Notion:', notionError)
		}

		res.json({
			success: true,
			message: '견적서가 제출되었습니다. 집첵 시스템 분석을 진행합니다.',
			request_id: quoteRequest.id,
			group_id: finalGroupId,
			sequence: sequence,
			quote_sets: createdSets.map(set => ({
				id: set.id,
				set_id: set.set_id,
				vendor_name: set.vendor_name,
				total_amount: set.total_amount,
				validation_status: set.validation_status
			}))
		})
	} catch (error) {
		console.error('Multiple quote submission error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// ============================================
// GPT-5 Pro Comprehensive Analysis (Admin Only)
// ============================================

/**
 * GPT-5 Pro를 사용한 종합 견적 분석
 *
 * 특징:
 * - 무한루프 방지 (max_steps=6, 중복 출력 차단)
 * - 토큰 낭비 방지 (50k 예산, 출력 상한 2~4k)
 * - 타임아웃 중복 호출 방지 (idempotency key)
 * - 기존 AnalysisResult 구조와 동일한 응답
 */
router.post(
	'/admin/:id/analyze-comprehensive',
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { id } = req.params
			const { analyzed_by = 'admin', user_id } = req.body

			console.log(
				`🎯 Admin: Starting GPT-5 Pro comprehensive analysis for quote request ${id}`
			)

			// 견적 요청 조회
			const quoteRequest = await findOne<any>('quote_requests', { id })

			if (!quoteRequest) {
				return res.status(404).json({ error: '견적을 찾을 수 없습니다.' })
			}

			// 도면 분석 먼저 수행 (기존 /analyze 엔드포인트와 동일)
			if (
				quoteRequest.floor_plan_images &&
				Array.isArray(quoteRequest.floor_plan_images) &&
				quoteRequest.floor_plan_images.length > 0
			) {
				if (
					!quoteRequest.room_areas ||
					Object.keys(quoteRequest.room_areas).length === 0
				) {
					console.log(
						`🏠 Analyzing ${quoteRequest.floor_plan_images.length} floor plan image(s)...`
					)

					try {
						let floorPlanAnalysis
						if (quoteRequest.floor_plan_images.length === 1) {
							floorPlanAnalysis = await analyzeFloorPlan(
								quoteRequest.floor_plan_images[0]
							)
						} else {
							floorPlanAnalysis = await analyzeMultipleFloorPlans(
								quoteRequest.floor_plan_images
							)
						}

						await query(
							`UPDATE quote_requests
							SET room_areas = $1,
								floor_plan_analysis_result = $2,
								updated_at = NOW()
							WHERE id = $3`,
							[
								floorPlanAnalysis.roomAreas,
								{
									totalArea: floorPlanAnalysis.totalArea,
									confidence: floorPlanAnalysis.confidence,
									rawText: floorPlanAnalysis.rawText
								},
								id
							]
						)

						// Log floor plan analysis to Notion
						try {
							await logAnalysisComplete({
								quoteRequestId: parseInt(id),
								customerName: quoteRequest.customer_name,
								analysisType: '도면분석',
								status: 'succeeded'
							})
						} catch (notionError) {
							console.error('Failed to log floor plan analysis to Notion:', notionError)
						}

						quoteRequest.room_areas = floorPlanAnalysis.roomAreas
					} catch (floorPlanError) {
						console.error(`⚠️  Floor plan analysis failed:`, floorPlanError)
					}
				}
			}

			// quote_sets 처리
			const quoteSetsResult = await query(
				'SELECT * FROM quote_sets WHERE request_id = $1 ORDER BY set_id',
				[id]
			)

			const quoteSets = quoteSetsResult.rows
			let allItems = []

			if (quoteSets.length > 0) {
				console.log(`📦 Found ${quoteSets.length} quote sets`)

				for (const quoteSet of quoteSets) {
					// Parse images if needed
					if (
						quoteSet.images &&
						Array.isArray(quoteSet.images) &&
						quoteSet.images.length > 0 &&
						quoteSet.upload_type === 'image'
					) {
						for (const base64Image of quoteSet.images) {
							const base64Data = base64Image.replace(
								/^data:image\/\w+;base64,/,
								''
							)
							const imageBuffer = Buffer.from(base64Data, 'base64')
							const parseResult = await parseQuoteImage(imageBuffer)

							if (parseResult.success && parseResult.items) {
								allItems.push(...parseResult.items)
							}
						}
					}

					// Add manual items
					if (quoteSet.items && Array.isArray(quoteSet.items)) {
						allItems.push(...quoteSet.items)
					}
				}
			} else {
				allItems = quoteRequest.items || []
			}

			if (allItems.length === 0) {
				throw new Error('분석할 견적 항목이 없습니다.')
			}

			console.log(`✅ Total items collected: ${allItems.length}`)

			// 상태 업데이트: analyzing
			await query(
				'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
				['analyzing', id]
			)

			// GPT-5 Pro 종합 분석 실행
			const analysisResult = await comprehensiveAnalysis(
				{
					quoteRequestId: parseInt(id),
					items: allItems,
					propertyType: quoteRequest.property_type,
					propertySize: quoteRequest.property_size,
					region: quoteRequest.region,
					roomAreas: quoteRequest.room_areas,
					userId: user_id || analyzed_by
				},
				{
					// abortSignal: req.signal, // TODO: Request AbortController support
					tokenBudget: 50000,
					maxOutputTokens: 3000,
					userId: user_id || analyzed_by
				}
			)

			console.log(`✅ GPT-5 Pro comprehensive analysis completed`)
			console.log(
				`   Token Usage: ${analysisResult._meta?.tokenUsage.total_tokens.toLocaleString()}`
			)
			console.log(`   Cost: $${analysisResult._meta?.costUsd.toFixed(4)}`)

			// 결과 저장 (AnalysisResult 부분만)
			const { _meta, ...analysisData } = analysisResult

			const updateResult = await query(
				`UPDATE quote_requests
				SET analysis_result = $1,
					analyzed_at = $2,
					analyzed_by = $3,
					status = $4,
					updated_at = NOW()
				WHERE id = $5
				RETURNING *`,
				[analysisData, new Date().toISOString(), analyzed_by, 'completed', id]
			)

			const updatedRequest = updateResult.rows[0]

			if (!updatedRequest) {
				throw new Error('Failed to update quote request')
			}

			console.log(`✅ Quote request updated with GPT-5 Pro analysis result`)

			// Log GPT-5 Pro analysis to Notion
			try {
				const totalAmount = allItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
				await logAnalysisComplete({
					quoteRequestId: parseInt(id),
					customerName: quoteRequest.customer_name,
					analysisType: 'GPT분석',
					totalAmount: totalAmount,
					overallScore: analysisData.overallScore,
					status: 'succeeded'
				})
			} catch (notionError) {
				console.error('Failed to log GPT-5 Pro analysis to Notion:', notionError)
			}

			res.json({
				success: true,
				message: 'GPT-5 Pro 종합 분석이 완료되었습니다.',
				data: updatedRequest,
				meta: _meta // 메타 정보 (토큰 사용량, 비용 등)
			})
		} catch (error) {
			console.error('GPT-5 Pro comprehensive analysis error:', error)

			// 상태 원복
			await query(
				'UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2',
				['pending', req.params.id]
			)

			const message = error instanceof Error ? error.message : 'Unknown error'
			res.status(500).json({ error: message })
		}
	}
)

/**
 * GPT-5 Pro 분석 작업 취소
 */
router.post(
	'/admin/analysis-job/:jobId/cancel',
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { jobId } = req.params

			console.log(`🚫 Admin: Canceling analysis job ${jobId}`)

			await cancelAnalysisJob(jobId)

			res.json({
				success: true,
				message: '분석 작업이 취소되었습니다.'
			})
		} catch (error) {
			console.error('Job cancel error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			res.status(500).json({ error: message })
		}
	}
)

/**
 * GPT-5 Pro 분석 작업 상태 조회
 */
router.get(
	'/admin/analysis-job/:jobId',
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { jobId } = req.params

			const jobResult = await query(
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

			if (jobResult.rows.length === 0) {
				return res.status(404).json({ error: '분석 작업을 찾을 수 없습니다.' })
			}

			res.json({
				success: true,
				data: jobResult.rows[0]
			})
		} catch (error) {
			console.error('Job status query error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			res.status(500).json({ error: message })
		}
	}
)

/**
 * GPT-5 Pro 분석 작업 목록 조회 (모니터링용)
 */
router.get('/admin/analysis-jobs', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { status, limit = 20, offset = 0 } = req.query

		let queryText = `
			SELECT
				aj.*,
				qr.customer_name,
				qr.property_type,
				qr.region
			FROM analysis_jobs aj
			LEFT JOIN quote_requests qr ON aj.quote_request_id = qr.id
		`
		const params: any[] = []

		if (status && status !== 'all') {
			queryText += ' WHERE aj.status = $1'
			params.push(status)
		}

		queryText += ` ORDER BY aj.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
		params.push(Number(limit), Number(offset))

		const result = await query(queryText, params)

		// 통계 정보
		const statsResult = await query(
			`SELECT status, COUNT(*) as count, AVG(actual_tokens_used) as avg_tokens, SUM(actual_cost_usd) as total_cost
			FROM analysis_jobs
			WHERE created_at > NOW() - INTERVAL '7 days'
			GROUP BY status`
		)

		res.json({
			success: true,
			data: result.rows,
			stats: statsResult.rows,
			pagination: {
				limit: Number(limit),
				offset: Number(offset),
				total: result.rows.length
			}
		})
	} catch (error) {
		console.error('Jobs list query error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
