import { useMemo } from 'react'

interface DailyData {
	date: string
	users: number
	sessions: number
	pageViews: number
	avgSessionDuration: number
}

interface CalendarHeatmapProps {
	data: DailyData[]
}

const WEEKDAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일']
const WEEKDAY_HEADER_COLORS = [
	'text-sand-600', 'text-sand-600', 'text-sand-600', 'text-sand-600', 'text-sand-600',
	'text-blue-500', 'text-red-400',
]

interface HeatmapCell {
	date: string
	dayOfWeek: number
	dayLabel: string
	users: number
	pageViews: number
	sessions: number
	avgSessionDuration: number
}

interface WeekRow {
	weekLabel: string
	cells: (HeatmapCell | null)[]
}

function parseDate(dateStr: string): Date {
	if (dateStr.length === 8) {
		const y = parseInt(dateStr.slice(0, 4))
		const m = parseInt(dateStr.slice(4, 6)) - 1
		const d = parseInt(dateStr.slice(6, 8))
		return new Date(y, m, d)
	}
	return new Date(dateStr)
}

function formatDateStr(dateStr: string): string {
	if (dateStr.length === 8) {
		return `${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
	}
	return dateStr.slice(5)
}

function cellBg(users: number, max: number): string {
	if (users === 0) return 'bg-sand-100'
	const r = users / (max || 1)
	if (r >= 0.7) return 'bg-forest-700'
	if (r >= 0.5) return 'bg-forest-600'
	if (r >= 0.3) return 'bg-forest-400'
	return 'bg-forest-200'
}

function mainTextCls(users: number, max: number): string {
	if (users === 0) return 'text-sand-400'
	const r = users / (max || 1)
	if (r >= 0.3) return 'text-white'
	return 'text-forest-900'
}

function subTextCls(users: number, max: number): string {
	if (users === 0) return 'text-sand-400'
	const r = users / (max || 1)
	if (r >= 0.5) return 'text-forest-200'
	if (r >= 0.3) return 'text-forest-100'
	return 'text-forest-800'
}

function fmtDuration(sec: number): string {
	if (!sec || sec === 0) return '0:00'
	const m = Math.floor(sec / 60)
	const s = Math.round(sec % 60)
	return `${m}:${String(s).padStart(2, '0')}`
}

export default function CalendarHeatmap({ data }: CalendarHeatmapProps) {
	const { weeks, maxUsers, dayAverages } = useMemo(() => {
		if (data.length === 0) return { weeks: [], maxUsers: 0, dayAverages: [] }

		const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
		const dayBuckets: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
		const weekMap = new Map<string, (HeatmapCell | null)[]>()

		sorted.forEach((d) => {
			const date = parseDate(d.date)
			const jsDay = date.getDay()
			const dayIdx = jsDay === 0 ? 6 : jsDay - 1

			const startOfYear = new Date(date.getFullYear(), 0, 1)
			const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
			let weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)
			if (jsDay === 0) weekNum = Math.max(1, weekNum - 1)

			const dateShort = formatDateStr(d.date)
			const cell: HeatmapCell = {
				date: d.date,
				dayOfWeek: dayIdx,
				dayLabel: `${dateShort} (${WEEKDAY_HEADERS[dayIdx]})`,
				users: d.users,
				pageViews: d.pageViews,
				sessions: d.sessions,
				avgSessionDuration: d.avgSessionDuration || 0,
			}

			const wKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
			if (!weekMap.has(wKey)) {
				weekMap.set(wKey, Array(7).fill(null))
			}
			weekMap.get(wKey)![dayIdx] = cell

			if (d.users > 0) dayBuckets[dayIdx].push(d.users)
		})

		const weekRows: WeekRow[] = Array.from(weekMap.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([, cells]) => {
				const firstCell = cells.find(c => c !== null)
				const label = firstCell ? formatDateStr(firstCell.date) : ''
				return { weekLabel: label, cells }
			})

		const avgByDay = WEEKDAY_HEADERS.map((_, idx) => {
			const vals = dayBuckets[idx]
			if (vals.length === 0) return 0
			return vals.reduce((a, b) => a + b, 0) / vals.length
		})

		const allUsers = sorted.map(d => d.users).filter(v => v > 0)
		const mx = allUsers.length > 0 ? Math.max(...allUsers) : 0

		return { weeks: weekRows, maxUsers: mx, dayAverages: avgByDay }
	}, [data])

	if (data.length === 0) return null

	return (
		<div className="bg-white rounded-2xl border border-sand-300 p-4 lg:p-5 space-y-3 lg:space-y-4">
			{/* Header */}
			<div>
				<h3 className="text-base font-semibold text-sand-900">일별 활동 히트맵</h3>
				<p className="text-sm text-sand-600">방문자 · 페이지뷰 · 체류시간</p>
			</div>

			{/* Heatmap grid */}
			<div className="overflow-x-auto">
				{/* Day headers */}
				<div
					className="grid gap-[2px] lg:gap-[5px] mb-[2px] lg:mb-[5px]"
					style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}
				>
					<div />
					{WEEKDAY_HEADERS.map((day, idx) => (
						<div
							key={day}
							className={`text-center text-[9px] lg:text-xs font-semibold py-0.5 ${WEEKDAY_HEADER_COLORS[idx]}`}
						>
							{day}
						</div>
					))}
				</div>

				{/* Week rows */}
				{weeks.map((week, wIdx) => (
					<div
						key={`week-${wIdx}`}
						className="grid gap-[2px] lg:gap-[5px] mb-[2px] lg:mb-[5px]"
						style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}
					>
						<div className="flex items-center justify-end pr-1 text-[9px] lg:text-xs text-sand-700 font-medium">
							{week.weekLabel}
						</div>
						{week.cells.map((cell, dIdx) => {
							if (!cell) {
								return (
									<div
										key={`empty-${wIdx}-${dIdx}`}
										className="rounded-md bg-sand-50 flex items-center justify-center h-7 lg:h-[92px]"
									>
										<span className="text-[7px] lg:text-[9px] text-sand-300">-</span>
									</div>
								)
							}

							if (cell.users === 0) {
								const hasPV = cell.pageViews > 0
								return (
									<div
										key={`zero-${wIdx}-${dIdx}`}
										className={`rounded-md ${hasPV ? 'bg-sand-200' : 'bg-sand-100'} flex flex-col items-center justify-center h-7 lg:h-[92px] group relative`}
									>
										<span className={`font-bold ${hasPV ? 'text-[9px] lg:text-lg text-sand-500' : 'text-[8px] lg:text-sm text-sand-400'}`}>0</span>
										{hasPV && (
											<div className="hidden lg:flex flex-col items-center mt-0.5 text-sand-500" style={{ fontSize: '11px', lineHeight: 1.45 }}>
												<span>PV {cell.pageViews.toLocaleString()}</span>
												<span>{fmtDuration(cell.avgSessionDuration)}</span>
											</div>
										)}
										{/* Tooltip */}
										<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-sand-900 text-white px-2.5 py-2 rounded-lg text-[11px] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-lg">
											<div className="font-semibold">{cell.dayLabel}</div>
											<div className="mt-1 space-y-0.5 text-sand-300">
												<div>방문자: {cell.users}명</div>
												<div>페이지뷰: {cell.pageViews.toLocaleString()}</div>
												<div>세션: {cell.sessions}</div>
												<div>체류시간: {fmtDuration(cell.avgSessionDuration)}</div>
											</div>
											<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sand-900" />
										</div>
									</div>
								)
							}

							const bg = cellBg(cell.users, maxUsers)
							const mainCls = mainTextCls(cell.users, maxUsers)
							const subCls = subTextCls(cell.users, maxUsers)

							return (
								<div
									key={`cell-${wIdx}-${dIdx}`}
									className={`rounded-md ${bg} cursor-pointer transition-all duration-150 hover:scale-105 hover:z-10 hover:shadow-md relative group h-7 lg:h-[92px] flex flex-col items-center justify-center`}
								>
									{/* Mobile: users only */}
									<span className={`lg:hidden font-bold text-[9px] ${mainCls}`}>
										{cell.users}
									</span>

									{/* Desktop: users (large) + PV + duration */}
									<div className="hidden lg:flex flex-col items-center justify-center w-full leading-none">
										<span className={`font-extrabold ${mainCls}`} style={{ fontSize: '24px', lineHeight: 1 }}>
											{cell.users}
										</span>
										<div className={`flex flex-col items-center mt-1 ${subCls}`} style={{ fontSize: '11px', lineHeight: 1.45 }}>
											<span>PV {cell.pageViews.toLocaleString()}</span>
											<span>{fmtDuration(cell.avgSessionDuration)}</span>
										</div>
									</div>

									{/* Tooltip */}
									<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-sand-900 text-white px-2.5 py-2 rounded-lg text-[11px] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-lg">
										<div className="font-semibold">{cell.dayLabel}</div>
										<div className="mt-1 space-y-0.5 text-sand-300">
											<div>방문자: {cell.users}명</div>
											<div>페이지뷰: {cell.pageViews.toLocaleString()}</div>
											<div>세션: {cell.sessions}</div>
											<div>체류시간: {fmtDuration(cell.avgSessionDuration)}</div>
										</div>
										<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sand-900" />
									</div>
								</div>
							)
						})}
					</div>
				))}
			</div>

			{/* Legend */}
			<div className="flex items-center justify-between flex-wrap gap-2">
				<div className="flex items-center gap-1.5">
					<span className="text-[10px] text-sand-500">적음</span>
					<div className="flex gap-0.5">
						{['bg-forest-200', 'bg-forest-400', 'bg-forest-600', 'bg-forest-700'].map((c, i) => (
							<div key={i} className={`w-4 lg:w-5 h-2.5 lg:h-3 ${c} rounded`} />
						))}
					</div>
					<span className="text-[10px] text-sand-500">많음</span>
				</div>
				<div className="text-[10px] text-sand-500">방문자 수 기준</div>
			</div>

			{/* Day averages */}
			<div className="grid grid-cols-7 gap-0.5 lg:gap-1.5">
				{dayAverages.map((avg, idx) => {
					if (avg === 0) return (
						<div key={idx} className="text-center bg-sand-50 rounded py-1 lg:py-1.5 border border-sand-200">
							<div className="text-[8px] lg:text-[10px] text-sand-500">{WEEKDAY_HEADERS[idx]}</div>
							<div className="text-[10px] lg:text-sm font-bold text-sand-400">-</div>
						</div>
					)

					const isHigh = avg >= Math.max(...dayAverages) * 0.8
					const colorStyle = isHigh
						? { text: 'text-forest-700', bg: 'bg-forest-50', border: 'border-forest-200' }
						: { text: 'text-sand-700', bg: 'bg-sand-50', border: 'border-sand-200' }

					return (
						<div key={idx} className={`text-center ${colorStyle.bg} rounded py-1 lg:py-1.5 border ${colorStyle.border}`}>
							<div className="text-[8px] lg:text-[10px] text-sand-500">{WEEKDAY_HEADERS[idx]}</div>
							<div className={`text-[10px] lg:text-sm font-bold ${colorStyle.text}`}>
								{avg.toFixed(1)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
