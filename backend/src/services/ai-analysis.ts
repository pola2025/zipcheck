import OpenAI from 'openai'
import { query } from '../lib/db'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
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
	roomAreas?: Record<string, number> // 도면 분석으로 추출된 공간별 면적 (예: { "주방": 5.5, "거실": 15.3 })
}

// 새로운 분석 결과 구조 (집첵 권장사항)
export interface AnalysisResult {
	// 1. 종합 평가
	overallScore: number // 0-100
	totalAmount: number // 총 견적액
	averageMarketPrice: number // 시장 평균가
	priceRating: 'low' | 'reasonable' | 'high' | 'very_high' // 가격 수준

	// 2. 요약 (긍정/부정/경고)
	summary: {
		positive: string[] // 긍정적 평가
		negative: string[] // 부정적 평가
		warnings: string[] // 주의사항
	}

	// 3. 카테고리별 분석
	categoryAnalysis: Array<{
		category: string
		totalCost: number
		marketAverage: number
		rating: 'good' | 'reasonable' | 'slightly_high' | 'high'
		percentage: number
		items: number
		findings: string[]
	}>

	// 4. 집첵 권장사항
	recommendations: Array<{
		type: 'cost_reduction' | 'quality_improvement' | 'warning'
		title: string
		description: string
		potentialSaving?: number
	}>

	// 5. 시장 비교
	marketComparison: {
		averagePriceRange: {
			min: number
			max: number
		}
		currentQuote: number
		percentile: number
		similarCases: Array<{
			location: string
			size: number // ㎡
			cost: number
			year: number
		}>
	}

	// 6. 전문가 의견 (항목별)
	expertNotes: Record<string, string>
}

interface MarketData {
	itemName: string
	category: string
	avgCost: number
	minCost: number
	maxCost: number
	hasData: boolean
}

/**
 * 견적서 분석 메인 함수 (집첵 권장사항)
 * - 모든 데이터는 DB에서 조회
 * - 할루시네이션 방지: 데이터가 없으면 "데이터 부족"으로 표시
 */
export async function analyzeQuote(
	request: QuoteAnalysisRequest
): Promise<AnalysisResult> {
	console.log('📊 Starting ZipCheck quote analysis...')

	// 1. 시장 데이터 조회 (DB 기반)
	const marketDataMap = await fetchMarketDataFromDB(request.items)

	// 2. 카테고리별 집계
	const categoryMap = new Map<string, {
		totalCost: number
		items: QuoteItem[]
		marketData: MarketData[]
	}>()

	request.items.forEach(item => {
		if (!categoryMap.has(item.category)) {
			categoryMap.set(item.category, { totalCost: 0, items: [], marketData: [] })
		}
		const cat = categoryMap.get(item.category)!
		cat.totalCost += item.totalPrice
		cat.items.push(item)
		const market = marketDataMap.get(item.itemName)
		if (market) {
			cat.marketData.push(market)
		}
	})

	// 3. 총액 계산
	const totalAmount = request.items.reduce((sum, item) => sum + item.totalPrice, 0)

	// 4. 시장 평균 계산 (실제 DB 데이터만 사용)
	let averageMarketPrice = 0
	let marketDataCount = 0

	request.items.forEach(item => {
		const market = marketDataMap.get(item.itemName)
		if (market && market.hasData && market.avgCost > 0) {
			averageMarketPrice += market.avgCost * item.quantity
			marketDataCount++
		} else {
			// 시장 데이터가 없는 경우 견적가를 기준으로 사용
			averageMarketPrice += item.totalPrice
		}
	})

	// 5. 가격 수준 판단
	const priceDiff = totalAmount - averageMarketPrice
	const priceDiffPercent = averageMarketPrice > 0 ? (priceDiff / averageMarketPrice) * 100 : 0
	const priceRating = getPriceRating(priceDiffPercent)

	// 6. 카테고리별 분석
	const categoryAnalysis = Array.from(categoryMap.entries()).map(([category, data]) => {
		const marketAvg = data.marketData.reduce((sum, m) => sum + m.avgCost, 0)
		const rating = getCategoryRating(data.totalCost, marketAvg)
		const percentage = totalAmount > 0 ? (data.totalCost / totalAmount) * 100 : 0

		// 카테고리별 발견사항 (데이터 기반)
		const findings: string[] = []
		data.items.forEach(item => {
			const market = marketDataMap.get(item.itemName)
			if (market && market.hasData) {
				const itemDiff = ((item.totalPrice - market.avgCost) / market.avgCost) * 100
				if (itemDiff > 15) {
					findings.push(`${item.itemName}: 시장가 대비 ${itemDiff.toFixed(1)}% 높음`)
				} else if (itemDiff < -15) {
					findings.push(`${item.itemName}: 시장가 대비 ${Math.abs(itemDiff).toFixed(1)}% 저렴 (품질 확인 필요)`)
				}
			} else {
				findings.push(`${item.itemName}: 시장 데이터 부족`)
			}
		})

		return {
			category,
			totalCost: data.totalCost,
			marketAverage: marketAvg,
			rating,
			percentage,
			items: data.items.length,
			findings: findings.slice(0, 3) // 최대 3개
		}
	})

	// 7. 요약 생성 (데이터 기반)
	const summary = generateSummary(
		totalAmount,
		averageMarketPrice,
		priceDiffPercent,
		categoryAnalysis,
		marketDataCount,
		request.items.length
	)

	// 8. 집첵 권장사항 생성 (데이터 기반)
	const recommendations = generateRecommendations(
		totalAmount,
		averageMarketPrice,
		priceDiffPercent,
		categoryAnalysis,
		request.items
	)

	// 9. 시장 비교 데이터 조회
	const marketComparison = await fetchMarketComparison(
		request.propertySize || 0,
		request.propertyType || '',
		totalAmount
	)

	// 10. 전문가 의견 (항목별)
	const expertNotes: Record<string, string> = {}
	request.items.forEach(item => {
		const market = marketDataMap.get(item.itemName)
		if (market && market.hasData) {
			const key = `${item.category}-${item.itemName}`
			expertNotes[key] = generateExpertNote(item, market)
		}
	})

	// 11. 종합 점수 계산
	const overallScore = calculateOverallScore(
		priceDiffPercent,
		categoryAnalysis,
		marketDataCount,
		request.items.length
	)

	console.log(`✅ ZipCheck analysis completed (Score: ${overallScore})`)

	return {
		overallScore,
		totalAmount,
		averageMarketPrice,
		priceRating,
		summary,
		categoryAnalysis,
		recommendations,
		marketComparison,
		expertNotes
	}
}

