/**
 * GOI 견적 분석 - 보정계수 계산 로직
 */

import type { AdjustmentFactors, Grade, DeviationBracket } from '../types/analysis'

// ============================================
// 면적 보정계수 (비선형, 기준 34평 = 1.00)
// ============================================

const AREA_TABLE: [number, number][] = [
	[10, 1.35],
	[15, 1.20],
	[20, 1.10],
	[25, 1.03],
	[30, 1.00],
	[34, 1.00],
	[40, 0.95],
	[50, 0.88],
]

export function getAreaFactor(pyeong: number): number {
	if (pyeong <= AREA_TABLE[0][0]) return AREA_TABLE[0][1]
	if (pyeong >= AREA_TABLE[AREA_TABLE.length - 1][0]) return AREA_TABLE[AREA_TABLE.length - 1][1]

	for (let i = 0; i < AREA_TABLE.length - 1; i++) {
		const [p1, f1] = AREA_TABLE[i]
		const [p2, f2] = AREA_TABLE[i + 1]
		if (pyeong >= p1 && pyeong <= p2) {
			const ratio = (pyeong - p1) / (p2 - p1)
			return f1 + (f2 - f1) * ratio
		}
	}
	return 1.0
}

export function sqmToPyeong(sqm: number): number {
	return sqm / 3.3058
}

// ============================================
// 지역 보정계수
// ============================================

const REGION_FACTORS: Record<string, number> = {
	'서울': 1.0,
	'경기': 0.9,
	'지방': 0.8,
}

export function getRegionFactor(region: string): number {
	return REGION_FACTORS[region] ?? 1.0
}

// ============================================
// 연도 보정계수 (+4%/년, 발행일 기준)
// ============================================

export function getYearFactor(quoteDate: string | null, referenceDate: string | null): number {
	if (!quoteDate || !referenceDate) return 1.0
	const qd = new Date(quoteDate)
	const rd = new Date(referenceDate)
	const yearDiff = (qd.getTime() - rd.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
	return 1 + yearDiff * 0.04
}

// ============================================
// 등급 보정계수
// ============================================

const GRADE_FACTORS: Record<Grade, number> = {
	'가성비': 0.7,
	'중급': 1.0,
	'고급': 1.4,
	'프리미엄': 1.8,
}

export function getGradeFactor(grade: Grade | string | undefined): number {
	if (!grade) return 1.0
	return GRADE_FACTORS[grade as Grade] ?? 1.0
}

// ============================================
// 계절 보정계수 (착공월 우선)
// ============================================

const SEASON_FACTORS: Record<number, number> = {
	1: 0.95, 2: 0.95,             // 비수기
	3: 1.07, 4: 1.07, 5: 1.07,   // 성수기
	6: 1.00, 7: 1.00, 8: 1.00,   // 보통
	9: 1.05, 10: 1.05,           // 약간 성수기
	11: 0.97, 12: 0.97,          // 약간 비수기
}

export function getSeasonFactor(month: number | null): number {
	if (!month || month < 1 || month > 12) return 1.0
	return SEASON_FACTORS[month] ?? 1.0
}

// ============================================
// 전속업체 보정계수
// ============================================

export function getExclusiveFactor(isExclusive: boolean): number {
	return isExclusive ? 1.12 : 1.0
}

// ============================================
// 종합 보정계수 계산
// ============================================

export interface AdjustmentInput {
	propertySizeSqm?: number | null
	region?: string | null
	quoteDate?: string | null
	benchmarkReferenceDate?: string | null
	grade?: string | null
	constructionStartMonth?: number | null
	isExclusive?: boolean
}

export function calculateAdjustmentFactors(input: AdjustmentInput): AdjustmentFactors {
	const pyeong = input.propertySizeSqm ? sqmToPyeong(input.propertySizeSqm) : 34
	return {
		area: Math.round(getAreaFactor(pyeong) * 1000) / 1000,
		region: getRegionFactor(input.region || '서울'),
		year: Math.round(getYearFactor(input.quoteDate || null, input.benchmarkReferenceDate || null) * 1000) / 1000,
		grade: getGradeFactor(input.grade || undefined),
		season: getSeasonFactor(input.constructionStartMonth ?? null),
		exclusive: getExclusiveFactor(input.isExclusive || false),
	}
}

export function applyAdjustments(basePrice: number, factors: AdjustmentFactors): number {
	let adjusted = basePrice
	if (factors.area) adjusted *= factors.area
	if (factors.region) adjusted *= factors.region
	if (factors.year) adjusted *= factors.year
	if (factors.grade) adjusted *= factors.grade
	if (factors.season) adjusted *= factors.season
	if (factors.exclusive) adjusted *= factors.exclusive
	return Math.round(adjusted)
}

// ============================================
// 편차 계산
// ============================================

export function calculateDeviation(actualPrice: number, adjustedBenchmark: number): number {
	if (adjustedBenchmark === 0) return 0
	return ((actualPrice - adjustedBenchmark) / adjustedBenchmark) * 100
}

export function getDeviationBracket(deviation: number): DeviationBracket {
	if (deviation < -25) return 'dump_risk'        // 저가 주의 (시장가 대비 25%↑ 저렴)
	if (deviation < -15) return 'under_warning'    // 과소 주의 (-25% ~ -15%)
	if (deviation < -5) return 'good'              // 양호 (-15% ~ -5%)
	if (deviation <= 10) return 'fair'             // 적정 (-5% ~ +10%)
	if (deviation <= 25) return 'slightly_high'    // 약간높음 (+10% ~ +25%)
	return 'high'                                  // 높음 (+25%↑)
}

export function getDeviationLabel(bracket: DeviationBracket): string {
	const labels: Record<DeviationBracket, string> = {
		dump_risk: '저가 주의',
		under_warning: '과소 주의',
		good: '양호',
		fair: '적정',
		slightly_high: '약간높음',
		high: '높음',
	}
	return labels[bracket]
}

export function getDeviationColor(bracket: DeviationBracket): string {
	const colors: Record<DeviationBracket, string> = {
		dump_risk: 'text-purple-600',
		under_warning: 'text-orange-600',
		good: 'text-green-600',
		fair: 'text-blue-600',
		slightly_high: 'text-amber-600',
		high: 'text-red-600',
	}
	return colors[bracket]
}
