import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FunnelStep {
	step: number
	label: string
	pagePath: string
	pageViews: number
	users: number
}

interface FunnelChartProps {
	data: FunnelStep[]
}

const STEP_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']

export default function FunnelChart({ data }: FunnelChartProps) {
	const maxPV = Math.max(...data.map(d => d.pageViews), 1)

	const chartData = data.map((d, i) => {
		const prevPV = i > 0 ? data[i - 1].pageViews : d.pageViews
		const dropOff = prevPV > 0 ? ((prevPV - d.pageViews) / prevPV * 100) : 0
		return {
			...d,
			displayLabel: `${d.step}. ${d.label}`,
			dropOff: i === 0 ? 0 : Math.round(dropOff),
			pct: Math.round((d.pageViews / maxPV) * 100),
		}
	})

	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
			<h3 className="text-lg font-semibold text-white mb-4">퍼널 분석</h3>
			<ResponsiveContainer width="100%" height={280}>
				<BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
					<XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
					<YAxis
						type="category"
						dataKey="displayLabel"
						tick={{ fill: '#D1D5DB', fontSize: 13 }}
						width={120}
					/>
					<Tooltip
						contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
						labelStyle={{ color: '#F3F4F6' }}
						formatter={(value: number, name: string) => {
							if (name === 'pageViews') return [value.toLocaleString(), '페이지뷰']
							return [value, name]
						}}
					/>
					<Bar dataKey="pageViews" radius={[0, 6, 6, 0]} barSize={28}>
						{chartData.map((_, index) => (
							<Cell key={index} fill={STEP_COLORS[index % STEP_COLORS.length]} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>

			{/* Drop-off indicators */}
			<div className="mt-4 flex flex-wrap gap-3">
				{chartData.slice(1).map(d => (
					<span key={d.step} className="text-xs bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full">
						{d.displayLabel}: -{d.dropOff}% 이탈
					</span>
				))}
			</div>
		</div>
	)
}
