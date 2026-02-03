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

const STEP_COLORS = ['#4A6741', '#6B9960', '#A87B4F', '#3B82F6', '#F59E0B']

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
		<div className="bg-white rounded-2xl p-5 border border-sand-200">
			<h3 className="text-base font-semibold text-sand-900 mb-4">퍼널 분석</h3>
			<ResponsiveContainer width="100%" height={280}>
				<BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
					<XAxis type="number" tick={{ fill: '#9B9588', fontSize: 12 }} />
					<YAxis
						type="category"
						dataKey="displayLabel"
						tick={{ fill: '#3D3D3D', fontSize: 13 }}
						width={120}
					/>
					<Tooltip
						contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
						labelStyle={{ color: '#1A1A1A' }}
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

			<div className="mt-4 flex flex-wrap gap-2">
				{chartData.slice(1).map(d => (
					<span key={d.step} className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
						{d.displayLabel}: -{d.dropOff}% 이탈
					</span>
				))}
			</div>
		</div>
	)
}
