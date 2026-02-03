/**
 * Google Services Admin API Routes
 *
 * GA4 트래픽, Search Console, 인덱싱 관리 엔드포인트
 */

import { Router } from 'express'
import { getTrafficReport, getRealtimeUsers, getDeviceReport, getGeoReport, getFunnelReport, getHourlyReport, getNewVsReturningReport, getConversionTrend } from '../../services/google-analytics'
import { syncDailyAnalytics } from '../../services/airtable-sync'
import { getSearchPerformance, requestIndexing, requestIndexingForSitemap, submitSitemap } from '../../services/google-search-console'
import { sendEmail } from '../../services/google-gmail'

const router = Router()

/** days 파라미터 파싱 및 범위 검증 (1~365) */
function parseDays(raw: unknown, defaultValue: number): number {
	const parsed = parseInt(raw as string)
	if (isNaN(parsed) || parsed < 1) return defaultValue
	return Math.min(parsed, 365)
}

// ============================================
// Google Analytics 4
// ============================================

/**
 * GET /api/admin/google/analytics/traffic
 * GA4 트래픽 리포트 조회
 * Query: ?days=30
 */
router.get('/analytics/traffic', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getTrafficReport(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 traffic report error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/realtime
 * GA4 실시간 사용자 수
 */
router.get('/analytics/realtime', async (req, res) => {
	try {
		const activeUsers = await getRealtimeUsers()
		res.json({ activeUsers })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 realtime error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/devices
 * 디바이스별 분석 데이터
 * Query: ?days=30
 */
router.get('/analytics/devices', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getDeviceReport(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 device report error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/geo
 * 지역별 분석 데이터
 * Query: ?days=30
 */
router.get('/analytics/geo', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getGeoReport(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 geo report error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/funnel
 * 퍼널 분석 데이터
 * Query: ?days=30
 */
router.get('/analytics/funnel', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getFunnelReport(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 funnel report error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/hourly
 * 시간대별 방문 패턴
 * Query: ?days=30
 */
router.get('/analytics/hourly', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getHourlyReport(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 hourly report error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/new-returning
 * 신규 vs 재방문 사용자
 * Query: ?days=30
 */
router.get('/analytics/new-returning', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getNewVsReturningReport(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 new-returning report error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/admin/google/analytics/conversion-trend
 * 전환율 추이
 * Query: ?days=30
 */
router.get('/analytics/conversion-trend', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 30)
		const report = await getConversionTrend(days)
		res.json(report)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('GA4 conversion trend error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * POST /api/admin/google/analytics/sync-airtable
 * Airtable에 일별 분석 데이터 동기화
 * Body: { days?: number }
 */
router.post('/analytics/sync-airtable', async (req, res) => {
	try {
		const days = parseDays(req.body.days, 30)
		const result = await syncDailyAnalytics(days)
		res.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('Airtable sync error:', message)
		res.status(500).json({ error: message })
	}
})

// ============================================
// Google Search Console
// ============================================

/**
 * GET /api/admin/google/search/performance
 * 검색 성과 데이터 조회
 * Query: ?days=28
 */
router.get('/search/performance', async (req, res) => {
	try {
		const days = parseDays(req.query.days, 28)
		const data = await getSearchPerformance(days)
		res.json(data)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('Search Console performance error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * POST /api/admin/google/search/index
 * 특정 URL 인덱싱 요청
 * Body: { url: string }
 */
router.post('/search/index', async (req, res) => {
	try {
		const { url } = req.body
		if (!url) {
			return res.status(400).json({ error: 'url 파라미터가 필요합니다.' })
		}
		const result = await requestIndexing(url)
		res.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('Indexing request error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * POST /api/admin/google/search/index-all
 * 사이트맵 전체 URL 인덱싱 요청
 */
router.post('/search/index-all', async (req, res) => {
	try {
		const result = await requestIndexingForSitemap()
		res.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('Sitemap indexing error:', message)
		res.status(500).json({ error: message })
	}
})

/**
 * POST /api/admin/google/search/submit-sitemap
 * Search Console에 사이트맵 제출
 */
router.post('/search/submit-sitemap', async (req, res) => {
	try {
		const result = await submitSitemap()
		res.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('Sitemap submission error:', message)
		res.status(500).json({ error: message })
	}
})

// ============================================
// Gmail (이메일 발송 테스트)
// ============================================

/**
 * POST /api/admin/google/email/test
 * 테스트 이메일 발송
 * Body: { to: string, subject: string, html: string }
 */
router.post('/email/test', async (req, res) => {
	try {
		const { to, subject, html } = req.body
		if (!to || !subject) {
			return res.status(400).json({ error: 'to, subject 파라미터가 필요합니다.' })
		}
		const result = await sendEmail({
			to,
			subject,
			html: html || `<p>ZipCheck 테스트 이메일입니다.</p>`,
		})
		res.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('Email test error:', message)
		res.status(500).json({ error: message })
	}
})

export default router
