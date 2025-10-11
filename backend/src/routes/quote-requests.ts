import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../lib/supabase'
import { analyzeQuote } from '../services/ai-analysis'
import {
	findActiveGroup,
	createQuoteGroup,
	addQuoteToGroup,
	getGroupPricing
} from '../services/quote-group'
import { validateQuoteDetail, needsAdminReview } from '../services/quote-validation'
import { parseQuoteImage } from '../services/image-parser'
import { authenticateToken, requireAdmin } from '../middleware/auth'

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
			group_name // Optional: 새 그룹 이름
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

		// Insert quote request
		const { data, error } = await supabase
			.from('quote_requests')
			.insert({
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
			})
			.select()
			.single()

		if (error) {
			console.error('Database insert error:', error)
			throw error
		}

		console.log(`✅ Quote request created: ${data.id} (Group: ${finalGroupId}, Sequence: ${sequence})`)

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

		const { data, error } = await supabase
			.from('quote_requests')
			.select('*')
			.eq('customer_phone', phone)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} quote requests`)

		res.json(data)
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

		// First, get the user's phone number
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('phone, email')
			.eq('id', userId)
			.single()

		if (userError || !userData) {
			return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
		}

		// Find quote requests matching user's phone or email
		let query = supabase
			.from('quote_requests')
			.select('*')
			.order('created_at', { ascending: false })

		if (userData.phone) {
			query = query.or(`customer_phone.eq.${userData.phone},customer_email.eq.${userData.email}`)
		} else {
			query = query.eq('customer_email', userData.email)
		}

		const { data, error } = await query

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} quote requests for user`)

		res.json(data)
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

		const { data, error } = await supabase
			.from('quote_requests')
			.select('*')
			.eq('id', id)
			.single()

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		// Only return analysis if status is completed
		if (data.status !== 'completed') {
			return res.status(403).json({
				error: '분석이 아직 완료되지 않았습니다.',
				status: data.status
			})
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

		let query = supabase
			.from('quote_requests')
			.select('*', { count: 'exact' })
			.order('created_at', { ascending: false })
			.range(Number(offset), Number(offset) + Number(limit) - 1)

		// Filter by status if provided
		if (status && status !== 'all') {
			query = query.eq('status', status)
		}

		const { data, error, count } = await query

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		console.log(`✅ Found ${data.length} quote requests (total: ${count})`)

		res.json({
			data,
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

		const { data, error } = await supabase
			.from('quote_requests')
			.select('*')
			.eq('id', id)
			.single()

		if (error) {
			console.error('Database query error:', error)
			throw error
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

		console.log(`🤖 Admin: Starting AI analysis for quote request ${id}`)

		// Fetch the quote request
		const { data: quoteRequest, error: fetchError } = await supabase
			.from('quote_requests')
			.select('*')
			.eq('id', id)
			.single()

		if (fetchError) {
			console.error('Database query error:', fetchError)
			throw fetchError
		}

		// Update status to 'analyzing'
		await supabase
			.from('quote_requests')
			.update({ status: 'analyzing' })
			.eq('id', id)

		console.log(`📊 Running AI analysis...`)

		// Run AI analysis
		const analysisResult = await analyzeQuote({
			items: quoteRequest.items,
			propertyType: quoteRequest.property_type,
			propertySize: quoteRequest.property_size,
			region: quoteRequest.region
		})

		console.log(`✅ AI analysis completed`)

		// Update with analysis result
		const { data: updatedRequest, error: updateError } = await supabase
			.from('quote_requests')
			.update({
				analysis_result: analysisResult,
				analyzed_at: new Date().toISOString(),
				analyzed_by,
				status: 'completed'
			})
			.eq('id', id)
			.select()
			.single()

		if (updateError) {
			console.error('Database update error:', updateError)
			throw updateError
		}

		console.log(`✅ Quote request updated with analysis result`)

		res.json({
			success: true,
			message: '분석이 완료되었습니다.',
			data: updatedRequest
		})
	} catch (error) {
		console.error('AI analysis error:', error)

		// Revert status to pending on error
		await supabase
			.from('quote_requests')
			.update({ status: 'pending' })
			.eq('id', req.params.id)

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

		const updateData: any = { status }
		if (admin_notes !== undefined) {
			updateData.admin_notes = admin_notes
		}

		const { data, error } = await supabase
			.from('quote_requests')
			.update(updateData)
			.eq('id', id)
			.select()
			.single()

		if (error) {
			console.error('Database update error:', error)
			throw error
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

		const { data, error } = await supabase
			.from('quote_requests')
			.update({ expert_item_notes })
			.eq('id', id)
			.select()
			.single()

		if (error) {
			console.error('Database update error:', error)
			throw error
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

// Delete quote request (admin only)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		console.log(`🗑️  Admin: Deleting quote request ${id}`)

		const { error } = await supabase
			.from('quote_requests')
			.delete()
			.eq('id', id)

		if (error) {
			console.error('Database delete error:', error)
			throw error
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

export default router
