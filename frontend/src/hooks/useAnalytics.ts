import { useQuery, useMutation } from '@tanstack/react-query'
import { getApiUrl } from '../lib/api-config'

function getAuthHeaders(): HeadersInit {
	const token = localStorage.getItem('admin_token')
	return {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	}
}

async function fetchAnalytics<T>(path: string): Promise<T> {
	const res = await fetch(getApiUrl(path), { headers: getAuthHeaders() })
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }))
		throw new Error(err.error || `API error ${res.status}`)
	}
	return res.json()
}

// ============================================
// Traffic Report
// ============================================

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

export function useTrafficReport(days: number = 30) {
	return useQuery<TrafficReport>({
		queryKey: ['analytics', 'traffic', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/traffic?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
}

// ============================================
// Realtime Users
// ============================================

export function useRealtimeUsers() {
	return useQuery<{ activeUsers: number }>({
		queryKey: ['analytics', 'realtime'],
		queryFn: () => fetchAnalytics('/api/admin/google/analytics/realtime'),
		refetchInterval: 60 * 1000,
		staleTime: 30 * 1000,
	})
}

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

export function useDeviceReport(days: number = 30) {
	return useQuery<DeviceReportItem[]>({
		queryKey: ['analytics', 'devices', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/devices?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
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

export function useGeoReport(days: number = 30) {
	return useQuery<GeoReport>({
		queryKey: ['analytics', 'geo', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/geo?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
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

export function useFunnelReport(days: number = 30) {
	return useQuery<FunnelStep[]>({
		queryKey: ['analytics', 'funnel', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/funnel?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
}

// ============================================
// Search Performance (Search Console)
// ============================================

interface SearchKeyword {
	query: string
	clicks: number
	impressions: number
	ctr: number
	position: number
}

interface SearchPerformance {
	totals: {
		clicks: number
		impressions: number
		ctr: number
		position: number
	}
	rows: SearchKeyword[]
}

export function useSearchPerformance(days: number = 28) {
	return useQuery<SearchPerformance>({
		queryKey: ['analytics', 'search', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/search/performance?days=${days}`),
		staleTime: 5 * 60 * 1000,
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

export function useHourlyReport(days: number = 30) {
	return useQuery<HourlyReportItem[]>({
		queryKey: ['analytics', 'hourly', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/hourly?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
}

// ============================================
// New vs Returning
// ============================================

interface NewVsReturningItem {
	type: string
	users: number
	sessions: number
}

export function useNewVsReturningReport(days: number = 30) {
	return useQuery<NewVsReturningItem[]>({
		queryKey: ['analytics', 'new-returning', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/new-returning?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
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

export function useConversionTrend(days: number = 30) {
	return useQuery<ConversionTrendItem[]>({
		queryKey: ['analytics', 'conversion-trend', days],
		queryFn: () => fetchAnalytics(`/api/admin/google/analytics/conversion-trend?days=${days}`),
		staleTime: 5 * 60 * 1000,
	})
}

// ============================================
// Airtable Sync
// ============================================

interface SyncResult {
	synced: number
	errors: number
	details: string[]
}

export function useAirtableSync() {
	return useMutation<SyncResult, Error, number>({
		mutationFn: async (days: number = 30) => {
			const res = await fetch(getApiUrl('/api/admin/google/analytics/sync-airtable'), {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify({ days }),
			})
			if (!res.ok) {
				const err = await res.json().catch(() => ({ error: res.statusText }))
				throw new Error(err.error || `API error ${res.status}`)
			}
			return res.json()
		},
	})
}
