/**
 * GOI 견적 자동 분석 엔진 (Backend)
 * scoring.ts + adjustments.ts 로직을 Workers 백엔드로 포팅
 */

import type { Env } from '../types'
import { query } from '../lib/db'

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

function marginToScore(marginRate: number): number {
	if (marginRate < 0) return 35          // 마이너스 마진 = 데이터 오류 가능성
	if (marginRate < 5) return 55          // 덤핑 위험
	if (marginRate < 10) return 78         // 저마진
	if (marginRate < 15) return 88         // 적정 근접
	if (marginRate <= 25) return 95        // 적정
	if (marginRate <= 30) return 85        // 약간 높음
	if (marginRate <= 40) return 70        // 높음
	if (marginRate <= 60) return 50        // 과다
	if (marginRate <= 80) return 35        // 매우 과다
	return 20                              // 비정상
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

const CATEGORY_WEIGHTS: Record<string, number> = {
	'욕실': 0.18, '바닥': 0.17, '주방': 0.14, '목공': 0.12,
	'전기': 0.08, '도배': 0.07, '철거': 0.06, '가구': 0.06,
	'창호': 0.05, '페인트': 0.04, '기타': 0.03,
}

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

	const searchTerms = [
		category?.trim().toLowerCase(),
		itemName?.trim().toLowerCase(),
	].filter(Boolean) as string[]

	for (const mapping of mappings) {
		const originalLower = mapping.original_name.toLowerCase()
		const allNames = [originalLower, ...(mapping.aliases || []).map(a => a.toLowerCase())]

		for (const term of searchTerms) {
			for (const name of allNames) {
				if (term.includes(name) || name.includes(term)) {
					return {
						stdCategory: mapping.std_category as StdCategory,
						stdItem: mapping.std_item,
					}
				}
			}
		}
	}

	// Fallback: direct category name match
	const stdCategories: StdCategory[] = ['욕실', '바닥', '가구', '목공', '전기', '도배', '철거', '주방', '창호', '페인트']
	for (const stdCat of stdCategories) {
		for (const term of searchTerms) {
			if (term.includes(stdCat)) {
				return { stdCategory: stdCat, stdItem: itemName || category || stdCat }
			}
		}
	}

	return null
}

function findBenchmark(
	stdCategory: string,
	stdItem: string,
	benchmarks: BenchmarkPrice[],
	grade: string
): BenchmarkPrice | null {
	const isManual = (b: BenchmarkPrice) => b.source !== 'google_search'
	const isGoogleReliable = (b: BenchmarkPrice) =>
		b.source === 'google_search' && b.model !== 'low'

	// 1차: 수동 벤치마크 exact match (수동 우선)
	const manualExact = benchmarks.find(
		b => isManual(b) && b.std_category === stdCategory && b.std_item === stdItem && b.grade === grade
	)
	if (manualExact) return manualExact

	// 2차: 수동 벤치마크 — 같은 카테고리 + 등급
	const manualCatGrade = benchmarks.find(
		b => isManual(b) && b.std_category === stdCategory && b.grade === grade
	)
	if (manualCatGrade) return manualCatGrade

	// 3차: 구글 벤치마크 exact match (신뢰도 high/medium만)
	const googleExact = benchmarks.find(
		b => isGoogleReliable(b) && b.std_category === stdCategory && b.std_item === stdItem
	)
	if (googleExact) return googleExact

	// 4차: 수동 벤치마크 — 같은 카테고리 + 중급
	const catDefault = benchmarks.find(
		b => isManual(b) && b.std_category === stdCategory && b.grade === '중급'
	)
	if (catDefault) return catDefault

	// 5차: 구글 벤치마크 — 같은 카테고리 (신뢰도 무관)
	const googleCat = benchmarks.find(
		b => b.source === 'google_search' && b.std_category === stdCategory
	)
	if (googleCat) return googleCat

	// 6차: 아무거나 (기존 fallback)
	const catAny = benchmarks.find(b => b.std_category === stdCategory)
	return catAny || null
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

	const targetGrade = input.grade || '중급'

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

		if (mapped) {
			const bench = findBenchmark(mapped.stdCategory, mapped.stdItem, benchmarks, targetGrade)
			if (bench) {
				benchmarkUnitPrice = bench.unit_price
				benchmarkUnit = bench.unit
				adjustedBenchmarkPrice = applyAdjustments(bench.unit_price, adjustmentFactors)

				// 단위 기반 비교 — 면적 단위(㎡, m2, 평) 벤치마크 vs 합산 총액 견적 감지
				const areaUnits = ['㎡', 'm2', 'm²', '평', '자']
				const lumpUnits = ['식', '일식', '세트', '개소', '조']
				const benchIsAreaBased = areaUnits.some(u => bench.unit?.includes(u))
				const quoteIsLumpSum = isBundled || lumpUnits.some(u => unit?.includes(u) || false)
					|| (!unitPrice && quantity === 1)

				if (benchIsAreaBased && quoteIsLumpSum) {
					// 단위 불일치: 면적 환산으로 원가 추정 → 마진율 계산
					unitMismatch = true
					deviationPercent = null
					deviationBracket = null

					// 카테고리 구성요소 합산 기반 원가 추정 (Fix 3)
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
							marginRate = deviationPercent
							marginBracket = getMarginBracket(marginRate)
						}

						// 추정 원가 총액
						estimatedCost = (quantity && quantity > 0)
							? Math.round(adjustedBenchmarkPrice * quantity)
							: adjustedBenchmarkPrice
						fairPriceMin = Math.round(estimatedCost * 1.15)
						fairPriceMax = Math.round(estimatedCost * 1.25)
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
			confidence: !mapped ? 0.3
				: (deviationPercent != null && Math.abs(deviationPercent) > 200) ? 0.4  // 벤치마크 미스매치 가능
				: 0.8,
			margin_rate: marginRate,
			margin_bracket: marginBracket,
			estimated_cost: estimatedCost,
			fair_price_min: fairPriceMin,
			fair_price_max: fairPriceMax,
		}
	})

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
			// 마진율 기반 (primary) — 개별 비교가 신뢰할 만할 때만
			const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length
			avgDeviation = Math.round(avgMargin * 100) / 100
			score = marginToScore(avgMargin)
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
				score = marginToScore(categoryMargin)
				console.log(`[AutoAnalysis] ${category}: category-level fallback, cost=${categoryCost}, quoted=${totalQuoted}, margin=${avgDeviation}%`)
			} else if (margins.length > 0) {
				// 카테고리 비용 계산 실패 → 기존 마진 사용
				const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length
				avgDeviation = Math.round(avgMargin * 100) / 100
				score = marginToScore(avgMargin)
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

	// 10. Batch insert analysis items (batches of 20 to stay within subrequest limits)
	const BATCH_SIZE = 20
	for (let i = 0; i < analyzedItems.length; i += BATCH_SIZE) {
		const batch = analyzedItems.slice(i, i + BATCH_SIZE)
		const values: unknown[] = []
		const placeholders: string[] = []

		batch.forEach((item, idx) => {
			const offset = idx * 16
			placeholders.push(`(
				$${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
				$${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8},
				$${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12},
				$${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}
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
			)
		})

		await query(
			env.DATABASE_URL,
			`INSERT INTO analysis_items (
				id, analysis_id, original_category, original_item_name,
				original_quantity, original_unit, original_unit_price, original_total_price,
				std_category, std_item, benchmark_unit_price, benchmark_unit, adjusted_benchmark_price,
				deviation_percent, is_bundled, unit_mismatch
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
