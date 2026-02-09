/**
 * GOI 견적 분석 — 점수 산출 서비스 (Single Source of Truth)
 *
 * auto-analysis.ts 와 admin calculate-score 엔드포인트가 공유하는
 * 유일한 스코어링 로직. Frontend에서는 이 로직을 API로 호출한다.
 */

import {
	CATEGORY_MARGIN_RATES, CATEGORY_WEIGHTS, categoryMarginToScore,
} from '../lib/constants'

// ============================================
// Types (auto-analysis.ts와 공유)
// ============================================

type StdCategory =
	| '욕실' | '바닥' | '가구' | '목공' | '전기'
	| '도배' | '철거' | '주방' | '창호' | '페인트' | '기타'

type MarginBracket = 'dump_risk' | 'low_margin' | 'fair' | 'slightly_high' | 'excessive' | 'abnormal'

export interface ScoreModifier {
	type: string
	label: string
	points: number
	reason?: string
}

export interface CategoryScore {
	category: StdCategory
	weight: number
	avg_deviation: number
	item_count: number
	score: number
}

export interface ScoreBreakdown {
	categories: CategoryScore[]
	bonuses: ScoreModifier[]
	penalties: ScoreModifier[]
	weighted_sum: number
	final_score: number
}

/** DB analysis_items 행 또는 auto-analysis AnalyzedItem과 호환되는 인터페이스 */
export interface ScorableItem {
	std_category: string | null
	std_item: string | null
	original_quantity: number | null
	original_unit: string | null
	original_unit_price: number | null
	original_total_price: number | null
	deviation_percent: number | null
	is_bundled: boolean
	unit_mismatch?: boolean
	margin_rate: number | null
	margin_bracket: MarginBracket | string | null
}

export interface CalculateScoreInput {
	items: ScorableItem[]
	propertySizeSqm: number | null
	hasLicense?: boolean | null
}

// ============================================
// Deviation → Score mapping
// ============================================

export function deviationToScore(deviationPercent: number): number {
	if (deviationPercent >= 0) {
		if (deviationPercent <= 5) return 95
		if (deviationPercent <= 10) return 87
		if (deviationPercent <= 15) return 78
		if (deviationPercent <= 20) return 65
		if (deviationPercent <= 30) return 50
		if (deviationPercent <= 40) return 35
		return 20
	} else {
		const abs = Math.abs(deviationPercent)
		if (abs <= 5) return 95
		if (abs <= 10) return 85
		if (abs <= 15) return 75
		if (abs <= 20) return 60
		if (abs <= 25) return 45
		return 30
	}
}

// ============================================
// Grade label
// ============================================

export function getScoreGrade(score: number): { label: string; description: string } {
	if (score >= 85) return { label: 'A', description: '매우 적정한 견적입니다' }
	if (score >= 72) return { label: 'B', description: '대체로 합리적인 견적입니다' }
	if (score >= 55) return { label: 'C', description: '일부 항목 검토가 필요합니다' }
	if (score >= 40) return { label: 'D', description: '상당 부분 검토가 필요합니다' }
	return { label: 'F', description: '견적 재검토를 권장합니다' }
}

// ============================================
// Bonus / Penalty
// ============================================

export function calculateBonuses(items: ScorableItem[], hasLicense?: boolean | null): ScoreModifier[] {
	const bonuses: ScoreModifier[] = []

	const hasFullPricing = items.every(i =>
		i.original_quantity != null && i.original_unit
	)
	if (hasFullPricing && items.length > 0) {
		bonuses.push({
			type: 'transparency',
			label: '투명성 보너스',
			points: items.length >= 15 ? 5 : 3,
			reason: '모든 항목에 수량/단위 명시',
		})
	}

	if (hasLicense) {
		bonuses.push({
			type: 'license_verified',
			label: '면허 확인',
			points: 5,
			reason: '시공업체 면허/자격 확인됨',
		})
	}

	return bonuses
}