/**
 * 시장 데이터 조회 (PostgreSQL DB)
 */
async function fetchMarketDataFromDB(items: QuoteItem[]): Promise<Map<string, MarketData>> {
	const marketDataMap = new Map<string, MarketData>()

	for (const item of items) {
		try {
			// 항목명으로 아이템 찾기
			const itemResult = await query(
				`SELECT i.id, i.name, c.name as category_name
				FROM items i
				LEFT JOIN categories c ON i.category_id = c.id
				WHERE i.name ILIKE $1
				LIMIT 1`,
				[`%${item.itemName}%`]
			)

			if (itemResult.rows.length > 0) {
				const dbItem = itemResult.rows[0]

				// 시장 평균 데이터 조회 (최근 분기)
				const avgResult = await query(
					`SELECT avg_total_cost, min_cost, max_cost, year, quarter
					FROM market_averages
					WHERE item_id = $1
					ORDER BY year DESC, quarter DESC
					LIMIT 1`,
					[dbItem.id]
				)

				if (avgResult.rows.length > 0) {
					const avg = avgResult.rows[0]
					marketDataMap.set(item.itemName, {
						itemName: item.itemName,
						category: item.category,
						avgCost: Number(avg.avg_total_cost) || 0,
						minCost: Number(avg.min_cost) || 0,
						maxCost: Number(avg.max_cost) || 0,
						hasData: true
					})
					continue
				}
			}

			// 데이터가 없는 경우
			marketDataMap.set(item.itemName, {
				itemName: item.itemName,
				category: item.category,
				avgCost: 0,
				minCost: 0,
				maxCost: 0,
				hasData: false
			})
		} catch (error) {
			console.error(`Market data fetch error for ${item.itemName}:`, error)
			marketDataMap.set(item.itemName, {
				itemName: item.itemName,
				category: item.category,
				avgCost: 0,
				minCost: 0,
				maxCost: 0,
				hasData: false
			})
		}
	}

	return marketDataMap
}

/**
 * 시장 비교 데이터 조회
 */
