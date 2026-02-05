// ============================================
// GOI 견적 분석 시스템 v1.6 - TypeScript 타입 정의
// ============================================

// --- 상태 ---

export type AnalysisStatus = 'draft' | 'in_progress' | 'review' | 'completed'

export type DeviationBracket = 'dump_risk' | 'under_warning' | 'good' | 'fair' | 'slightly_high' | 'high'

export type Grade = '가성비' | '중급' | '고급' | '프리미엄'

export type StdCategory =
	| '욕실' | '바닥' | '가구' | '목공' | '전기'
	| '도배' | '철거' | '주방' | '창호' | '페인트' | '기타'

export type CorrectionReasonCode =
	| 'WRONG_GRADE' | 'WRONG_CATEGORY' | 'WRONG_UNIT'
	| 'MISSING_LOGISTICS' | 'BUNDLED_MISSED' | 'BRAND_CONFUSED'
	| 'OCR_MISREAD' | 'OTHER'

export type SuccessReasonCode =
	| 'MATCH_BY_BRAND' | 'MATCH_BY_MARKET_AVG' | 'MATCH_BY_SIMILAR_CASE'
	| 'MATCH_BY_AREA_SCALING' | 'MATCH_BY_SEASONAL' | 'MATCH_BY_DEBUNDLE'

export type ErrorType = 'parsing_error' | 'reasoning_error'

export type ConflictScope = 'GLOBAL' | 'CATEGORY' | 'CASE_SPECIFIC'

export type DecisionLogStatus = 'open' | 'resolved' | 'escalated'

// --- 분석 마스터 ---

export interface Analysis {
	id: string
	quote_request_id: string | null
	status: AnalysisStatus
	current_step: number

	// 고객/업체
	customer_name: string | null
	customer_phone: string | null
	customer_email: string | null
	contractor_name: string | null
	contractor_license: string | null
	contractor_license_verified: boolean

	// 건물 정보
	property_type: string | null
	property_size_sqm: number | null
	region: string | null
	address: string | null

	// 분석 메타
	is_vat_included: boolean
	is_blind_labeling: boolean
	completeness: 'full' | 'partial' | 'minimal'
	pricing_type: 'itemized' | 'lump_sum' | 'mixed'
	quote_date: string | null
	construction_start_month: number | null

	// 점수
	total_score: number | null
	score_breakdown: ScoreBreakdown | null

	// 리뷰어
	reviewed_by: string | null
	reviewer_notes: string | null

	// 타임스탬프
	created_at: string
	updated_at: string
	completed_at: string | null
}

// --- 분석 항목 (Gold Standard 라벨) ---

export interface AnalysisItem {
	id: string
	analysis_id: string

	// 원본
	original_category: string | null
	original_item_name: string | null
	original_quantity: number | null
	original_unit: string | null
	original_unit_price: number | null
	original_total_price: number | null
	original_notes: string | null

	// Gold Standard
	std_category: StdCategory | null
	std_item: string | null
	sub_category: string | null
	attributes: ItemAttributes
	is_bundled: boolean
	components: BundleComponent[]
	debundling_logic: string | null

	// 라벨링
	correction_reason_code: CorrectionReasonCode | null
	success_reason_code: SuccessReasonCode | null
	confidence: number
	reviewed_by: string | null
	reviewer_confidence: number | null
	error_type: ErrorType | null

	// 벤치마크
	benchmark_price_id: string | null
	benchmark_unit_price: number | null
	benchmark_unit: string | null
	adjusted_benchmark_price: number | null
	adjustment_factors: AdjustmentFactors
	deviation_percent: number | null
	deviation_bracket: DeviationBracket | null
	unit_mismatch: boolean

	// VAT
	is_vat_override: boolean
	vat_adjusted_price: number | null

	sort_order: number
	created_at: string
	updated_at: string
}

export interface ItemAttributes {
	brand?: string
	grade?: Grade
	unit_type?: string
	model?: string
	thickness?: string
	material?: string
	feature_evidence?: string
}

export interface BundleComponent {
	name: string
	estimatedRatio: number
	variance_estimate: number
}

export interface AdjustmentFactors {
	area?: number
	region?: number
	year?: number
	grade?: number
	season?: number
	exclusive?: number
}

// --- 점수 ---

export interface ScoreBreakdown {
	categories: CategoryScore[]
	bonuses: ScoreModifier[]
	penalties: ScoreModifier[]
	weighted_sum: number
	final_score: number
}

export interface CategoryScore {
	category: StdCategory
	weight: number
	avg_deviation: number
	item_count: number
	score: number
}

export interface ScoreModifier {
	type: string
	label: string
	points: number
	reason?: string
}

// --- Decision Log ---

export interface DecisionLog {
	id: string
	analysis_id: string
	item_id: string | null
	dispute_type: string
	dispute_description: string
	resolution: string | null
	resolved_by: string | null
	resolution_reasoning: string | null
	status: DecisionLogStatus
	created_at: string
	resolved_at: string | null
}

// --- Conflict Rule ---

export interface ConflictRule {
	id: string
	rule_name: string
	description: string
	scope: ConflictScope
	category: string | null
	conditions: Record<string, unknown>
	actions: Record<string, unknown>
	priority: number
	supersedes: string[]
	is_active: boolean
	created_by: string | null
	created_at: string
	updated_at: string
}

// --- Benchmark Price ---

export interface BenchmarkPrice {
	id: string
	std_category: string
	std_item: string
	sub_category: string | null
	unit_price: number
	unit: string
	grade: Grade
	brand: string | null
	model: string | null
	material: string | null
	thickness: string | null
	source: string | null
	region: string
	reference_date: string | null
	is_active: boolean
	created_at: string
	updated_at: string
}

// --- Category Mapping ---

export interface CategoryMapping {
	id: string
	original_name: string
	std_category: string
	std_item: string
	aliases: string[]
	frequency: number
	is_verified: boolean
	verified_by: string | null
	created_at: string
	updated_at: string
}

// --- API Request/Response ---

export interface CreateAnalysisRequest {
	quoteRequestId?: string
	customerName?: string
	customerPhone?: string
	propertyType?: string
	propertySizeSqm?: number
	region?: string
}

export interface AnalysisListFilters {
	status?: AnalysisStatus
	reviewer?: string
	page?: number
	limit?: number
}
