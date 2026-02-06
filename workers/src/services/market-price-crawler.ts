/**
 * Google Custom Search 기반 시장가 수집 + 원가 역추정 서비스
 *
 * 파이프라인:
 * 검색 쿼리 생성 → Google CSE API 호출 → snippet에서 가격 추출
 *   → 시장가 저장 → 마진율 역산 → 추정 원가 벤치마크 저장
 */

import type { Env } from '../types'
import { query } from '../lib/db'
import { CATEGORY_MARGIN_RATES as SHARED_MARGIN_RATES } from '../lib/constants'

// ============================================
// Types
// ============================================

interface SearchResult {
	title: string
	snippet: string
	link: string
}

interface PriceExtraction {
	rawPrice: number
	source: string
	unit: string
}

interface CrawlResult {
	std_category: string
	std_item: string
	searchQuery: string
	marketPrice: number | null
	estimatedCost: number | null
	confidence: 'high' | 'medium' | 'low'
	unit: string
	extractedPrices: number[]
	sources: string[]
}

export interface CrawlSummary {
	totalQueries: number
	successCount: number
	failCount: number
	results: CrawlResult[]
	apiCallsUsed: number
}

// ============================================
// 카테고리별 검색 쿼리
// ============================================

interface SearchQuery {
	query: string
	stdItem: string
	unit: string
}

const SEARCH_QUERIES: Record<string, SearchQuery[]> = {
	'바닥': [
		{ query: '강화마루 시공비 단가 ㎡ 2026', stdItem: '강화마루', unit: '㎡' },
		{ query: '강마루 시공 비용 평당 가격', stdItem: '강마루', unit: '㎡' },
		{ query: '원목마루 시공단가 2026', stdItem: '원목마루', unit: '㎡' },
		{ query: '타일 바닥 시공비 ㎡당 가격', stdItem: '타일', unit: '㎡' },
		{ query: '장판 교체 비용 평당 가격', stdItem: '장판', unit: '㎡' },
	],
	'욕실': [
		{ query: '욕실 바닥 타일 시공비 단가 ㎡', stdItem: '바닥 타일', unit: '㎡' },
		{ query: '욕실 벽 타일 시공비 단가 ㎡', stdItem: '벽 타일', unit: '㎡' },
		{ query: '세면대 교체 비용 가격 2026', stdItem: '세면대', unit: '개' },
		{ query: '양변기 교체 비용 가격 2026', stdItem: '양변기', unit: '개' },
		{ query: '욕실 수전 교체 비용 세트', stdItem: '수전', unit: '세트' },
		{ query: '욕실 방수 공사 비용 ㎡ 단가', stdItem: '방수 공사', unit: '㎡' },
	],
	'도배': [
		{ query: '실크 도배 시공비 ㎡ 단가 2026', stdItem: '실크 도배', unit: '㎡' },
		{ query: '합지 도배 비용 평당 가격', stdItem: '합지 도배', unit: '㎡' },
		{ query: '천장 도배 비용 ㎡ 단가', stdItem: '천장 도배', unit: '㎡' },
		{ query: '천연벽지 시공 비용 ㎡ 단가', stdItem: '천연 벽지', unit: '㎡' },
	],
	'철거': [
		{ query: '인테리어 바닥 철거 비용 ㎡ 단가', stdItem: '바닥 철거', unit: '㎡' },
		{ query: '벽체 철거 비용 ㎡ 단가', stdItem: '벽체 철거', unit: '㎡' },
		{ query: '욕실 철거 비용 가격', stdItem: '욕실 철거', unit: '식' },
		{ query: '주방 철거 비용 가격', stdItem: '주방 철거', unit: '식' },
		{ query: '도배 철거 비용 ㎡ 단가', stdItem: '도배 철거', unit: '㎡' },
		{ query: '인테리어 폐기물 반출 비용 톤', stdItem: '폐기물 반출', unit: '톤' },
	],
	'전기': [
		{ query: '콘센트 교체 비용 개당 가격', stdItem: '콘센트 교체', unit: '개' },
		{ query: '스위치 교체 비용 개당 가격', stdItem: '스위치 교체', unit: '개' },
		{ query: '조명 교체 시공비 개당', stdItem: '조명 교체', unit: '개' },
		{ query: '분전반 교체 비용 가격 2026', stdItem: '분전반 교체', unit: '식' },
		{ query: '전선 교체 비용 m당 단가', stdItem: '전선 교체', unit: 'm' },
	],
	'목공': [
		{ query: '걸레받이 시공비 m당 단가', stdItem: '걸레받이', unit: 'm' },
		{ query: '몰딩 시공비 m당 가격', stdItem: '몰딩', unit: 'm' },
		{ query: '문틀 교체 비용 개당 가격', stdItem: '문틀', unit: '개' },
		{ query: '중문 설치 비용 가격 2026', stdItem: '중문', unit: '개' },
		{ query: '천장 틀 작업 비용 ㎡ 단가', stdItem: '천장 틀 작업', unit: '㎡' },
	],
	'주방': [
		{ query: '싱크대 상판 교체 비용 m당', stdItem: '싱크대 상판', unit: 'm' },
		{ query: '주방 하부장 비용 m당 가격', stdItem: '하부장', unit: 'm' },
		{ query: '주방 상부장 비용 m당 가격', stdItem: '상부장', unit: 'm' },
		{ query: '빌트인 후드 설치 비용 가격', stdItem: '빌트인 후드', unit: '개' },
	],
	'가구': [
		{ query: '붙박이장 시공 비용 칸당 가격 2026', stdItem: '붙박이장', unit: '칸' },
		{ query: '신발장 제작 비용 가격', stdItem: '신발장', unit: '식' },
		{ query: '드레스룸 시공 비용 가격', stdItem: '드레스룸', unit: '식' },
	],
	'창호': [
		{ query: '시스템 창호 교체 비용 ㎡ 단가', stdItem: '시스템 창호', unit: '㎡' },
		{ query: '방문 교체 비용 개당 가격 2026', stdItem: '방문', unit: '개' },
		{ query: '현관문 교체 비용 가격 2026', stdItem: '현관문', unit: '개' },
	],
	'페인트': [
		{ query: '벽면 페인트 시공비 ㎡ 단가', stdItem: '벽면 페인트', unit: '㎡' },
		{ query: '천장 페인트 시공비 ㎡ 단가', stdItem: '천장 페인트', unit: '㎡' },
		{ query: '에폭시 바닥 시공비 ㎡ 단가', stdItem: '에폭시', unit: '㎡' },
	],
}

