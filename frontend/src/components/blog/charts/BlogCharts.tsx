/**
 * Interactive chart components for blog posts
 * Uses Recharts for data visualization
 */

import {
	BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
	PieChart, Pie, Cell,
	LineChart, Line,
	ResponsiveContainer,
} from 'recharts'

// ── Chart Data Types ────────────────────────────────

export interface ChartConfig {
	id: string
	type: 'bar' | 'pie' | 'line' | 'horizontal-bar'
	title: string
	subtitle?: string
	data: Record<string, unknown>[]
	keys?: { dataKey: string; name: string; color: string }[]
	xKey?: string
	unit?: string
}

// ── Color Palette ───────────────────────────────────

const COLORS = [
	'#38755e', // forest
	'#ef4444', // red
	'#f59e0b', // amber
	'#3b82f6', // blue
	'#8b5cf6', // violet
	'#06b6d4', // cyan
	'#ec4899', // pink
	'#10b981', // emerald
]

const chartLabelStyle = { fill: '#9ca3af', fontSize: 12 }
const chartAxisStyle = { stroke: '#374151', strokeDasharray: '3 3' }

// ── Custom Tooltip ──────────────────────────────────

function CustomTooltip({ active, payload, label }: {
	active?: boolean
	payload?: Array<{ name: string; value: number; color: string }>
	label?: string
}) {
	if (!active || !payload?.length) return null
	return (
		<div className="bg-sand-800 border border-sand-700 rounded-lg px-3 py-2 shadow-lg">
			{label && <p className="text-sand-400 text-xs mb-1">{label}</p>}
			{payload.map((entry, i) => (
				<p key={i} className="text-xs" style={{ color: entry.color }}>
					{entry.name}: <strong className="text-white">{entry.value.toLocaleString()}</strong>
				</p>
			))}
		</div>
	)
}

// ── Bar Chart ───────────────────────────────────────

