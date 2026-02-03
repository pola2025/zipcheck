import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface TrafficSource {
	source: string
	medium: string
	users: number
	sessions: number
}

interface TrafficSourcesChartProps {
	data: TrafficSource[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

export default function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
	const chartData = data.slice(0, 8).map(d => ({
		name: `${d.source} / ${d.medium}`,
		value: d.sessions,
	}))

	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
			<h3 className="text-lg font-semibold text-white mb-4">유입 출처</h3>
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
						labelLine={{ stroke: '#6B7280' }}
					>
						{chartData.map((_, index) => (
							<Cell key={index} fill={COLORS[index % COLORS.length]} />
						))}
					</Pie>
					<Tooltip
						contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
						labelStyle={{ color: '#F3F4F6' }}
						itemStyle={{ color: '#D1D5DB' }}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	)
}