async function fetchMarketComparison(
	propertySize: number,
	propertyType: string,
	currentQuote: number
): Promise<AnalysisResult['marketComparison']> {
	// 유사 사례 조회 (실제 완료된 견적들)
	try {
		const casesResult = await query(
			`SELECT
				region as location,
				property_size as size,
				(SELECT SUM((item->>'totalPrice')::numeric) FROM jsonb_array_elements(items) as item) as cost,
				EXTRACT(YEAR FROM created_at) as year
			FROM quote_requests
			WHERE status = 'completed'
				AND property_size BETWEEN $1 AND $2
				AND property_type = $3
			ORDER BY created_at DESC
			LIMIT 5`,
			[propertySize * 0.8, propertySize * 1.2, propertyType]
		)

		const similarCases = casesResult.rows
			.filter(row => row.cost && row.cost > 0)
			.map(row => ({
				location: row.location || '서울',
				size: Number(row.size) || propertySize,
				cost: Number(row.cost) || 0,
				year: Number(row.year) || 2025
			}))

		// 가격 범위 계산
		if (similarCases.length > 0) {
			const costs = similarCases.map(c => c.cost)
			const min = Math.min(...costs)
			const max = Math.max(...costs)
			const avg = costs.reduce((sum, c) => sum + c, 0) / costs.length

			// 백분위 계산
			const lowerCount = similarCases.filter(c => c.cost < currentQuote).length
			const percentile = Math.round((lowerCount / similarCases.length) * 100)

			return {
				averagePriceRange: { min, max },
				currentQuote,
				percentile,
				similarCases
			}
		}
	} catch (error) {
		console.error('Market comparison fetch error:', error)
	}

	// 데이터가 없는 경우 기본값 (평수 기반 추정)
	const estimatedMin = propertySize * 300000 // ㎡당 30만원
	const estimatedMax = propertySize * 500000 // ㎡당 50만원

	return {
		averagePriceRange: {
			min: estimatedMin,
			max: estimatedMax
		},
		currentQuote,
		percentile: 50, // 중간값
		similarCases: []
	}
}

/**
 * 가격 수준 판단
 */
function getPriceRating(diffPercent: number): AnalysisResult['priceRating'] {
	if (diffPercent <= -10) return 'low' // 시장가보다 10% 이상 저렴
	if (diffPercent <= 5) return 'reasonable' // 시장가 대비 -10% ~ +5%
	if (diffPercent <= 15) return 'high' // 시장가보다 5-15% 높음
	return 'very_high' // 시장가보다 15% 이상 높음
}

/**
 * 카테고리 평가
 */
function getCategoryRating(
	totalCost: number,
	marketAvg: number
): 'good' | 'reasonable' | 'slightly_high' | 'high' {
	if (marketAvg === 0) return 'reasonable' // 데이터 없음

	const diff = ((totalCost - marketAvg) / marketAvg) * 100
	if (diff <= -5) return 'good'
	if (diff <= 10) return 'reasonable'
	if (diff <= 20) return 'slightly_high'
	return 'high'
}

/**
 * 요약 생성 (데이터 기반)
 */
function generateSummary(
	totalAmount: number,
	averageMarketPrice: number,
	priceDiffPercent: number,
	categoryAnalysis: AnalysisResult['categoryAnalysis'],
	marketDataCount: number,
	totalItemCount: number
): AnalysisResult['summary'] {
	const positive: string[] = []
	const negative: string[] = []
	const warnings: string[] = []

	// 가격 평가
	if (priceDiffPercent <= -5) {
		positive.push(`전체 견적 금액이 시장 평균 대비 ${Math.abs(priceDiffPercent).toFixed(1)}% 저렴합니다`)
	} else if (priceDiffPercent > 15) {
		negative.push(`전체 견적 금액이 시장 평균 대비 ${priceDiffPercent.toFixed(1)}% 높습니다`)
	}

	// 카테고리 평가
	const goodCategories = categoryAnalysis.filter(c => c.rating === 'good')
	const highCategories = categoryAnalysis.filter(c => c.rating === 'high' || c.rating === 'slightly_high')

	if (goodCategories.length > 0) {
		positive.push(`${goodCategories.map(c => c.category).join(', ')} 항목의 가격이 합리적입니다`)
	}

	if (highCategories.length > 0) {
		negative.push(`${highCategories.map(c => c.category).join(', ')} 항목이 시장 평균 대비 높게 책정되어 있습니다`)
	}

	// 데이터 커버리지 경고
	if (marketDataCount < totalItemCount * 0.5) {
		warnings.push(`시장 데이터가 부족합니다 (${marketDataCount}/${totalItemCount}개 항목). 추가 검증이 필요합니다`)
	}

	// 세부 항목 경고
	categoryAnalysis.forEach(cat => {
		if (cat.findings.length > 0 && cat.findings.some(f => f.includes('높음'))) {
			warnings.push(`${cat.category} 카테고리의 일부 항목이 시장가보다 높습니다`)
		}
	})

	return { positive, negative, warnings }
}

/**
 * 집첵 권장사항 생성 (데이터 기반)
 */
