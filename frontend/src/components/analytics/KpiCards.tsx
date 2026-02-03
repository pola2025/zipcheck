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
		color: 'from-blue-500 to-blue-600',
		format: (v: number) => v.toLocaleString(),
	},
	{
		key: 'sessions',
		label: '세션',
		icon: MousePointerClick,
		color: 'from-green-500 to-green-600',
		format: (v: number) => v.toLocaleString(),
	},
	{
		key: 'bounceRate',
		label: '이탈률',
		icon: TrendingDown,
		color: 'from-orange-500 to-orange-600',
		format: (v: number) => `${(v * 100).toFixed(1)}%`,
	},
	{
		key: 'avgDuration',
		label: '평균 체류시간',
		icon: Clock,
		color: 'from-purple-500 to-purple-600',
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
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
					className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700"
				>
					<div className="flex items-center justify-between mb-3">
						<div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
							<card.icon className="w-5 h-5 text-white" />
						</div>
						{card.key === 'users' && activeUsers !== undefined && activeUsers > 0 && (
							<span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
								<span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
								{activeUsers} online
							</span>
						)}
					</div>
					<p className="text-gray-400 text-sm mb-1">{card.label}</p>
					<p className="text-2xl font-bold text-white">
						{isLoading ? '...' : card.format(values[card.key])}
					</p>
				</motion.div>
			))}
		</div>
	)
}
