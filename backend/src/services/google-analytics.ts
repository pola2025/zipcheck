/**
 * Google Analytics 4 Data API Service
 *
 * GA4 Property에서 사이트 트래픽 데이터를 조회합니다.
 * 사전 조건: GA4 Property에 서비스 계정 이메일을 "뷰어" 권한으로 추가해야 합니다.
 *
 * 설정 방법:
 * 1. Google Analytics > Admin > Property Access Management
 * 2. "+" 버튼 > "Add users"
 * 3. 이메일: zipcheck@zipcheck-486307.iam.gserviceaccount.com
 * 4. 역할: Viewer (뷰어)
 */

import { google } from 'googleapis'
import { getGoogleAuth, GOOGLE_SCOPES } from './google-auth'

let _analyticsClient: ReturnType<typeof google.analyticsdata> | null = null

const analyticsDataClient = () => {
	if (!_analyticsClient) {
		const auth = getGoogleAuth([GOOGLE_SCOPES.ANALYTICS_READONLY])
		_analyticsClient = google.analyticsdata({ version: 'v1beta', auth })
	}
	return _analyticsClient
}

interface TrafficReport {
	totalUsers: number
	totalSessions: number
	totalPageViews: number
	avgSessionDuration: number
	bounceRate: number
	prevTotalUsers: number
	prevTotalSessions: number
	prevTotalPageViews: number
	prevAvgSessionDuration: number
	prevBounceRate: number
	dailyData: Array<{
		date: string
		users: number
		sessions: number
		pageViews: number
		avgSessionDuration: number
	}>
	topPages: Array<{
		pagePath: string
		pageTitle: string
		views: number
		users: number
	}>
	trafficSources: Array<{
		source: string
		medium: string
		users: number
		sessions: number
	}>
}

/**
 * GA4 트래픽 리포트 조회
 * @param days 조회 기간 (일 수, 기본 30일)
 */
