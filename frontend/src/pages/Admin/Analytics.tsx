import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Database, Loader2 } from 'lucide-react'

import KpiCards from '../../components/analytics/KpiCards'
import DailyTrendChart from '../../components/analytics/DailyTrendChart'
import TrafficSourcesChart from '../../components/analytics/TrafficSourcesChart'
import DeviceChart from '../../components/analytics/DeviceChart'
import FunnelChart from '../../components/analytics/FunnelChart'
import GeoChart from '../../components/analytics/GeoChart'
import SearchKeywordsTable from '../../components/analytics/SearchKeywordsTable'

import {
	useTrafficReport,
	useRealtimeUsers,
	useDeviceReport,
	useGeoReport,
	useFunnelReport,
	useSearchPerformance,
	useAirtableSync,
} from '../../hooks/useAnalytics'

const PERIOD_OPTIONS = [
	{ label: '7일', value: 7 },
	{ label: '14일', value: 14 },
	{ label: '30일', value: 30 },
	{ label: '90일', value: 90 },
]

function AnalyticsContent() {
	const [days, setDays] = useState(30)

	const traffic = useTrafficReport(days)
	const realtime = useRealtimeUsers()
	const devices = useDeviceReport(days)
	const geo = useGeoReport(days)
	const funnel = useFunnelReport(days)
	const search = useSearchPerformance(days)
	const airtableSync = useAirtableSync()

	const isLoading = traffic.isLoading

	const handleSync = () => {
		airtableSync.mutate(days)
	}

	return (
		<div className="space-y-6">
			{/* Page Header with Period Selector */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
						유입 분석
					</h2>
					<p className="text-sand-500 text-sm mt-1">트래픽, 검색어, 퍼널, 디바이스 분석</p>
				</div>

				<div className="flex gap-1 bg-sand-100 rounded-xl p-1">
					{PERIOD_OPTIONS.map(opt => (
						<button
							key={opt.value}
							onClick={() => setDays(opt.value)}
							className={`px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all ${
								days === opt.value
									? 'bg-white text-forest-700 shadow-sm'
									: 'text-sand-500 hover:text-sand-700'
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{/* KPI Cards */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
				<KpiCards
					totalUsers={traffic.data?.totalUsers ?? 0}
					totalSessions={traffic.data?.totalSessions ?? 0}
					bounceRate={traffic.data?.bounceRate ?? 0}
					avgSessionDuration={traffic.data?.avgSessionDuration ?? 0}
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

			{/* Funnel */}
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
				{funnel.data && <FunnelChart data={funnel.data} />}
			</motion.div>

			{/* 2-column: Keywords + Geo */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
					<SearchKeywordsTable
						keywords={search.data?.rows ?? []}
						totals={search.data?.totals}
					/>
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
					{geo.data && (
						<GeoChart countries={geo.data.countries} cities={geo.data.cities} />
					)}
				</motion.div>
			</div>

			{/* Airtable Sync */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-white rounded-2xl p-5 border border-sand-200"
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Database className="w-5 h-5 text-forest-600" />
						<div>
							<h3 className="text-base font-semibold text-sand-900">Airtable 동기화</h3>
							<p className="text-sm text-sand-500">
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

			{/* Error display */}
			{traffic.error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-xl">
					<p className="text-red-600">데이터 로드 실패: {traffic.error.message}</p>
				</div>
			)}
		</div>
	)
}

export default function Analytics() {
	return <AnalyticsContent />
}
