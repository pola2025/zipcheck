import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Database, Loader2, Calendar } from 'lucide-react'

import KpiCards from '../../components/analytics/KpiCards'
import DailyTrendChart from '../../components/analytics/DailyTrendChart'
import TrafficSourcesChart from '../../components/analytics/TrafficSourcesChart'
import DeviceChart from '../../components/analytics/DeviceChart'
import FunnelChart from '../../components/analytics/FunnelChart'
import GeoChart from '../../components/analytics/GeoChart'
import TopPagesTable from '../../components/analytics/TopPagesTable'
import SearchKeywordsTable from '../../components/analytics/SearchKeywordsTable'
import HourlyChart from '../../components/analytics/HourlyChart'
import NewVsReturningChart from '../../components/analytics/NewVsReturningChart'
import ConversionTrendChart from '../../components/analytics/ConversionTrendChart'
import CalendarHeatmap from '../../components/analytics/CalendarHeatmap'

import {
	useTrafficReport,
	useRealtimeUsers,
	useDeviceReport,
	useGeoReport,
	useFunnelReport,
	useSearchPerformance,
	useAirtableSync,
	useHourlyReport,
	useNewVsReturningReport,
	useConversionTrend,
} from '../../hooks/useAnalytics'
import type { SiteFilter } from '../../hooks/useAnalytics'

const PERIOD_OPTIONS = [
	{ label: '7일', value: 7 },
	{ label: '14일', value: 14 },
	{ label: '30일', value: 30 },
	{ label: '90일', value: 90 },
]

const SITE_OPTIONS = [
	{ label: '전체', value: undefined as SiteFilter },
	{ label: '홈페이지', value: 'main' as SiteFilter },
	{ label: '블로그', value: 'blog' as SiteFilter },
]

function formatDateInput(d: Date): string {
	return d.toISOString().split('T')[0]
}

