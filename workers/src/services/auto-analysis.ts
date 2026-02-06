/**
 * GOI 견적 자동 분석 엔진 (Backend)
 * scoring.ts + adjustments.ts 로직을 Workers 백엔드로 포팅
 */

import type { Env } from '../types'
import { query } from '../lib/db'
import {
	CATEGORY_MARGIN_RATES, CATEGORY_WEIGHTS, categoryMarginToScore,
	CATEGORY_OVERRIDE_RULES, ITEM_KEYWORD_MAP, LUMP_SUM_RANGES,
	type CategoryOverrideRule,
} from '../lib/constants'

// ============================================
// Types
// ============================================

type StdCategory =
	| '욕실' | '바닥' | '가구' | '목공' | '전기'
	| '도배' | '철거' | '주방' | '창호' | '페인트' | '기타'

type DeviationBracket = 'dump_risk' | 'under_warning' | 'good' | 'fair' | 'slightly_high' | 'high'

type MarginBracket = 'dump_risk' | 'low_margin' | 'fair' | 'slightly_high' | 'excessive' | 'abnormal'

type Grade = '가성비' | '중급' | '고급' | '프리미엄'

interface AdjustmentFactors {
	area: number
	region: number
	year: number
	grade: number
	season: number
	exclusive: number
}

