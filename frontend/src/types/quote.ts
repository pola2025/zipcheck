export type RiskLevel = 'low' | 'medium' | 'high'

export type PriceEvaluation = 'appropriate' | 'high' | 'low'

// 종합 견적 등급
export type OverallGrade =
	| 'WARNING'        // 주의: 가격 과다 또는 위험 요소 많음
	| 'APPROPRIATE_A'  // 적정 A: 매우 합리적
	| 'APPROPRIATE_B'  // 적정 B: 합리적
	| 'APPROPRIATE_C'  // 적정 C: 수용 가능
	| 'PREMIUM'        // 프리미엄: 브랜드 프리미엄 포함

export type QuoteLineItem = {
	id: string
	category: string
	name: string
	description?: string
	amount: number
}

export type QuoteAnalysis = {
	itemId: string
	priceEvaluation: PriceEvaluation
	marketPriceDiff: number // % 차이 (+ 높음, - 낮음)
	appropriatePrice: number
	hasBrandPremium: boolean
	premiumFactors?: string[]
	riskLevel: RiskLevel
	expertComment: string
	checkpoints: string[]
	alternatives?: string[]
}

export type QuoteSummary = {
	originalAmount: number
	appropriateAmount: number
	savingsAmount: number
	savingsPercent: number
	overallGrade: OverallGrade
	overallGradeDisplay?: string // 표시용 텍스트 (예: "B+")
	overallComment: string
	premiumFactors?: string[] // 프리미엄인 경우 요소 목록
}

export type QuoteExample = {
	summary: QuoteSummary
	items: QuoteLineItem[]
	analyses: QuoteAnalysis[]
}
