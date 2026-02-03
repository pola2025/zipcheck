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

const analyticsDataClient = () => {
	const auth = getGoogleAuth([GOOGLE_SCOPES.ANALYTICS_READONLY])
	return google.analyticsdata({ version: 'v1beta', auth })
}

interface TrafficReport {
	totalUsers: number
	totalSessions: number
	totalPageViews: number
	avgSessionDuration: number
	bounceRate: number
	dailyData: Array<{
		date: string
		users: number
		sessions: number
		pageViews: number
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

	// 일별 트래픽 + 전체 요약
	const [overviewRes, dailyRes, pagesRes, sourcesRes] = await Promise.all([
		// 전체 요약 메트릭
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

	// 일별 데이터 파싱
	const dailyData = (dailyRes.data.rows || []).map(row => ({
		date: row.dimensionValues?.[0]?.value || '',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
		pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
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
		dailyData,
		topPages,
		trafficSources,
	}
}

/**
 * 실시간 사용자 수 조회
 */
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
