import { getGoogleAccessToken, SCOPES } from '../lib/google-auth'
import type { Env } from '../types'

// GA4 Data API helper
async function runReport(accessToken: string, propertyId: string, request: Record<string, unknown>) {
	const res = await fetch(
		`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
		}
	)
	if (!res.ok) {
		const err = await res.text()
		throw new Error(`GA4 API error (${res.status}): ${err}`)
	}
	return res.json() as Promise<GA4Response>
}

async function runRealtimeReport(accessToken: string, propertyId: string, request: Record<string, unknown>) {
	const res = await fetch(
		`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runRealtimeReport`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
		}
	)
	if (!res.ok) {
		const err = await res.text()
		throw new Error(`GA4 Realtime API error (${res.status}): ${err}`)
	}
	return res.json() as Promise<GA4Response>
}

interface GA4Response {
	rows?: Array<{
		dimensionValues?: Array<{ value: string }>
		metricValues?: Array<{ value: string }>
	}>
}

function getToken(env: Env) {
	return getGoogleAccessToken(
		env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
		SCOPES.GA4_READONLY
	)
}

export async function getTrafficReport(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const propertyId = env.GA4_PROPERTY_ID
	const prevStart = `${days * 2}daysAgo`
	const prevEnd = `${days + 1}daysAgo`

	const [overviewRes, prevOverviewRes, dailyRes, pagesRes, sourcesRes] = await Promise.all([
		runReport(accessToken, propertyId, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			metrics: [
				{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
				{ name: 'averageSessionDuration' }, { name: 'bounceRate' },
			],
		}),
		runReport(accessToken, propertyId, {
			dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
			metrics: [
				{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
				{ name: 'averageSessionDuration' }, { name: 'bounceRate' },
			],
		}),
		runReport(accessToken, propertyId, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'date' }],
			metrics: [
				{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
				{ name: 'averageSessionDuration' },
			],
			orderBys: [{ dimension: { dimensionName: 'date' } }],
		}),
		runReport(accessToken, propertyId, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
			metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
			orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
			limit: '20',
		}),
		runReport(accessToken, propertyId, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
			metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
			orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
			limit: '15',
		}),
	])

	const m = (res: GA4Response, idx: number, parser: (v: string) => number = parseInt) =>
		parser(res.rows?.[0]?.metricValues?.[idx]?.value || '0')

	const dailyData = (dailyRes.rows || []).map(row => ({
		date: row.dimensionValues?.[0]?.value || '',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
		pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
		avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
	}))

	const topPages = (pagesRes.rows || []).map(row => ({
		pagePath: row.dimensionValues?.[0]?.value || '',
		pageTitle: row.dimensionValues?.[1]?.value || '',
		views: parseInt(row.metricValues?.[0]?.value || '0'),
		users: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	const trafficSources = (sourcesRes.rows || []).map(row => ({
		source: row.dimensionValues?.[0]?.value || '',
		medium: row.dimensionValues?.[1]?.value || '',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	return {
		totalUsers: m(overviewRes, 0), totalSessions: m(overviewRes, 1),
		totalPageViews: m(overviewRes, 2), avgSessionDuration: m(overviewRes, 3, parseFloat),
		bounceRate: m(overviewRes, 4, parseFloat),
		prevTotalUsers: m(prevOverviewRes, 0), prevTotalSessions: m(prevOverviewRes, 1),
		prevTotalPageViews: m(prevOverviewRes, 2), prevAvgSessionDuration: m(prevOverviewRes, 3, parseFloat),
		prevBounceRate: m(prevOverviewRes, 4, parseFloat),
		dailyData, topPages, trafficSources,
	}
}

export async function getDeviceReport(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const res = await runReport(accessToken, env.GA4_PROPERTY_ID, {
		dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
		dimensions: [{ name: 'deviceCategory' }],
		metrics: [
			{ name: 'totalUsers' }, { name: 'sessions' },
			{ name: 'screenPageViews' }, { name: 'bounceRate' },
		],
		orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
	})

	return (res.rows || []).map(row => ({
		device: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
		pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
		bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
	}))
}

export async function getGeoReport(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const [regionsRes, citiesRes] = await Promise.all([
		runReport(accessToken, env.GA4_PROPERTY_ID, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'region' }],
			metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
			orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
			limit: '15',
		}),
		runReport(accessToken, env.GA4_PROPERTY_ID, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'city' }],
			metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
			orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
			limit: '15',
		}),
	])

	const parse = (res: GA4Response) => (res.rows || []).map(row => ({
		name: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))

	return { regions: parse(regionsRes), cities: parse(citiesRes) }
}

const FUNNEL_PATHS = [
	{ path: '/', label: '메인 페이지' },
	{ path: '/plan-selection', label: '플랜 선택' },
	{ path: '/payment', label: '결제' },
	{ path: '/quote-submission', label: '견적 신청' },
	{ path: '/quote-status', label: '견적 확인' },
]

export async function getFunnelReport(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const res = await runReport(accessToken, env.GA4_PROPERTY_ID, {
		dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
		dimensions: [{ name: 'pagePath' }],
		metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
		dimensionFilter: {
			filter: {
				fieldName: 'pagePath',
				inListFilter: { values: FUNNEL_PATHS.map(f => f.path) },
			},
		},
	})

	const dataMap = new Map<string, { pageViews: number; users: number }>()
	for (const row of (res.rows || [])) {
		dataMap.set(row.dimensionValues?.[0]?.value || '', {
			pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
			users: parseInt(row.metricValues?.[1]?.value || '0'),
		})
	}

	return FUNNEL_PATHS.map((f, i) => {
		const d = dataMap.get(f.path) || { pageViews: 0, users: 0 }
		return { step: i + 1, label: f.label, pagePath: f.path, pageViews: d.pageViews, users: d.users }
	})
}

export async function getHourlyReport(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const res = await runReport(accessToken, env.GA4_PROPERTY_ID, {
		dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
		dimensions: [{ name: 'hour' }],
		metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
		orderBys: [{ dimension: { dimensionName: 'hour' } }],
	})

	const dataMap = new Map<number, { users: number; sessions: number }>()
	for (const row of (res.rows || [])) {
		dataMap.set(parseInt(row.dimensionValues?.[0]?.value || '0'), {
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

export async function getNewVsReturningReport(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const res = await runReport(accessToken, env.GA4_PROPERTY_ID, {
		dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
		dimensions: [{ name: 'newVsReturning' }],
		metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
		orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
	})

	return (res.rows || []).map(row => ({
		type: row.dimensionValues?.[0]?.value || 'unknown',
		users: parseInt(row.metricValues?.[0]?.value || '0'),
		sessions: parseInt(row.metricValues?.[1]?.value || '0'),
	}))
}

export async function getConversionTrend(env: Env, days = 30) {
	const accessToken = await getToken(env)
	const [totalRes, convRes] = await Promise.all([
		runReport(accessToken, env.GA4_PROPERTY_ID, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'date' }],
			metrics: [{ name: 'totalUsers' }],
			orderBys: [{ dimension: { dimensionName: 'date' } }],
		}),
		runReport(accessToken, env.GA4_PROPERTY_ID, {
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: [{ name: 'date' }],
			metrics: [{ name: 'totalUsers' }],
			dimensionFilter: {
				filter: {
					fieldName: 'pagePath',
					stringFilter: { matchType: 'EXACT', value: '/quote-submission' },
				},
			},
			orderBys: [{ dimension: { dimensionName: 'date' } }],
		}),
	])

	const totalMap = new Map<string, number>()
	for (const row of (totalRes.rows || [])) {
		totalMap.set(row.dimensionValues?.[0]?.value || '', parseInt(row.metricValues?.[0]?.value || '0'))
	}
	const convMap = new Map<string, number>()
	for (const row of (convRes.rows || [])) {
		convMap.set(row.dimensionValues?.[0]?.value || '', parseInt(row.metricValues?.[0]?.value || '0'))
	}

	return Array.from(totalMap.keys()).sort().map(date => {
		const totalUsers = totalMap.get(date) || 0
		const conversionUsers = convMap.get(date) || 0
		return {
			date, totalUsers, conversionUsers,
			conversionRate: totalUsers > 0 ? (conversionUsers / totalUsers) * 100 : 0,
		}
	})
}

export async function getRealtimeUsers(env: Env): Promise<number> {
	const accessToken = await getToken(env)
	const res = await runRealtimeReport(accessToken, env.GA4_PROPERTY_ID, {
		metrics: [{ name: 'activeUsers' }],
	})
	return parseInt(res.rows?.[0]?.metricValues?.[0]?.value || '0')
}