interface CategoryScore {
	category: StdCategory
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

interface AnalyzedItem {
	original_category: string | null
	original_item_name: string | null
	original_quantity: number | null
	original_unit: string | null
	original_unit_price: number | null
	original_total_price: number | null
	std_category: StdCategory | null
	std_item: string | null
	benchmark_unit_price: number | null
	benchmark_unit: string | null
	adjusted_benchmark_price: number | null
	deviation_percent: number | null
	deviation_bracket: DeviationBracket | null
	unit_mismatch: boolean
	adjustment_factors: AdjustmentFactors
	is_bundled: boolean
	confidence: number
	match_tier: number | null  // v3: 어느 단계에서 매칭했는지 (1~7)
	// 마진율 분석 (v2)
	margin_rate: number | null
	margin_bracket: MarginBracket | null
	estimated_cost: number | null
	fair_price_min: number | null
	fair_price_max: number | null
}

interface CategoryMapping {
	original_name: string
	std_category: string
	std_item: string
	aliases: string[]
}

interface BenchmarkPrice {
	std_category: string
	std_item: string
	unit_price: number
	unit: string
	grade: string
	region: string
	reference_date: string | null
	source?: string | null
	model?: string | null  // google_search 신뢰도: 'high'/'medium'/'low'
}

interface QuoteItem {
	category?: string
	item_name?: string
	itemName?: string
	quantity?: number
	unit?: string
	unit_price?: number
	unitPrice?: number
	total_price?: number
	totalPrice?: number
	quoted_price?: number
	specification?: string
	material_cost?: number
	labor_cost?: number
	notes?: string
}

export interface AutoAnalysisInput {
	quoteRequestId: string
	items: QuoteItem[]
	propertySizeSqm: number | null
	region: string
	propertyType: string
	quoteDate: string | null
	constructionStartMonth: number | null
	grade: string | null
	isExclusive: boolean
	customerName: string | null
	customerEmail: string | null
}

export interface AutoAnalysisResult {
	analysisId: string
	scoreBreakdown: ScoreBreakdown
	items: AnalyzedItem[]
	adjustmentFactors: AdjustmentFactors
	totalScore: number
	grade: { label: string; description: string }
}

// ============================================
// Adjustment factor calculations (ported from frontend)
// ============================================

const AREA_TABLE: [number, number][] = [
	[10, 1.35], [15, 1.20], [20, 1.10], [25, 1.03],
	[30, 1.00], [34, 1.00], [40, 0.95], [50, 0.88],
]

function sqmToPyeong(sqm: number): number {
	return sqm / 3.3058
}

function getAreaFactor(pyeong: number): number {
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

const REGION_FACTORS: Record<string, number> = {
	'서울': 1.0, '경기': 0.9, '지방': 0.8,
}

function getRegionFactor(region: string): number {
	return REGION_FACTORS[region] ?? 1.0
}

function getYearFactor(quoteDate: string | null, referenceDate: string | null): number {
	if (!quoteDate || !referenceDate) return 1.0
	const qd = new Date(quoteDate)
	const rd = new Date(referenceDate)
	const yearDiff = (qd.getTime() - rd.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
	return 1 + yearDiff * 0.04
}

const GRADE_FACTORS: Record<string, number> = {
	'가성비': 0.7, '중급': 1.0, '고급': 1.4, '프리미엄': 1.8,
}

function getGradeFactor(grade: string | null): number {
	if (!grade) return 1.0
	return GRADE_FACTORS[grade] ?? 1.0
}

const SEASON_FACTORS: Record<number, number> = {
	1: 0.95, 2: 0.95,
	3: 1.07, 4: 1.07, 5: 1.07,
	6: 1.00, 7: 1.00, 8: 1.00,
	9: 1.05, 10: 1.05,
	11: 0.97, 12: 0.97,
}

function getSeasonFactor(month: number | null): number {
	if (!month || month < 1 || month > 12) return 1.0
	return SEASON_FACTORS[month] ?? 1.0
}

function getExclusiveFactor(isExclusive: boolean): number {
	return isExclusive ? 1.12 : 1.0
}

function calculateAdjustmentFactors(input: {
	propertySizeSqm: number | null
	region: string
	quoteDate: string | null
	benchmarkReferenceDate: string | null
	grade: string | null
	constructionStartMonth: number | null
	isExclusive: boolean
}): AdjustmentFactors {
	const pyeong = input.propertySizeSqm ? sqmToPyeong(input.propertySizeSqm) : 34
	return {
		area: Math.round(getAreaFactor(pyeong) * 1000) / 1000,
		region: getRegionFactor(input.region || '서울'),
		year: Math.round(getYearFactor(input.quoteDate, input.benchmarkReferenceDate) * 1000) / 1000,
		grade: getGradeFactor(input.grade),
		season: getSeasonFactor(input.constructionStartMonth ?? null),
		exclusive: getExclusiveFactor(input.isExclusive || false),
	}
}

function applyAdjustments(basePrice: number, factors: AdjustmentFactors): number {
	let adjusted = basePrice
	adjusted *= factors.area
	adjusted *= factors.region
	adjusted *= factors.year
	adjusted *= factors.grade
	adjusted *= factors.season
	adjusted *= factors.exclusive
	return Math.round(adjusted)
}

// ============================================
// 카테고리별 원가 프로필 (구성요소 합산 방식)
// ============================================

interface CostComponent {
	std_item: string       // 벤치마크에서 찾을 std_item
	area_factor?: number   // propertySizeSqm × factor = 시공면적
	default_qty?: number   // 세트 기반일 때 기본 수량
}

interface CategoryCostProfile {
	type: 'area' | 'set' | 'mixed'
	components: CostComponent[]
}

const CATEGORY_COST_PROFILES: Record<string, CategoryCostProfile> = {
	'도배': {
		type: 'area',
		components: [
			{ std_item: '실크 도배', area_factor: 1.8 },
			{ std_item: '천장 도배', area_factor: 1.0 },
		],
	},
	'바닥': {
		type: 'area',
		components: [
			{ std_item: '강화마루', area_factor: 0.85 },
		],
	},
	'철거': {
		type: 'area',
		components: [
			{ std_item: '바닥 철거', area_factor: 1.0 },
			{ std_item: '도배 철거', area_factor: 1.8 },
		],
	},
	'페인트': {
		type: 'area',
		components: [
			{ std_item: '벽면 페인트', area_factor: 1.8 },
			{ std_item: '천장 페인트', area_factor: 1.0 },
		],
	},
	'욕실': {
		type: 'set',
		components: [
			{ std_item: '바닥 타일', area_factor: 0.035 },
			{ std_item: '벽 타일', area_factor: 0.12 },
			{ std_item: '세면대', default_qty: 1 },
			{ std_item: '양변기', default_qty: 1 },
			{ std_item: '수전', default_qty: 1 },
			{ std_item: '방수 공사', area_factor: 0.035 },
		],
	},
	'주방': {
		type: 'set',
		components: [
			{ std_item: '싱크대 상판', default_qty: 3 },
			{ std_item: '하부장', default_qty: 3 },
			{ std_item: '상부장', default_qty: 3 },
			{ std_item: '빌트인 후드', default_qty: 1 },
		],
	},
	'전기': {
		type: 'set',
		components: [
			{ std_item: '콘센트 교체', default_qty: 20 },
			{ std_item: '스위치 교체', default_qty: 10 },
			{ std_item: '조명 교체', default_qty: 10 },
			{ std_item: '분전반 교체', default_qty: 1 },
		],
	},
	'목공': {
		type: 'mixed',
		components: [
			{ std_item: '문틀', default_qty: 5 },
			{ std_item: '몰딩', default_qty: 40 },
			{ std_item: '걸레받이', default_qty: 40 },
		],
	},
	'가구': {
		type: 'set',
		components: [
			{ std_item: '붙박이장', default_qty: 2 },
			{ std_item: '신발장', default_qty: 1 },
		],
	},
	'창호': {
		type: 'set',
		components: [
			{ std_item: '방문', default_qty: 4 },
			{ std_item: '현관문', default_qty: 1 },
		],
	},
}

// ============================================
// 마진율 계산 헬퍼
// ============================================

function getMarginBracket(marginRate: number): MarginBracket {
	if (marginRate < 5) return 'dump_risk'
	if (marginRate < 15) return 'low_margin'
	if (marginRate <= 25) return 'fair'
	if (marginRate <= 40) return 'slightly_high'
	if (marginRate <= 80) return 'excessive'
	return 'abnormal'
}


/**
 * 카테고리 전체 구성요소를 합산하여 원가 추정 (Fix 2)
 * 기존 calculateEstimatedCost(단일 벤치마크)를 대체
 */
function calculateCategoryCost(
	stdCategory: string,
	benchmarks: BenchmarkPrice[],
	adjustmentFactors: AdjustmentFactors,
	targetGrade: string,
	propertySizeSqm: number | null,
): number | null {
	const profile = CATEGORY_COST_PROFILES[stdCategory]
	if (!profile) return null

	let totalCost = 0
	let matchedComponents = 0

	for (const comp of profile.components) {
		const bench = findBenchmark(stdCategory, comp.std_item, benchmarks, targetGrade)
		if (!bench) continue

		const adjustedPrice = applyAdjustments(bench.unit_price, adjustmentFactors)
		let qty: number

		if (comp.area_factor != null && propertySizeSqm && propertySizeSqm > 0) {
			qty = propertySizeSqm * comp.area_factor
		} else if (comp.default_qty != null) {
			qty = comp.default_qty
		} else {
			continue
		}

		totalCost += adjustedPrice * qty
		matchedComponents++
	}

	// 최소 절반 이상 매칭되어야 유효
	if (matchedComponents < profile.components.length / 2) return null
	return Math.round(totalCost)
}

// ============================================
// Scoring (ported from frontend)
// ============================================

// CATEGORY_WEIGHTS imported from ../lib/constants

function deviationToScore(deviationPercent: number): number {
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

function getDeviationBracket(deviation: number): DeviationBracket {
	if (deviation < -25) return 'dump_risk'
	if (deviation < -15) return 'under_warning'
	if (deviation < -5) return 'good'
	if (deviation <= 10) return 'fair'
	if (deviation <= 25) return 'slightly_high'
	return 'high'
}

function getScoreGrade(score: number): { label: string; description: string } {
	if (score >= 85) return { label: 'A', description: '매우 적정한 견적입니다' }
	if (score >= 72) return { label: 'B', description: '대체로 합리적인 견적입니다' }
	if (score >= 55) return { label: 'C', description: '일부 항목 검토가 필요합니다' }
	if (score >= 40) return { label: 'D', description: '상당 부분 검토가 필요합니다' }
	return { label: 'F', description: '견적 재검토를 권장합니다' }
}

// ============================================
// Category mapping logic
// ============================================

function matchCategory(
	category: string | null,
	itemName: string | null,
	mappings: CategoryMapping[]
): { stdCategory: StdCategory; stdItem: string } | null {
	if (!category && !itemName) return null

	const catLower = category?.trim().toLowerCase() || ''
	const itemLower = itemName?.trim().toLowerCase() || ''
	const combined = `${catLower} ${itemLower}`.trim()

	// Phase 0: CATEGORY_OVERRIDE_RULES (priority 순, 최우선)
	const sortedRules = [...CATEGORY_OVERRIDE_RULES].sort((a, b) => b.priority - a.priority)
	for (const rule of sortedRules) {
		for (const keyword of rule.keywords) {
			if (combined.includes(keyword.toLowerCase())) {
				// 키워드 매칭된 항목명으로 std_item 결정
				const mappedItem = ITEM_KEYWORD_MAP[keyword] || itemName || category || rule.stdCategory
				return {
					stdCategory: rule.stdCategory,
					stdItem: mappedItem,
				}
			}
		}
	}

	// Phase 1: category_mappings DB에서 모든 후보 수집 + 점수 부여
	const searchTerms = [catLower, itemLower].filter(Boolean)
	interface MappingCandidate {
		stdCategory: StdCategory
		stdItem: string
		score: number
	}
	const candidates: MappingCandidate[] = []

	for (const mapping of mappings) {
		const originalLower = mapping.original_name.toLowerCase()
		const allNames = [originalLower, ...(mapping.aliases || []).map(a => a.toLowerCase())]

		let bestScore = 0
		for (const term of searchTerms) {
			for (const name of allNames) {
				if (term === name) {
					// 완전 일치
					bestScore = Math.max(bestScore, 100)
				} else if (term.includes(name) || name.includes(term)) {
					// 부분 일치 — category vs itemName 구분
					const isCatMatch = catLower.includes(name) || name.includes(catLower)
					const isItemMatch = itemLower.includes(name) || name.includes(itemLower)
					if (isCatMatch && isItemMatch) {
						bestScore = Math.max(bestScore, 80)
					} else if (isItemMatch) {
						bestScore = Math.max(bestScore, 60)
					} else if (isCatMatch) {
						bestScore = Math.max(bestScore, 40)
					}
				}
			}
		}
		if (bestScore > 0) {
			candidates.push({
				stdCategory: mapping.std_category as StdCategory,
				stdItem: mapping.std_item,
				score: bestScore,
			})
		}
	}

	// 최고 점수 후보 반환
	if (candidates.length > 0) {
		candidates.sort((a, b) => b.score - a.score)
		return {
			stdCategory: candidates[0].stdCategory,
			stdItem: candidates[0].stdItem,
		}
	}

	// Phase 2: Fallback — 직접 카테고리명 매칭 (철거 우선순위 높임)
	const stdCategories: StdCategory[] = ['철거', '욕실', '바닥', '가구', '목공', '전기', '도배', '주방', '창호', '페인트', '기타']
	for (const stdCat of stdCategories) {
		for (const term of searchTerms) {
			if (term.includes(stdCat)) {
				return { stdCategory: stdCat, stdItem: itemName || category || stdCat }
			}
		}
	}

	return null
}

interface BenchmarkMatch {
	benchmark: BenchmarkPrice
	matchTier: 1 | 2 | 3 | 4 | 5 | 6 | 10
}

function findBenchmarkWithTier(
	stdCategory: string,
	stdItem: string,
	benchmarks: BenchmarkPrice[],
	grade: string,
	originalItemName?: string | null,
	quoteUnit?: string | null,
): BenchmarkMatch | null {
	const isManual = (b: BenchmarkPrice) => b.source !== 'google_search'
	const isGoogleReliable = (b: BenchmarkPrice) =>
		b.source === 'google_search' && b.model !== 'low'

	// 단위 호환성 체크 (방충망 등 ㎡/개 양쪽 벤치마크가 있는 경우)
	const unitCompatible = (benchUnit: string | null, qUnit: string | null): boolean => {
		if (!qUnit || !benchUnit) return true // 정보 부족 시 호환으로 간주
		const countUnits = ['개', '세트', '조', '짝', '식']
		const areaUnits = ['㎡', 'm2', 'm²', '평']
		const qIsCount = countUnits.some(u => qUnit.includes(u))
		const bIsCount = countUnits.some(u => benchUnit.includes(u))
		const qIsArea = areaUnits.some(u => qUnit.includes(u))
		const bIsArea = areaUnits.some(u => benchUnit.includes(u))
		// 같은 유형이면 호환
		if (qIsCount && bIsCount) return true
		if (qIsArea && bIsArea) return true
		// 유형이 다르면 비호환
		if ((qIsCount && bIsArea) || (qIsArea && bIsCount)) return false
		return true // 기타(m, 톤 등)는 호환으로 간주
	}

	// Tier 1: 수동 벤치마크 exact match (수동 우선, 단위 일치 우선)
	const manualExacts = benchmarks.filter(
		b => isManual(b) && b.std_category === stdCategory && b.std_item === stdItem && b.grade === grade
	)
	if (manualExacts.length > 0) {
		// 단위 호환 벤치마크 우선
		const unitMatch = manualExacts.find(b => unitCompatible(b.unit, quoteUnit))
		if (unitMatch) return { benchmark: unitMatch, matchTier: 1 }
		return { benchmark: manualExacts[0], matchTier: 1 }
	}

	// Tier 2: 키워드 매칭 (ITEM_KEYWORD_MAP으로 변환 후 매칭)
	if (originalItemName) {
		const itemLower = originalItemName.toLowerCase()
		// 키워드 맵에서 매칭되는 std_item 찾기
		for (const [keyword, mappedStdItem] of Object.entries(ITEM_KEYWORD_MAP)) {
			if (itemLower.includes(keyword.toLowerCase())) {
				// 같은 등급 우선
				const keywordMatch = benchmarks.find(
					b => isManual(b) && b.std_category === stdCategory && b.std_item === mappedStdItem && b.grade === grade
				)
				if (keywordMatch) return { benchmark: keywordMatch, matchTier: 2 }
				// 가장 가까운 등급 (중급 → 고급 → 가성비 → 프리미엄)
				const gradeOrder = ['중급', '고급', '가성비', '프리미엄']
				for (const g of gradeOrder) {
					const fallbackMatch = benchmarks.find(
						b => isManual(b) && b.std_category === stdCategory && b.std_item === mappedStdItem && b.grade === g
					)
					if (fallbackMatch) return { benchmark: fallbackMatch, matchTier: 2 }
				}
			}
		}
	}

	// Tier 3: 수동 벤치마크 — 같은 카테고리 + 등급
	const manualCatGrade = benchmarks.find(
		b => isManual(b) && b.std_category === stdCategory && b.grade === grade
	)
	if (manualCatGrade) return { benchmark: manualCatGrade, matchTier: 3 }

	// Tier 4: 구글 벤치마크 exact match (신뢰도 high/medium만)
	const googleExact = benchmarks.find(
		b => isGoogleReliable(b) && b.std_category === stdCategory && b.std_item === stdItem
	)
	if (googleExact) return { benchmark: googleExact, matchTier: 4 }

	// Tier 5: 수동 벤치마크 — 같은 카테고리 + 중급
	const catDefault = benchmarks.find(
		b => isManual(b) && b.std_category === stdCategory && b.grade === '중급'
	)
	if (catDefault) return { benchmark: catDefault, matchTier: 5 }

	// Tier 6: 구글 벤치마크 — 같은 카테고리 (신뢰도 무관)
	const googleCat = benchmarks.find(
		b => b.source === 'google_search' && b.std_category === stdCategory
	)
	if (googleCat) return { benchmark: googleCat, matchTier: 6 }

	// Tier 7: 매칭 실패 (기존의 "아무거나" 제거)
	return null
}

// 하위 호환: calculateCategoryCost 등에서 사용하는 기존 시그니처
function findBenchmark(
	stdCategory: string,
	stdItem: string,
	benchmarks: BenchmarkPrice[],
	grade: string
): BenchmarkPrice | null {
	const result = findBenchmarkWithTier(stdCategory, stdItem, benchmarks, grade)
	return result?.benchmark || null
}

/**
 * matchTier 기반 confidence 산출 (v3)
 */
function getConfidence(matchTier: number | null, deviationPercent: number | null): number {
	let base: number
	if (!matchTier) {
		base = 0.20  // 매칭 실패
	} else if (matchTier === 1) {
		base = 0.90  // 정확 매칭
	} else if (matchTier === 2) {
		base = 0.75  // 키워드 매칭
	} else if (matchTier <= 4) {
		base = 0.60  // 카테고리+등급 / google exact
	} else if (matchTier <= 6) {
		base = 0.45  // 카테고리 대표 / google any
	} else if (matchTier === 10) {
		base = 0.55  // cross-grade refinement (다른 등급 벤치마크 매칭)
	} else {
		base = 0.20  // fallback
	}
	// 편차 200%+ 일 때 0.1 감산
	if (deviationPercent != null && Math.abs(deviationPercent) > 200) {
		base = Math.max(0.10, base - 0.10)
	}
	return base
}

/**
 * 일식 항목 적정가격 범위 평가 (v3)
 */
interface LumpSumResult {
	score: number
	bracket: 'dump_risk' | 'low_margin' | 'fair' | 'slightly_high' | 'excessive'
	rangeMin: number
	rangeMax: number
}

function evaluateLumpSum(
	stdCategory: string,
	stdItem: string,
	totalPrice: number,
	propertySizePyeong: number,
	targetGrade: string
): LumpSumResult | null {
	// 카테고리 → LUMP_SUM_RANGES 키 매핑
	let rangeKey: string | null = null
	const itemLower = stdItem.toLowerCase()
	if (itemLower.includes('아트월') || itemLower.includes('포인트월')) {
		rangeKey = '목공_아트월'
	} else if (itemLower.includes('폐기물') || itemLower.includes('잔재물')) {
		rangeKey = '폐기물처리'
	} else if (stdCategory === '철거' && (itemLower.includes('전체') || totalPrice > 1_500_000)) {
		rangeKey = '철거_전체'
	} else if (stdCategory === '욕실') {
		rangeKey = '욕실'
	} else if (stdCategory === '주방') {
		rangeKey = '주방'
	}

	if (!rangeKey) return null
	const rangeData = LUMP_SUM_RANGES[rangeKey]
	if (!rangeData) return null

	// 평수 구간 결정
	let pyeongIdx = 0
	for (let i = 0; i < rangeData.pyeongRanges.length; i++) {
		const [min, max] = rangeData.pyeongRanges[i]
		if (propertySizePyeong >= min && propertySizePyeong < max) {
			pyeongIdx = i
			break
		}
		if (i === rangeData.pyeongRanges.length - 1) {
			pyeongIdx = i
		}
	}

	const gradeRanges = rangeData.grades[targetGrade]
	if (!gradeRanges || !gradeRanges[pyeongIdx]) return null

	const [rangeMin, rangeMax] = gradeRanges[pyeongIdx]

	// 총액이 범위 대비 어디인지 판정
	if (totalPrice < rangeMin * 0.8) {
		return { score: 55, bracket: 'dump_risk', rangeMin, rangeMax }
	}
	if (totalPrice < rangeMin) {
		return { score: 75, bracket: 'low_margin', rangeMin, rangeMax }
	}
	if (totalPrice <= rangeMax) {
		return { score: 90, bracket: 'fair', rangeMin, rangeMax }
	}
	if (totalPrice <= rangeMax * 1.3) {
		return { score: 70, bracket: 'slightly_high', rangeMin, rangeMax }
	}
	return { score: 40, bracket: 'excessive', rangeMin, rangeMax }
}

// ============================================
// Grade auto-estimation (v3.1)
// ============================================

/**
 * 견적 항목의 단가 수준으로 등급(가성비/중급/고급/프리미엄) 자동 추정
 * 4등급 각각에서 가중 평균 편차를 계산, 최소 편차 등급을 반환
 */
function estimateGrade(
	items: QuoteItem[],
	mappings: CategoryMapping[],
	benchmarks: BenchmarkPrice[],
	baseFactors: AdjustmentFactors,
	propertySizeSqm: number | null,
): Grade {
	const grades: Grade[] = ['가성비', '중급', '고급', '프리미엄']
	const pyeong = propertySizeSqm ? sqmToPyeong(propertySizeSqm) : 34

	// 카테고리 매핑은 등급과 무관 → 1회만 계산
	const mappedItems: Array<{
		mapped: { stdCategory: StdCategory; stdItem: string }
		unitPrice: number | null
		totalPrice: number | null
		quantity: number | null
		unit: string | null
		isBundled: boolean
		itemName: string | null
	}> = []

	for (const item of items) {
		const itemName = item.item_name ?? item.itemName ?? null
		const category = item.category ?? null
		const unitPrice = item.unit_price ?? item.unitPrice ?? null
		const quantity = item.quantity ?? null
		const totalPrice = item.total_price ?? item.totalPrice ?? item.quoted_price ?? null
		const unit = item.unit ?? null
		const isBundled = !quantity || !unitPrice || (unit === '일식' || unit === '식')

		const mapped = matchCategory(category, itemName, mappings)
		if (!mapped) continue

		mappedItems.push({ mapped, unitPrice, totalPrice, quantity, unit, isBundled, itemName })
	}

	if (mappedItems.length === 0) return '중급'

	let bestGrade: Grade = '중급'
	let bestAvgDev = Infinity

	for (const grade of grades) {
		const gradeFactor = GRADE_FACTORS[grade] ?? 1.0
		const factors = { ...baseFactors, grade: gradeFactor }
		let totalWeightedDev = 0
		let totalWeight = 0

		for (const { mapped, unitPrice, totalPrice, quantity, unit, isBundled, itemName } of mappedItems) {
			if (!isBundled && unitPrice && unitPrice > 0) {
				// 단가 비교 가능한 항목
				const benchResult = findBenchmarkWithTier(
					mapped.stdCategory, mapped.stdItem, benchmarks, grade, itemName
				)
				if (!benchResult) continue

				const adjustedPrice = applyAdjustments(benchResult.benchmark.unit_price, factors)
				if (adjustedPrice <= 0) continue

				const deviation = Math.abs((unitPrice - adjustedPrice) / adjustedPrice * 100)
				const weight = totalPrice || (unitPrice * (quantity || 1))
				totalWeightedDev += deviation * weight
				totalWeight += weight
			} else if (totalPrice && totalPrice > 0) {
				// 일식 항목 → LUMP_SUM_RANGES 범위 기반 평가
				const lumpResult = evaluateLumpSum(
					mapped.stdCategory, mapped.stdItem,
					totalPrice, pyeong, grade
				)
				if (lumpResult) {
					const pseudoDev = lumpResult.bracket === 'fair' ? 5 :
						lumpResult.bracket === 'low_margin' ? 15 :
						lumpResult.bracket === 'slightly_high' ? 20 :
						lumpResult.bracket === 'dump_risk' ? 40 : 50
					totalWeightedDev += pseudoDev * totalPrice
					totalWeight += totalPrice
				}
			}
		}

		if (totalWeight === 0) continue
		const avgDev = totalWeightedDev / totalWeight

		if (avgDev < bestAvgDev) {
			bestAvgDev = avgDev
			bestGrade = grade
		}
	}

	return bestGrade
}

// ============================================
// Bonus / Penalty calculation
// ============================================

function calculateBonuses(items: AnalyzedItem[]): ScoreModifier[] {
	const bonuses: ScoreModifier[] = []

	// Transparency bonus
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

	return bonuses
}

function calculatePenalties(items: AnalyzedItem[], propertySizeSqm: number | null): ScoreModifier[] {
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

	// License unverified nudge (auto-analysis can't verify licenses, so soft penalty only)
	penalties.push({
		type: 'license_unverified',
		label: '면허 미확인',
		points: -3,
		reason: '시공업체 면허 정보 미제공 (자동분석)',
	})

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

	// Quantity-area cross-validation (v1.6 → v2: 카테고리 합산 비교, Fix 5)
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
			// 카테고리 내 모든 아이템 수량 합산하여 비교 (개별 비교 → 합산 비교)
			const totalQty = catItems.reduce((sum, i) => sum + (i.original_quantity || 0), 0)
			const expectedQty = propertySizeSqm * stdRatio
			const ratio = totalQty / expectedQty
			if (ratio < 0.5) {  // 50% 미만일 때만 (기존 85%는 너무 엄격)
				penalties.push({
					type: 'under_quantity',
					label: `${cat} 수량 부족`,
					points: -5,  // -8 → -5 완화, 카테고리당 1번만
					reason: `${cat} 합산 수량 ${Math.round(totalQty)}㎡ vs 예상 ${Math.round(expectedQty)}㎡ (비율 ${(ratio * 100).toFixed(0)}%)`,
				})
			}
		}
	}

	return penalties
}

// ============================================
// Main auto-analysis function
// ============================================

export async function runAutoAnalysis(
	env: Env,
	input: AutoAnalysisInput
): Promise<AutoAnalysisResult> {
	console.log(`[AutoAnalysis] Starting for quote request ${input.quoteRequestId}`)
	console.log(`[AutoAnalysis] Items: ${input.items.length}, Region: ${input.region}`)

	// 1. Load category mappings (1 query)
	const mappingRows = await query(
		env.DATABASE_URL,
		'SELECT original_name, std_category, std_item, aliases FROM category_mappings WHERE is_verified = true'
	)
	const mappings = mappingRows as CategoryMapping[]
	console.log(`[AutoAnalysis] Loaded ${mappings.length} category mappings`)

	// 2. Load benchmark prices (1 query)
	const benchmarkRows = await query(
		env.DATABASE_URL,
		'SELECT std_category, std_item, unit_price, unit, grade, region, reference_date, source, model FROM benchmark_prices WHERE is_active = true'
	)
	const benchmarks = benchmarkRows as BenchmarkPrice[]
	console.log(`[AutoAnalysis] Loaded ${benchmarks.length} benchmark prices`)

	// 3. Find the earliest benchmark reference date for year factor
	const referenceDates = benchmarks
		.filter(b => b.reference_date)
		.map(b => b.reference_date!)
	const benchmarkReferenceDate = referenceDates.length > 0
		? referenceDates.sort()[0]
		: null

	// 4. Calculate adjustment factors
	const targetGrade = input.grade || '중급'
	const adjustmentFactors = calculateAdjustmentFactors({
		propertySizeSqm: input.propertySizeSqm,
		region: input.region,
		quoteDate: input.quoteDate || new Date().toISOString(),
		benchmarkReferenceDate,
		grade: input.grade,
		constructionStartMonth: input.constructionStartMonth,
		isExclusive: input.isExclusive,
	})
	console.log(`[AutoAnalysis] Adjustment factors:`, adjustmentFactors)

	// Auto-estimate grade for informational purposes (stored in result, not used for scoring)
	let estimatedGradeInfo: string | null = null
	if (!input.grade) {
		const neutralFactors = { ...adjustmentFactors, grade: 1.0 }
		estimatedGradeInfo = estimateGrade(input.items, mappings, benchmarks, neutralFactors, input.propertySizeSqm)
		console.log(`[AutoAnalysis] Estimated grade (info only): ${estimatedGradeInfo}`)
	}

	// 5. Analyze each item
	const analyzedItems: AnalyzedItem[] = input.items.map((item) => {
		const category = item.category ?? null
		const itemName = item.item_name ?? item.itemName ?? null
		const quantity = item.quantity ?? null
		const unit = item.unit ?? null
		const unitPrice = item.unit_price ?? item.unitPrice ?? null
		const totalPrice = item.total_price ?? item.totalPrice ?? item.quoted_price ?? null

		// Detect bundled (lump sum) items
		const isBundled = !quantity || !unitPrice || (unit === '일식' || unit === '식')

		// Map to standard category
		const mapped = matchCategory(category, itemName, mappings)

		// Find benchmark
		let benchmarkUnitPrice: number | null = null
		let benchmarkUnit: string | null = null
		let adjustedBenchmarkPrice: number | null = null
		let deviationPercent: number | null = null
		let deviationBracket: DeviationBracket | null = null
		let unitMismatch = false
		// 마진율 분석 필드
		let marginRate: number | null = null
		let marginBracket: MarginBracket | null = null
		let estimatedCost: number | null = null
		let fairPriceMin: number | null = null
		let fairPriceMax: number | null = null

		let matchTier: number | null = null

		if (mapped) {
			const benchResult = findBenchmarkWithTier(mapped.stdCategory, mapped.stdItem, benchmarks, targetGrade, itemName, unit)
			if (benchResult) {
				const bench = benchResult.benchmark
				matchTier = benchResult.matchTier
				benchmarkUnitPrice = bench.unit_price
				benchmarkUnit = bench.unit
				adjustedBenchmarkPrice = applyAdjustments(bench.unit_price, adjustmentFactors)

				// 단위 기반 비교 — 벤치마크 단위 vs 견적 단위 불일치 감지
				const areaUnits = ['㎡', 'm2', 'm²', '평', '자']
				const lumpUnits = ['식', '일식', '세트', '개소', '조']
				const weightUnits = ['톤', 'kg', 't']
				const benchIsAreaBased = areaUnits.some(u => bench.unit?.includes(u))
				const benchIsWeightBased = weightUnits.some(u => bench.unit?.includes(u))
				const quoteUnitIsCount = unit === '개' || unit === '세트' || unit === '조'
				const quoteIsLumpSum = isBundled || lumpUnits.some(u => unit?.includes(u) || false)
					|| (!unitPrice && quantity === 1)
				// 단위 불일치 판정:
				// 1) 벤치마크가 면적/중량 기반인데 견적이 일식/개수 기반
				// 2) 벤치마크가 면적 기반인데 견적이 개수 기반 (방충망 ㎡ vs 개 등)
				const isUnitMismatch = (benchIsAreaBased || benchIsWeightBased) && (quoteIsLumpSum || quoteUnitIsCount)

				if (isUnitMismatch) {
					// 단위 불일치: 일식 항목 평가
					unitMismatch = true
					deviationPercent = null
					deviationBracket = null

					// v3: evaluateLumpSum 먼저 시도
					const pyeong = input.propertySizeSqm ? sqmToPyeong(input.propertySizeSqm) : 34
					if (totalPrice && totalPrice > 0) {
						const lumpResult = evaluateLumpSum(
							mapped.stdCategory, mapped.stdItem,
							totalPrice, pyeong, targetGrade
						)
						if (lumpResult) {
							// 일식 범위 기반 평가 성공
							fairPriceMin = lumpResult.rangeMin
							fairPriceMax = lumpResult.rangeMax
							estimatedCost = Math.round((lumpResult.rangeMin + lumpResult.rangeMax) / 2)
							marginRate = Math.round(
								((totalPrice - estimatedCost) / estimatedCost) * 10000
							) / 100
							marginBracket = lumpResult.bracket as MarginBracket
						}
					}

					// evaluateLumpSum 실패 시 기존 calculateCategoryCost 폴백
					if (!estimatedCost) {
						estimatedCost = calculateCategoryCost(
							mapped.stdCategory, benchmarks, adjustmentFactors,
							targetGrade, input.propertySizeSqm
						)
						if (estimatedCost && totalPrice && estimatedCost > 0) {
							marginRate = Math.round(
								((totalPrice - estimatedCost) / estimatedCost) * 10000
							) / 100
							marginBracket = getMarginBracket(marginRate)
							fairPriceMin = Math.round(estimatedCost * 1.15)
							fairPriceMax = Math.round(estimatedCost * 1.25)
						}
					}
				} else {
					// 단가 비교 가능 항목
					const comparePrice = unitPrice || (totalPrice && quantity ? totalPrice / quantity : null)
					if (comparePrice && adjustedBenchmarkPrice > 0) {
						// 기존 deviation 계산 (하위호환)
						deviationPercent = Math.round(
							((comparePrice - adjustedBenchmarkPrice) / adjustedBenchmarkPrice) * 10000
						) / 100
						deviationBracket = getDeviationBracket(deviationPercent)

						// 비정상 deviation(>200%)은 벤치마크 미스매치 → 마진 계산 스킵 (Fix 4)
						if (Math.abs(deviationPercent) > 200) {
							marginRate = null
							marginBracket = null
						} else {
							// 업종 표준 마진율로 원가 추정 후 실제 마진 계산 (Fix: margin ≠ deviation)
							const industryMargin = CATEGORY_MARGIN_RATES[mapped.stdCategory] || 0.20
							const estimatedCostPerUnit = adjustedBenchmarkPrice / (1 + industryMargin)
							marginRate = Math.round(
								((comparePrice - estimatedCostPerUnit) / estimatedCostPerUnit) * 10000
							) / 100
							marginBracket = getMarginBracket(marginRate)
						}

						// 추정 원가 총액
						const industryMarginForCost = CATEGORY_MARGIN_RATES[mapped.stdCategory] || 0.20
						estimatedCost = (quantity && quantity > 0)
							? Math.round((adjustedBenchmarkPrice / (1 + industryMarginForCost)) * quantity)
							: Math.round(adjustedBenchmarkPrice / (1 + industryMarginForCost))
						fairPriceMin = Math.round(estimatedCost * (1 + industryMarginForCost * 0.8))
						fairPriceMax = Math.round(estimatedCost * (1 + industryMarginForCost * 1.2))
					}
				}
			}
		}

		return {
			original_category: category,
			original_item_name: itemName,
			original_quantity: quantity,
			original_unit: unit,
			original_unit_price: unitPrice,
			original_total_price: totalPrice,
			std_category: mapped?.stdCategory || null,
			std_item: mapped?.stdItem || null,
			benchmark_unit_price: benchmarkUnitPrice,
			benchmark_unit: benchmarkUnit,
			adjusted_benchmark_price: adjustedBenchmarkPrice,
			deviation_percent: deviationPercent,
			deviation_bracket: deviationBracket,
			unit_mismatch: unitMismatch,
			adjustment_factors: adjustmentFactors,
			is_bundled: isBundled,
			confidence: getConfidence(mapped ? matchTier : null, deviationPercent),
			match_tier: matchTier,
			margin_rate: marginRate,
			margin_bracket: marginBracket,
			estimated_cost: estimatedCost,
			fair_price_min: fairPriceMin,
			fair_price_max: fairPriceMax,
		}
	})

	// 5.5. Cross-grade refinement: items with high deviation (>50%)
	// 등급 미스매치 의심 항목에 대해 다른 등급 벤치마크를 탐색하여 최적 매칭
	// 조건: (1) deviation > 50% AND (2) cross-grade가 50%+ 개선해야 적용
	const CROSS_GRADE_TRIGGER = 50
	const CROSS_GRADE_MIN_IMPROVEMENT = 0.5
	const factorsNoGrade = { ...adjustmentFactors, grade: 1.0 }
	let crossGradeRefined = 0
	for (const item of analyzedItems) {
		if (item.deviation_percent == null || Math.abs(item.deviation_percent) <= CROSS_GRADE_TRIGGER) continue
		if (!item.std_category || !item.std_item) continue
		if (item.unit_mismatch) continue  // 일식 항목은 별도 처리

		const comparePrice = item.original_unit_price ||
			(item.original_total_price && item.original_quantity
				? item.original_total_price / item.original_quantity : null)
		if (!comparePrice || comparePrice <= 0) continue

		let bestDev = Math.abs(item.deviation_percent)
		let bestBench: BenchmarkPrice | null = null
		let bestAdjusted: number | null = null

		for (const bench of benchmarks) {
			if (bench.std_category !== item.std_category) continue
			if (bench.source === 'google_search') continue

			// std_item 직접 매칭 또는 키워드 매핑으로 매칭
			let isMatch = bench.std_item === item.std_item
			if (!isMatch && item.original_item_name) {
				const itemLower = item.original_item_name.toLowerCase()
				for (const [kw, mapped] of Object.entries(ITEM_KEYWORD_MAP)) {
					if (itemLower.includes(kw.toLowerCase()) && bench.std_item === mapped) {
						isMatch = true
						break
					}
				}
			}
			if (!isMatch) continue

			// 등급별 벤치마크를 grade factor 없이 비교 (이미 등급 가격이 반영됨)
			const adjusted = applyAdjustments(bench.unit_price, factorsNoGrade)
			if (adjusted <= 0) continue
			const dev = Math.abs((comparePrice - adjusted) / adjusted * 100)
			if (dev < bestDev) {
				bestDev = dev
				bestBench = bench
				bestAdjusted = adjusted
			}
		}

		const origDev = Math.abs(item.deviation_percent)
		const improvement = origDev > 0 ? 1 - (bestDev / origDev) : 0
		if (bestBench && bestAdjusted && improvement >= CROSS_GRADE_MIN_IMPROVEMENT) {
			item.benchmark_unit_price = bestBench.unit_price
			item.benchmark_unit = bestBench.unit
			item.adjusted_benchmark_price = bestAdjusted
			item.deviation_percent = Math.round(
				((comparePrice - bestAdjusted) / bestAdjusted) * 10000
			) / 100
			item.deviation_bracket = getDeviationBracket(item.deviation_percent)
			item.match_tier = 10
			item.confidence = getConfidence(10, item.deviation_percent)

			// 편차 200% 이하면 마진율 재계산
			if (Math.abs(item.deviation_percent) <= 200) {
				const industryMargin = CATEGORY_MARGIN_RATES[item.std_category] || 0.20
				const estimatedCostPerUnit = bestAdjusted / (1 + industryMargin)
				item.margin_rate = Math.round(
					((comparePrice - estimatedCostPerUnit) / estimatedCostPerUnit) * 10000
				) / 100
				item.margin_bracket = getMarginBracket(item.margin_rate)
				const quantity = item.original_quantity || 1
				item.estimated_cost = Math.round(estimatedCostPerUnit * quantity)
				item.fair_price_min = Math.round(item.estimated_cost * (1 + industryMargin * 0.8))
				item.fair_price_max = Math.round(item.estimated_cost * (1 + industryMargin * 1.2))
			}
			crossGradeRefined++
			console.log(`[AutoAnalysis] Cross-grade refined: ${item.original_item_name} → ${bestBench.grade} ${bestBench.std_item} (${bestBench.unit_price}원), dev: ${item.deviation_percent}%`)
		}
	}
	if (crossGradeRefined > 0) {
		console.log(`[AutoAnalysis] Cross-grade refinement: ${crossGradeRefined}건 개선`)
	}

	// 6. Calculate category scores
	const categoryMap = new Map<string, AnalyzedItem[]>()
	for (const item of analyzedItems) {
		if (!item.std_category) continue
		if (!categoryMap.has(item.std_category)) categoryMap.set(item.std_category, [])
		categoryMap.get(item.std_category)!.push(item)
	}

	const categoryScores: CategoryScore[] = []
	for (const [category, catItems] of categoryMap) {
		const weight = CATEGORY_WEIGHTS[category] || 0.03

		// 마진율 기반 스코어링 (우선), 없으면 deviation 폴백
		const margins = catItems
			.filter(i => i.margin_rate != null)
			.map(i => i.margin_rate!)
		const deviations = catItems
			.filter(i => i.deviation_percent != null)
			.map(i => i.deviation_percent!)

		let avgDeviation: number
		let score: number

		// 개별 비교 신뢰도 판단: 극단적 deviation(>100%) 비율 체크
		const extremeDeviations = deviations.filter(d => Math.abs(d) > 100)
		const unreliableRatio = catItems.length > 0
			? (catItems.length - margins.length + extremeDeviations.length) / catItems.length
			: 0
		const isUnreliable = unreliableRatio > 0.5

		if (margins.length > 0 && !isUnreliable) {
			// 마진율 기반 (primary) — 카테고리별 차등 스코어링
			const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length
			avgDeviation = Math.round(avgMargin * 100) / 100
			score = categoryMarginToScore(avgMargin, category)
		} else {
			// 개별 비교 실패 → 카테고리 총액 비교로 폴백
			const categoryCost = calculateCategoryCost(
				category, benchmarks, adjustmentFactors, targetGrade, input.propertySizeSqm
			)
			const totalQuoted = catItems.reduce((s, i) => s + (i.original_total_price || 0), 0)

			if (categoryCost && categoryCost > 0 && totalQuoted > 0) {
				// 카테고리 전체 견적가 vs 카테고리 합산 원가
				const categoryMargin = ((totalQuoted - categoryCost) / categoryCost) * 100
				avgDeviation = Math.round(categoryMargin * 100) / 100
				score = categoryMarginToScore(categoryMargin, category)
				console.log(`[AutoAnalysis] ${category}: category-level fallback, cost=${categoryCost}, quoted=${totalQuoted}, margin=${avgDeviation}%`)
			} else if (margins.length > 0) {
				// 카테고리 비용 계산 실패 → 기존 마진 사용
				const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length
				avgDeviation = Math.round(avgMargin * 100) / 100
				score = categoryMarginToScore(avgMargin, category)
			} else if (deviations.length > 0) {
				// deviation 폴백 (최후 수단)
				avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
				avgDeviation = Math.round(avgDeviation * 100) / 100
				score = deviationToScore(avgDeviation)
			} else {
				avgDeviation = 0
				score = 70
			}
		}

		categoryScores.push({
			category: category as StdCategory,
			weight,
			avg_deviation: avgDeviation,
			item_count: catItems.length,
			score,
		})
	}

	// 7. Calculate weighted sum
	let totalWeight = 0
	let weightedSum = 0
	for (const cat of categoryScores) {
		weightedSum += cat.score * cat.weight
		totalWeight += cat.weight
	}
	const normalizedSum = totalWeight > 0
		? Math.round((weightedSum / totalWeight) * 100) / 100
		: 70

	// 8. Calculate bonuses and penalties
	const bonuses = calculateBonuses(analyzedItems)
	const penalties = calculatePenalties(analyzedItems, input.propertySizeSqm)

	const bonusTotal = bonuses.reduce((s, b) => s + b.points, 0)
	const penaltyTotal = penalties.reduce((s, p) => s + p.points, 0)

	const finalScore = Math.max(0, Math.min(100,
		Math.round(normalizedSum + bonusTotal + penaltyTotal)
	))

	const scoreBreakdown: ScoreBreakdown = {
		categories: categoryScores,
		bonuses,
		penalties,
		weighted_sum: normalizedSum,
		final_score: finalScore,
	}

	console.log(`[AutoAnalysis] Score: ${finalScore}, Categories: ${categoryScores.length}`)

	// 9. Insert analysis record (1 query)
	const analysisId = crypto.randomUUID()
	await query(
		env.DATABASE_URL,
		`INSERT INTO analyses (
			id, quote_request_id, status, current_step,
			customer_name, property_type, property_size_sqm, region,
			is_vat_included, is_blind_labeling, completeness, pricing_type,
			total_score, score_breakdown,
			created_at, updated_at, completed_at
		) VALUES (
			$1, $2, 'completed', 7,
			$3, $4, $5, $6,
			false, false, 'partial', 'mixed',
			$7, $8,
			NOW(), NOW(), NOW()
		)`,
		[
			analysisId,
			input.quoteRequestId,
			input.customerName,
			input.propertyType,
			input.propertySizeSqm,
			input.region,
			finalScore,
			JSON.stringify(scoreBreakdown),
		]
	)

	// 10. Batch insert analysis items (batches of 10 for wider columns, stay within subrequest limits)
	const BATCH_SIZE = 10
	for (let i = 0; i < analyzedItems.length; i += BATCH_SIZE) {
		const batch = analyzedItems.slice(i, i + BATCH_SIZE)
		const values: unknown[] = []
		const placeholders: string[] = []
		const COLS_PER_ROW = 22

		batch.forEach((item, idx) => {
			const offset = idx * COLS_PER_ROW
			placeholders.push(`(
				$${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
				$${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8},
				$${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12},
				$${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16},
				$${offset + 17}, $${offset + 18}, $${offset + 19}, $${offset + 20},
				$${offset + 21}, $${offset + 22}
			)`)
			values.push(
				crypto.randomUUID(),        // id
				analysisId,                 // analysis_id
				item.original_category,     // original_category
				item.original_item_name,    // original_item_name
				item.original_quantity,      // original_quantity
				item.original_unit,          // original_unit
				item.original_unit_price,    // original_unit_price
				item.original_total_price,   // original_total_price
				item.std_category,           // std_category
				item.std_item,               // std_item
				item.benchmark_unit_price,   // benchmark_unit_price
				item.benchmark_unit,         // benchmark_unit
				item.adjusted_benchmark_price, // adjusted_benchmark_price
				item.deviation_percent,      // deviation_percent
				item.is_bundled,             // is_bundled
				item.unit_mismatch,          // unit_mismatch
				item.margin_rate,            // margin_rate
				item.margin_bracket,         // margin_bracket
				item.estimated_cost,         // estimated_cost
				item.fair_price_min,         // fair_price_min
				item.fair_price_max,         // fair_price_max
				item.confidence,             // confidence
			)
		})

		// NOTE: match_tier is stored in analysis_result JSON, not as a DB column
		// to avoid schema migration. It's accessible via the JSON payload.
		await query(
			env.DATABASE_URL,
			`INSERT INTO analysis_items (
				id, analysis_id, original_category, original_item_name,
				original_quantity, original_unit, original_unit_price, original_total_price,
				std_category, std_item, benchmark_unit_price, benchmark_unit, adjusted_benchmark_price,
				deviation_percent, is_bundled, unit_mismatch,
				margin_rate, margin_bracket, estimated_cost, fair_price_min, fair_price_max, confidence
			) VALUES ${placeholders.join(', ')}`,
			values
		)
	}

	// 11. Update quote_requests status + analysis_result
	await query(
		env.DATABASE_URL,
		`UPDATE quote_requests SET
			status = 'completed',
			analysis_result = $1,
			analyzed_at = NOW(),
			analyzed_by = 'auto-analysis',
			updated_at = NOW()
		WHERE id = $2`,
		[JSON.stringify({
			analysisId,
			estimatedGrade: estimatedGradeInfo,
			...scoreBreakdown,
			adjustmentFactors,
			items: analyzedItems,
			totalItems: analyzedItems.length,
			mappedItems: analyzedItems.filter(i => i.std_category).length,
			benchmarkedItems: analyzedItems.filter(i => i.benchmark_unit_price != null).length,
			// 마진율 요약
			marginAnalysis: (() => {
				const withMargin = analyzedItems.filter(i => i.margin_rate != null)
				if (withMargin.length === 0) return null
				const avgMargin = withMargin.reduce((s, i) => s + i.margin_rate!, 0) / withMargin.length
				const totalEstimatedCost = withMargin.reduce((s, i) => s + (i.estimated_cost || 0), 0)
				const totalQuotePrice = withMargin.reduce((s, i) => s + (i.original_total_price || 0), 0)
				return {
					avgMarginRate: Math.round(avgMargin * 100) / 100,
					totalEstimatedCost,
					totalQuotePrice,
					overallMarginRate: totalEstimatedCost > 0
						? Math.round(((totalQuotePrice - totalEstimatedCost) / totalEstimatedCost) * 10000) / 100
						: null,
					itemCount: withMargin.length,
				}
			})(),
		}), input.quoteRequestId]
	)

	// 12. 미매핑 용어 수집 (매핑 실패 항목 UPSERT)
	const unmappedItems = analyzedItems.filter(i =>
		!i.std_category && (i.original_category || i.original_item_name)
	)
	if (unmappedItems.length > 0) {
		const unmappedBatch = unmappedItems.slice(0, 10) // 최대 10개만 (서브리퀘스트 제한)
		for (const item of unmappedBatch) {
			const searchText = [item.original_category, item.original_item_name]
				.filter(Boolean).join(' :: ').trim()
			if (!searchText) continue

			try {
				await query(
					env.DATABASE_URL,
					`INSERT INTO unmapped_terms (
						original_category, original_item_name, combined_search_text,
						quote_request_id, analysis_id, frequency
					) VALUES ($1, $2, $3, $4, $5, 1)
					ON CONFLICT (combined_search_text) DO UPDATE SET
						frequency = unmapped_terms.frequency + 1,
						last_seen_at = NOW(),
						quote_request_id = $4,
						analysis_id = $5`,
					[
						item.original_category,
						item.original_item_name,
						searchText,
						input.quoteRequestId,
						analysisId,
					]
				)
			} catch (e) {
				// 미매핑 수집 실패는 분석 자체를 실패시키지 않음
				console.warn(`[AutoAnalysis] Unmapped term insert failed: ${searchText}`, e)
			}
		}
		console.log(`[AutoAnalysis] ${unmappedBatch.length}건 미매핑 용어 수집`)
	}

	console.log(`[AutoAnalysis] Completed for ${input.quoteRequestId}. Analysis ID: ${analysisId}`)

	return {
		analysisId,
		scoreBreakdown,
		items: analyzedItems,
		adjustmentFactors,
		totalScore: finalScore,
		grade: getScoreGrade(finalScore),
	}
}
