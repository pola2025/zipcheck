import { useRef, useState } from 'react'
import {
	Download, AlertTriangle, CheckCircle, XCircle,
	Shield, Info, Package, Database,
	Copy
} from 'lucide-react'
import ScoreGauge, { GRADE_BG } from './ScoreGauge'
import { getScoreGrade } from '../../lib/scoring'
import { exportToPdf } from '../../lib/pdf-export'

// ─── Interfaces ───────────────────────────────

interface CategoryScore {
	category: string
	weight: number
	avg_deviation: number
	item_count: number
	score: number
}

interface ScoreModifier {
	type: string
	label: string
	points: number
	reason?: string
}

interface ScoreBreakdown {
	categories: CategoryScore[]
	bonuses: ScoreModifier[]
	penalties: ScoreModifier[]
	weighted_sum: number
	final_score: number
}

interface AdjustmentFactors {
	area?: number
	region?: number
	year?: number
	grade?: number
	season?: number
	exclusive?: number
}

interface AnalyzedItem {
	original_category: string | null
	original_item_name: string | null
	original_unit_price: number | null
	original_total_price: number | null
	original_quantity: number | null
	original_unit: string | null
	std_category: string | null
	std_item: string | null
	benchmark_unit_price: number | null
	adjusted_benchmark_price: number | null
	deviation_percent: number | null
	deviation_bracket: string | null
	is_bundled: boolean
	confidence: number
}

interface Props {
	scoreBreakdown: ScoreBreakdown
	adjustmentFactors?: AdjustmentFactors
	items?: AnalyzedItem[]
	customerName?: string
	propertyInfo?: string
	region?: string
	propertySizePyeong?: number
	benchmarkCount?: number
	propertyType?: string
	isVatIncluded?: boolean | null
	completeness?: 'full' | 'partial' | 'minimal'
}

// ─── Utility functions ───────────────────────────────

function deviationBadgeStyle(dev: number): string {
	if (dev < -25) return 'bg-purple-50 text-purple-700 border-purple-200'
	if (dev < -15) return 'bg-orange-50 text-orange-600 border-orange-200'
	if (dev < -5) return 'bg-green-50 text-green-600 border-green-200'
	if (dev <= 10) return 'bg-blue-50 text-blue-700 border-blue-200'
	if (dev <= 25) return 'bg-amber-50 text-amber-700 border-amber-200'
	return 'bg-red-50 text-red-700 border-red-200'
}

function deviationBadgeLabel(dev: number): string {
	if (dev < -25) return '덤핑 위험'
	if (dev < -15) return '과소 주의'
	if (dev < -5) return '양호'
	if (dev <= 10) return '적정'
	if (dev <= 25) return '약간높음'
	return '높음'
}

function barColorByDev(dev: number): string {
	if (dev < -5) return 'bg-gradient-to-r from-green-400 to-green-500'
	if (dev <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-500'
	if (dev <= 25) return 'bg-gradient-to-r from-amber-400 to-amber-500'
	return 'bg-gradient-to-r from-red-400 to-red-500'
}

function categoryBorderByDev(dev: number): string {
	if (dev < -5) return 'border-green-200 bg-green-50/30'
	if (dev <= 10) return 'border-sand-200'
	if (dev <= 25) return 'border-amber-200 bg-amber-50/30'
	return 'border-red-200 bg-red-50/30'
}

function formatWon(n: number): string {
	if (Math.abs(n) >= 10000) {
		return `${(n / 10000).toFixed(0)}만원`
	}
	return `${n.toLocaleString()}원`
}

function formatManWon(n: number): string {
	return `${Math.round(n / 10000).toLocaleString()}만원`
}

// ─── Constants ───────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
	'욕실': 'bg-blue-50 text-blue-700',
	'바닥': 'bg-emerald-50 text-emerald-700',
	'주방': 'bg-teal-50 text-teal-700',
	'목공': 'bg-amber-50 text-amber-700',
	'전기': 'bg-orange-50 text-orange-700',
	'도배': 'bg-violet-50 text-violet-700',
	'철거': 'bg-gray-100 text-gray-700',
	'가구': 'bg-red-50 text-red-700',
	'창호': 'bg-indigo-50 text-indigo-700',
	'페인트': 'bg-green-50 text-green-700',
	'기타': 'bg-sand-100 text-sand-700',
}

const CATEGORY_COLORS: Record<string, string> = {
	'바닥': '#60A5FA', '욕실': '#3B82F6', '가구': '#EF4444',
	'목공': '#F59E0B', '전기': '#F97316', '도배': '#8B5CF6',
	'철거': '#6B7280', '페인트': '#10B981', '창호': '#06B6D4',
	'주방': '#22C55E', '기타': '#D1D5DB',
}

const REQUIRED_CATEGORIES_MAP: Record<string, string[]> = {
	'전체 리모델링': ['철거', '바닥', '욕실', '주방', '전기', '도배', '페인트'],
	'욕실 공사': ['욕실'],
	'주방 공사': ['주방'],
}

const PAYMENT_STEPS = [
	{ label: '계약금', pct: 0.10, timing: '계약서 서명 시 지급', color: 'bg-forest-500', lightBg: 'bg-forest-50', border: 'border-forest-200', badgeBg: 'bg-forest-100 text-forest-700', note: '자재 브랜드·등급이 계약서에 명시되었는지 확인' },
	{ label: '1차 중도금', pct: 0.30, timing: '철거 + 배관/전기 공사 완료 시', color: 'bg-forest-400', lightBg: 'bg-forest-50/60', border: 'border-forest-200', badgeBg: 'bg-forest-100 text-forest-700', note: '배관 상태 사진 확인 후 지급' },
	{ label: '2차 중도금', pct: 0.30, timing: '타일/방수 + 목공 완료 시', color: 'bg-blue-400', lightBg: 'bg-blue-50', border: 'border-blue-200', badgeBg: 'bg-blue-100 text-blue-700', note: '방수 테스트(48시간 담수) 결과 확인 후 지급' },
	{ label: '잔금 (1차)', pct: 0.20, timing: '도배/페인트 + 가구 설치 완료 시', color: 'bg-amber-400', lightBg: 'bg-amber-50', border: 'border-amber-200', badgeBg: 'bg-amber-100 text-amber-700', note: '전체 마감 상태 점검 후 지급' },
	{ label: '잔금 (최종)', pct: 0.10, timing: '입주 후 7일 뒤 지급', color: 'bg-sand-400', lightBg: 'bg-sand-50', border: 'border-sand-200', badgeBg: 'bg-sand-200 text-sand-700', note: '하자 항목 체크리스트 작성 → 보수 완료 확인 → 최종 결제' },
]

const HIDDEN_COSTS = [
	{ name: '엘리베이터 보양 및 사용료', range: '10~30만원', desc: '아파트 관리사무소에 납부하는 공사용 엘리베이터 사용 보증금' },
	{ name: '입주 청소', range: '50~70만원', desc: '전문 입주청소 비용 (평당 1.5~2만원)' },
	{ name: '바닥 수평 미장 추가', range: '30~80만원', desc: '철거 후 바닥 수평 불량이 발견되면 미장 보수가 필요합니다' },
	{ name: '관리사무소 공사 신고비', range: '5~15만원', desc: '공사 신고서 접수, 동의서 징구 대행 비용' },
	{ name: '배관 노후 교체', range: '50~150만원', desc: '철거 후 급수/배수 배관 상태가 불량하면 교체가 필요합니다' },
	{ name: '현장 변경 추가금', range: '변동', desc: '시공 중 디자인·자재 변경 시 추가 발생 (사전 합의 필수)' },
]