function BlogBarChart({ config }: { config: ChartConfig }) {
	const keys = config.keys || [{ dataKey: 'value', name: '값', color: COLORS[0] }]
	const xKey = config.xKey || 'name'

	return (
		<ResponsiveContainer width="100%" height={280}>
			<BarChart data={config.data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
				<CartesianGrid {...chartAxisStyle} />
				<XAxis dataKey={xKey} tick={chartLabelStyle} axisLine={false} />
				<YAxis tick={chartLabelStyle} axisLine={false} tickFormatter={(v) => `${v.toLocaleString()}${config.unit || ''}`} />
				<Tooltip content={<CustomTooltip />} />
				<Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
				{keys.map((k, i) => (
					<Bar key={k.dataKey} dataKey={k.dataKey} name={k.name} fill={k.color || COLORS[i]} radius={[4, 4, 0, 0]} />
				))}
			</BarChart>
		</ResponsiveContainer>
	)
}

// ── Pie Chart ───────────────────────────────────────

function BlogPieChart({ config }: { config: ChartConfig }) {
	const dataKey = config.keys?.[0]?.dataKey || 'value'

	return (
		<ResponsiveContainer width="100%" height={280}>
			<PieChart>
				<Pie
					data={config.data}
					dataKey={dataKey}
					nameKey="name"
					cx="50%"
					cy="50%"
					outerRadius={100}
					label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
					labelLine={{ stroke: '#6b7280' }}
				>
					{config.data.map((_, i) => (
						<Cell key={i} fill={COLORS[i % COLORS.length]} />
					))}
				</Pie>
				<Tooltip content={<CustomTooltip />} />
			</PieChart>
		</ResponsiveContainer>
	)
}

// ── Line Chart ──────────────────────────────────────

function BlogLineChart({ config }: { config: ChartConfig }) {
	const keys = config.keys || [{ dataKey: 'value', name: '값', color: COLORS[0] }]
	const xKey = config.xKey || 'name'

	return (
		<ResponsiveContainer width="100%" height={280}>
			<LineChart data={config.data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
				<CartesianGrid {...chartAxisStyle} />
				<XAxis dataKey={xKey} tick={chartLabelStyle} axisLine={false} />
				<YAxis tick={chartLabelStyle} axisLine={false} />
				<Tooltip content={<CustomTooltip />} />
				<Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
				{keys.map((k, i) => (
					<Line
						key={k.dataKey}
						type="monotone"
						dataKey={k.dataKey}
						name={k.name}
						stroke={k.color || COLORS[i]}
						strokeWidth={2}
						dot={{ r: 3, fill: k.color || COLORS[i] }}
					/>
				))}
			</LineChart>
		</ResponsiveContainer>
	)
}

// ── Chart Renderer ──────────────────────────────────

export function BlogChart({ config }: { config: ChartConfig }) {
	return (
		<div className="my-8 bg-sand-800/60 border border-sand-700/30 rounded-xl p-4 md:p-5">
			<h4 className="text-sand-200 text-sm font-bold mb-1">{config.title}</h4>
			{config.subtitle && (
				<p className="text-sand-500 text-xs mb-4">{config.subtitle}</p>
			)}
			{config.type === 'bar' && <BlogBarChart config={config} />}
			{config.type === 'pie' && <BlogPieChart config={config} />}
			{config.type === 'line' && <BlogLineChart config={config} />}
			<p className="text-sand-600 text-[10px] mt-2 text-right">출처: 집첵 데이터 분석</p>
		</div>
	)
}

// ── Pre-built Chart Configs ─────────────────────────

/**
 * 30평대 리모델링 비용 비교 차트
 */
export const COST_COMPARISON_CHART: ChartConfig = {
	id: 'cost-comparison',
	type: 'bar',
	title: '30평대 리모델링 비용 비교 (2026년, 만원)',
	subtitle: '시공 범위별 중급/고급 자재 기준',
	xKey: 'name',
	unit: '만',
	keys: [
		{ dataKey: 'mid', name: '중급 자재', color: '#38755e' },
		{ dataKey: 'high', name: '고급 자재', color: '#f59e0b' },
	],
	data: [
		{ name: '부분(욕실+주방)', mid: 1000, high: 1600 },
		{ name: '반 리모델링', mid: 2000, high: 3000 },
		{ name: '전체 리모델링', mid: 3200, high: 5200 },
	],
}

/**
 * 자재별 평당 가격 비교 차트
 */
export const MATERIAL_COST_CHART: ChartConfig = {
	id: 'material-cost',
	type: 'bar',
	title: '바닥재 종류별 평당 가격 (만원)',
	subtitle: '자재비 기준, 시공비 별도',
	xKey: 'name',
	unit: '만',
	keys: [
		{ dataKey: 'min', name: '최저', color: '#3b82f6' },
		{ dataKey: 'max', name: '최고', color: '#ef4444' },
	],
	data: [
		{ name: '강화마루', min: 3, max: 8 },
		{ name: 'SPC', min: 5, max: 12 },
		{ name: '원목마루', min: 10, max: 25 },
		{ name: '타일', min: 4, max: 15 },
	],
}

/**
 * 인테리어 피해 유형 분포 차트
 */
export const DAMAGE_TYPE_CHART: ChartConfig = {
	id: 'damage-types',
	type: 'pie',
	title: '인테리어 피해 유형 분포 (2025년)',
	subtitle: '한국소비자원 접수 기준',
	keys: [{ dataKey: 'value', name: '건수', color: '' }],
	data: [
		{ name: '견적 분쟁', value: 42 },
		{ name: '부실시공', value: 25 },
		{ name: '공사 지연', value: 15 },
		{ name: '계약 해지', value: 10 },
		{ name: '기타', value: 8 },
	],
}

/**
 * 지역별 인테리어 비용 지수 차트
 */
export const REGIONAL_COST_CHART: ChartConfig = {
	id: 'regional-cost',
	type: 'bar',
	title: '지역별 인테리어 비용 지수',
	subtitle: '서울 기준 100%, 동일 시공 범위·자재 기준',
	xKey: 'name',
	unit: '%',
	keys: [{ dataKey: 'value', name: '비용 지수', color: '#06b6d4' }],
	data: [
		{ name: '서울', value: 100 },
		{ name: '경기', value: 93 },
		{ name: '광역시', value: 85 },
		{ name: '기타 지역', value: 78 },
	],
}

/**
 * Map of chart IDs to configs (for dynamic rendering from Airtable)
 */
export const PRESET_CHARTS: Record<string, ChartConfig> = {
	'cost-comparison': COST_COMPARISON_CHART,
	'material-cost': MATERIAL_COST_CHART,
	'damage-types': DAMAGE_TYPE_CHART,
	'regional-cost': REGIONAL_COST_CHART,
}
