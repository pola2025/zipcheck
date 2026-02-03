import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { uploadConstructionData, uploadDistributorData, uploadConstructionSheets } from './services/data-upload'
import { analyzeQuote } from './services/ai-analysis'
import quoteRequestsRouter from './routes/quote-requests'
import authRouter from './routes/auth'
import companyReviewsRouter from './routes/company-reviews'
import damageCasesRouter from './routes/damage-cases'
import communityRouter from './routes/community'
import companyReviewsAdminRouter from './routes/admin/company-reviews-admin'
import damageCasesAdminRouter from './routes/admin/damage-cases-admin'
import googleServicesRouter from './routes/admin/google-services'
import { authenticateToken, requireAdmin } from './middleware/auth'
import { pool } from './lib/db' // Import database pool to initialize connection
import { startStatsCronJobs } from './services/stats-cron'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = Number(process.env.PORT) || 3001

// 미들웨어
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// 파일 업로드 설정 (메모리에 저장)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
})

// ============================================
// API 엔드포인트
// ============================================

// 헬스 체크
app.get('/health', (req, res) => {
	res.json({ status: 'ok', message: 'ZipCheck Backend is running!' })
})

// 인증 API
app.use('/api/auth', authRouter)

// ============================================
// Protected Admin Routes (인증 필요)
// ============================================