export function calculatePenalties(items: ScorableItem[], propertySizeSqm: number | null): ScoreModifier[] {
	const penalties: ScoreModifier[] = []

	// Missing category penalty (capped at -12)
	const missingItems = items.filter(i => !i.std_category || !i.std_item)
	if (missingItems.length > 0) {
		penalties.push({
			type: 'missing_items',
			label: '미분류 항목',
			points: Math.max(-12, -3 * missingItems.length),
			reason: `${missingItems.length}개 항목 미분류`,
		})
	}

	// Bundled items penalty
	const bundledCount = items.filter(i => i.is_bundled).length
	const bundledRatio = items.length > 0 ? bundledCount / items.length : 0
	if (bundledRatio > 0.3 && bundledCount >= 3) {
		penalties.push({
			type: 'excessive_bundling',
			label: '일식 과다',
			points: bundledRatio > 0.5 ? -5 : -3,
			reason: `일식 비율 ${(bundledRatio * 100).toFixed(0)}% (${bundledCount}/${items.length})`,
		})
	}

	// High value bundled penalty (capped at -15)
	const highValueBundled = items.filter(i =>
		i.is_bundled && (i.original_total_price ?? 0) > 5_000_000
	)
	if (highValueBundled.length > 0) {
		penalties.push({
			type: 'high_value_bundled',
			label: '고액 일식 항목',
			points: Math.max(-15, -5 * highValueBundled.length),
			reason: `${highValueBundled.length}건의 500만원 초과 일식 항목`,
		})
	}

	// Quantity-area cross-validation (카테고리 합산 비교)
	if (propertySizeSqm && propertySizeSqm > 0) {
		const areaCategories: Array<{ cat: string; stdRatio: number }> = [
			{ cat: '바닥', stdRatio: 1.05 },
			{ cat: '도배', stdRatio: 1.15 },
			{ cat: '페인트', stdRatio: 1.10 },
		]
		for (const { cat, stdRatio } of areaCategories) {
			const catItems = items.filter(i =>
				i.std_category === cat && i.original_quantity != null && i.original_quantity > 0
			)
			if (catItems.length === 0) continue
			const totalQty = catItems.reduce((sum, i) => sum + (i.original_quantity || 0), 0)
			const expectedQty = propertySizeSqm * stdRatio
			const ratio = totalQty / expectedQty
			if (ratio < 0.5) {
				penalties.push({
					type: 'under_quantity',
					label: `${cat} 수량 부족`,
					points: -5,
					reason: `${cat} 합산 수량 ${Math.round(totalQty)}㎡ vs 예상 ${Math.round(expectedQty)}㎡ (비율 ${(ratio * 100).toFixed(0)}%)`,
				})
			}
		}
	}

	return penalties
}

// ============================================
// Main: calculateScoreFromItems
// ============================================

export function calculateScoreFromItems(input: CalculateScoreInput): ScoreBreakdown {
	const { items, propertySizeSqm, hasLicense } = input

	// 1. Category scores
	const categoryMap = new Map<string, ScorableItem[]>()
	for (const item of items) {
		if (!item.std_category) continue
		if (!categoryMap.has(item.std_category)) categoryMap.set(item.std_category, [])
		categoryMap.get(item.std_category)!.push(item)
	}

	const categoryScores: CategoryScore[] = []
	for (const [category, catItems] of categoryMap) {
		const weight = CATEGORY_WEIGHTS[category] || 0.03

		// 마진율 기반 스코어링 (우선), 없으면 deviation 폴백
		const industryMarginPct = (CATEGORY_MARGIN_RATES[category] || 0.20) * 100
		const getEffectiveMargin = (item: ScorableItem): number | null => {
			if (item.margin_rate == null) return null
			if (item.unit_mismatch && item.margin_bracket) {
				switch (item.margin_bracket) {
					case 'fair': return industryMarginPct
					case 'low_margin': return industryMarginPct - 8
					case 'dump_risk': return -5
					case 'slightly_high': return industryMarginPct + 12
					case 'excessive': return industryMarginPct + 30
					default: return item.margin_rate
				}
			}
			return item.margin_rate
		}

		const margins = catItems
			.filter(i => i.margin_rate != null)
			.map(i => getEffectiveMargin(i)!)
		const deviations = catItems
			.filter(i => i.deviation_percent != null)
			.map(i => i.deviation_percent!)

		let avgDeviation: number
		let score: number

		// 개별 비교 신뢰도 판단
		const extremeDeviations = deviations.filter(d => Math.abs(d) > 100)
		const unreliableRatio = catItems.length > 0
			? (catItems.length - margins.length + extremeDeviations.length) / catItems.length
			: 0
		const isUnreliable = unreliableRatio > 0.5

		if (margins.length > 0 && !isUnreliable) {
			const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length
			avgDeviation = Math.round(avgMargin * 100) / 100
			score = categoryMarginToScore(avgMargin, category)
		} else if (deviations.length > 0) {
			avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
			avgDeviation = Math.round(avgDeviation * 100) / 100
			score = deviationToScore(avgDeviation)
		} else {
			avgDeviation = 0
			score = 70
		}

		categoryScores.push({
			category: category as StdCategory,
			weight,
			avg_deviation: avgDeviation,
			item_count: catItems.length,
			score,
		})
	}

	// 2. Weighted sum
	let totalWeight = 0
	let weightedSum = 0
	for (const cat of categoryScores) {
		weightedSum += cat.score * cat.weight
		totalWeight += cat.weight
	}
	const normalizedSum = totalWeight > 0
		? Math.round((weightedSum / totalWeight) * 100) / 100
		: 70

	// 3. Bonuses and penalties
	const bonuses = calculateBonuses(items, hasLicense)
	const penalties = calculatePenalties(items, propertySizeSqm)

	const bonusTotal = bonuses.reduce((s, b) => s + b.points, 0)
	const penaltyTotal = penalties.reduce((s, p) => s + p.points, 0)

	const finalScore = Math.max(0, Math.min(100,
		Math.round(normalizedSum + bonusTotal + penaltyTotal)
	))

	return {
		categories: categoryScores,
		bonuses,
		penalties,
		weighted_sum: normalizedSum,
		final_score: finalScore,
	}
}
