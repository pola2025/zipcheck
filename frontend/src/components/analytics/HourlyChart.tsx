import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface HourlyData {
	hour: number
	users: number
	sessions: number
}

interface HourlyChartProps {
	data: HourlyData[]
}

export default function HourlyChart({ data }: HourlyChartProps) {
	const chartData = data.map(d => ({
		...d,
		hourLabel: `${d.hour}시`,
	}))

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<h3 className="text-base font-semibold text-sand-900 mb-1">시간대별 방문</h3>
			<p className="text-sm text-sand-700 mb-4">하루 중 방문이 집중되는 시간대</p>
			<ResponsiveContainer width="100%" height={280}>
				<BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
					<XAxis
						dataKey="hourLabel"
						tick={{ fill: '#9B9588', fontSize: 11 }}
						interval={2}
					/>
					<YAxis tick={{ fill: '#9B9588', fontSize: 12 }} />
					<Tooltip
						contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
						labelStyle={{ color: '#1A1A1A' }}
						itemStyle={{ color: '#6B6B6B' }}
					/>
					<Legend wrapperStyle={{ color: '#6B6B6B' }} />
					<Bar dataKey="users" name="사용자" fill="#4A6741" radius={[3, 3, 0, 0]} />
					<Bar dataKey="sessions" name="세션" fill="#A87B4F" radius={[3, 3, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