// 시공 데이터 업로드 (테이블 형식)
app.post('/api/admin/upload-construction', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' })
		}

		console.log(`📤 Uploading construction data: ${req.file.originalname}`)
		const result = await uploadConstructionData(req.file)

		res.json(result)
	} catch (error) {
		console.error('Upload error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 현장별 실행내역서 업로드 (173개 시트 형식)
app.post('/api/admin/upload-construction-sheets', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' })
		}

		console.log(`📤 Uploading construction sheets: ${req.file.originalname}`)
		const result = await uploadConstructionSheets(req.file)

		res.json(result)
	} catch (error) {
		console.error('Upload error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 유통사 가격 데이터 업로드
app.post('/api/admin/upload-distributor', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' })
		}

		console.log(`📤 Uploading distributor data: ${req.file.originalname}`)
		const result = await uploadDistributorData(req.file)

		res.json(result)
	} catch (error) {
		console.error('Upload error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 업로드 이력 조회
app.get('/api/admin/upload-history', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const history = await pool.query(`
			SELECT
				id,
				dataset_type,
				file_name,
				status,
				total_rows,
				success_rows,
				error_rows,
				created_at as uploaded_at
			FROM upload_history
			ORDER BY created_at DESC
			LIMIT 50
		`)
		res.json(history.rows)
	} catch (error) {
		console.error('History fetch error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 데이터 통계 조회
app.get('/api/admin/data-stats', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const stats = await pool.query(`
			SELECT
				(SELECT COUNT(*) FROM categories) as categories_count,
				(SELECT COUNT(*) FROM items) as items_count,
				(SELECT COUNT(*) FROM construction_records) as records_count,
				(SELECT SUM(total_cost) FROM construction_records) as total_amount
		`)

		const categoryStats = await pool.query(`
			SELECT
				c.name as category,
				COUNT(cr.id) as record_count,
				SUM(cr.total_cost) as total_cost
			FROM categories c
			LEFT JOIN items i ON i.category_id = c.id
			LEFT JOIN construction_records cr ON cr.item_id = i.id
			GROUP BY c.name
			HAVING COUNT(cr.id) > 0
			ORDER BY SUM(cr.total_cost) DESC
		`)

		const regionStats = await pool.query(`
			SELECT
				region,
				COUNT(*) as count,
				SUM(total_cost) as total_cost
			FROM construction_records
			WHERE region IS NOT NULL
			GROUP BY region
			ORDER BY SUM(total_cost) DESC
			LIMIT 10
		`)

		res.json({
			overview: stats.rows[0],
			byCategory: categoryStats.rows,
			byRegion: regionStats.rows
		})
	} catch (error) {
		console.error('Stats fetch error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 항목별 가격 통계 조회 (위치별로 구분)
app.get('/api/admin/item-stats', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { category, search, limit = 100, offset = 0 } = req.query

		let whereConditions = ['cr.total_cost IS NOT NULL']
		const params: any[] = []
		let paramIndex = 1

		if (category) {
			whereConditions.push(`c.name = $${paramIndex}`)
			params.push(category)
			paramIndex++
		}

		if (search) {
			// 검색 시 base_name, location, 원래 이름 모두 검색
			whereConditions.push(`(
				i.name ILIKE $${paramIndex} OR
				i.base_name ILIKE $${paramIndex} OR
				cr.location ILIKE $${paramIndex}
			)`)
			params.push(`%${search}%`)
			paramIndex++
		}

		params.push(limit)
		const limitParam = paramIndex++
		params.push(offset)
		const offsetParam = paramIndex

		// 업무(base_name) - 위치(location) 조합으로 그룹화
		const itemStats = await pool.query(`
			SELECT
				i.id,
				COALESCE(i.base_name, i.name) as base_name,
				cr.location,
				CASE
					WHEN cr.location IS NOT NULL THEN COALESCE(i.base_name, i.name) || ' - ' || cr.location
					ELSE i.name
				END as item_name,
				c.name as category_name,
				COUNT(cr.id) as record_count,
				ROUND(AVG(cr.total_cost)) as avg_total_cost,
				ROUND(AVG(cr.material_cost)) as avg_material_cost,
				ROUND(AVG(cr.labor_cost)) as avg_labor_cost,
				ROUND(AVG(cr.overhead_cost)) as avg_overhead_cost,
				MIN(cr.total_cost) as min_cost,
				MAX(cr.total_cost) as max_cost,
				PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cr.total_cost) as median_cost
			FROM items i
			INNER JOIN categories c ON i.category_id = c.id
			INNER JOIN construction_records cr ON cr.item_id = i.id
			WHERE ${whereConditions.join(' AND ')}
			GROUP BY i.id, i.name, i.base_name, c.name, cr.location
			HAVING COUNT(cr.id) > 0
			ORDER BY COUNT(cr.id) DESC, AVG(cr.total_cost) DESC
			LIMIT $${limitParam} OFFSET $${offsetParam}
		`, params)

		// 전체 개수 조회 (base_name + location 조합 개수)
		const countResult = await pool.query(`
			SELECT COUNT(*) as total
			FROM (
				SELECT DISTINCT i.id, cr.location
				FROM items i
				INNER JOIN categories c ON i.category_id = c.id
				INNER JOIN construction_records cr ON cr.item_id = i.id
				WHERE ${whereConditions.join(' AND ')}
			) subquery
		`, params.slice(0, -2)) // limit, offset 제외

		res.json({
			items: itemStats.rows,
			total: parseInt(countResult.rows[0].total),
			limit: parseInt(limit as string),
			offset: parseInt(offset as string)
		})
	} catch (error) {
		console.error('Item stats fetch error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 견적 분석 API (deprecated - use /api/quote-requests instead)
app.post('/api/analyze-quote', async (req, res) => {
	try {
		const { items, propertyType, propertySize, region } = req.body

		// 입력 검증
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: '견적 항목이 필요합니다.' })
		}

		console.log(`🤖 Analyzing quote with ${items.length} items...`)

		// AI 분석 실행
		const analysisResult = await analyzeQuote({
			items,
			propertyType,
			propertySize,
			region
		})

		console.log('✅ Quote analysis completed')
		res.json(analysisResult)
	} catch (error) {
		console.error('Quote analysis error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 견적 신청 관리 API
app.use('/api/quote-requests', quoteRequestsRouter)

// 커뮤니티 API
app.use('/api/company-reviews', companyReviewsRouter)
app.use('/api/damage-cases', damageCasesRouter)
app.use('/api/community', communityRouter)

// 관리자 API
app.use('/api/company-reviews/admin', companyReviewsAdminRouter)
app.use('/api/damage-cases/admin', damageCasesAdminRouter)
app.use('/api/admin/google', authenticateToken, requireAdmin, googleServicesRouter)

// ============================================
// 서버 시작
// ============================================

app.listen(PORT, '0.0.0.0', async () => {
	console.log(`
🚀 ZipCheck Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port: ${PORT}
🗄️  Database: Neon DB (PostgreSQL)
🔍 Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	`)

	// Test database connection
	try {
		await pool.query('SELECT NOW()')
		console.log('✅ Connected to Neon DB (PostgreSQL)')
		console.log('✅ Database connection verified')

		// Start statistics cron jobs
		startStatsCronJobs()
	} catch (error) {
		console.error('❌ Database connection failed:', error)
		console.log('⚠️  Statistics cron jobs not started due to database connection failure')
	}
})
