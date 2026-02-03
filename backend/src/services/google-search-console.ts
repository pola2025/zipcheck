/**
 * Google Search Console API Service
 *
 * URL 인덱싱 요청 및 검색 성과 데이터를 조회합니다.
 *
 * 사전 조건:
 * 1. Search Console에 사이트(https://zcheck.co.kr) 등록
 * 2. 서비스 계정 이메일을 Search Console 사용자로 추가
 *    - Search Console > Settings > Users and permissions > Add user
 *    - zipcheck@zipcheck-486307.iam.gserviceaccount.com
 *    - 권한: Owner (인덱싱 API 사용 시) 또는 Full (검색 데이터만)
 */

import { google } from 'googleapis'
import { getGoogleAuth, GOOGLE_SCOPES } from './google-auth'

/**
 * Indexing API: URL 인덱싱 요청
 * Google에 특정 URL의 크롤링/인덱싱을 요청합니다.
 */
export async function requestIndexing(url: string): Promise<{ success: boolean; error?: string }> {
	try {
		const auth = getGoogleAuth([GOOGLE_SCOPES.INDEXING])
		const indexing = google.indexing({ version: 'v3', auth })

		const res = await indexing.urlNotifications.publish({
			requestBody: {
				url,
				type: 'URL_UPDATED',
			},
		})

		console.log(`✅ Indexing requested for: ${url}`)
		return { success: true }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error(`❌ Indexing request failed for ${url}:`, message)
		return { success: false, error: message }
	}
}

/**
 * Indexing API: URL 삭제 요청
 */
export async function requestUrlRemoval(url: string): Promise<{ success: boolean; error?: string }> {
	try {
		const auth = getGoogleAuth([GOOGLE_SCOPES.INDEXING])
		const indexing = google.indexing({ version: 'v3', auth })

		await indexing.urlNotifications.publish({
			requestBody: {
				url,
				type: 'URL_DELETED',
			},
		})

		console.log(`✅ URL removal requested: ${url}`)
		return { success: true }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error(`❌ URL removal failed for ${url}:`, message)
		return { success: false, error: message }
	}
}

/**
 * 사이트맵의 모든 URL에 대해 인덱싱 요청
 */
export async function requestIndexingForSitemap(): Promise<{
	total: number
	success: number
	failed: number
	results: Array<{ url: string; success: boolean; error?: string }>
}> {
	const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL || 'https://zcheck.co.kr'

	// 사이트맵 URL 목록
	const urls = [
		`${siteUrl}/`,
		`${siteUrl}/plan-selection`,
		`${siteUrl}/quote-submission`,
		`${siteUrl}/payment`,
		`${siteUrl}/quote-status`,
		`${siteUrl}/community`,
		`${siteUrl}/community/reviews/create`,
		`${siteUrl}/community/damage-cases/create`,
	]

	const results: Array<{ url: string; success: boolean; error?: string }> = []

	// 순차 실행 (API rate limit 고려)
	for (const url of urls) {
		const result = await requestIndexing(url)
		results.push({ url, ...result })

		// API rate limit 방지 (200ms 대기)
		await new Promise(resolve => setTimeout(resolve, 200))
	}

	return {
		total: results.length,
		success: results.filter(r => r.success).length,
		failed: results.filter(r => !r.success).length,
		results,
	}
}

interface SearchPerformanceData {
	rows: Array<{
		query: string
		page: string
		clicks: number
		impressions: number
		ctr: number
		position: number
	}>
	totals: {
		clicks: number
		impressions: number
		ctr: number
		position: number
	}
}

/**
 * Search Console: 검색 성과 데이터 조회
 * @param days 조회 기간 (기본 28일)
 */
export async function getSearchPerformance(days: number = 28): Promise<SearchPerformanceData> {
	const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL || 'https://zcheck.co.kr'
	const auth = getGoogleAuth([GOOGLE_SCOPES.SEARCH_CONSOLE_READONLY])
	const searchConsole = google.searchconsole({ version: 'v1', auth })

	const endDate = new Date()
	const startDate = new Date()
	startDate.setDate(startDate.getDate() - days)

	const formatDate = (d: Date) => d.toISOString().split('T')[0]

	const res = await searchConsole.searchanalytics.query({
		siteUrl,
		requestBody: {
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
			dimensions: ['query', 'page'],
			rowLimit: 100,
			startRow: 0,
		},
	})

	const rows = (res.data.rows || []).map(row => ({
		query: row.keys?.[0] || '',
		page: row.keys?.[1] || '',
		clicks: row.clicks || 0,
		impressions: row.impressions || 0,
		ctr: row.ctr || 0,
		position: row.position || 0,
	}))

	// 합계 계산
	const totals = rows.reduce(
		(acc, row) => ({
			clicks: acc.clicks + row.clicks,
			impressions: acc.impressions + row.impressions,
			ctr: 0, // 나중에 계산
			position: acc.position + row.position,
		}),
		{ clicks: 0, impressions: 0, ctr: 0, position: 0 }
	)

	if (totals.impressions > 0) {
		totals.ctr = totals.clicks / totals.impressions
	}
	if (rows.length > 0) {
		totals.position = totals.position / rows.length
	}

	return { rows, totals }
}

/**
 * Search Console: 사이트맵 제출
 */
export async function submitSitemap(): Promise<{ success: boolean; error?: string }> {
	try {
		const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL || 'https://zcheck.co.kr'
		const auth = getGoogleAuth([GOOGLE_SCOPES.SEARCH_CONSOLE])
		const searchConsole = google.searchconsole({ version: 'v1', auth })

		await searchConsole.sitemaps.submit({
			siteUrl,
			feedpath: `${siteUrl}/sitemap.xml`,
		})

		console.log(`✅ Sitemap submitted: ${siteUrl}/sitemap.xml`)
		return { success: true }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error(`❌ Sitemap submission failed:`, message)
		return { success: false, error: message }
	}
}
