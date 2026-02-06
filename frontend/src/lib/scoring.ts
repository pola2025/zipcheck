/**
 * GOI 견적 분석 - 클라이언트 점수 산출 로직
 */

import type {
	AnalysisItem, Analysis, StdCategory,
	ScoreBreakdown, CategoryScore, ScoreModifier
} from '../types/analysis'
import { getDeviationBracket } from './adjustments'
import { CATEGORY_MARGIN_RATES, categoryMarginToScore } from './analysis-constants'
export { categoryMarginToScore, CATEGORY_MARGIN_RATES } from './analysis-constants'

// ============================================
// 카테고리 가중치
// ============================================

const CATEGORY_WEIGHTS: Record<StdCategory, number> = {
	'욕실': 0.18,
	'바닥': 0.17,
	'주방': 0.14,
	'목공': 0.12,
	'전기': 0.08,
	'도배': 0.07,
	'철거': 0.06,
	'가구': 0.06,
	'창호': 0.05,
	'페인트': 0.04,
	'기타': 0.03,
}

// ============================================
// 편차 → 점수 매핑
// ============================================

function deviationToScore(deviationPercent: number): number {
	if (deviationPercent >= 0) {
		// 고가 방향 (양수: 시장가보다 비쌈)
		if (deviationPercent <= 5) return 95
		if (deviationPercent <= 10) return 87
		if (deviationPercent <= 15) return 78
		if (deviationPercent <= 20) return 65
		if (deviationPercent <= 30) return 50
		if (deviationPercent <= 40) return 35
		return 20
	} else {
		// 저가 방향 (음수: 시장가보다 저렴 → 덤핑 위험 반영)
		const abs = Math.abs(deviationPercent)
		if (abs <= 5) return 95
		if (abs <= 10) return 85
		if (abs <= 15) return 75
		if (abs <= 20) return 60
		if (abs <= 25) return 45
		return 30                    // -25% 초과: 덤핑 위험
	}
}

// ============================================
// 보너스 계산
// ============================================