export async function getTrafficReport(days: number = 30): Promise<TrafficReport> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	// 이전 기간 계산 (같은 일수)
	const prevStart = `${days * 2}daysAgo`
	const prevEnd = `${days + 1}daysAgo`

	// 일별 트래픽 + 전체 요약 + 이전 기간
	const [overviewRes, prevOverviewRes, dailyRes, pagesRes, sourcesRes] = await Promise.all([
		// 현재 기간 요약 메트릭
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessions' },
					{ name: 'screenPageViews' },
					{ name: 'averageSessionDuration' },
					{ name: 'bounceRate' },
				],
			},
		}),

		// 이전 기간 요약 메트릭
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessions' },
					{ name: 'screenPageViews' },
					{ name: 'averageSessionDuration' },
					{ name: 'bounceRate' },
				],
			},
		}),

		// 일별 데이터
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [{ name: 'date' }],
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessions' },
					{ name: 'screenPageViews' },
					{ name: 'averageSessionDuration' },
				],
				orderBys: [{ dimension: { dimensionName: 'date' } }],
			},
		}),

		// 인기 페이지 (Top 20)
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [
					{ name: 'pagePath' },
					{ name: 'pageTitle' },
				],
				metrics: [
					{ name: 'screenPageViews' },
					{ name: 'totalUsers' },
				],
				orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
				limit: '20',
			},
		}),

		// 트래픽 소스
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [
					{ name: 'sessionSource' },
					{ name: 'sessionMedium' },
				],
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessions' },
				],
				orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
				limit: '15',
			},
		}),
	])

	// 전체 요약 파싱
	const overviewRow = overviewRes.data.rows?.[0]
	const overviewMetrics = overviewRow?.metricValues || []

	// 이전 기간 요약 파싱
	const prevRow = prevOverviewRes.data.rows?.[0]
	const prevMetrics = prevRow?.metricValues || []

	// 일별 데이터 파싱
	const dailyData = (dailyRes.data.rows || []).map(row => ({
		date: row.dimensionValues?.[0]?.value || '',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
		pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
		avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
	}))

	// 인기 페이지 파싱
	const topPages = (pagesRes.data.rows || []).map(row => ({
		pagePath: row.dimensionValues?.[0]?.value || '',
		pageTitle: row.dimensionValues?.[1]?.value || '',
		views: parseInt(row.metricValues?.[0]?.value || '0'),
		users: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	// 트래픽 소스 파싱
	const trafficSources = (sourcesRes.data.rows || []).map(row => ({
		source: row.dimensionValues?.[0]?.value || '',
		medium: row.dimensionValues?.[1]?.value || '',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	return {
		totalUsers: parseInt(overviewMetrics[0]?.value || '0'),
		totalSessions: parseInt(overviewMetrics[1]?.value || '0'),
		totalPageViews: parseInt(overviewMetrics[2]?.value || '0'),
		avgSessionDuration: parseFloat(overviewMetrics[3]?.value || '0'),
		bounceRate: parseFloat(overviewMetrics[4]?.value || '0'),
		prevTotalUsers: parseInt(prevMetrics[0]?.value || '0'),
		prevTotalSessions: parseInt(prevMetrics[1]?.value || '0'),
		prevTotalPageViews: parseInt(prevMetrics[2]?.value || '0'),
		prevAvgSessionDuration: parseFloat(prevMetrics[3]?.value || '0'),
		prevBounceRate: parseFloat(prevMetrics[4]?.value || '0'),
		dailyData,
		topPages,
		trafficSources,
	}
}

/**
 * 실시간 사용자 수 조회
 */
// ============================================
// Device Report
// ============================================

interface DeviceReportItem {
	device: string
	users: number
	sessions: number
	pageViews: number
	bounceRate: number
}

export async function getDeviceReport(days: number = 30): Promise<DeviceReportItem[]> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	const res = await client.properties.runReport({
		property,
		requestBody: {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'deviceCategory' }],
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessions' },
				{ name: 'screenPageViews' },
				{ name: 'bounceRate' },
			],
			orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
		},
	})

	return (res.data.rows || []).map(row => ({
		device: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
		pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
		bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
	}))
}

// ============================================
// Geo Report
// ============================================

interface GeoReportItem {
	name: string
	users: number
	sessions: number
}

interface GeoReport {
	regions: GeoReportItem[]
	cities: GeoReportItem[]
}

export async function getGeoReport(days: number = 30): Promise<GeoReport> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	const [regionsRes, citiesRes] = await Promise.all([
		// 시/도 단위
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [{ name: 'region' }],
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessions' },
				],
				orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
				limit: '15',
			},
		}),
		// 도시 단위
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [{ name: 'city' }],
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessions' },
				],
				orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
				limit: '15',
			},
		}),
	])

	const regions = (regionsRes.data.rows || []).map(row => ({
		name: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	const cities = (citiesRes.data.rows || []).map(row => ({
		name: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	return { regions, cities }
}

// ============================================
// Funnel Report
// ============================================

interface FunnelStep {
	step: number
	label: string
	pagePath: string
	pageViews: number
	users: number
}

const FUNNEL_PATHS: Array<{ path: string; label: string }> = [
	{ path: '/', label: '메인 페이지' },
	{ path: '/plan-selection', label: '플랜 선택' },
	{ path: '/payment', label: '결제' },
	{ path: '/quote-submission', label: '견적 신청' },
	{ path: '/quote-status', label: '견적 확인' },
]

export async function getFunnelReport(days: number = 30): Promise<FunnelStep[]> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	const res = await client.properties.runReport({
		property,
		requestBody: {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'pagePath' }],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'totalUsers' },
			],
			dimensionFilter: {
				filter: {
					fieldName: 'pagePath',
					inListFilter: {
						values: FUNNEL_PATHS.map(f => f.path),
					},
				},
			},
		},
	})

	const dataMap = new Map<string, { pageViews: number; users: number }>()
	for (const row of (res.data.rows || [])) {
		const pagePath = row.dimensionValues?.[0]?.value || ''
		dataMap.set(pagePath, {
			pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
			users: parseInt(row.metricValues?.[1]?.value || '0'),
		})
	}

	return FUNNEL_PATHS.map((funnel, index) => {
		const data = dataMap.get(funnel.path) || { pageViews: 0, users: 0 }
		return {
			step: index + 1,
			label: funnel.label,
			pagePath: funnel.path,
			pageViews: data.pageViews,
			users: data.users,
		}
	})
}