// ─── Component ───────────────────────────────

export default function AnalysisResultView({
	scoreBreakdown,
	adjustmentFactors,
	items,
	customerName,
	propertyInfo,
	region,
	propertySizePyeong,
	benchmarkCount,
	propertyType,
	isVatIncluded,
	completeness,
}: Props) {
	const printRef = useRef<HTMLDivElement>(null)
	const [exporting, setExporting] = useState(false)
	const [copiedScript, setCopiedScript] = useState(false)
	const [simChecks, setSimChecks] = useState<Record<string, boolean>>({})

	const handleExportPdf = async () => {
		if (!printRef.current) return
		setExporting(true)
		try {
			await exportToPdf(printRef.current, `zipcheck-분석결과-${customerName || 'report'}`)
		} catch (err) {
			console.error('PDF export failed:', err)
			alert('PDF 내보내기 실패')
		} finally {
			setExporting(false)
		}
	}

	const handleCopyScript = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopiedScript(true)
		setTimeout(() => setCopiedScript(false), 2000)
	}

	// ─── Data derivation ───────────────────────────────

	const score = scoreBreakdown.final_score
	const grade = getScoreGrade(score)
	const totalItems = items?.length || 0
	const benchmarkedItems = items?.filter(i => i.benchmark_unit_price != null && i.deviation_percent != null) || []
	const benchmarkCoverage = totalItems > 0 ? benchmarkedItems.length / totalItems : 0
	const totalFactor = adjustmentFactors
		? Object.values(adjustmentFactors).reduce((a, b) => a * (b || 1), 1)
		: 1

	// 총액
	const totalQuoteAmount = items?.reduce((sum, item) => {
		const itemTotal = item.original_total_price
			|| ((item.original_unit_price || 0) * (item.original_quantity || 0))
		return sum + (itemTotal || 0)
	}, 0) || 0

	// 카테고리별 집계
	const categoryAgg = new Map<string, { total: number; benchmark: number; count: number; deviation: number }>()
	items?.forEach(item => {
		const cat = item.std_category || item.original_category || '기타'
		const itemTotal = item.original_total_price || ((item.original_unit_price || 0) * (item.original_quantity || 0))
		const fairTotal = (item.adjusted_benchmark_price != null && item.original_quantity)
			? item.adjusted_benchmark_price * item.original_quantity
			: 0
		const existing = categoryAgg.get(cat) || { total: 0, benchmark: 0, count: 0, deviation: 0 }
		existing.total += itemTotal || 0
		existing.benchmark += fairTotal
		existing.count += 1
		categoryAgg.set(cat, existing)
	})
	categoryAgg.forEach((val) => {
		val.deviation = val.benchmark > 0 ? ((val.total - val.benchmark) / val.benchmark) * 100 : 0
	})
	const categoryList = Array.from(categoryAgg.entries())
		.map(([name, data]) => ({
			name,
			...data,
			pct: totalQuoteAmount > 0 ? (data.total / totalQuoteAmount) * 100 : 0,
		}))
		.sort((a, b) => b.total - a.total)

	// 적정가 비교 데이터
	// 단위 불일치 항목 (벤치마크 있지만 단가 비교 불가)
	const unitMismatchItems = (items || []).filter(i => i.unit_mismatch && i.benchmark_unit_price != null)

	const comparisonItems = (items || [])
		.filter(i => i.adjusted_benchmark_price != null && i.deviation_percent != null && !i.unit_mismatch)
		.map(item => {
			const quoteTotal = item.original_total_price
				|| ((item.original_unit_price || 0) * (item.original_quantity || 0))
			const fairTotal = item.adjusted_benchmark_price != null && item.original_quantity
				? item.adjusted_benchmark_price * item.original_quantity
				: null
			const diff = quoteTotal && fairTotal ? quoteTotal - fairTotal : null
			return { ...item, quoteTotal: quoteTotal || 0, fairTotal: fairTotal || 0, diff: diff || 0 }
		})

	const totalFairAmount = comparisonItems.reduce((s, i) => s + i.fairTotal, 0)
	const savingsItems = comparisonItems.filter(i => i.diff > 0).sort((a, b) => b.diff - a.diff)
	const totalSavings = savingsItems.reduce((s, i) => s + i.diff, 0)

	const marketDeviation = totalFairAmount > 0
		? ((totalQuoteAmount - totalFairAmount) / totalFairAmount) * 100
		: 0

	// 주요 발견
	const warningTypes = ['under_quantity', 'over_quantity', 'dump_risk', 'site_confirm']
	const positiveFindings = scoreBreakdown.bonuses
	const negativeFindings = scoreBreakdown.penalties.filter(p => !warningTypes.includes(p.type))

	const licenseUnverified = scoreBreakdown.penalties.some(
		p => p.type === 'license_unverified' || p.type === 'license_unverified_high_risk'
	)

	// 누락 항목
	const presentCategories = new Set(items?.map(i => i.std_category).filter(Boolean) || [])
	const requiredCats = REQUIRED_CATEGORIES_MAP[propertyType || ''] || []
	const missingCats = requiredCats.filter(c => !presentCategories.has(c))

	// 일식 항목
	const bundledItems = items?.filter(i => i.is_bundled) || []

	// 리스크
	const dumpRiskItems = items?.filter(i => i.deviation_bracket === 'dump_risk') || []
	const underQuantityPenalties = scoreBreakdown.penalties.filter(p => p.type === 'under_quantity')
	const hasRisks = dumpRiskItems.length > 0 || underQuantityPenalties.length > 0 || licenseUnverified

	// 비정상 가격 항목 (편차 > +80% 이상 고가 또는 < -40% 이상 저가)
	const abnormalItems = comparisonItems.filter(i => {
		const dev = i.deviation_percent || 0
		return dev > 80 || dev < -40
	})

	// 협상 스크립트
	const topSavings = savingsItems.slice(0, 3)
	const negotiationLines = topSavings.map(item =>
		`"${item.std_category || item.original_category} - ${item.std_item || item.original_item_name}" 항목의 시장 적정가는 ${item.fairTotal.toLocaleString()}원입니다. 현재 견적은 ${item.quoteTotal.toLocaleString()}원으로 ${formatWon(item.diff)} 높습니다. 조정이 가능한지 확인 부탁드립니다.`
	)
	const fullScript = totalSavings > 0
		? [...negotiationLines, `\n전체적으로 시장 적정가 대비 약 ${formatWon(totalSavings)} 정도 높은 편입니다. 항목별로 조정해주시면 계약을 진행하고 싶습니다.`].join('\n\n')
		: ''

	// 도넛 차트 데이터
	let cumulativePct = 0
	const donutSegments = categoryList.map(cat => {
		const start = cumulativePct
		cumulativePct += cat.pct
		return { ...cat, start, end: cumulativePct, color: CATEGORY_COLORS[cat.name] || '#D1D5DB' }
	})
	const conicGradient = donutSegments
		.map(s => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`)
		.join(',')

	// 비용 시뮬레이션 계산
	const simTotal = (() => {
		let total = totalQuoteAmount
		Object.entries(simChecks).forEach(([key, checked]) => {
			if (!checked) return
			if (key === 'savings') total -= totalSavings
			else {
				const cost = parseInt(key)
				if (!isNaN(cost)) total += cost
			}
		})
		return total
	})()

	return (
		<div className="space-y-5 sm:space-y-6">
			{/* PDF Download button */}
			<div className="flex justify-end">
				<button
					onClick={handleExportPdf}
					disabled={exporting}
					className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
						exporting
							? 'bg-sand-100 text-sand-500 cursor-not-allowed'
							: 'bg-forest-600 hover:bg-forest-700 text-white shadow-md hover:shadow-lg'
					}`}
				>
					<Download className="w-4 h-4" />
					{exporting ? 'PDF 생성 중...' : 'PDF 다운로드'}
				</button>
			</div>

			{/* Printable area */}
			<div ref={printRef} className="space-y-5 sm:space-y-6">

				{/* ═══════════════════════════════════════════════════════
				    1. 종합 점수 + 총액 (설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				<div className="bg-white rounded-2xl border border-sand-300 p-5 sm:p-8">
					<div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
						{/* Score Gauge — SVG only */}
						<div className="flex-shrink-0">
							<ScoreGauge score={score} />
						</div>

						{/* Info — 설계서 매칭: score number + grade badges + description + stats */}
						<div className="flex-1 text-center md:text-left w-full">
							<div className="flex items-center gap-3 justify-center md:justify-start mb-2">
								<span className="font-outfit text-3xl sm:text-4xl font-bold text-sand-900">{score}</span>
								<span className={`px-3 py-1 rounded-full text-sm font-bold border ${GRADE_BG[grade.label] || ''}`}>
									{grade.label}
								</span>
								{marketDeviation <= 0 && (
									<span className="px-3 py-1 rounded-full text-sm font-bold bg-forest-50 text-forest-700 border border-forest-200">
										시장가 이하
									</span>
								)}
							</div>
							<p className="text-sand-600 text-sm sm:text-base">{grade.description}</p>
							{customerName && (
								<p className="text-xs text-sand-700 mt-1 truncate">
									{customerName}{propertyInfo ? ` | ${propertyInfo}` : ''}
								</p>
							)}

							{/* Stats: 2x2 on mobile, inline on desktop — 설계서 매칭 */}
							<div className="mt-4 grid grid-cols-2 md:flex gap-3 justify-center md:justify-start">
								<div className="bg-sand-50 rounded-xl px-4 py-2.5 border border-sand-200 text-center md:text-left">
									<div className="text-[11px] sm:text-xs text-sand-700">총 견적액</div>
									<div className="text-lg sm:text-xl font-bold text-sand-900">
										{formatManWon(totalQuoteAmount)}
									</div>
								</div>
								<div className="bg-sand-50 rounded-xl px-4 py-2.5 border border-sand-200 text-center md:text-left">
									<div className="text-[11px] sm:text-xs text-sand-700">시장 평균가</div>
									<div className="text-lg sm:text-xl font-bold text-sand-700">
										{totalFairAmount > 0 ? formatManWon(totalFairAmount) : '—'}
									</div>
								</div>
								<div className={`rounded-xl px-4 py-2.5 border text-center md:text-left ${
									marketDeviation <= 0
										? 'bg-green-50 border-green-200'
										: marketDeviation <= 15
											? 'bg-amber-50 border-amber-200'
											: 'bg-red-50 border-red-200'
								}`}>
									<div className={`text-[11px] sm:text-xs ${
										marketDeviation <= 0 ? 'text-green-600' : marketDeviation <= 15 ? 'text-amber-600' : 'text-red-600'
									}`}>시장가 대비</div>
									<div className={`text-lg sm:text-xl font-bold ${
										marketDeviation <= 0 ? 'text-green-700' : marketDeviation <= 15 ? 'text-amber-700' : 'text-red-700'
									}`}>
										{marketDeviation > 0 ? '+' : ''}{marketDeviation.toFixed(1)}%
									</div>
								</div>
								<div className="bg-sand-50 rounded-xl px-4 py-2.5 border border-sand-200 text-center md:text-left">
									<div className="text-[11px] sm:text-xs text-sand-700">항목 수</div>
									<div className="text-lg sm:text-xl font-bold text-sand-900">{totalItems}건</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* ═══════════════════════════════════════════════════════
				    2. 요약: 긍정/주의/미포함/절감 + 추가비용 (설계서 매칭 2x2 그리드)
				    ═══════════════════════════════════════════════════════ */}
				{(positiveFindings.length > 0 || negativeFindings.length > 0 || savingsItems.length > 0 || missingCats.length > 0) && (
					<div className="grid md:grid-cols-2 gap-4">
						{/* 긍정 */}
						{positiveFindings.length > 0 && (
							<div className="bg-white rounded-2xl border border-green-200 p-5">
								<h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
									<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									긍정적 ({positiveFindings.length}건)
								</h3>
								<ul className="space-y-2.5">
									{positiveFindings.map((b, i) => (
										<li key={i} className="text-sm text-sand-700 flex items-center gap-2 break-keep">
											<span className="text-green-500 shrink-0">+</span>
											{b.label}
											{b.reason && <span className="shrink-0 ml-auto px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-700 whitespace-nowrap">{b.reason}</span>}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* 주의 */}
						{negativeFindings.length > 0 && (
							<div className="bg-white rounded-2xl border border-red-200 p-5">
								<h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
									<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
									주의 ({negativeFindings.length}건)
								</h3>
								<ul className="space-y-2.5">
									{negativeFindings.map((p, i) => (
										<li key={i} className="text-sm text-sand-700 flex items-center gap-2 break-keep">
											<span className="text-red-500 shrink-0">!</span>
											{p.label}
											{p.reason && <span className="shrink-0 ml-auto px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">{p.reason}</span>}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* 미포함 — 설계서 매칭 (누락 카테고리) */}
						{missingCats.length > 0 && (
							<div className="bg-white rounded-2xl border border-amber-200 p-5">
								<h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
									<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									미포함 ({missingCats.length}건)
								</h3>
								<ul className="space-y-2.5">
									{missingCats.map((cat, i) => (
										<li key={i} className="text-sm text-sand-700 flex items-center gap-2 break-keep">
											<span className="text-amber-500 shrink-0">~</span>
											{cat}
											<span className="shrink-0 ml-auto px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-700 whitespace-nowrap">미포함</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* 절감 가능 — 설계서 매칭 */}
						{savingsItems.length > 0 && (
							<div className="bg-white rounded-2xl border border-forest-200 p-5">
								<h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
									<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									절감 가능 ({savingsItems.length}건)
									<span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold bg-forest-100 text-forest-700 whitespace-nowrap">
										-{formatManWon(totalSavings)}
									</span>
								</h3>
								<ul className="space-y-2.5">
									{savingsItems.slice(0, 5).map((item, i) => (
										<li key={i} className="text-sm text-sand-700 flex items-center gap-2 break-keep">
											<span className="text-forest-500 shrink-0">↓</span>
											{item.std_category}: {item.std_item || item.original_item_name}
											<span className="shrink-0 ml-auto px-2 py-0.5 rounded-md text-xs font-bold bg-forest-100 text-forest-700 whitespace-nowrap">
												-{formatWon(item.diff)}
											</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* 추가 정보 (VAT/완전성/면허/벤치마크) — 전체 너비 — 설계서 매칭 */}
						<div className="md:col-span-2 bg-white rounded-2xl border border-sand-200 p-5">
							<div className="flex flex-wrap items-center gap-4 sm:gap-6">
								{/* VAT */}
								<div className="flex items-center gap-2">
									<Info className="w-4 h-4 text-sand-700 shrink-0" />
									<span className="text-sm text-sand-600">VAT:</span>
									{isVatIncluded === true && (
										<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">포함</span>
									)}
									{isVatIncluded === false && (
										<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
											별도 (+{formatManWon(totalQuoteAmount * 0.1)})
										</span>
									)}
									{isVatIncluded == null && (
										<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">미확인</span>
									)}
								</div>
								{/* 완전성 */}
								<div className="flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-sand-700 shrink-0" />
									<span className="text-sm text-sand-600">완전성:</span>
									{completeness === 'full' && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">완전</span>}
									{completeness === 'partial' && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">부분</span>}
									{completeness === 'minimal' && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">최소</span>}
									{!completeness && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sand-100 text-sand-600 border border-sand-200">미평가</span>}
								</div>
								{/* 면허 */}
								<div className="flex items-center gap-2">
									<Shield className="w-4 h-4 text-sand-700 shrink-0" />
									<span className="text-sm text-sand-600">면허:</span>
									{licenseUnverified ? (
										<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">미확인</span>
									) : (
										<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">확인 완료</span>
									)}
								</div>
								{/* 벤치마크 커버리지 */}
								{totalItems > 0 && (
									<div className="flex items-center gap-2">
										<Database className="w-4 h-4 text-sand-700 shrink-0" />
										<span className="text-sm text-sand-600">벤치마크:</span>
										<span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
											benchmarkCoverage >= 0.7
												? 'bg-green-50 text-green-700 border-green-200'
												: benchmarkCoverage >= 0.5
													? 'bg-amber-50 text-amber-700 border-amber-200'
													: 'bg-red-50 text-red-700 border-red-200'
										}`}>
											{benchmarkedItems.length}/{totalItems} ({Math.round(benchmarkCoverage * 100)}%)
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    3. 카테고리별 분석 (설계서 매칭 — 바 차트)
				    ═══════════════════════════════════════════════════════ */}
				{categoryList.length > 0 && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-4 sm:mb-5">
							카테고리별 분석 ({categoryList.length}개)
						</h3>
						<div className="space-y-3">
							{/* 주요 카테고리 (상위 7개) — 설계서 매칭 */}
							{categoryList.slice(0, 7).map(cat => (
								<div key={cat.name} className={`rounded-xl border p-3 sm:p-4 transition-colors ${categoryBorderByDev(cat.deviation)}`}>
									<div className="flex items-center justify-between gap-2 mb-2">
										<div className="flex items-center gap-2 min-w-0">
											<span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${CATEGORY_BADGE[cat.name] || 'bg-sand-100 text-sand-700'}`}>
												{cat.name}
											</span>
											<span className="text-sm font-semibold text-sand-800 break-keep">
												{cat.count}개 항목 | {formatManWon(cat.total)}
											</span>
										</div>
										<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
											<span className="text-xs text-sand-700 hidden sm:inline">
												시장 평균 {cat.benchmark > 0 ? formatManWon(cat.benchmark) : '—'}
											</span>
											<span className={`px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${deviationBadgeStyle(cat.deviation)}`}>
												{deviationBadgeLabel(cat.deviation)}
											</span>
											<span className={`text-sm font-bold ${cat.deviation > 25 ? 'text-red-700' : 'text-sand-800'}`}>
												{cat.pct.toFixed(1)}%
											</span>
										</div>
									</div>
									<div className="sm:hidden text-xs text-sand-700 mb-1.5">
										시장 평균 {cat.benchmark > 0 ? formatManWon(cat.benchmark) : '—'}
									</div>
									<div className="w-full bg-sand-100 rounded-full h-2.5 mb-2">
										<div
											className={`h-full rounded-full ${barColorByDev(cat.deviation)}`}
											style={{ width: `${Math.min(cat.pct * 2, 100)}%` }}
										/>
									</div>
								</div>
							))}

							{/* 나머지 (축약 — 3열 그리드) — 설계서 매칭 */}
							{categoryList.length > 7 && (
								<div className="grid grid-cols-3 gap-2 sm:gap-3">
									{categoryList.slice(7).map(cat => (
										<div key={cat.name} className={`rounded-xl border p-2.5 sm:p-3 text-center ${categoryBorderByDev(cat.deviation)}`}>
											<span className="text-xs font-bold text-sand-600">{cat.name}</span>
											<div className="text-sm font-bold text-sand-900 mt-1">{formatManWon(cat.total)}</div>
											<span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${deviationBadgeStyle(cat.deviation)}`}>
												{deviationBadgeLabel(cat.deviation)} {cat.pct.toFixed(1)}%
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    4. 적정가 비교표 (설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				{comparisonItems.length > 0 && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
							<h3 className="font-outfit text-lg font-semibold text-sand-900 flex items-center gap-2">
								<svg className="w-5 h-5 text-forest-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
								항목별 적정가 비교
							</h3>
							<div className="flex items-center gap-2">
								{totalSavings > 0 && (
									<span className="px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-700 border border-forest-200">
										절감 가능: {formatManWon(totalSavings)}
									</span>
								)}
								{totalSavings > 30000 && (
									<span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
										리포트 비용의 약 {Math.round(totalSavings / 30000)}배
									</span>
								)}
							</div>
						</div>
						<div className="overflow-x-auto -mx-4 sm:mx-0">
							<table className="w-full text-sm min-w-[600px]">
								<thead>
									<tr className="border-b-2 border-sand-200">
										<th className="text-left py-2.5 px-3 text-xs font-semibold text-sand-600 uppercase tracking-wider">카테고리</th>
										<th className="text-left py-2.5 px-3 text-xs font-semibold text-sand-600 uppercase tracking-wider">주요 항목</th>
										<th className="text-right py-2.5 px-3 text-xs font-semibold text-sand-600 uppercase tracking-wider">현재 견적가</th>
										<th className="text-right py-2.5 px-3 text-xs font-semibold text-sand-600 uppercase tracking-wider">벤치마크 적정가</th>
										<th className="text-right py-2.5 px-3 text-xs font-semibold text-sand-600 uppercase tracking-wider">차이</th>
										<th className="text-center py-2.5 px-3 text-xs font-semibold text-sand-600 uppercase tracking-wider">판정</th>
									</tr>
								</thead>
								<tbody>
									{comparisonItems.map((item, idx) => {
										const dev = item.deviation_percent || 0
										const isHigh = dev > 25
										const isWarn = dev > 10 && dev <= 25
										const isGood = dev < -5
										const isAbnormal = dev > 80 || dev < -40
										return (
											<>
												<tr key={idx} className={`border-b ${isAbnormal ? 'border-b-0' : ''} border-sand-100 transition-colors ${
													isAbnormal ? 'bg-purple-50/40' : isHigh ? 'bg-red-50/30' : isWarn ? 'bg-amber-50/20' : isGood ? 'bg-green-50/20' : 'hover:bg-sand-50'
												}`}>
													<td className="py-3 px-3">
														<div className="flex items-center gap-1">
															<span className={`px-2 py-0.5 rounded text-xs font-bold ${CATEGORY_BADGE[item.std_category || ''] || 'bg-sand-100 text-sand-700'}`}>
																{item.std_category || '—'}
															</span>
															{isAbnormal && <span className="text-purple-600 text-xs">⚠</span>}
														</div>
													</td>
													<td className="py-3 px-3 text-sand-800">
														{item.std_item || item.original_item_name || '—'}
													</td>
													<td className={`py-3 px-3 text-right font-semibold ${isAbnormal ? 'text-purple-700' : isHigh ? 'text-red-700' : 'text-sand-800'}`}>
														{formatManWon(item.quoteTotal)}
													</td>
													<td className="py-3 px-3 text-right text-sand-700">
														{formatManWon(item.fairTotal)}
													</td>
													<td className={`py-3 px-3 text-right font-semibold ${
														isAbnormal ? 'text-purple-600' : dev > 10 ? 'text-red-600' : dev > 0 ? 'text-amber-600' : 'text-green-600'
													}`}>
														{dev > 0 ? '+' : ''}{dev.toFixed(1)}%
													</td>
													<td className="py-3 px-3 text-center">
														<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
															isAbnormal
																? 'bg-purple-100 text-purple-700 border border-purple-300'
																: deviationBadgeStyle(dev)
														}`}>
															{isAbnormal ? (dev > 0 ? '확인필요↑' : '확인필요↓') : deviationBadgeLabel(dev)}
														</span>
													</td>
												</tr>
												{isAbnormal && (
													<tr key={`${idx}-note`} className="border-b border-sand-100 bg-purple-50/30">
														<td colSpan={6} className="px-4 py-2">
															<p className="text-xs text-purple-700 break-keep">
																{dev > 0
																	? `💡 시장 평균 대비 ${dev.toFixed(0)}% 높은 금액입니다. 프리미엄 자재·특수 시공 등 차별화 요소가 포함되었을 수 있습니다. 업체에 해당 항목의 상세 사양을 확인해주세요.`
																	: `💡 시장 평균 대비 ${Math.abs(dev).toFixed(0)}% 낮은 금액입니다. 자재 등급 하향·일부 공정 미포함 등의 가능성이 있습니다. 업체에 포함 범위를 확인해주세요.`
																}
															</p>
														</td>
													</tr>
												)}
											</>
										)
									})}
								</tbody>
								<tfoot>
									<tr className="border-t-2 border-sand-300 bg-sand-50">
										<td className="py-3 px-3 font-bold text-sand-900" colSpan={2}>합계</td>
										<td className="py-3 px-3 text-right font-bold text-sand-900">{formatManWon(totalQuoteAmount)}</td>
										<td className="py-3 px-3 text-right font-bold text-sand-700">{formatManWon(totalFairAmount)}</td>
										<td className={`py-3 px-3 text-right font-bold ${marketDeviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
											{marketDeviation > 0 ? '+' : ''}{marketDeviation.toFixed(1)}%
										</td>
										<td className="py-3 px-3 text-center">
											<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${deviationBadgeStyle(marketDeviation)}`}>
												{deviationBadgeLabel(marketDeviation)}
											</span>
										</td>
									</tr>
								</tfoot>
							</table>
						</div>

						{/* 단위 불일치 항목 안내 */}
						{unitMismatchItems.length > 0 && (
							<div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
								<div className="flex items-start gap-3">
									<Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-bold text-amber-800 mb-1">
											면적·수량 확인 필요 {unitMismatchItems.length}건
										</p>
										<p className="text-sm text-amber-700 break-keep mb-3">
											아래 항목은 견적서에 합산 금액으로 기재되어 있어 면적 기반 단가와 직접 비교가 어렵습니다.
											정확한 면적·수량을 확인하면 적정가 비교가 가능합니다.
										</p>
										<div className="space-y-2">
											{unitMismatchItems.map((item, i) => {
												const total = item.original_total_price || 0
												return (
													<div key={i} className="text-xs text-amber-800 bg-amber-100/50 rounded-lg p-2.5">
														<div className="flex items-center justify-between gap-2 mb-1">
															<span className="font-bold">{item.std_category || item.original_category} — {item.std_item || item.original_item_name}</span>
															<span className="font-bold">{formatManWon(total)}</span>
														</div>
														<span className="text-amber-600">
															기준 단가: {item.benchmark_unit_price?.toLocaleString()}원/{item.benchmark_unit || '㎡'}
															{item.benchmark_unit_price && total > 0 && (
																<> · 역산 면적: 약 {(total / item.benchmark_unit_price).toFixed(1)}{item.benchmark_unit || '㎡'}</>
															)}
														</span>
													</div>
												)
											})}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 비정상 가격 확인 요청 */}
						{abnormalItems.length > 0 && (
							<div className="mt-4 rounded-xl bg-purple-50 border border-purple-200 p-4">
								<div className="flex items-start gap-3">
									<AlertTriangle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-bold text-purple-800 mb-1">
											가격 확인이 필요한 항목 {abnormalItems.length}건
										</p>
										<p className="text-sm text-purple-700 break-keep mb-3">
											아래 항목은 시장 평균과 큰 차이가 있어 별도의 사유가 있을 수 있습니다.
											인테리어 업체와 협의된 특이사항(프리미엄 자재, 특수 시공, 공정 범위 등)이 있는지 확인해주세요.
										</p>
										<ul className="space-y-1.5">
											{abnormalItems.map((item, i) => {
												const dev = item.deviation_percent || 0
												return (
													<li key={i} className="text-xs text-purple-800 flex items-start gap-2">
														<span className="shrink-0 mt-0.5">{dev > 0 ? '🔺' : '🔻'}</span>
														<span>
															<strong>{item.std_category || item.original_category}</strong> — {item.std_item || item.original_item_name}:
															견적 {formatManWon(item.quoteTotal)} / 적정가 {formatManWon(item.fairTotal)}
															<span className="font-bold"> ({dev > 0 ? '+' : ''}{dev.toFixed(0)}%)</span>
														</span>
													</li>
												)
											})}
										</ul>
										<p className="text-xs text-purple-600 mt-3 italic break-keep">
											※ 확인된 사유가 있다면 관리자에게 알려주시면 분석 결과에 반영합니다.
										</p>
									</div>
								</div>
							</div>
						)}

						{/* ROI callout — 설계서 매칭 */}
						{totalSavings > 0 && (
							<div className="mt-4 rounded-xl bg-forest-50 border border-forest-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
								<div className="flex items-center gap-2 shrink-0">
									<svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
									<span className="text-sm font-bold text-forest-800">ROI</span>
								</div>
								<p className="text-sm text-sand-700 break-keep">
									이 리포트의 권장 절감 항목만 적용해도 <strong className="text-forest-700">{formatManWon(totalSavings)} 절감 가능</strong>합니다.
								</p>
							</div>
						)}
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    5. 비용 구조 (도넛 차트 — 설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				{categoryList.length > 0 && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-5 flex items-center gap-2">
							<svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
							비용 구조
						</h3>
						<div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
							<div className="relative w-44 h-44 md:w-56 md:h-56 shrink-0">
								<div
									className="w-full h-full rounded-full"
									style={{ background: `conic-gradient(${conicGradient})` }}
								/>
								<div className="absolute inset-[22%] bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
									<span className="font-outfit text-xl md:text-2xl font-bold text-sand-900">
										{Math.round(totalQuoteAmount / 10000).toLocaleString()}
									</span>
									<span className="text-[10px] md:text-xs text-sand-700">만원</span>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-x-5 sm:gap-x-8 gap-y-1.5 text-sm flex-1">
								{categoryList.map(cat => (
									<div key={cat.name} className="flex items-center gap-2">
										<span
											className="w-2.5 h-2.5 rounded-sm shrink-0"
											style={{ background: CATEGORY_COLORS[cat.name] || '#D1D5DB' }}
										/>
										<span className="text-sand-700">
											{cat.name} <strong>{cat.pct.toFixed(1)}%</strong>
										</span>
									</div>
								))}
							</div>
						</div>
						{categoryList.length >= 2 && (
							<p className="mt-4 text-sm text-sand-600 bg-sand-50 rounded-lg p-3 break-keep">
								{categoryList[0].name}({categoryList[0].pct.toFixed(1)}%)과 {categoryList[1].name}({categoryList[1].pct.toFixed(1)}%)이 전체의{' '}
								<strong>{(categoryList[0].pct + categoryList[1].pct).toFixed(1)}%</strong>를 차지하며 핵심 비용 구간입니다.
								{savingsItems.length > 0 && ` 주의 카테고리 합산 ${savingsItems.reduce((s, i) => {
									const cat = categoryList.find(c => c.name === i.std_category)
									return s + (cat ? cat.pct : 0)
								}, 0).toFixed(1)}%.`}
							</p>
						)}
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    6. 추천사항 (설계서 매칭 — 절감/경고 카드)
				    ═══════════════════════════════════════════════════════ */}
				{(savingsItems.length > 0 || missingCats.length > 0) && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-4">추천 사항</h3>
						<div className="space-y-3">
							{/* 절감 추천 */}
							{savingsItems.slice(0, 3).map((item, idx) => (
								<div key={idx} className="flex items-start gap-3 rounded-xl bg-forest-50 border border-forest-200 p-4">
									<div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center shrink-0 mt-0.5">
										<svg className="w-4 h-4 text-forest-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									</div>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
											<span className="text-sm font-semibold text-forest-800 break-keep">
												{item.std_category}: {item.std_item || item.original_item_name} 비용 절감
											</span>
											<span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-700 whitespace-nowrap">
												-{formatWon(item.diff)} 절감
											</span>
										</div>
										<p className="text-sm text-sand-700 mt-1 break-keep">
											시장 적정가({item.fairTotal.toLocaleString()}원) 대비 {formatWon(item.diff)} 높습니다. 대안 자재·업체 협상으로 절감 가능
										</p>
									</div>
								</div>
							))}
							{/* 경고 (미포함 항목) */}
							{missingCats.map((cat, idx) => (
								<div key={`warn-${idx}`} className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
									<div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
										<svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
									</div>
									<div className="min-w-0">
										<span className="text-sm font-semibold text-amber-800 break-keep">{cat} 항목 별도 확인 필요</span>
										<p className="text-sm text-sand-700 mt-1 break-keep">
											현재 견적에 {cat} 비용이 포함되어 있지 않습니다. 필요 시 추가 비용이 발생합니다.
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    7. 업체 협상 가이드 (다크 테마 — 설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				{topSavings.length > 0 && (
					<div className="bg-gradient-to-br from-sand-800 to-sand-900 rounded-2xl p-4 sm:p-6 text-white">
						<div className="flex items-center justify-between mb-2">
							<h3 className="font-outfit text-lg font-semibold flex items-center gap-2">
								<svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
								이대로 따라 하세요: 업체 협상 멘트
							</h3>
							<button
								onClick={() => handleCopyScript(fullScript)}
								className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
									copiedScript
										? 'bg-green-500/20 text-green-300 border border-green-400/30'
										: 'bg-white/10 hover:bg-white/20 text-sand-300 border border-white/20'
								}`}
							>
								<Copy className="w-3.5 h-3.5" />
								{copiedScript ? '복사 완료!' : '전체 복사'}
							</button>
						</div>
						<p className="text-sm text-sand-600 mb-5 break-keep">
							아래 멘트를 시공사에 그대로 전달하시면 됩니다. 자연스럽게 단가 재검토를 유도합니다.
						</p>
						<div className="space-y-4">
							{topSavings.map((item, idx) => (
								<div key={idx} className="rounded-xl bg-white/10 border border-white/20 p-4">
									<div className="flex items-center gap-2 mb-2">
										<span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-400/20 text-amber-300">
											{item.std_category || '—'}
										</span>
										<span className="text-sm font-semibold text-sand-200">
											{item.std_item || item.original_item_name} 단가 협상
										</span>
										<span className="text-xs font-bold text-forest-300 ml-auto whitespace-nowrap">
											{formatWon(item.diff)} 절감
										</span>
									</div>
									<p className="text-sm text-sand-300 break-keep italic leading-relaxed">
										"{item.std_category || item.original_category} - {item.std_item || item.original_item_name}" 항목이{' '}
										<strong className="text-white not-italic">
											시장 적정가({item.fairTotal.toLocaleString()}원) 대비 {formatWon(item.diff)} 높게
										</strong>{' '}
										책정되어 있더라고요. 혹시 이 부분 재검토가 가능할까요?
									</p>
								</div>
							))}
						</div>
						<div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-3">
							<p className="text-xs text-sand-600 break-keep">
								<strong className="text-sand-300">TIP:</strong>{' '}
								협상은 "깎아주세요"가 아니라{' '}
								<strong className="text-sand-200">"시장 데이터 기반으로 확인하고 싶다"</strong>는 톤으로 접근하면 시공사도 부담 없이 응합니다.
							</p>
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    8. 비용 시뮬레이션 (인터랙티브 — 설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				{(missingCats.length > 0 || totalSavings > 0) && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-2 flex items-center gap-2">
							<svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
							미포함 항목 포함 시 예상 총액
						</h3>
						<p className="text-sm text-sand-700 mb-5 break-keep">아래 항목을 체크하면 실제 예상 총 공사비를 확인할 수 있습니다.</p>
						<div className="space-y-3 mb-5">
							{missingCats.map((cat) => {
								const key = `missing-${cat}`
								const estimatedCost = 5000000 // 기본 500만원 추정
								return (
									<label key={key} className="flex items-center gap-3 rounded-xl border border-sand-200 p-3.5 cursor-pointer hover:bg-sand-50 transition-colors">
										<input
											type="checkbox"
											checked={simChecks[String(estimatedCost)] || false}
											onChange={(e) => setSimChecks(prev => ({ ...prev, [String(estimatedCost)]: e.target.checked }))}
											className="w-5 h-5 rounded accent-forest-600"
										/>
										<div className="flex-1 min-w-0">
											<span className="text-sm font-semibold text-sand-800 break-keep">{cat} 추가</span>
											<span className="text-xs text-sand-700 ml-2">+{formatManWon(estimatedCost)}</span>
										</div>
									</label>
								)
							})}
							{totalSavings > 0 && (
								<label className="flex items-center gap-3 rounded-xl border border-forest-200 bg-forest-50/50 p-3.5 cursor-pointer hover:bg-forest-50 transition-colors">
									<input
										type="checkbox"
										checked={simChecks['savings'] || false}
										onChange={(e) => setSimChecks(prev => ({ ...prev, savings: e.target.checked }))}
										className="w-5 h-5 rounded accent-forest-600"
									/>
									<div className="flex-1 min-w-0">
										<span className="text-sm font-semibold text-forest-800 break-keep">비용 최적화 적용</span>
										<span className="text-xs text-forest-600 ml-2">-{formatManWon(totalSavings)}</span>
									</div>
								</label>
							)}
						</div>
						<div className="rounded-xl bg-sand-900 text-white p-5 text-center">
							<div className="text-xs text-sand-600 mb-1">예상 총 공사비</div>
							<div className="font-outfit text-3xl sm:text-4xl font-bold">{formatManWon(simTotal)}</div>
							<div className="text-xs text-sand-600 mt-1">
								{simTotal === totalQuoteAmount
									? '현재 견적 기준'
									: simTotal > totalQuoteAmount
										? `현재 대비 +${formatManWon(simTotal - totalQuoteAmount)}`
										: `현재 대비 ${formatManWon(simTotal - totalQuoteAmount)}`
								}
							</div>
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    9. 공사 전 필수 체크리스트 (설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
					<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-2 flex items-center gap-2">
						<svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
						공사 전 필수 체크리스트
					</h3>
					<p className="text-sm text-sand-700 mb-5 break-keep">
						{formatManWon(totalQuoteAmount)} 규모 {propertySizePyeong ? `${Math.round(propertySizePyeong)}평` : ''} {propertyType || '인테리어'} 기준, 계약 전 반드시 확인해야 할 사항입니다.
					</p>
					<div className="grid md:grid-cols-2 gap-4">
						<div className="rounded-xl border border-sand-200 p-4">
							<h4 className="text-sm font-bold text-sand-900 mb-3 flex items-center gap-2">
								<span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">1</span>
								예상 공사 기간
							</h4>
							<div className="flex items-center gap-3 mb-2">
								<span className="font-outfit text-2xl font-bold text-sand-900">4~5주</span>
								<span className="text-xs text-sand-700">(약 28~35일)</span>
							</div>
							<p className="text-xs text-sand-600 break-keep">철거 3~4일 → 배관/전기 5~7일 → 타일/방수 7~10일 → 목공/도배 7~10일 → 마감/청소 3~5일</p>
						</div>
						<div className="rounded-xl border border-sand-200 p-4">
							<h4 className="text-sm font-bold text-sand-900 mb-3 flex items-center gap-2">
								<span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">2</span>
								계약서 필수 항목
							</h4>
							<ul className="space-y-1.5 text-xs text-sand-700">
								<li className="flex gap-2"><span className="text-forest-600 shrink-0">✓</span><span className="break-keep"><strong>하자보수 이행증권</strong> 발행 여부 확인</span></li>
								<li className="flex gap-2"><span className="text-forest-600 shrink-0">✓</span><span className="break-keep">공사 <strong>중간금/잔금 지급 조건</strong> 명시</span></li>
								<li className="flex gap-2"><span className="text-forest-600 shrink-0">✓</span><span className="break-keep">자재 브랜드·등급 <strong>계약서에 기재</strong></span></li>
								<li className="flex gap-2"><span className="text-forest-600 shrink-0">✓</span><span className="break-keep">추가 공사 발생 시 <strong>사전 서면 합의</strong> 조항</span></li>
							</ul>
						</div>
						<div className="rounded-xl border border-sand-200 p-4">
							<h4 className="text-sm font-bold text-sand-900 mb-3 flex items-center gap-2">
								<span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">3</span>
								표준 AS 기간 안내
							</h4>
							<ul className="space-y-1.5 text-xs text-sand-700">
								<li className="flex justify-between"><span className="break-keep">타일 들뜸·크랙</span><strong>2년</strong></li>
								<li className="flex justify-between"><span className="break-keep">방수 하자 (욕실·발코니)</span><strong>3년</strong></li>
								<li className="flex justify-between"><span className="break-keep">전기 배선·누전</span><strong>1년</strong></li>
								<li className="flex justify-between"><span className="break-keep">도배 벌어짐·곰팡이</span><strong>1년</strong></li>
								<li className="flex justify-between"><span className="break-keep">목공 뒤틀림·마감</span><strong>1년</strong></li>
							</ul>
						</div>
						<div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
							<h4 className="text-sm font-bold text-sand-900 mb-3 flex items-center gap-2">
								<span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">4</span>
								잔금 지급 팁
							</h4>
							<ul className="space-y-1.5 text-xs text-sand-700">
								<li className="flex gap-2 break-keep"><span className="text-amber-600 shrink-0">!</span><strong>잔금 10%는 입주 후 1주일 뒤</strong> 지급 (하자 확인 기간)</li>
								<li className="flex gap-2 break-keep"><span className="text-amber-600 shrink-0">!</span>최종 정산 시 <strong>시공 사진 전후 비교</strong> 요청</li>
								<li className="flex gap-2 break-keep"><span className="text-amber-600 shrink-0">!</span>계약서에 없는 추가 비용 요청 시 <strong>서면 근거</strong> 요구</li>
							</ul>
						</div>
					</div>
				</div>

				{/* ═══════════════════════════════════════════════════════
				    10. 안전 결제 스케줄 (설계서 매칭 — 프로그레스 바)
				    ═══════════════════════════════════════════════════════ */}
				{totalQuoteAmount > 0 && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-2 flex items-center gap-2">
							<svg className="w-5 h-5 text-forest-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
							안전 결제 스케줄
						</h3>
						<p className="text-sm text-sand-700 mb-5 break-keep">
							{formatManWon(totalQuoteAmount)} 기준 권장 지급 일정입니다. 각 단계별 시공 완료를 확인한 후 결제하세요.
						</p>

						{/* 프로그레스 바 — 설계서 매칭 */}
						<div className="relative mb-6">
							<div className="flex h-8 sm:h-10 rounded-full overflow-hidden border border-sand-200">
								{PAYMENT_STEPS.map((step, idx) => (
									<div
										key={idx}
										className={`${step.color} flex items-center justify-center`}
										style={{ width: `${step.pct * 100}%` }}
									>
										<span className="text-[9px] sm:text-xs font-bold text-white">
											{Math.round(step.pct * 100)}%
										</span>
									</div>
								))}
							</div>
						</div>

						{/* 단계별 설명 — 설계서 매칭 */}
						<div className="space-y-3">
							{PAYMENT_STEPS.map((step, idx) => {
								const amount = Math.round(totalQuoteAmount * step.pct)
								return (
									<div key={idx} className={`flex items-start gap-3 rounded-xl ${step.lightBg} border ${step.border} p-3.5`}>
										<div className={`w-7 h-7 rounded-full ${step.color} flex items-center justify-center shrink-0`}>
											<span className="text-xs font-bold text-white">{idx + 1}</span>
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-sm font-semibold text-sand-800">{step.label}</span>
												<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${step.badgeBg}`}>
													{formatManWon(amount)} ({Math.round(step.pct * 100)}%)
												</span>
											</div>
											<p className="text-xs text-sand-600 mt-1 break-keep">{step.timing}. {step.note}</p>
										</div>
									</div>
								)
							})}
						</div>

						<div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
							<p className="text-xs text-sand-700 break-keep">
								<strong className="text-amber-700">핵심 원칙:</strong>{' '}
								절대 공사 시작 전 전액 지급하지 마세요. 각 단계별 시공 완료 확인 → 사진 기록 → 결제 순서를 지키면 하자 분쟁을 예방할 수 있습니다.
							</p>
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    11. 숨은 비용 경고 (설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				<div className="bg-white rounded-2xl border border-red-200 p-4 sm:p-6">
					<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-2 flex items-center gap-2">
						<svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
						이런 추가 비용이 발생할 수 있어요
					</h3>
					<p className="text-sm text-sand-700 mb-4 break-keep">
						견적서에 포함되지 않지만 거의 모든 인테리어 공사에서 발생하는 비용입니다. 미리 알면 당황하지 않습니다.
					</p>
					<div className="grid sm:grid-cols-2 gap-3">
						{HIDDEN_COSTS.map((cost, idx) => (
							<div key={idx} className="rounded-lg bg-red-50/50 border border-red-100 p-3">
								<div className="flex items-center justify-between mb-1">
									<span className="text-sm font-semibold text-sand-800 break-keep">{cost.name}</span>
									<span className="text-xs font-bold text-red-600 whitespace-nowrap">{cost.range}</span>
								</div>
								<p className="text-xs text-sand-600 break-keep">{cost.desc}</p>
							</div>
						))}
					</div>
				</div>

				{/* ═══════════════════════════════════════════════════════
				    12. 누락 항목 감지 (기능 섹션)
				    ═══════════════════════════════════════════════════════ */}
				{propertyType && requiredCats.length > 0 && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-4 flex items-center gap-2">
							<CheckCircle className="w-5 h-5 text-sand-700" />
							누락 항목 감지
						</h3>
						<p className="text-sm text-sand-600 mb-4 break-keep">{propertyType} 기준 필수 카테고리 점검</p>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{requiredCats.map(cat => {
								const present = presentCategories.has(cat)
								return (
									<div key={cat} className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${
										present ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
									}`}>
										{present
											? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
											: <XCircle className="w-4 h-4 text-red-600 shrink-0" />
										}
										<span className={`text-sm font-semibold ${present ? 'text-green-700' : 'text-red-700'}`}>{cat}</span>
									</div>
								)
							})}
						</div>
						{missingCats.length > 0 && (
							<div className="mt-3 bg-red-50 rounded-xl px-4 py-3 border border-red-200 text-sm text-red-700">
								<strong>{missingCats.length}개</strong> 필수 카테고리 누락: {missingCats.join(', ')}
							</div>
						)}
						{missingCats.length === 0 && (
							<div className="mt-3 bg-green-50 rounded-xl px-4 py-3 border border-green-200 text-sm text-green-700 flex items-center gap-2">
								<CheckCircle className="w-4 h-4 text-green-600" />
								필수 카테고리가 모두 포함되어 있습니다
							</div>
						)}
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    13. 일식 분해 분석 (기능 섹션)
				    ═══════════════════════════════════════════════════════ */}
				{bundledItems.length > 0 && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-sand-900 mb-4 flex items-center gap-2">
							<Package className="w-5 h-5 text-sand-700" />
							일식 분해 분석
						</h3>
						<p className="text-sm text-sand-600 mb-4 break-keep">
							일식(묶음) 항목은 세부 내역 확인이 어렵습니다. ({bundledItems.length}건 감지)
						</p>
						<div className="space-y-2">
							{bundledItems.map((item, idx) => {
								const itemTotal = item.original_total_price || ((item.original_unit_price || 0) * (item.original_quantity || 0))
								const isHighValue = (itemTotal || 0) > 5_000_000
								return (
									<div key={idx} className={`rounded-xl p-4 border flex items-center justify-between ${
										isHighValue ? 'bg-orange-50 border-orange-200' : 'bg-sand-50 border-sand-200'
									}`}>
										<div className="flex items-center gap-3">
											<span className={`px-2 py-0.5 rounded text-xs font-semibold ${CATEGORY_BADGE[item.std_category || ''] || 'bg-sand-100 text-sand-700'}`}>
												{item.std_category || item.original_category || '—'}
											</span>
											<div>
												<span className="text-sm font-semibold text-sand-900">
													{item.std_item || item.original_item_name || '—'}
												</span>
												{isHighValue && <span className="ml-2 text-xs text-orange-600 font-semibold">고액 일식</span>}
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-bold text-sand-900">{(itemTotal || 0).toLocaleString()}원</div>
											<div className="text-xs text-amber-600 flex items-center gap-1 justify-end mt-0.5">
												<AlertTriangle className="w-3 h-3" />
												세부 내역 확인 필요
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    14. 리스크 알림 (기능 섹션)
				    ═══════════════════════════════════════════════════════ */}
				{hasRisks && (
					<div className="bg-white rounded-2xl border border-sand-300 p-4 sm:p-6">
						<h3 className="font-outfit text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
							<AlertTriangle className="w-5 h-5" />
							리스크 알림
						</h3>
						<div className="space-y-4">
							{dumpRiskItems.length > 0 && (
								<div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5">
									<h4 className="text-base font-bold text-purple-800 mb-2">덤핑 위험 감지 (시장가 대비 25%+ 저렴)</h4>
									<p className="text-sm text-purple-700 mb-2 break-keep">
										이 가격대에서는 <strong>공사중단, 저품질 시공, 추가비용 리스크</strong>가 높습니다.
									</p>
									<div className="space-y-1.5">
										{dumpRiskItems.map((item, idx) => (
											<div key={idx} className="bg-white rounded-lg px-3 py-2 border border-purple-200 text-sm">
												<span className="font-semibold text-purple-800">{item.std_category || item.original_category}</span>
												<span className="text-purple-600 ml-2">{item.std_item || item.original_item_name}</span>
												<span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
													{item.deviation_percent?.toFixed(1)}%
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{underQuantityPenalties.length > 0 && (
								<div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
									<h4 className="text-base font-bold text-orange-800 mb-2">과소산량 경고</h4>
									<p className="text-sm text-orange-700 mb-2 break-keep">
										일부 항목의 수량이 시공 면적 대비 <strong>15% 이상 부족</strong>합니다.
									</p>
									<div className="space-y-1">
										{underQuantityPenalties.map((p, idx) => (
											<div key={idx} className="text-sm text-orange-700">{p.reason}</div>
										))}
									</div>
								</div>
							)}

							{licenseUnverified && (
								<div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
									<div className="flex items-start gap-3">
										<Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
										<div>
											<h4 className="text-base font-bold text-amber-800 mb-2">시공업체 면허 미확인</h4>
											<p className="text-sm text-amber-700 break-keep">
												면허가 확인되지 않은 업체입니다. 전기/욕실/주방 공사는 면허 보유 업체에 의뢰하세요.
												<strong> 사업자등록증, 건설업 면허, 하자보증보험</strong>을 반드시 확인하세요.
											</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════
				    15. 데이터 출처 푸터 (설계서 매칭)
				    ═══════════════════════════════════════════════════════ */}
				<div className="border-t-2 border-sand-200 pt-5">
					<div className="text-center text-xs text-sand-700 space-y-1">
						<p>
							본 분석은{' '}
							{region && <>{region} </>}
							{propertySizePyeong && <>{propertySizePyeong.toFixed(0)}평 기준 </>}
							{benchmarkCount ? `${benchmarkCount}건의 검증된 계약 데이터` : '검증된 계약 데이터'}를 기반으로 산출되었습니다.
						</p>
						<p>
							벤치마크 적정가는 면적/지역/계절/등급 보정계수 적용 후 산출됩니다.
							{totalFactor !== 1 && ` (종합 보정계수: ${totalFactor.toFixed(2)})`}
						</p>
						<p className="text-sand-600">
							ZipCheck 견적 분석 시스템 v1.7 | zcheck.co.kr
						</p>
					</div>
				</div>

			</div>
		</div>
	)
}
