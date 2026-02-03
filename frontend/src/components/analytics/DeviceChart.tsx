import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface DeviceData {
	device: string
	users: number
	sessions: number
	pageViews: number
	bounceRate: number
}

interface DeviceChartProps {
	data: DeviceData[]
}

const DEVICE_COLORS: Record<string, string> = {
	desktop: '#3B82F6',
	mobile: '#10B981',
	tablet: '#F59E0B',
}

const DEVICE_LABELS: Record<string, string> = {
	desktop: 'PC',
	mobile: '모바일',
	tablet: '태블릿',
}

export default function DeviceChart({ data }: DeviceChartProps) {
	const chartData = data.map(d => ({
		name: DEVICE_LABELS[d.device.toLowerCase()] || d.device,
		value: d.users,
		fill: DEVICE_COLORS[d.device.toLowerCase()] || '#6B7280',
	}))

	const total = chartData.reduce((sum, d) => sum + d.value, 0)

	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
			<h3 className="text-lg font-semibold text-white mb-4">디바이스</h3>
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
						contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
						itemStyle={{ color: '#D1D5DB' }}
					/>
				</PieChart>
			</ResponsiveContainer>
			<div className="flex justify-center gap-6 mt-2">
				{chartData.map(d => (
					<div key={d.name} className="flex items-center gap-2">
						<span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
						<span className="text-sm text-gray-300">
							{d.name} {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
