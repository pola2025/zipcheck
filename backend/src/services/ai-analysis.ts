import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../lib/supabase'

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
	apiKey: process.env.CLAUDE_API_KEY
})

interface QuoteItem {
	category: string
	itemName: string
	quantity: number
	unit?: string
	unitPrice: number
	totalPrice: number
	notes?: string
}

interface QuoteAnalysisRequest {
	items: QuoteItem[]
	propertyType?: string
	propertySize?: number
	region?: string
}

interface MarketComparison {
	itemName: string
	quotedPrice: number
	marketAverage: number
	marketMin: number
	marketMax: number
	priceEvaluation: 'low' | 'fair' | 'high'
	priceDifference: number
	priceDifferencePercent: number
}

interface ItemAnalysis {
	category: string
	item: string
	estimatePrice: number
	marketAverage: number
	difference: number
	differencePercent: number
	evaluation: 'good' | 'fair' | 'expensive'
	marginEstimate?: number
	comment?: string
}

interface CriteriaScore {
	criteria: string
	score: number
	market: number
	comment?: string
}

interface MarginAnalysis {
	estimatedMargin: number
	evaluation: string
	isNormal: boolean
	comment: string
}

interface QuoteAnalysisResult {
	overallScore: number // 0-100
	priceLevel: 'low' | 'fair' | 'high' | 'very-high'
	totalEstimate: number
	marketAverage: number
	recommendedPrice: number
	savings: number
	savingsPercent: number

	marginAnalysis: MarginAnalysis

	itemAnalysis: ItemAnalysis[]

	criteriaScores: CriteriaScore[]

	aiInsights: {
		summary: string
		warnings: string[]
		recommendations: string[]
	}
}

/**
 * 견적서 분석 메인 함수
 */
export async function analyzeQuote(
	request: QuoteAnalysisRequest
): Promise<QuoteAnalysisResult> {
	console.log('🤖 Starting AI quote analysis...')

	// 1. 시장 데이터 조회
	const marketData = await fetchMarketData(request.items)

	// 2. 가격 비교
	const itemComparisons = compareWithMarket(request.items, marketData)

	// 3. 총액 계산
	const totalEstimate = request.items.reduce((sum, item) => sum + item.totalPrice, 0)
	const marketAverage = itemComparisons.reduce((sum, comp) => sum + comp.marketAverage, 0)
	const savings = totalEstimate - marketAverage
	const savingsPercent = marketAverage > 0 ? (savings / marketAverage) * 100 : 0

	// 4. 가격 수준 판단
	const priceLevel = getPriceLevel(savingsPercent)

	// 5. 권장가 계산 (시장 평균 + 정상 마진 15%)
	const recommendedPrice = Math.round(marketAverage * 1.15)

	// 6. 마진 분석
	const marginAnalysis = analyzeMargin(totalEstimate, marketAverage)

	// 7. 항목별 상세 분석
	const itemAnalysis = itemComparisons.map((comp) => ({
		category: request.items.find((item) => item.itemName === comp.itemName)?.category || '기타',
		item: comp.itemName,
		estimatePrice: comp.quotedPrice,
		marketAverage: comp.marketAverage,
		difference: comp.priceDifference,
		differencePercent: comp.priceDifferencePercent,
		evaluation: getItemEvaluation(comp.priceDifferencePercent),
		marginEstimate: comp.marketAverage > 0 ? ((comp.quotedPrice - comp.marketAverage) / comp.marketAverage) * 100 : 0,
		comment: getItemComment(comp)
	}))

	// 8. 기준별 점수 (레이더 차트용)
	const criteriaScores = generateCriteriaScores(itemAnalysis, savingsPercent)

	// 9. 종합 점수 계산 (0-100)
	const overallScore = calculateOverallScore(criteriaScores, marginAnalysis, savingsPercent)

	// 10. AI 인사이트 생성
	const aiInsights = await generateAIInsightsNew(
		request,
		itemAnalysis,
		totalEstimate,
		marketAverage,
		savingsPercent,
		marginAnalysis
	)

	return {
		overallScore,
		priceLevel,
		totalEstimate,
		marketAverage,
		recommendedPrice,
		savings,
		savingsPercent,
		marginAnalysis,
		itemAnalysis,
		criteriaScores,
		aiInsights
	}
}