function AnalyticsContent() {
	const [site, setSite] = useState<SiteFilter>(undefined)
	const [preset, setPreset] = useState<number | 'custom'>(30)
	const [startDate, setStartDate] = useState(() => {
		const d = new Date()
		d.setDate(d.getDate() - 30)
		return formatDateInput(d)
	})
	const [endDate, setEndDate] = useState(() => formatDateInput(new Date()))

	const days = useMemo(() => {
		if (preset !== 'custom') return preset
		const start = new Date(startDate)
		const end = new Date(endDate)
		const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
		return Math.max(1, Math.min(diff, 365))
	}, [preset, startDate, endDate])

	const handlePreset = (value: number) => {
		setPreset(value)
		const end = new Date()
		const start = new Date()
		start.setDate(start.getDate() - value)
		setStartDate(formatDateInput(start))
		setEndDate(formatDateInput(end))
	}

	const traffic = useTrafficReport(days, site)
	const realtime = useRealtimeUsers(site)
	const devices = useDeviceReport(days, site)
	const geo = useGeoReport(days, site)
	const funnel = useFunnelReport(days, site)
	const search = useSearchPerformance(days)
	const airtableSync = useAirtableSync()
	const hourly = useHourlyReport(days, site)
	const newVsReturning = useNewVsReturningReport(days, site)
	const conversionTrend = useConversionTrend(days, site)

	const isLoading = traffic.isLoading || devices.isLoading || geo.isLoading || funnel.isLoading

	const errors = [
		traffic.error && `트래픽: ${traffic.error.message}`,
		devices.error && `디바이스: ${devices.error.message}`,
		geo.error && `지역: ${geo.error.message}`,
		funnel.error && `퍼널: ${funnel.error.message}`,
		hourly.error && `시간대별: ${hourly.error.message}`,
		newVsReturning.error && `신규/재방문: ${newVsReturning.error.message}`,
		conversionTrend.error && `전환율: ${conversionTrend.error.message}`,
	].filter(Boolean) as string[]

	const searchWarning = search.error ? `검색 콘솔: ${search.error.message}` : null

	const handleSync = () => {
		airtableSync.mutate(days)
	}

	return (
		<div className="space-y-6">
			{/* Page Header with Period Selector */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
							유입 분석
						</h2>
						<p className="text-sand-700 text-sm mt-1">트래픽, 검색어, 퍼널, 디바이스 분석</p>
					</div>

					<div className="flex gap-1 bg-sand-100 rounded-xl p-1">
						{PERIOD_OPTIONS.map(opt => (
							<button
								key={opt.value}
								onClick={() => handlePreset(opt.value)}
								className={`px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all ${
									preset === opt.value
										? 'bg-white text-forest-700 shadow-sm'
										: 'text-sand-700 hover:text-sand-800'
								}`}
							>
								{opt.label}
							</button>
						))}
						<button
							onClick={() => setPreset('custom')}
							className={`px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all flex items-center gap-1 ${
								preset === 'custom'
									? 'bg-white text-forest-700 shadow-sm'
									: 'text-sand-700 hover:text-sand-800'
							}`}
						>
							<Calendar className="w-3.5 h-3.5" />
							직접설정
						</button>
					</div>
				</div>

				{/* Site Filter */}
				<div className="flex gap-1 bg-sand-100 rounded-xl p-1 w-fit">
					{SITE_OPTIONS.map(opt => (
						<button
							key={opt.label}
							onClick={() => setSite(opt.value)}
							className={`px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all ${
								site === opt.value
									? 'bg-white text-forest-700 shadow-sm'
									: 'text-sand-700 hover:text-sand-800'
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>

				{preset === 'custom' && (
					<div className="flex items-center gap-3 bg-sand-50 rounded-xl px-4 py-2.5 border border-sand-200">
						<input
							type="date"
							value={startDate}
							onChange={e => setStartDate(e.target.value)}
							max={endDate}
							className="bg-white border border-sand-300 rounded-lg px-3 py-1.5 text-sm text-sand-900 focus:outline-none focus:ring-2 focus:ring-forest-300"
						/>
						<span className="text-sand-600 text-sm">~</span>
						<input
							type="date"
							value={endDate}
							onChange={e => setEndDate(e.target.value)}
							min={startDate}
							max={formatDateInput(new Date())}
							className="bg-white border border-sand-300 rounded-lg px-3 py-1.5 text-sm text-sand-900 focus:outline-none focus:ring-2 focus:ring-forest-300"
						/>
						<span className="text-sand-700 text-xs ml-1">{days}일</span>
					</div>
				)}
			</div>

			{/* KPI Cards */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
				<KpiCards
					totalUsers={traffic.data?.totalUsers ?? 0}
					totalSessions={traffic.data?.totalSessions ?? 0}
					bounceRate={traffic.data?.bounceRate ?? 0}
					avgSessionDuration={traffic.data?.avgSessionDuration ?? 0}
					prevTotalUsers={traffic.data?.prevTotalUsers}
					prevTotalSessions={traffic.data?.prevTotalSessions}
					prevBounceRate={traffic.data?.prevBounceRate}
					prevAvgSessionDuration={traffic.data?.prevAvgSessionDuration}
					activeUsers={realtime.data?.activeUsers}
					isLoading={isLoading}
				/>
			</motion.div>

			{/* Daily Trend */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
				{traffic.data?.dailyData && (
					<DailyTrendChart data={traffic.data.dailyData} />
				)}
			</motion.div>

			{/* Calendar Heatmap */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
				{traffic.data?.dailyData && (
					<CalendarHeatmap data={traffic.data.dailyData} />
				)}
			</motion.div>

			{/* 2-column: Sources + Device */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
					{traffic.data?.trafficSources && (
						<TrafficSourcesChart data={traffic.data.trafficSources} />
					)}
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
					{devices.data && <DeviceChart data={devices.data} />}
				</motion.div>
			</div>

			{/* 2-column: Hourly + New vs Returning */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
					{hourly.data && <HourlyChart data={hourly.data} />}
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
					{newVsReturning.data && <NewVsReturningChart data={newVsReturning.data} />}
				</motion.div>
			</div>

			{/* Funnel */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
				{site === 'blog' ? (
					<div className="bg-sand-50 rounded-2xl p-5 border border-sand-200">
						<p className="text-sand-600 text-sm">블로그에는 퍼널 데이터가 없습니다. 전체 또는 홈페이지를 선택해주세요.</p>
					</div>
				) : (
					funnel.data && <FunnelChart data={funnel.data} />
				)}
			</motion.div>

			{/* Conversion Trend */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
				{site === 'blog' ? (
					<div className="bg-sand-50 rounded-2xl p-5 border border-sand-200">
						<p className="text-sand-600 text-sm">블로그에는 전환율 데이터가 없습니다. 전체 또는 홈페이지를 선택해주세요.</p>
					</div>
				) : (
					conversionTrend.data && <ConversionTrendChart data={conversionTrend.data} />
				)}
			</motion.div>

			{/* 2-column: Top Pages + Cities */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
					<TopPagesTable pages={traffic.data?.topPages ?? []} />
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
					{geo.data && (
						<GeoChart regions={geo.data.regions} cities={geo.data.cities} />
					)}
				</motion.div>
			</div>

			{/* Search Keywords */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
				<SearchKeywordsTable
					keywords={search.data?.rows ?? []}
					totals={search.data?.totals}
				/>
			</motion.div>

			{/* Airtable Sync */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.45 }}
				className="bg-white rounded-2xl p-5 border border-sand-300"
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Database className="w-5 h-5 text-forest-600" />
						<div>
							<h3 className="text-base font-semibold text-sand-900">Airtable 동기화</h3>
							<p className="text-sm text-sand-700">
								최근 {days}일 GA4 데이터를 Airtable에 동기화합니다
							</p>
						</div>
					</div>
					<button
						onClick={handleSync}
						disabled={airtableSync.isPending}
						className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
					>
						{airtableSync.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<RefreshCw className="w-4 h-4" />
						)}
						동기화
					</button>
				</div>

				{airtableSync.isSuccess && (
					<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
						<p className="text-green-700 text-sm">
							{airtableSync.data.details[0]}
						</p>
					</div>
				)}

				{airtableSync.isError && (
					<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
						<p className="text-red-600 text-sm">
							동기화 실패: {airtableSync.error.message}
						</p>
					</div>
				)}
			</motion.div>

			{/* Search Console warning (non-critical) */}
			{searchWarning && (
				<div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
					<p className="text-amber-700 text-sm">{searchWarning}</p>
				</div>
			)}

			{/* GA4 errors (critical) */}
			{errors.length > 0 && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
					{errors.map((msg, i) => (
						<p key={i} className="text-red-600 text-sm">데이터 로드 실패 — {msg}</p>
					))}
				</div>
			)}
		</div>
	)
}

export default function Analytics() {
	return <AnalyticsContent />
}
