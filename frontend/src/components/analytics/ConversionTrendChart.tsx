import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ConversionTrendData {
	date: string
	totalUsers: number
	conversionUsers: number
	conversionRate: number
}

interface ConversionTrendChartProps {
	data: ConversionTrendData[]
}

function formatDate(dateStr: string): string {
	if (dateStr.length === 8) {
		const m = parseInt(dateStr.slice(4, 6))
		const d = parseInt(dateStr.slice(6, 8))
		return `${m}/${d}`
	}
	return dateStr
}

export default function ConversionTrendChart({ data }: ConversionTrendChartProps) {
	const chartData = data.map(d => ({
		...d,
		dateLabel: formatDate(d.date),
		rate: parseFloat(d.conversionRate.toFixed(1)),
	}))

	const avgRate = data.length > 0
		? data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length
		: 0

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-base font-semibold text-sand-900">전환율 추이</h3>
					<p className="text-sm text-sand-700">견적신청 페이지 도달률</p>
				</div>
				<div className="text-right">
					<p className="text-2xl font-bold text-forest-700">{avgRate.toFixed(1)}%</p>
					<p className="text-xs text-sand-700">평균 전환율</p>
				</div>
			</div>
			<ResponsiveContainer width="100%" height={280}>
				<LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
					<XAxis dataKey="dateLabel" tick={{ fill: '#9B9588', fontSize: 12 }} />
					<YAxis
						tick={{ fill: '#9B9588', fontSize: 12 }}
						tickFormatter={(v) => `${v}%`}
					/>
					<Tooltip
						contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
						labelStyle={{ color: '#1A1A1A' }}
						formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, '전환율']}
					/>
					<Line
						type="monotone"
						dataKey="rate"
						stroke="#4A6741"
						strokeWidth={2}
						dot={{ fill: '#4A6741', r: 3 }}
						activeDot={{ r: 5, fill: '#4A6741' }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	)
}