/**
 * 시장 데이터 조회
 */
async function fetchMarketData(items: QuoteItem[]) {
	const marketData: Record<string, any> = {}

	for (const item of items) {
		// 항목명으로 아이템 찾기
		const { data: dbItems } = await supabase
			.from('items')
			.select('id, name, category_id, categories(name)')
			.ilike('name', `%${item.itemName}%`)
			.limit(1)

		if (dbItems && dbItems.length > 0) {
			const dbItem = dbItems[0]

			// 시장 평균 데이터 조회 (최근 분기)
			const { data: avgData } = await supabase
				.from('market_averages')
				.select('*')
				.eq('item_id', dbItem.id)
				.order('year', { ascending: false })
				.order('quarter', { ascending: false })
				.limit(1)
				.single()

			// 유통사 가격 데이터 조회 (현재 가격)
			const { data: distributorPrices } = await supabase
				.from('distributor_prices')
				.select('*')
				.eq('item_id', dbItem.id)
				.eq('is_current', true)

			marketData[item.itemName] = {
				item: dbItem,
				average: avgData,
				distributorPrices: distributorPrices || []
			}
		}
	}

	return marketData
}

/**
 * 시장 가격과 비교
 */
function compareWithMarket(
	items: QuoteItem[],
	marketData: Record<string, any>
): MarketComparison[] {
	return items.map((item) => {
		const market = marketData[item.itemName]

		if (!market || !market.average) {
			// 시장 데이터가 없는 경우
			return {
				itemName: item.itemName,
				quotedPrice: item.totalPrice,
				marketAverage: item.totalPrice,
				marketMin: item.totalPrice,
				marketMax: item.totalPrice,
				priceEvaluation: 'fair' as const,
				priceDifference: 0,
				priceDifferencePercent: 0
			}
		}

		const marketAvg = Number(market.average.avg_total_cost) || 0
		const marketMin = Number(market.average.min_cost) || 0
		const marketMax = Number(market.average.max_cost) || 0

		const diff = item.totalPrice - marketAvg
		const diffPercent = marketAvg > 0 ? (diff / marketAvg) * 100 : 0

		// 가격 평가
		let evaluation: 'low' | 'fair' | 'high' = 'fair'
		if (diffPercent > 15) {
			evaluation = 'high'
		} else if (diffPercent < -15) {
			evaluation = 'low'
		}

		return {
			itemName: item.itemName,
			quotedPrice: item.totalPrice,
			marketAverage: marketAvg,
			marketMin,
			marketMax,
			priceEvaluation: evaluation,
			priceDifference: diff,
			priceDifferencePercent: diffPercent
		}
	})
}

/**
 * 가격 수준 판단
 */
function getPriceLevel(savingsPercent: number): 'low' | 'fair' | 'high' | 'very-high' {
	if (savingsPercent <= -10) return 'low' // 시장가보다 10% 이상 저렴
	if (savingsPercent <= 5) return 'fair' // 시장가 대비 -10% ~ +5%
	if (savingsPercent <= 15) return 'high' // 시장가보다 5-15% 높음
	return 'very-high' // 시장가보다 15% 이상 높음
}

/**
 * 마진 분석
 */