function generateRecommendations(
	totalAmount: number,
	averageMarketPrice: number,
	priceDiffPercent: number,
	categoryAnalysis: AnalysisResult['categoryAnalysis'],
	items: QuoteItem[]
): AnalysisResult['recommendations'] {
	const recommendations: AnalysisResult['recommendations'] = []

	// 비용 절감 방안
	if (priceDiffPercent > 10) {
		const potentialSaving = Math.round((totalAmount - averageMarketPrice) * 0.7)
		recommendations.push({
			type: 'cost_reduction',
			title: '가격 협상을 통한 비용 절감',
			description: `현재 견적이 시장 평균보다 ${priceDiffPercent.toFixed(1)}% 높습니다. 업체와 협상을 통해 시장 평균 수준으로 조정할 수 있습니다.`,
			potentialSaving
		})
	}

	// 고가 카테고리 절감
	const highCategories = categoryAnalysis.filter(c => c.rating === 'high')
	if (highCategories.length > 0) {
		const topCategory = highCategories.sort((a, b) => b.totalCost - a.totalCost)[0]
		const saving = Math.round((topCategory.totalCost - topCategory.marketAverage) * 0.6)
		recommendations.push({
			type: 'cost_reduction',
			title: `${topCategory.category} 비용 재검토`,
			description: `${topCategory.category} 항목이 시장 평균보다 높게 책정되어 있습니다. 해당 항목의 자재 등급이나 시공 범위를 조정하여 비용을 절감할 수 있습니다.`,
			potentialSaving: saving > 0 ? saving : undefined
		})
	}

	// 품질 개선 사항
	const lowCategories = categoryAnalysis.filter(c => c.rating === 'good')
	if (lowCategories.length > 0 && priceDiffPercent < -10) {
		recommendations.push({
			type: 'quality_improvement',
			title: '자재 및 시공 품질 확인',
			description: '견적가가 시장 평균보다 낮습니다. 사용 자재의 등급, 브랜드, A/S 조건 등을 꼼꼼히 확인하세요.',
			potentialSaving: undefined
		})
	}

	// 일반 권장사항
	recommendations.push({
		type: 'warning',
		title: '복수 견적 비교 필수',
		description: '최소 2-3개 업체의 견적을 비교하여 가격과 품질을 종합적으로 판단하세요. 집첵을 통해 추가 견적을 받아보실 수 있습니다.',
		potentialSaving: undefined
	})

	return recommendations
}

/**
 * 전문가 의견 생성
 */
function generateExpertNote(item: QuoteItem, market: MarketData): string {
	const diff = ((item.totalPrice - market.avgCost) / market.avgCost) * 100

	if (diff > 20) {
		return `시장 평균(${market.avgCost.toLocaleString()}원) 대비 ${diff.toFixed(1)}% 높습니다. 가격 협상을 권장합니다.`
	} else if (diff > 10) {
		return `시장 평균(${market.avgCost.toLocaleString()}원) 대비 다소 높은 편입니다. 자재 등급이나 브랜드를 확인하세요.`
	} else if (diff < -15) {
		return `시장 평균(${market.avgCost.toLocaleString()}원) 대비 저렴합니다. 자재 품질과 시공 보증을 확인하세요.`
	} else {
		return `적정 가격 범위입니다 (시장 평균: ${market.avgCost.toLocaleString()}원).`
	}
}

/**
 * 종합 점수 계산
 */
function calculateOverallScore(
	priceDiffPercent: number,
	categoryAnalysis: AnalysisResult['categoryAnalysis'],
	marketDataCount: number,
	totalItemCount: number
): number {
	// 1. 가격 점수 (40%)
	let priceScore = 100
	if (priceDiffPercent > 15) {
		priceScore = Math.max(0, 100 - (priceDiffPercent - 15) * 3)
	} else if (priceDiffPercent > 5) {
		priceScore = 80
	} else if (priceDiffPercent < -15) {
		priceScore = Math.max(60, 100 + priceDiffPercent * 2)
	}

	// 2. 카테고리 품질 점수 (40%)
	const goodCount = categoryAnalysis.filter(c => c.rating === 'good').length
	const reasonableCount = categoryAnalysis.filter(c => c.rating === 'reasonable').length
	const totalCategories = categoryAnalysis.length
	const qualityScore = totalCategories > 0
		? ((goodCount * 100 + reasonableCount * 70) / totalCategories)
		: 70

	// 3. 데이터 신뢰도 점수 (20%)
	const dataCoverage = totalItemCount > 0 ? (marketDataCount / totalItemCount) : 0
	const reliabilityScore = dataCoverage * 100

	// 가중 평균
	const overall = priceScore * 0.4 + qualityScore * 0.4 + reliabilityScore * 0.2

	return Math.round(Math.max(0, Math.min(100, overall)))
}
