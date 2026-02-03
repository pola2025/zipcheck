import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, RefreshCw, Database, Loader2 } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import KpiCards from '../../components/analytics/KpiCards'
import DailyTrendChart from '../../components/analytics/DailyTrendChart'
import TrafficSourcesChart from '../../components/analytics/TrafficSourcesChart'
import DeviceChart from '../../components/analytics/DeviceChart'
import FunnelChart from '../../components/analytics/FunnelChart'
import GeoChart from '../../components/analytics/GeoChart'
import SearchKeywordsTable from '../../components/analytics/SearchKeywordsTable'

import { adminPath } from '../../lib/admin-path'
import {
	useTrafficReport,
	useRealtimeUsers,
	useDeviceReport,
	useGeoReport,
	useFunnelReport,
	useSearchPerformance,
	useAirtableSync,
} from '../../hooks/useAnalytics'

const queryClient = new QueryClient()

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
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			{/* Header */}
			<header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Link
								to={adminPath()}
								className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
							>
								<ArrowLeft className="w-5 h-5 text-gray-400" />
							</Link>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
									<BarChart3 className="w-5 h-5 text-white" />
								</div>
								<div>
									<h1 className="text-xl font-bold text-white">유입 분석</h1>
									<p className="text-gray-400 text-sm">트래픽, 검색어, 퍼널, 디바이스 분석</p>
								</div>
							</div>
						</div>

						{/* Period selector */}
						<div className="flex items-center gap-2">
							<div className="flex gap-1 bg-gray-700/50 rounded-lg p-0.5">
								{PERIOD_OPTIONS.map(opt => (
									<button
										key={opt.value}
										onClick={() => setDays(opt.value)}
										className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
											days === opt.value
												? 'bg-cyan-600 text-white'
												: 'text-gray-400 hover:text-gray-200'
										}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
				{/* KPI Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
				>
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
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					{traffic.data?.dailyData && (
						<DailyTrendChart data={traffic.data.dailyData} />
					)}
				</motion.div>

				{/* 2-column: Sources + Device */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15 }}
					>
						{traffic.data?.trafficSources && (
							<TrafficSourcesChart data={traffic.data.trafficSources} />
						)}
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						{devices.data && <DeviceChart data={devices.data} />}
					</motion.div>
				</div>

				{/* Funnel */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.25 }}
				>
					{funnel.data && <FunnelChart data={funnel.data} />}
				</motion.div>

				{/* 2-column: Keywords + Geo */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<SearchKeywordsTable
							keywords={search.data?.keywords ?? []}
							totals={search.data?.totals}
						/>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
					>
						{geo.data && (
							<GeoChart countries={geo.data.countries} cities={geo.data.cities} />
						)}
					</motion.div>
				</div>

				{/* Airtable Sync */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Database className="w-5 h-5 text-cyan-400" />
							<div>
								<h3 className="text-lg font-semibold text-white">Airtable 동기화</h3>
								<p className="text-sm text-gray-400">
									최근 {days}일 GA4 데이터를 Airtable에 동기화합니다
								</p>
							</div>
						</div>
						<button
							onClick={handleSync}
							disabled={airtableSync.isPending}
							className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
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
						<div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
							<p className="text-green-400 text-sm">
								{airtableSync.data.details[0]}
							</p>
						</div>
					)}

					{airtableSync.isError && (
						<div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
							<p className="text-red-400 text-sm">
								동기화 실패: {airtableSync.error.message}
							</p>
						</div>
					)}
				</motion.div>

				{/* Error display */}
				{traffic.error && (
					<div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
						<p className="text-red-400">데이터 로드 실패: {traffic.error.message}</p>
					</div>
				)}
			</main>
		</div>
	)
}

export default function Analytics() {
	return (
		<QueryClientProvider client={queryClient}>
			<AnalyticsContent />
		</QueryClientProvider>
	)
}
