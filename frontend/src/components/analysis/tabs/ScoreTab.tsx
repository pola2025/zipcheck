import { useState, useEffect } from 'react'
import { CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Analysis, AnalysisItem, ScoreBreakdown } from '../../../types/analysis'
import { calculateScore, getScoreGrade } from '../../../lib/scoring'
import { calculateAdjustmentFactors, getDeviationBracket } from '../../../lib/adjustments'
import ScoreGauge from '../ScoreGauge'
import DeviationBadge from '../DeviationBadge'

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
	onComplete: (totalScore: number, breakdown: ScoreBreakdown) => Promise<Analysis | null>
	completing: boolean
}

// 카테고리별 바 색상 (점수 기준)
function barColor(score: number): string {
	if (score >= 75) return 'bg-gradient-to-r from-forest-400 to-forest-600'
	if (score >= 55) return 'bg-gradient-to-r from-amber-400 to-amber-500'
	return 'bg-gradient-to-r from-red-400 to-red-500'
}

// 편차 배지 색상 (간략 버전)
function deviationBadgeStyle(dev: number): string {
	if (dev < -15) return 'bg-green-50 text-green-600'
	if (dev <= 10) return 'bg-blue-50 text-blue-600'
	if (dev <= 25) return 'bg-amber-50 text-amber-600'
	return 'bg-red-50 text-red-600'
}

function deviationBadgeLabel(dev: number): string {
	if (dev < -15) return '양호'
	if (dev <= 10) return '적정'
	if (dev <= 25) return '약간높음'
	return '높음'
}

const FACTOR_LABELS: { key: keyof ReturnType<typeof calculateAdjustmentFactors>; label: string; desc: (v: number, a: Analysis) => string }[] = [
	{ key: 'area', label: '면적', desc: (_, a) => a.property_size_sqm ? `${Math.round(a.property_size_sqm / 3.3058)}평 기준` : '—' },
	{ key: 'region', label: '지역', desc: (_, a) => a.region || '—' },
	{ key: 'year', label: '연도', desc: (v) => v > 1 ? `+${Math.round((v - 1) * 100 / 4)}년` : '기준년도' },
	{ key: 'grade', label: '등급', desc: () => '중급' },
	{ key: 'season', label: '계절', desc: (v, a) => {
		if (!a.construction_start_month) return '—'
		return v > 1.03 ? `${a.construction_start_month}월 성수기` : v < 0.97 ? `${a.construction_start_month}월 비수기` : `${a.construction_start_month}월`
	}},
	{ key: 'exclusive', label: '전속', desc: (v) => v > 1 ? '전속업체' : '비전속' },
]

const GRADE_SYSTEM = [
	{ label: 'A', range: '85+', desc: '매우 적정', bg: 'bg-green-50 border-green-200', color: 'text-green-600' },
	{ label: 'B', range: '75~84', desc: '대체로 합리적', bg: 'bg-blue-50 border-blue-200', color: 'text-blue-600' },
	{ label: 'C', range: '60~74', desc: '일부 검토 필요', bg: 'bg-amber-50 border-amber-200', color: 'text-amber-600' },
	{ label: 'D', range: '45~59', desc: '상당 부분 검토', bg: 'bg-orange-50 border-orange-200', color: 'text-orange-600' },
	{ label: 'F', range: '0~44', desc: '재검토 권장', bg: 'bg-red-50 border-red-200', color: 'text-red-600' },
]

