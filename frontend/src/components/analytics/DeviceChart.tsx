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
	desktop: '#4A6741',
	mobile: '#A87B4F',
	tablet: '#3B82F6',
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
		fill: DEVICE_COLORS[d.device.toLowerCase()] || '#9B9588',
	}))

	const total = chartData.reduce((sum, d) => sum + d.value, 0)

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-200">
			<h3 className="text-base font-semibold text-sand-900 mb-4">디바이스</h3>
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
					/>
				</PieChart>
			</ResponsiveContainer>
			<div className="flex justify-center gap-6 mt-2">
				{chartData.map(d => (
					<div key={d.name} className="flex items-center gap-2">
						<span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
						<span className="text-sm text-sand-600">
							{d.name} {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
