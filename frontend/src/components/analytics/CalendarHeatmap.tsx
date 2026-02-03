import { useState, useMemo } from 'react'

interface DailyData {
	date: string
	users: number
	sessions: number
	pageViews: number
}

interface CalendarHeatmapProps {
	data: DailyData[]
}

type MetricKey = 'pageViews' | 'users' | 'sessions'

const METRIC_OPTIONS: Array<{ key: MetricKey; label: string }> = [
	{ key: 'pageViews', label: '페이지뷰' },
	{ key: 'users', label: '사용자' },
	{ key: 'sessions', label: '세션' },
]

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function parseDate(dateStr: string): Date {
	if (dateStr.length === 8) {
		const y = parseInt(dateStr.slice(0, 4))
		const m = parseInt(dateStr.slice(4, 6)) - 1
		const d = parseInt(dateStr.slice(6, 8))
		return new Date(y, m, d)
	}
	return new Date(dateStr)
}

function formatDateLabel(d: Date): string {
	return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}

function getColorIntensity(value: number, max: number): string {
	if (max === 0 || value === 0) return '#F5F0E8'
	const ratio = value / max
	if (ratio < 0.25) return '#C8E6C9'
	if (ratio < 0.5) return '#81C784'
	if (ratio < 0.75) return '#4A6741'
	return '#2E4628'
}

export default function CalendarHeatmap({ data }: CalendarHeatmapProps) {
	const [metric, setMetric] = useState<MetricKey>('pageViews')
	const [hoveredCell, setHoveredCell] = useState<{ date: string; value: number; x: number; y: number } | null>(null)

	const { weeks, maxValue, monthLabels } = useMemo(() => {
		if (data.length === 0) return { weeks: [], maxValue: 0, monthLabels: [] }

		const dataMap = new Map<string, DailyData>()
		for (const d of data) {
			dataMap.set(d.date, d)
		}

		const dates = data.map(d => parseDate(d.date)).sort((a, b) => a.getTime() - b.getTime())
		const startDate = new Date(dates[0])
		const endDate = new Date(dates[dates.length - 1])

		// 시작일의 주 첫날(일요일)로 맞춤
		const calStart = new Date(startDate)
		calStart.setDate(calStart.getDate() - calStart.getDay())

		const weeks: Array<Array<{ date: Date; value: number; dateStr: string } | null>> = []
		const months: Array<{ label: string; weekIndex: number }> = []
		let currentWeek: Array<{ date: Date; value: number; dateStr: string } | null> = []
		let lastMonth = -1

		const cursor = new Date(calStart)
		let weekIndex = 0

		while (cursor <= endDate || currentWeek.length > 0) {
			if (cursor > endDate && currentWeek.length < 7) {
				// 마지막 주 채우기
				while (currentWeek.length < 7) currentWeek.push(null)
				weeks.push(currentWeek)
				break
			}

			const dateStr = `${cursor.getFullYear()}${String(cursor.getMonth() + 1).padStart(2, '0')}${String(cursor.getDate()).padStart(2, '0')}`
			const isInRange = cursor >= startDate && cursor <= endDate
			const dayData = dataMap.get(dateStr)
			const value = isInRange ? (dayData ? dayData[metric] : 0) : -1

			if (cursor.getMonth() !== lastMonth && isInRange) {
				months.push({ label: `${cursor.getMonth() + 1}월`, weekIndex })
				lastMonth = cursor.getMonth()
			}

			currentWeek.push(value >= 0 ? { date: new Date(cursor), value, dateStr } : null)

			if (currentWeek.length === 7) {
				weeks.push(currentWeek)
				currentWeek = []
				weekIndex++
			}

			cursor.setDate(cursor.getDate() + 1)
		}

		let maxVal = 0
		for (const d of data) {
			if (d[metric] > maxVal) maxVal = d[metric]
		}

		return { weeks, maxValue: maxVal, monthLabels: months }
	}, [data, metric])

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-base font-semibold text-sand-900">일별 활동 히트맵</h3>
					<p className="text-sm text-sand-700">날짜별 방문 현황</p>
				</div>
				<div className="flex gap-1 bg-sand-100 rounded-lg p-0.5">
					{METRIC_OPTIONS.map(opt => (
						<button
							key={opt.key}
							onClick={() => setMetric(opt.key)}
							className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
								metric === opt.key
									? 'bg-white text-forest-700 shadow-sm'
									: 'text-sand-600 hover:text-sand-800'
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			<div className="overflow-x-auto relative">
				{/* Month labels */}
				<div className="flex ml-8 mb-1">
					{monthLabels.map((m, i) => (
						<div
							key={i}
							className="text-xs text-sand-600"
							style={{ position: 'absolute', left: `${m.weekIndex * 16 + 32}px` }}
						>
							{m.label}
						</div>
					))}
				</div>

				<div className="flex gap-[2px] mt-5">
					{/* Weekday labels */}
					<div className="flex flex-col gap-[2px] mr-1 pt-0">
						{WEEKDAY_LABELS.map((label, i) => (
							<div key={i} className="h-[14px] flex items-center">
								{i % 2 === 1 && (
									<span className="text-[10px] text-sand-500 w-5 text-right">{label}</span>
								)}
							</div>
						))}
					</div>

					{/* Heatmap cells */}
					{weeks.map((week, wi) => (
						<div key={wi} className="flex flex-col gap-[2px]">
							{week.map((cell, di) => (
								<div
									key={di}
									className="w-[14px] h-[14px] rounded-[3px] transition-colors cursor-pointer"
									style={{
										backgroundColor: cell ? getColorIntensity(cell.value, maxValue) : 'transparent',
									}}
									onMouseEnter={e => {
										if (cell) {
											const rect = e.currentTarget.getBoundingClientRect()
											setHoveredCell({
												date: formatDateLabel(cell.date),
												value: cell.value,
												x: rect.left,
												y: rect.top - 40,
											})
										}
									}}
									onMouseLeave={() => setHoveredCell(null)}
								/>
							))}
						</div>
					))}
				</div>

				{/* Tooltip */}
				{hoveredCell && (
					<div
						className="fixed z-50 bg-sand-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none"
						style={{ left: hoveredCell.x, top: hoveredCell.y }}
					>
						{hoveredCell.date}: <span className="font-semibold">{hoveredCell.value.toLocaleString()}</span>
					</div>
				)}
			</div>

			{/* Legend */}
			<div className="flex items-center gap-2 mt-3 justify-end">
				<span className="text-[10px] text-sand-600">적음</span>
				{['#F5F0E8', '#C8E6C9', '#81C784', '#4A6741', '#2E4628'].map(color => (
					<div key={color} className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: color }} />
				))}
				<span className="text-[10px] text-sand-600">많음</span>
			</div>
		</div>
	)
}