const DEVIATION_LEGEND = [
	{ label: '양호', range: '편차 < -15%', desc: '시장가 대비 저렴', bg: 'border-green-200 bg-green-50/50', badge: 'bg-green-50 text-green-700 border-green-200' },
	{ label: '적정', range: '-15% ~ +10%', desc: '합리적 가격대', bg: 'border-blue-200 bg-blue-50/50', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
	{ label: '약간높음', range: '+10% ~ +25%', desc: '검토 권장', bg: 'border-amber-200 bg-amber-50/50', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
	{ label: '높음', range: '편차 > +25%', desc: '재검토 필요', bg: 'border-red-200 bg-red-50/50', badge: 'bg-red-50 text-red-700 border-red-200' },
]

// 카테고리별 배지 색상
const CATEGORY_BADGE: Record<string, string> = {
	'욕실': 'bg-blue-50 text-blue-700',
	'바닥': 'bg-emerald-50 text-emerald-700',
	'주방': 'bg-teal-50 text-teal-700',
	'목공': 'bg-amber-50 text-amber-700',
	'전기': 'bg-orange-50 text-orange-700',
	'도배': 'bg-violet-50 text-violet-700',
	'철거': 'bg-rose-50 text-rose-700',
	'가구': 'bg-cyan-50 text-cyan-700',
	'창호': 'bg-indigo-50 text-indigo-700',
	'페인트': 'bg-lime-50 text-lime-700',
	'기타': 'bg-sand-100 text-sand-700',
}

export default function ScoreTab({ analysis, items, onComplete, completing }: Props) {
	const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null)

	useEffect(() => {
		const result = calculateScore(analysis, items)
		setBreakdown(result)
	}, [analysis, items])

	if (!breakdown) return null

	const grade = getScoreGrade(breakdown.final_score)
	const factors = calculateAdjustmentFactors({
		propertySizeSqm: analysis.property_size_sqm,
		region: analysis.region,
		quoteDate: analysis.quote_date,
		constructionStartMonth: analysis.construction_start_month,
	})
	const totalFactor = Object.values(factors).reduce((a, b) => a * (b || 1), 1)

	// 벤치마크가 있는 항목만 필터
	const benchmarkedItems = items.filter(i => i.benchmark_unit_price != null && i.deviation_percent != null)

	const handleComplete = async () => {
		if (!confirm('분석을 완료하시겠습니까? 완료 후 점수가 저장됩니다.')) return
		await onComplete(breakdown.final_score, breakdown)
	}

	return (
		<div className="space-y-6">

			{/* ====== 1. 점수 게이지 + 요약 ====== */}
			<div className="bg-white rounded-2xl border border-sand-300 p-8">
				<ScoreGauge score={breakdown.final_score} />
				<div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
					<div className="bg-sand-50 rounded-xl px-4 py-2 border border-sand-200">
						<div className="text-xs text-sand-500">가중 합산</div>
						<div className="text-lg font-bold text-sand-900">{breakdown.weighted_sum.toFixed(1)}</div>
					</div>
					<div className="bg-green-50 rounded-xl px-4 py-2 border border-green-200">
						<div className="text-xs text-green-600">보너스</div>
						<div className="text-lg font-bold text-green-700">
							+{breakdown.bonuses.reduce((s, b) => s + b.points, 0)}
						</div>
					</div>
					<div className="bg-red-50 rounded-xl px-4 py-2 border border-red-200">
						<div className="text-xs text-red-600">패널티</div>
						<div className="text-lg font-bold text-red-700">
							{breakdown.penalties.reduce((s, p) => s + p.points, 0)}
						</div>
					</div>
				</div>
			</div>

			{/* ====== 2. 카테고리별 점수 ====== */}
			<div className="bg-white rounded-2xl border border-sand-300 p-6">
				<h3 className="text-lg font-semibold text-sand-900 mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
					카테고리별 점수
				</h3>
				<div className="space-y-3">
					{breakdown.categories
						.sort((a, b) => b.weight - a.weight)
						.map((cat) => (
						<div key={cat.category} className="flex items-center gap-4">
							<div className="w-16 text-sm font-semibold text-sand-800">{cat.category}</div>
							<div className="flex-1 bg-sand-100 rounded-full h-6 overflow-hidden relative">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${cat.score}%` }}
									transition={{ duration: 0.8 }}
									className={`h-full rounded-full ${barColor(cat.score)}`}
								/>
								<span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
									{cat.score}점
								</span>
							</div>
							<div className="w-24 text-right">
								<span className="text-xs text-sand-500">가중치</span>
								<span className="text-sm font-bold text-sand-800 ml-1">{Math.round(cat.weight * 100)}%</span>
							</div>
							<div className="w-28 text-right">
								<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${deviationBadgeStyle(cat.avg_deviation)}`}>
									{deviationBadgeLabel(cat.avg_deviation)} {cat.avg_deviation > 0 ? '+' : ''}{cat.avg_deviation.toFixed(1)}%
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* ====== 3. 보너스 / 패널티 ====== */}
			<div className="grid md:grid-cols-2 gap-6">
				{/* 보너스 */}
				<div className="bg-white rounded-2xl border border-sand-300 p-6">
					<h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
						<TrendingUp className="w-5 h-5" />
						보너스
					</h3>
					{breakdown.bonuses.length === 0 ? (
						<p className="text-sm text-green-600">보너스 없음</p>
					) : (
						<div className="space-y-3">
							{breakdown.bonuses.map((b, i) => (
								<div key={i} className="bg-green-50 rounded-xl p-4 border border-green-100">
									<div className="flex justify-between items-start">
										<div>
											<div className="text-sm font-semibold text-green-800">{b.label}</div>
											{b.reason && <div className="text-xs text-green-600 mt-1">{b.reason}</div>}
										</div>
										<span className="text-lg font-bold text-green-700">+{b.points}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* 패널티 */}
				<div className="bg-white rounded-2xl border border-sand-300 p-6">
					<h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
						<TrendingDown className="w-5 h-5" />
						패널티
					</h3>
					{breakdown.penalties.length === 0 ? (
						<p className="text-sm text-red-600">패널티 없음</p>
					) : (
						<div className="space-y-3">
							{breakdown.penalties.map((p, i) => (
								<div key={i} className="bg-red-50 rounded-xl p-4 border border-red-100">
									<div className="flex justify-between items-start">
										<div>
											<div className="text-sm font-semibold text-red-800">{p.label}</div>
											{p.reason && <div className="text-xs text-red-600 mt-1">{p.reason}</div>}
										</div>
										<span className="text-lg font-bold text-red-700">{p.points}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* ====== 4. 벤치마크 비교 테이블 ====== */}
			{benchmarkedItems.length > 0 && (
				<div className="bg-white rounded-2xl border border-sand-300 p-6">
					<h3 className="text-lg font-semibold text-sand-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
						벤치마크 비교
					</h3>
					<p className="text-sm text-sand-600 mb-5">각 항목별 시장 단가 대비 편차율</p>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-sand-50 border-b border-sand-300">
									<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">카테고리</th>
									<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">항목명</th>
									<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">견적 단가</th>
									<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">벤치마크</th>
									<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">보정 후</th>
									<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">편차</th>
									<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">판정</th>
								</tr>
							</thead>
							<tbody>
								{benchmarkedItems.map((item) => {
									const bracket = item.deviation_bracket || getDeviationBracket(item.deviation_percent!)
									return (
										<tr key={item.id} className="border-b border-sand-100 hover:bg-sand-50 transition-colors">
											<td className="py-3 px-4">
												<span className={`px-2 py-0.5 rounded text-xs font-semibold ${CATEGORY_BADGE[item.std_category || ''] || 'bg-sand-100 text-sand-700'}`}>
													{item.std_category || '—'}
												</span>
											</td>
											<td className="py-3 px-4 font-semibold text-sand-900">
												{item.std_item || item.original_item_name || '—'}
											</td>
											<td className="py-3 px-4 text-right font-bold text-sand-900">
												{(item.original_unit_price || 0).toLocaleString()}
											</td>
											<td className="py-3 px-4 text-right text-sand-600">
												{(item.benchmark_unit_price || 0).toLocaleString()}
											</td>
											<td className="py-3 px-4 text-right text-sand-700">
												{item.adjusted_benchmark_price != null
													? item.adjusted_benchmark_price.toLocaleString()
													: '—'}
											</td>
											<td className="py-3 px-4 text-center">
												<DeviationBadge bracket={bracket} deviationPercent={item.deviation_percent} />
											</td>
											<td className="py-3 px-4 text-center">
												<DeviationBadge bracket={bracket} />
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ====== 5. 적용 보정계수 ====== */}
			<div className="bg-white rounded-2xl border border-sand-300 p-6">
				<h3 className="text-lg font-semibold text-sand-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
					적용 보정계수
				</h3>
				<div className="grid grid-cols-3 md:grid-cols-6 gap-3">
					{FACTOR_LABELS.map(({ key, label, desc }) => {
						const val = factors[key] as number
						return (
							<div key={key} className="bg-sand-50 rounded-xl p-3 text-center border border-sand-200">
								<div className="text-xs text-sand-500 mb-1">{label}</div>
								<div className={`text-lg font-bold ${val !== 1.0 ? 'text-forest-700' : 'text-sand-900'}`}>
									{val.toFixed(2)}
								</div>
								<div className="text-[10px] text-sand-400">{desc(val, analysis)}</div>
							</div>
						)
					})}
				</div>
				<p className="text-xs text-sand-500 mt-3">
					종합 보정계수 = 면적 × 지역 × 연도 × 등급 × 계절 × 전속 ={' '}
					<strong className="text-sand-800">{totalFactor.toFixed(2)}</strong>
					{' '}(벤치마크 단가에 곱하여 보정 후 단가 산출)
				</p>
			</div>

			{/* ====== 6. 편차 판정 기준 범례 ====== */}
			<div className="bg-white rounded-2xl border border-sand-300 p-6">
				<h3 className="text-lg font-semibold text-sand-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
					편차 판정 기준
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{DEVIATION_LEGEND.map((d) => (
						<div key={d.label} className={`rounded-xl border-2 p-4 text-center ${d.bg}`}>
							<span className={`px-3 py-1.5 rounded-full text-sm font-bold border inline-block mb-2 ${d.badge}`}>
								{d.label}
							</span>
							<div className="text-xs text-sand-600">{d.range}</div>
							<div className="text-xs font-semibold mt-1" style={{ color: 'inherit' }}>{d.desc}</div>
						</div>
					))}
				</div>
			</div>

			{/* ====== 7. 점수 등급 체계 ====== */}
			<div className="bg-white rounded-2xl border border-sand-300 p-6">
				<h3 className="text-lg font-semibold text-sand-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
					점수 등급 체계
				</h3>
				<div className="grid grid-cols-5 gap-3">
					{GRADE_SYSTEM.map((g) => (
						<div key={g.label} className={`rounded-xl p-4 text-center border ${g.bg}`}>
							<div className={`text-3xl font-bold ${g.color}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
								{g.label}
							</div>
							<div className="text-sm font-semibold text-sand-800 mt-1">{g.range}</div>
							<div className="text-xs text-sand-600 mt-1">{g.desc}</div>
						</div>
					))}
				</div>
			</div>

			{/* ====== 완료 버튼 ====== */}
			{analysis.status !== 'completed' && (
				<div className="flex justify-center pt-4">
					<button
						onClick={handleComplete}
						disabled={completing}
						className={`px-8 py-3 rounded-xl text-base font-semibold transition-all flex items-center gap-2 ${
							completing
								? 'bg-sand-100 text-sand-600 cursor-not-allowed'
								: 'bg-forest-600 hover:bg-forest-700 text-white shadow-md hover:shadow-lg'
						}`}
					>
						<CheckCircle className="w-5 h-5" />
						{completing ? '처리 중...' : '분석 완료'}
					</button>
				</div>
			)}

			{analysis.status === 'completed' && (
				<div className="flex items-center justify-center gap-2 py-4 text-green-600">
					<CheckCircle className="w-5 h-5" />
					<span className="text-sm font-semibold">분석이 완료되었습니다</span>
				</div>
			)}
		</div>
	)
}
