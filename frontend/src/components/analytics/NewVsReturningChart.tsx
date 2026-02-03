import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface NewVsReturningData {
	type: string
	users: number
	sessions: number
}

interface NewVsReturningChartProps {
	data: NewVsReturningData[]
}

const TYPE_COLORS: Record<string, string> = {
	new: '#4A6741',
	returning: '#A87B4F',
	unknown: '#9B9588',
}

const TYPE_LABELS: Record<string, string> = {
	new: '신규 방문',
	returning: '재방문',
	unknown: '미분류',
}

export default function NewVsReturningChart({ data }: NewVsReturningChartProps) {
	const chartData = data.map(d => ({
		name: TYPE_LABELS[d.type.toLowerCase()] || d.type,
		value: d.users,
		fill: TYPE_COLORS[d.type.toLowerCase()] || '#9B9588',
	}))

	const total = chartData.reduce((sum, d) => sum + d.value, 0)

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<h3 className="text-base font-semibold text-sand-900 mb-1">신규 vs 재방문</h3>
			<p className="text-sm text-sand-700 mb-4">사용자 유형별 비율</p>
			<ResponsiveContainer width="100%" height={200}>
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						outerRadius={80}
						innerRadius={45}
						dataKey="value"
						paddingAngle={3}
					>
						{chartData.map((entry, index) => (
							<Cell key={index} fill={entry.fill} />
						))}
					</Pie>
					<Tooltip
						contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
						itemStyle={{ color: '#6B6B6B' }}
						formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), '사용자']}
					/>
				</PieChart>
			</ResponsiveContainer>
			<div className="flex justify-center gap-6 mt-2">
				{chartData.map(d => (
					<div key={d.name} className="flex items-center gap-2">
						<span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
						<span className="text-sm text-sand-700">
							{d.name} {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