function calculateBonuses(analysis: Analysis, items: AnalysisItem[]): ScoreModifier[] {
	const bonuses: ScoreModifier[] = []

	// 투명성 보너스: 모든 항목에 수량/단위가 있으면 +3~5
	const hasFullPricing = items.every((i) =>
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

	// 브랜드 명시 보너스
	const brandCount = items.filter((i) => i.attributes?.brand).length
	if (brandCount >= 3) {
		bonuses.push({
			type: 'brand_disclosure',
			label: '브랜드 명시',
			points: brandCount >= 5 ? 3 : 2,
			reason: `${brandCount}개 항목에 브랜드 명시`,
		})
	}

	// 면허 확인 보너스
	if (analysis.contractor_license_verified) {
		bonuses.push({
			type: 'license_verified',
			label: '면허 확인',
			points: 3,
			reason: '시공업체 면허 확인 완료',
		})
	}

	return bonuses
}

// ============================================
// 패널티 계산
// ============================================

function calculatePenalties(analysis: Analysis, items: AnalysisItem[]): ScoreModifier[] {
	const penalties: ScoreModifier[] = []

	// 누락 패널티 (capped at -12)
	const missingItems = items.filter((i) =>
		!i.std_category || !i.std_item
	)
	if (missingItems.length > 0) {
		penalties.push({
			type: 'missing_items',
			label: '미분류 항목',
			points: Math.max(-12, -3 * missingItems.length),
			reason: `${missingItems.length}개 항목 미분류`,
		})
	}

	// 일식 과다 패널티 (-3~5)
	const bundledCount = items.filter((i) => i.is_bundled).length
	const bundledRatio = items.length > 0 ? bundledCount / items.length : 0
	if (bundledRatio > 0.3 && bundledCount >= 3) {
		penalties.push({
			type: 'excessive_bundling',
			label: '일식 과다',
			points: bundledRatio > 0.5 ? -5 : -3,
			reason: `일식 비율 ${(bundledRatio * 100).toFixed(0)}% (${bundledCount}/${items.length})`,
		})
	}

	// 면허 미확인 패널티
	if (!analysis.contractor_license_verified) {
		const highRiskCategories = items.filter((i) =>
			['전기', '욕실', '주방'].includes(i.std_category || '')
		)
		if (highRiskCategories.length > 0) {
			penalties.push({
				type: 'license_unverified_high_risk',
				label: '면허 미확인 (고위험)',
				points: -15,
				reason: '전기/욕실/주방 포함인데 면허 미확인',
			})
		} else {
			penalties.push({
				type: 'license_unverified',
				label: '면허 미확인',
				points: -5,
				reason: '시공업체 면허 미확인',
			})
		}
	}

	// 고액 일식 개별 패널티 (capped at -15)
	const highValueBundled = items.filter((i) =>
		i.is_bundled && (i.original_total_price ?? 0) > 5_000_000
	)
	if (highValueBundled.length > 0) {
		penalties.push({
			type: 'high_value_bundled',
			label: '고액 일식 항목',
			points: Math.max(-15, -5 * highValueBundled.length),
			reason: `${highValueBundled.length}건의 500만원 초과 일식 항목 (투명성 부족)`,
		})
	}

	// 수량-면적 교차검증 (바닥/도배)
	const propertySqm = analysis.property_size_sqm
	if (propertySqm && propertySqm > 0) {
		const areaCategories: Array<{ cat: string; stdRatio: number }> = [
			{ cat: '바닥', stdRatio: 1.05 },
			{ cat: '도배', stdRatio: 1.15 },
		]
		for (const { cat, stdRatio } of areaCategories) {
			const catItems = items.filter((i) =>
				i.std_category === cat && i.original_quantity != null && i.original_quantity > 0
			)
			for (const item of catItems) {
				const expectedQty = propertySqm * stdRatio
				const ratio = item.original_quantity! / expectedQty
				if (ratio < 0.85) {
					penalties.push({
						type: 'under_quantity',
						label: `${cat} 수량 부족`,
						points: -8,
						reason: `${item.std_item || cat}: 수량 ${item.original_quantity}㎡ vs 예상 ${Math.round(expectedQty)}㎡ (비율 ${(ratio * 100).toFixed(0)}%)`,
					})
				}
			}
		}
	}

	// 불완전 견적서 패널티
	if (analysis.completeness === 'minimal') {
		penalties.push({
			type: 'incomplete',
			label: '불완전 견적',
			points: -8,
			reason: '견적서 완전성: 최소',
		})
	} else if (analysis.completeness === 'partial') {
		penalties.push({
			type: 'incomplete',
			label: '부분 견적',
			points: -4,
			reason: '견적서 완전성: 부분',
		})
	}

	return penalties
}

// ============================================
// 카테고리별 점수 계산
// ============================================

function calculateCategoryScores(items: AnalysisItem[]): CategoryScore[] {
	const categoryMap = new Map<StdCategory, AnalysisItem[]>()

	for (const item of items) {
		if (!item.std_category) continue
		const cat = item.std_category as StdCategory
		if (!categoryMap.has(cat)) categoryMap.set(cat, [])
		categoryMap.get(cat)!.push(item)
	}

	const scores: CategoryScore[] = []

	for (const [category, catItems] of categoryMap) {
		const weight = CATEGORY_WEIGHTS[category] || 0.03

		const deviations = catItems
			.filter((i) => i.deviation_percent != null)
			.map((i) => i.deviation_percent!)

		const avgDeviation = deviations.length > 0
			? deviations.reduce((a, b) => a + b, 0) / deviations.length
			: 0

		const score = deviations.length > 0 ? deviationToScore(avgDeviation) : 70 // default if no benchmark

		scores.push({
			category,
			weight,
			avg_deviation: Math.round(avgDeviation * 100) / 100,
			item_count: catItems.length,
			score,
		})
	}

	return scores
}

// ============================================
// 종합 점수 산출
// ============================================

export function calculateScore(analysis: Analysis, items: AnalysisItem[]): ScoreBreakdown {
	const categories = calculateCategoryScores(items)
	const bonuses = calculateBonuses(analysis, items)
	const penalties = calculatePenalties(analysis, items)

	// Weighted sum
	let totalWeight = 0
	let weightedSum = 0
	for (const cat of categories) {
		weightedSum += cat.score * cat.weight
		totalWeight += cat.weight
	}

	// Normalize if total weight < 1 (some categories missing)
	const normalizedSum = totalWeight > 0
		? Math.round((weightedSum / totalWeight) * 100) / 100
		: 70

	const bonusTotal = bonuses.reduce((s, b) => s + b.points, 0)
	const penaltyTotal = penalties.reduce((s, p) => s + p.points, 0)

	const finalScore = Math.max(0, Math.min(100,
		Math.round(normalizedSum + bonusTotal + penaltyTotal)
	))

	return {
		categories,
		bonuses,
		penalties,
		weighted_sum: normalizedSum,
		final_score: finalScore,
	}
}

// ============================================
// 점수 등급 텍스트
// ============================================

export function getScoreGrade(score: number): { label: string; color: string; description: string } {
	if (score >= 85) return { label: '매우 좋음', color: 'text-green-600', description: '매우 적정한 견적입니다' }
	if (score >= 72) return { label: '합리적', color: 'text-blue-600', description: '대체로 합리적인 견적입니다' }
	if (score >= 55) return { label: '평균 수준', color: 'text-amber-600', description: '일부 항목 검토가 필요합니다' }
	if (score >= 40) return { label: '다소 비쌈', color: 'text-orange-600', description: '상당 부분 검토가 필요합니다' }
	return { label: '매우 비쌈', color: 'text-red-600', description: '견적 재검토를 권장합니다' }
}