function analyzeMargin(totalEstimate: number, marketAverage: number): MarginAnalysis {
	const estimatedMargin = marketAverage > 0 ? ((totalEstimate - marketAverage) / marketAverage) * 100 : 0
	const isNormal = estimatedMargin >= 10 && estimatedMargin <= 20

	let evaluation: string
	let comment: string

	if (estimatedMargin < 10) {
		evaluation = '낮음'
		comment = '업체 마진이 정상 범위(10-20%)보다 낮습니다. 품질이나 시공 보증을 꼼꼼히 확인하세요.'
	} else if (estimatedMargin <= 20) {
		evaluation = '적정'
		comment = '업체 마진이 정상 범위(10-20%) 내에 있습니다.'
	} else if (estimatedMargin <= 30) {
		evaluation = '높음'
		comment = '업체 마진이 정상 범위(10-20%)보다 높습니다. 가격 협상을 시도해보세요.'
	} else {
		evaluation = '매우 높음'
		comment = '업체 마진이 정상 범위를 크게 벗어납니다. 다른 업체 견적과 비교 필수입니다.'
	}

	return {
		estimatedMargin,
		evaluation,
		isNormal,
		comment
	}
}

/**
 * 항목 평가
 */
function getItemEvaluation(diffPercent: number): 'good' | 'fair' | 'expensive' {
	if (diffPercent <= -5) return 'good' // 시장가보다 5% 이상 저렴
	if (diffPercent <= 10) return 'fair' // 시장가 대비 -5% ~ +10%
	return 'expensive' // 시장가보다 10% 이상 높음
}

/**
 * 항목별 코멘트
 */
function getItemComment(comp: MarketComparison): string {
	if (comp.priceDifferencePercent > 20) {
		return '시장 평균보다 상당히 높은 가격입니다. 다른 업체 견적과 비교를 권장합니다.'
	} else if (comp.priceDifferencePercent > 10) {
		return '시장 평균보다 다소 높습니다. 가격 협상 여지가 있습니다.'
	} else if (comp.priceDifferencePercent < -10) {
		return '시장 평균보다 저렴합니다. 자재 품질을 확인하세요.'
	} else {
		return '적정 가격 범위입니다.'
	}
}

/**
 * 레이더 차트용 기준별 점수 생성
 */
function generateCriteriaScores(itemAnalysis: ItemAnalysis[], savingsPercent: number): CriteriaScore[] {
	// 가격경쟁력: 시장 평균 대비 얼마나 저렴한가 (낮을수록 좋음)
	const priceCompetitiveness = Math.max(0, Math.min(100, 100 - savingsPercent * 2))

	// 품질: 항목별 평가 기반 (적정가 항목이 많을수록 좋음)
	const goodItems = itemAnalysis.filter((item) => item.evaluation === 'good').length
	const quality = Math.min(100, (goodItems / itemAnalysis.length) * 100 + 50)

	// 시공성: 중간값 기준 (실제 데이터 없으므로 평균치)
	const workability = 70

	// 내구성: 중간값 기준
	const durability = 75

	// 디자인: 중간값 기준
	const design = 70

	return [
		{ criteria: '시공자재 퀄리티', score: Math.round(quality), market: 70, comment: '자재 및 시공 품질 평가' },
		{
			criteria: '가격경쟁력',
			score: Math.round(priceCompetitiveness),
			market: 70,
			comment: '시장 대비 가격 경쟁력'
		},
		{ criteria: '시공성', score: Math.round(workability), market: 70, comment: '시공 난이도 및 기간' },
		{ criteria: '예상 마감완성도', score: Math.round(durability), market: 70, comment: '자재 및 시공 내구성' },
		{ criteria: '디자인', score: Math.round(design), market: 70, comment: '디자인 완성도' }
	]
}

/**
 * 종합 점수 계산 (0-100)
 */
