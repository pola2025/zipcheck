import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface TrafficSource {
	source: string
	medium: string
	users: number
	sessions: number
}

interface TrafficSourcesChartProps {
	data: TrafficSource[]
}

const COLORS = ['#4A6741', '#A87B4F', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']

export default function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
	const chartData = data.slice(0, 8).map(d => ({
		name: `${d.source} / ${d.medium}`,
		value: d.sessions,
	}))

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<h3 className="text-base font-semibold text-sand-900 mb-4">유입 출처</h3>
			<ResponsiveContainer width="100%" height={300}>
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						outerRadius={100}
						innerRadius={50}
						dataKey="value"
						paddingAngle={2}
						label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
						labelLine={{ stroke: '#C4BEB4' }}
					>
						{chartData.map((_, index) => (
							<Cell key={index} fill={COLORS[index % COLORS.length]} />
						))}
					</Pie>
					<Tooltip
						contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
						labelStyle={{ color: '#1A1A1A' }}
						itemStyle={{ color: '#6B6B6B' }}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	)
}
