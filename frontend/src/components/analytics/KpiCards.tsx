import { motion } from 'framer-motion'
import { Users, MousePointerClick, TrendingDown, Clock, TrendingUp, Minus } from 'lucide-react'

interface KpiCardsProps {
	totalUsers: number
	totalSessions: number
	bounceRate: number
	avgSessionDuration: number
	prevTotalUsers?: number
	prevTotalSessions?: number
	prevBounceRate?: number
	prevAvgSessionDuration?: number
	activeUsers?: number
	isLoading?: boolean
}

function formatDuration(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.round(seconds % 60)
	return `${m}분 ${s}초`
}

function calcChange(current: number, previous: number | undefined): { pct: number; direction: 'up' | 'down' | 'same' } | null {
	if (previous === undefined || previous === 0) return null
	const pct = ((current - previous) / previous) * 100
	if (Math.abs(pct) < 0.5) return { pct: 0, direction: 'same' }
	return { pct, direction: pct > 0 ? 'up' : 'down' }
}

const cards = [
	{
		key: 'users',
		label: '총 사용자',
		icon: Users,
		accent: 'bg-forest-100 text-forest-700',
		format: (v: number) => v.toLocaleString(),
		invertColor: false,
	},
	{
		key: 'sessions',
		label: '세션',
		icon: MousePointerClick,
		accent: 'bg-emerald-50 text-emerald-600',
		format: (v: number) => v.toLocaleString(),
		invertColor: false,
	},
	{
		key: 'bounceRate',
		label: '이탈률',
		icon: TrendingDown,
		accent: 'bg-amber-50 text-amber-600',
		format: (v: number) => `${(v * 100).toFixed(1)}%`,
		invertColor: true, // 이탈률은 감소가 좋음
	},
	{
		key: 'avgDuration',
		label: '평균 체류시간',
		icon: Clock,
		accent: 'bg-wood-100 text-wood-500',
		format: (v: number) => formatDuration(v),
		invertColor: false,
	},
] as const

export default function KpiCards({
	totalUsers,
	totalSessions,
	bounceRate,
	avgSessionDuration,
	prevTotalUsers,
	prevTotalSessions,
	prevBounceRate,
	prevAvgSessionDuration,
	activeUsers,
	isLoading,
}: KpiCardsProps) {
	const values: Record<string, number> = {
		users: totalUsers,
		sessions: totalSessions,
		bounceRate,
		avgDuration: avgSessionDuration,
	}

	const prevValues: Record<string, number | undefined> = {
		users: prevTotalUsers,
		sessions: prevTotalSessions,
		bounceRate: prevBounceRate,
		avgDuration: prevAvgSessionDuration,
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card, index) => {
				const change = calcChange(values[card.key], prevValues[card.key])
				// invertColor: 이탈률은 감소=green, 증가=red
				const isPositive = change
					? card.invertColor
						? change.direction === 'down'
						: change.direction === 'up'
					: false

				return (
					<motion.div
						key={card.key}
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className="bg-white rounded-2xl p-5 border border-sand-300"
					>
						<div className="flex items-center justify-between mb-3">
							<div className={`w-10 h-10 rounded-xl ${card.accent} flex items-center justify-center`}>
								<card.icon className="w-5 h-5" />
							</div>
							{card.key === 'users' && activeUsers !== undefined && activeUsers > 0 && (
								<span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
									<span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
									{activeUsers} online
								</span>
							)}
						</div>
						<p className="text-sand-700 text-sm mb-1">{card.label}</p>
						<div className="flex items-end gap-2">
							<p className="text-2xl font-bold text-sand-900">
								{isLoading ? '...' : card.format(values[card.key])}
							</p>
							{!isLoading && change && change.direction !== 'same' && (
								<span className={`flex items-center gap-0.5 text-xs font-medium mb-0.5 ${
									isPositive ? 'text-green-600' : 'text-red-500'
								}`}>
									{change.direction === 'up' ? (
										<TrendingUp className="w-3.5 h-3.5" />
									) : (
										<TrendingDown className="w-3.5 h-3.5" />
									)}
									{Math.abs(change.pct).toFixed(1)}%
								</span>
							)}
							{!isLoading && change && change.direction === 'same' && (
								<span className="flex items-center gap-0.5 text-xs font-medium text-sand-500 mb-0.5">
									<Minus className="w-3.5 h-3.5" />
									0%
								</span>
							)}
						</div>
					</motion.div>
				)
			})}
		</div>
	)
}
