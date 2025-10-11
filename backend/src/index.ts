import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { uploadConstructionData, uploadDistributorData } from './services/data-upload'
import { recalculateMarketAverages, getUploadHistory } from './services/data-management'
import { analyzeQuote } from './services/ai-analysis'
import quoteRequestsRouter from './routes/quote-requests'
import authRouter from './routes/auth'
import companyReviewsRouter from './routes/company-reviews'
import damageCasesRouter from './routes/damage-cases'
import communityRouter from './routes/community'
import { authenticateToken, requireAdmin } from './middleware/auth'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// 미들웨어
app.use(cors())
app.use(express.json())

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

// 시공 데이터 업로드
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

// 시장 평균 재계산
app.post('/api/admin/recalculate-averages', authenticateToken, requireAdmin, async (req, res) => {
	try {
		console.log('🔄 Recalculating market averages...')
		await recalculateMarketAverages()
		res.json({ message: 'Market averages recalculated successfully' })
	} catch (error) {
		console.error('Recalculation error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 업로드 이력 조회
app.get('/api/admin/upload-history', authenticateToken, requireAdmin, async (req, res) => {
	try {
		const history = await getUploadHistory()
		res.json(history)
	} catch (error) {
		console.error('History fetch error:', error)
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

// ============================================
// 서버 시작
// ============================================

app.listen(PORT, () => {
	console.log(`
🚀 ZipCheck Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:${PORT}
🗄️  Database: Supabase
🔍 Environment: ${process.env.NODE_ENV}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	`)
})