function calculateOverallScore(
	criteriaScores: CriteriaScore[],
	marginAnalysis: MarginAnalysis,
	savingsPercent: number
): number {
	// 기준별 점수 평균
	const avgCriteriaScore = criteriaScores.reduce((sum, c) => sum + c.score, 0) / criteriaScores.length

	// 마진 점수 (10-20% 범위면 만점)
	const marginScore = marginAnalysis.isNormal ? 100 : Math.max(0, 100 - Math.abs(marginAnalysis.estimatedMargin - 15) * 3)

	// 가격 점수 (시장 평균 대비)
	const priceScore = Math.max(0, Math.min(100, 100 - Math.abs(savingsPercent) * 2))

	// 가중 평균 (기준 50%, 마진 30%, 가격 20%)
	const overallScore = avgCriteriaScore * 0.5 + marginScore * 0.3 + priceScore * 0.2

	return Math.round(overallScore)
}

/**
 * AI 인사이트 생성
 */
async function generateAIInsightsNew(
	request: QuoteAnalysisRequest,
	itemAnalysis: ItemAnalysis[],
	totalEstimate: number,
	marketAverage: number,
	savingsPercent: number,
	marginAnalysis: MarginAnalysis
): Promise<{ summary: string; warnings: string[]; recommendations: string[] }> {
	const warnings: string[] = []
	const recommendations: string[] = []

	// 경고사항 생성
	if (savingsPercent > 15) {
		warnings.push('견적가가 시장 평균보다 15% 이상 높습니다.')
	}
	if (!marginAnalysis.isNormal && marginAnalysis.estimatedMargin > 20) {
		warnings.push('업체 마진이 정상 범위(10-20%)를 초과합니다.')
	}
	const expensiveItems = itemAnalysis.filter((item) => item.evaluation === 'expensive')
	if (expensiveItems.length > 0) {
		warnings.push(`${expensiveItems.length}개 항목이 시장가보다 높게 책정되어 있습니다.`)
	}

	// 권장사항 생성
	if (savingsPercent > 10) {
		recommendations.push('가격 협상을 통해 시장 평균 수준으로 조정을 요청하세요.')
	}
	if (expensiveItems.length > 0) {
		const topExpensive = expensiveItems.sort((a, b) => b.differencePercent - a.differencePercent)[0]
		recommendations.push(`"${topExpensive.item}" 항목의 가격을 중점적으로 협상하세요.`)
	}
	if (marginAnalysis.isNormal && savingsPercent <= 5) {
		recommendations.push('전반적으로 합리적인 견적입니다. 품질과 A/S 조건을 확인 후 진행하세요.')
	}
	recommendations.push('최소 2-3개 업체의 견적을 비교 검토하는 것을 권장합니다.')

	// AI 요약 생성
	const prompt = `당신은 인테리어 견적 분석 전문가입니다. 다음 견적 분석 결과를 2-3문장으로 요약해주세요.

**견적 정보:**
- 총 견적가: ${totalEstimate.toLocaleString()}원
- 시장 평균: ${marketAverage.toLocaleString()}원
- 차이: ${savingsPercent > 0 ? '+' : ''}${savingsPercent.toFixed(1)}%
- 업체 마진: ${marginAnalysis.estimatedMargin.toFixed(1)}% (정상 범위: 10-20%)

**항목 분석:**
- 적정가 항목: ${itemAnalysis.filter((i) => i.evaluation === 'good').length}개
- 보통 항목: ${itemAnalysis.filter((i) => i.evaluation === 'fair').length}개
- 고가 항목: ${itemAnalysis.filter((i) => i.evaluation === 'expensive').length}개

전문가 입장에서 이 견적에 대한 종합 평가를 간결하게 제공해주세요.`

	let summary: string
	try {
		const message = await anthropic.messages.create({
			model: 'claude-3-5-sonnet-20241022',
			max_tokens: 300,
			messages: [{ role: 'user', content: prompt }]
		})

		const textContent = message.content.find((block) => block.type === 'text')
		summary = textContent && 'text' in textContent ? textContent.text : '이 견적은 전반적인 검토가 필요합니다.'
	} catch (error) {
		console.error('AI 요약 생성 실패:', error)
		summary = '이 견적은 전반적인 검토가 필요합니다.'
	}

	return {
		summary,
		warnings,
		recommendations
	}
}