// ============================================
// 카테고리별 마진율 (시장가 → 원가 역추정)
// ============================================

// 로컬 복사본: 마진율 커스텀 오버라이드와 합치기 위해 spread 복사
const CATEGORY_MARGIN_RATES: Record<string, number> = { ...SHARED_MARGIN_RATES }

// 마진율 커스텀 오버라이드 (KV 저장)
async function getMarginRates(env: Env): Promise<Record<string, number>> {
	try {
		const custom = await env.KV.get('market_price_margin_rates', 'json')
		if (custom && typeof custom === 'object') {
			return { ...CATEGORY_MARGIN_RATES, ...(custom as Record<string, number>) }
		}
	} catch {}
	return { ...CATEGORY_MARGIN_RATES }
}

export async function setMarginRates(env: Env, rates: Record<string, number>): Promise<void> {
	await env.KV.put('market_price_margin_rates', JSON.stringify(rates))
}

export function getDefaultMarginRates(): Record<string, number> {
	return { ...CATEGORY_MARGIN_RATES }
}

// ============================================
// Google Custom Search API
// ============================================

async function searchGoogle(
	apiKey: string,
	cx: string,
	searchQuery: string,
): Promise<SearchResult[]> {
	const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&num=5&lr=lang_ko&cr=countryKR`

	const res = await fetch(url)
	if (!res.ok) {
		const text = await res.text()
		console.error(`[MarketPrice] Google API error ${res.status}: ${text}`)
		return []
	}

	const data = await res.json() as { items?: Array<{ title: string; snippet: string; link: string }> }
	return (data.items || []).map(item => ({
		title: item.title || '',
		snippet: item.snippet || '',
		link: item.link || '',
	}))
}

// ============================================
// 가격 추출 (정규식)
// ============================================

function extractPricesFromSnippets(results: SearchResult[], unit: string): PriceExtraction[] {
	const extractions: PriceExtraction[] = []

	for (const result of results) {
		const text = `${result.title} ${result.snippet}`
		const prices = extractPricesFromText(text, unit)
		for (const price of prices) {
			extractions.push({
				rawPrice: price,
				source: result.link,
				unit,
			})
		}
	}

	return extractions
}

function extractPricesFromText(text: string, _unit: string): number[] {
	const prices: number[] = []

	// Pattern 1: "45,000~65,000원" 또는 "45000~65000원" (범위)
	const rangePattern = /([0-9,]+)\s*[~\-]\s*([0-9,]+)\s*원/g
	let match
	while ((match = rangePattern.exec(text)) !== null) {
		const low = parseKoreanNumber(match[1])
		const high = parseKoreanNumber(match[2])
		if (low > 0 && high > 0) {
			prices.push(Math.round((low + high) / 2))
		}
	}

	// Pattern 2: "약 50만원", "15만원", "3만5천원"
	const manwonPattern = /약?\s*([0-9,.]+)\s*만\s*(?:([0-9]+)\s*천\s*)?원/g
	while ((match = manwonPattern.exec(text)) !== null) {
		let price = parseFloat(match[1].replace(/,/g, '')) * 10000
		if (match[2]) {
			price += parseInt(match[2]) * 1000
		}
		if (price > 0) prices.push(Math.round(price))
	}

	// Pattern 3: "㎡당 45,000원", "평당 15만원", "개당 30,000원"
	const unitPricePattern = /(?:㎡당|평당|개당|m당|미터당)\s*([0-9,]+)\s*원/g
	while ((match = unitPricePattern.exec(text)) !== null) {
		const price = parseKoreanNumber(match[1])
		if (price > 0) prices.push(price)
	}

	// Pattern 4: "45,000원" (일반 가격)
	const simplePricePattern = /(?<![0-9~\-])([0-9]{1,3}(?:,[0-9]{3})+)\s*원/g
	while ((match = simplePricePattern.exec(text)) !== null) {
		const price = parseKoreanNumber(match[1])
		if (price > 0 && price >= 1000 && price <= 50_000_000) {
			prices.push(price)
		}
	}

	// 평 → ㎡ 변환 (문맥에 "평당" 포함시)
	if (text.includes('평당') || text.includes('평 당')) {
		return prices.map(p => {
			// 평당 가격이면 ㎡로 변환 (1평 = 3.3058㎡)
			if (p > 10000 && p < 1000000) {
				return Math.round(p / 3.3058)
			}
			return p
		})
	}

	return prices
}

function parseKoreanNumber(str: string): number {
	return parseInt(str.replace(/,/g, ''), 10) || 0
}

// ============================================
// 가격 정제 (이상치 제거 + 중앙값)
// ============================================

function refinePrice(prices: number[]): { price: number; confidence: 'high' | 'medium' | 'low' } | null {
	if (prices.length === 0) return null

	// 이상치 필터: IQR 방식
	const sorted = [...prices].sort((a, b) => a - b)
	const q1 = sorted[Math.floor(sorted.length * 0.25)]
	const q3 = sorted[Math.floor(sorted.length * 0.75)]
	const iqr = q3 - q1
	const lower = q1 - iqr * 1.5
	const upper = q3 + iqr * 1.5

	const filtered = sorted.filter(p => p >= lower && p <= upper)
	if (filtered.length === 0) {
		// IQR로 필터링 후 아무것도 안 남으면 원본 중앙값 사용
		const median = sorted[Math.floor(sorted.length / 2)]
		return { price: median, confidence: 'low' }
	}

	const median = filtered[Math.floor(filtered.length / 2)]

	// 신뢰도 판정
	const maxPrice = Math.max(...filtered)
	const minPrice = Math.min(...filtered)
	const ratio = minPrice > 0 ? maxPrice / minPrice : Infinity

	let confidence: 'high' | 'medium' | 'low'
	if (filtered.length >= 3 && ratio < 2) {
		confidence = 'high'
	} else if (filtered.length >= 2 && ratio < 3) {
		confidence = 'medium'
	} else {
		confidence = 'low'
	}

	return { price: median, confidence }
}

// ============================================
// 원가 역추정
// ============================================

function estimateCost(marketPrice: number, category: string, marginRates: Record<string, number>): number {
	const marginRate = marginRates[category] || 0.20
	return Math.round(marketPrice / (1 + marginRate))
}

// ============================================
// 일일 API 호출 카운터 (KV)
// ============================================

async function getDailyApiCount(env: Env): Promise<number> {
	const today = new Date().toISOString().slice(0, 10)
	const key = `market_price_api_count_${today}`
	const count = await env.KV.get(key)
	return count ? parseInt(count) : 0
}

async function incrementApiCount(env: Env, amount: number): Promise<void> {
	const today = new Date().toISOString().slice(0, 10)
	const key = `market_price_api_count_${today}`
	const current = await getDailyApiCount(env)
	await env.KV.put(key, String(current + amount), { expirationTtl: 86400 * 2 })
}

// ============================================
// 크롤 진행 상태 (KV)
// ============================================

interface CrawlProgress {
	lastCategory: string | null
	lastIndex: number
	totalProcessed: number
	startedAt: string
	updatedAt: string
}

async function getCrawlProgress(env: Env): Promise<CrawlProgress | null> {
	const data = await env.KV.get('market_price_crawl_progress', 'json')
	return data as CrawlProgress | null
}

async function setCrawlProgress(env: Env, progress: CrawlProgress): Promise<void> {
	await env.KV.put('market_price_crawl_progress', JSON.stringify(progress), {
		expirationTtl: 86400 * 30, // 30일 유지
	})
}

async function clearCrawlProgress(env: Env): Promise<void> {
	await env.KV.delete('market_price_crawl_progress')
}

// ============================================
// 메인 크롤 실행
// ============================================

export async function runMarketPriceCrawl(
	env: Env,
	options?: {
		category?: string
		maxQueries?: number
		resumeFromProgress?: boolean
	},
): Promise<CrawlSummary> {
	const apiKey = env.GOOGLE_CSE_API_KEY
	const cx = env.GOOGLE_CSE_CX

	if (!apiKey || !cx) {
		throw new Error('GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX 시크릿이 설정되지 않았습니다.')
	}

	const maxQueries = options?.maxQueries || 10
	const dailyCount = await getDailyApiCount(env)
	const dailyLimit = 90 // 무료 100/일 중 90까지만 (버퍼 10)
	const remainingQuota = Math.max(0, dailyLimit - dailyCount)
	const effectiveMax = Math.min(maxQueries, remainingQuota)

	if (effectiveMax === 0) {
		return {
			totalQueries: 0,
			successCount: 0,
			failCount: 0,
			results: [],
			apiCallsUsed: 0,
		}
	}

	const marginRates = await getMarginRates(env)

	// 실행할 쿼리 목록 빌드
	let queries: Array<{ category: string } & SearchQuery> = []

	if (options?.category) {
		const catQueries = SEARCH_QUERIES[options.category]
		if (catQueries) {
			queries = catQueries.map(q => ({ category: options.category!, ...q }))
		}
	} else {
		// 전체 카테고리 — 진행 상태 있으면 이어서
		let startCat: string | null = null
		let startIdx = 0

		if (options?.resumeFromProgress) {
			const progress = await getCrawlProgress(env)
			if (progress) {
				startCat = progress.lastCategory
				startIdx = progress.lastIndex + 1
			}
		}

		let started = !startCat
		for (const [cat, catQueries] of Object.entries(SEARCH_QUERIES)) {
			if (!started) {
				if (cat === startCat) {
					started = true
					const remaining = catQueries.slice(startIdx)
					queries.push(...remaining.map(q => ({ category: cat, ...q })))
				}
				continue
			}
			queries.push(...catQueries.map(q => ({ category: cat, ...q })))
		}
	}

	// effectiveMax만큼만 실행
	queries = queries.slice(0, effectiveMax)

	const results: CrawlResult[] = []
	let apiCallsUsed = 0

	for (const q of queries) {
		try {
			const searchResults = await searchGoogle(apiKey, cx, q.query)
			apiCallsUsed++

			const extractions = extractPricesFromSnippets(searchResults, q.unit)
			const rawPrices = extractions.map(e => e.rawPrice)
			const refined = refinePrice(rawPrices)

			if (refined) {
				const cost = estimateCost(refined.price, q.category, marginRates)

				results.push({
					std_category: q.category,
					std_item: q.stdItem,
					searchQuery: q.query,
					marketPrice: refined.price,
					estimatedCost: cost,
					confidence: refined.confidence,
					unit: q.unit,
					extractedPrices: rawPrices,
					sources: extractions.map(e => e.source).filter((v, i, a) => a.indexOf(v) === i),
				})
			} else {
				results.push({
					std_category: q.category,
					std_item: q.stdItem,
					searchQuery: q.query,
					marketPrice: null,
					estimatedCost: null,
					confidence: 'low',
					unit: q.unit,
					extractedPrices: rawPrices,
					sources: [],
				})
			}
		} catch (err) {
			console.error(`[MarketPrice] Error for query "${q.query}":`, err)
			results.push({
				std_category: q.category,
				std_item: q.stdItem,
				searchQuery: q.query,
				marketPrice: null,
				estimatedCost: null,
				confidence: 'low',
				unit: q.unit,
				extractedPrices: [],
				sources: [],
			})
		}
	}

	// API 카운터 업데이트
	await incrementApiCount(env, apiCallsUsed)

	// 진행 상태 업데이트
	if (queries.length > 0) {
		const lastQ = queries[queries.length - 1]
		const catQueries = SEARCH_QUERIES[lastQ.category] || []
		const lastIdx = catQueries.findIndex(
			q => q.stdItem === lastQ.stdItem && q.query === lastQ.query
		)
		await setCrawlProgress(env, {
			lastCategory: lastQ.category,
			lastIndex: lastIdx >= 0 ? lastIdx : 0,
			totalProcessed: (await getCrawlProgress(env))?.totalProcessed || 0 + queries.length,
			startedAt: (await getCrawlProgress(env))?.startedAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		})
	}

	// DB에 저장 (성공한 결과만)
	const successResults = results.filter(r => r.estimatedCost != null && r.confidence !== 'low')
	if (successResults.length > 0) {
		await saveToBenchmarks(env, successResults)
	}

	return {
		totalQueries: queries.length,
		successCount: successResults.length,
		failCount: queries.length - successResults.length,
		results,
		apiCallsUsed,
	}
}

// ============================================
// 벤치마크 DB 저장
// ============================================

async function saveToBenchmarks(env: Env, results: CrawlResult[]): Promise<void> {
	const BATCH_SIZE = 15
	const today = new Date().toISOString().slice(0, 10)

	for (let i = 0; i < results.length; i += BATCH_SIZE) {
		const batch = results.slice(i, i + BATCH_SIZE)
		const placeholders: string[] = []
		const values: unknown[] = []
		let idx = 1

		for (const r of batch) {
			placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`)
			values.push(
				r.std_category,
				r.std_item,
				r.estimatedCost,                     // unit_price = 추정 원가
				r.unit,
				'중급',                               // grade = 시장 평균
				r.searchQuery,                        // brand = 검색 쿼리 원문
				r.confidence,                         // model = 신뢰도
				String(r.marketPrice),                // material = 시장가 원본
				'google_search',                      // source
				today,                                // reference_date
			)
		}

		await query(
			env.DATABASE_URL,
			`INSERT INTO benchmark_prices (
				std_category, std_item, unit_price, unit, grade,
				brand, model, material, source, reference_date,
				region, is_active
			) VALUES ${placeholders.map(p => p.replace(/\)$/, `, '서울', true)`))}
			ON CONFLICT DO NOTHING`,
			values,
		)
	}
}

// ============================================
// 월간 자동 크롤 (분산 실행)
// ============================================

export async function runMonthlyCrawl(env: Env): Promise<void> {
	try {
		// 기존 진행 상태 초기화하고 새로 시작
		await clearCrawlProgress(env)

		const summary = await runMarketPriceCrawl(env, {
			maxQueries: 10,
			resumeFromProgress: false,
		})

		console.log(`[MarketPrice] Monthly crawl batch: ${summary.successCount}/${summary.totalQueries} success, ${summary.apiCallsUsed} API calls`)
	} catch (err) {
		console.error('[MarketPrice] Monthly crawl error:', err)
	}
}

// ============================================
// 유틸리티 (어드민 API용)
// ============================================

export function getAllSearchQueries(): Record<string, SearchQuery[]> {
	return SEARCH_QUERIES
}

export function getTotalQueryCount(): number {
	return Object.values(SEARCH_QUERIES).reduce((sum, qs) => sum + qs.length, 0)
}
