import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DailyData {
	date: string
	users: number
	sessions: number
	pageViews: number
}

interface DailyTrendChartProps {
	data: DailyData[]
}

function formatDate(dateStr: string): string {
	// "20250103" → "1/3"
	if (dateStr.length === 8) {
		const m = parseInt(dateStr.slice(4, 6))
		const d = parseInt(dateStr.slice(6, 8))
		return `${m}/${d}`
	}
	return dateStr
}

export default function DailyTrendChart({ data }: DailyTrendChartProps) {
	const chartData = data.map(d => ({
		...d,
		dateLabel: formatDate(d.date),
	}))

	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
			<h3 className="text-lg font-semibold text-white mb-4">일별 추이</h3>
			<ResponsiveContainer width="100%" height={320}>
				<AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
					<defs>
						<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
						</linearGradient>
						<linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#10B981" stopOpacity={0} />
						</linearGradient>
						<linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
					<XAxis dataKey="dateLabel" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
					<YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
					<Tooltip
						contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
						labelStyle={{ color: '#F3F4F6' }}
						itemStyle={{ color: '#D1D5DB' }}
					/>
					<Legend wrapperStyle={{ color: '#9CA3AF' }} />
					<Area type="monotone" dataKey="users" name="사용자" stroke="#3B82F6" fill="url(#colorUsers)" strokeWidth={2} />
					<Area type="monotone" dataKey="sessions" name="세션" stroke="#10B981" fill="url(#colorSessions)" strokeWidth={2} />
					<Area type="monotone" dataKey="pageViews" name="페이지뷰" stroke="#F59E0B" fill="url(#colorPV)" strokeWidth={2} />
				</AreaChart>
			</ResponsiveContainer>
		</div>
	)
}
