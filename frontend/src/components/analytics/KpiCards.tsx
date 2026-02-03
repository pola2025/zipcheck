import { motion } from 'framer-motion'
import { Users, MousePointerClick, TrendingDown, Clock } from 'lucide-react'

interface KpiCardsProps {
	totalUsers: number
	totalSessions: number
	bounceRate: number
	avgSessionDuration: number
	activeUsers?: number
	isLoading?: boolean
}

function formatDuration(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.round(seconds % 60)
	return `${m}분 ${s}초`
}

const cards = [
	{
		key: 'users',
		label: '총 사용자',
		icon: Users,
		accent: 'bg-forest-100 text-forest-700',
		format: (v: number) => v.toLocaleString(),
	},
	{
		key: 'sessions',
		label: '세션',
		icon: MousePointerClick,
		accent: 'bg-emerald-50 text-emerald-600',
		format: (v: number) => v.toLocaleString(),
	},
	{
		key: 'bounceRate',
		label: '이탈률',
		icon: TrendingDown,
		accent: 'bg-amber-50 text-amber-600',
		format: (v: number) => `${(v * 100).toFixed(1)}%`,
	},
	{
		key: 'avgDuration',
		label: '평균 체류시간',
		icon: Clock,
		accent: 'bg-wood-100 text-wood-500',
		format: (v: number) => formatDuration(v),
	},
] as const

export default function KpiCards({
	totalUsers,
	totalSessions,
	bounceRate,
	avgSessionDuration,
	activeUsers,
	isLoading,
}: KpiCardsProps) {
	const values: Record<string, number> = {
		users: totalUsers,
		sessions: totalSessions,
		bounceRate,
		avgDuration: avgSessionDuration,
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card, index) => (
				<motion.div
					key={card.key}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
					className="bg-white rounded-2xl p-5 border border-sand-200"
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
					<p className="text-sand-500 text-sm mb-1">{card.label}</p>
					<p className="text-2xl font-bold text-sand-900">
						{isLoading ? '...' : card.format(values[card.key])}
					</p>
				</motion.div>
			))}
		</div>
	)
}