// ============================================
// Hourly Report
// ============================================

interface HourlyReportItem {
	hour: number
	users: number
	sessions: number
}

export async function getHourlyReport(days: number = 30): Promise<HourlyReportItem[]> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	const res = await client.properties.runReport({
		property,
		requestBody: {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'hour' }],
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessions' },
			],
			orderBys: [{ dimension: { dimensionName: 'hour' } }],
		},
	})

	// 0~23 시간대 모두 포함 (데이터 없는 시간대는 0)
	const dataMap = new Map<number, { users: number; sessions: number }>()
	for (const row of (res.data.rows || [])) {
		const hour = parseInt(row.dimensionValues?.[0]?.value || '0')
		dataMap.set(hour, {
			users: parseInt(row.metricValues?.[0]?.value || '0'),
			sessions: parseInt(row.metricValues?.[1]?.value || '0'),
		})
	}

	return Array.from({ length: 24 }, (_, i) => ({
		hour: i,
		users: dataMap.get(i)?.users || 0,
		sessions: dataMap.get(i)?.sessions || 0,
	}))
}

// ============================================
// New vs Returning
// ============================================

interface NewVsReturningItem {
	type: string
	users: number
	sessions: number
}

export async function getNewVsReturningReport(days: number = 30): Promise<NewVsReturningItem[]> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	const res = await client.properties.runReport({
		property,
		requestBody: {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'newVsReturning' }],
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessions' },
			],
			orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
		},
	})

	return (res.data.rows || []).map(row => ({
		type: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))
}

// ============================================
// Conversion Trend
// ============================================

interface ConversionTrendItem {
	date: string
	totalUsers: number
	conversionUsers: number
	conversionRate: number
}

export async function getConversionTrend(days: number = 30): Promise<ConversionTrendItem[]> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()
	const property = `properties/${propertyId}`

	const [totalRes, convRes] = await Promise.all([
		// 일별 전체 사용자
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [{ name: 'date' }],
				metrics: [{ name: 'totalUsers' }],
				orderBys: [{ dimension: { dimensionName: 'date' } }],
			},
		}),
		// 일별 견적신청 페이지 사용자
		client.properties.runReport({
			property,
			requestBody: {
				dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
				dimensions: [{ name: 'date' }],
				metrics: [{ name: 'totalUsers' }],
				dimensionFilter: {
					filter: {
						fieldName: 'pagePath',
						stringFilter: {
							matchType: 'EXACT',
							value: '/quote-submission',
						},
					},
				},
				orderBys: [{ dimension: { dimensionName: 'date' } }],
			},
		}),
	])

	const totalMap = new Map<string, number>()
	for (const row of (totalRes.data.rows || [])) {
		const date = row.dimensionValues?.[0]?.value || ''
		totalMap.set(date, parseInt(row.metricValues?.[0]?.value || '0'))
	}

	const convMap = new Map<string, number>()
	for (const row of (convRes.data.rows || [])) {
		const date = row.dimensionValues?.[0]?.value || ''
		convMap.set(date, parseInt(row.metricValues?.[0]?.value || '0'))
	}

	const dates = Array.from(totalMap.keys()).sort()
	return dates.map(date => {
		const totalUsers = totalMap.get(date) || 0
		const conversionUsers = convMap.get(date) || 0
		return {
			date,
			totalUsers,
			conversionUsers,
			conversionRate: totalUsers > 0 ? (conversionUsers / totalUsers) * 100 : 0,
		}
	})
}

// ============================================
// Realtime Users
// ============================================

export async function getRealtimeUsers(): Promise<number> {
	const propertyId = process.env.GA4_PROPERTY_ID
	if (!propertyId) {
		throw new Error('GA4_PROPERTY_ID 환경변수가 설정되지 않았습니다.')
	}

	const client = analyticsDataClient()

	const res = await client.properties.runRealtimeReport({
		property: `properties/${propertyId}`,
		requestBody: {
			metrics: [{ name: 'activeUsers' }],
		},
	})

	return parseInt(res.data.rows?.[0]?.metricValues?.[0]?.value || '0')
}
