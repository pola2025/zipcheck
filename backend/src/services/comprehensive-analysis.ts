/**
 * GPT-5 Pro를 사용한 종합 견적 분석
 *
 * 기존 analyzeQuote()와 동일한 AnalysisResult 구조를 반환하지만,
 * GPT-5 Pro를 통해 더 정밀하고 종합적인 분석을 수행합니다.
 */

import { query } from '../lib/db'
import {
	safeGpt5ProCall,
	preflightEstimate,
	TokenUsage,
	SafeCallResult
} from './gpt5-pro-safe-call'
import { AnalysisResult } from './ai-analysis'
import crypto from 'crypto'
import {
	notifyAnalysisComplete,
	notifyTokenWarning,
	notifyCostWarning,
	notifyAnalysisError
} from './slack-notifications'

interface ComprehensiveAnalysisRequest {
	quoteRequestId: number
	items: Array<{
		category: string
		itemName: string
		quantity: number
		unit?: string
		unitPrice: number
		totalPrice: number
		notes?: string
	}>
	propertyType?: string
	propertySize?: number
	region?: string
	roomAreas?: Record<string, number>
	userId?: string
}

interface ComprehensiveAnalysisResult extends AnalysisResult {
	_meta?: {
		jobId: string
		model: string
		tokenUsage: TokenUsage
		costUsd: number
		duration: number
		stopReason: string
	}
}

/**
 * Idempotency Key 생성
 */
function generateIdemKey(request: ComprehensiveAnalysisRequest): string {
	const data = JSON.stringify({
		userId: request.userId,
		quoteRequestId: request.quoteRequestId,
		itemCount: request.items.length,
		totalAmount: request.items.reduce((sum, i) => sum + i.totalPrice, 0)
	})
	return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * 시장 데이터 조회 (DB 기반)
 */
async function fetchMarketContext(
	items: ComprehensiveAnalysisRequest['items']
): Promise<string> {
	const marketData: Array<{
		itemName: string
		category: string
		avgCost: number
		minCost: number
		maxCost: number
		recordCount: number
	}> = []

	for (const item of items) {
		try {
			// 항목명으로 시장 평균 조회
			const result = await query(
				`SELECT
					i.name as item_name,
					c.name as category,
					COUNT(cr.id) as record_count,
					ROUND(AVG(cr.total_cost)) as avg_cost,
					MIN(cr.total_cost) as min_cost,
					MAX(cr.total_cost) as max_cost
				FROM items i
				INNER JOIN categories c ON i.category_id = c.id
				INNER JOIN construction_records cr ON cr.item_id = i.id
				WHERE i.name ILIKE $1 OR i.base_name ILIKE $1
				GROUP BY i.name, c.name
				LIMIT 1`,
				[`%${item.itemName}%`]
			)

			if (result.rows.length > 0) {
				const row = result.rows[0]
				marketData.push({
					itemName: item.itemName,
					category: item.category,
					avgCost: Number(row.avg_cost) || 0,
					minCost: Number(row.min_cost) || 0,
					maxCost: Number(row.max_cost) || 0,
					recordCount: Number(row.record_count) || 0
				})
			}
		} catch (error) {
			console.error(`Market data fetch error for ${item.itemName}:`, error)
		}
	}

	// 시장 데이터를 간결한 텍스트로 변환 (토큰 절약)
	const lines = marketData.map(
		m =>
			`${m.itemName}: 평균 ${m.avgCost.toLocaleString()}원 (${m.minCost.toLocaleString()}~${m.maxCost.toLocaleString()}원, ${m.recordCount}건 기반)`
	)

	return lines.join('\n')
}

/**
 * 프롬프트 생성 (현재 AnalysisResult 구조와 일치하도록)
 */
function buildAnalysisPrompt(
	request: ComprehensiveAnalysisRequest,
	marketContext: string
): Array<{ role: 'system' | 'user'; content: string }> {
	const systemPrompt = `당신은 집첵(ZipCheck) 인테리어 견적 분석 전문가입니다.

**핵심 규칙:**
1. 반드시 JSON 객체 하나만 출력하고, 마지막 줄에 **END**를 붙이세요.
2. 최대 출력 토큰 3000 이내로 간결하게 작성하세요.
3. 불확실한 정보는 생성하지 말고 "데이터 부족"이라고 명시하세요.
4. 아래 JSON 스키마를 정확히 따르세요.

**응답 JSON 스키마:**
{
  "overallScore": number,           // 0~100점 (종합 평가 점수)
  "totalAmount": number,            // 총 견적액 (원)
  "averageMarketPrice": number,     // 시장 평균가 (원)
  "priceRating": "low" | "reasonable" | "high" | "very_high",
  "summary": {
    "positive": ["긍정 평가 1", "긍정 평가 2"],   // 최대 3개
    "negative": ["부정 평가 1", "부정 평가 2"],   // 최대 3개
    "warnings": ["주의사항 1", "주의사항 2"]      // 최대 3개
  },
  "categoryAnalysis": [              // 카테고리별 분석
    {
      "category": "카테고리명",
      "totalCost": number,
      "marketAverage": number,
      "rating": "good" | "reasonable" | "slightly_high" | "high",
      "percentage": number,          // 전체 대비 비율 (%)
      "items": number,               // 항목 수
      "findings": ["발견사항 1", "발견사항 2"]  // 최대 3개
    }
  ],
  "recommendations": [               // 집첵 권장사항 (최대 5개)
    {
      "type": "cost_reduction" | "quality_improvement" | "warning",
      "title": "권장사항 제목",
      "description": "권장사항 설명 (200자 이내)",
      "potentialSaving": number | null  // 절감 가능 금액 (원)
    }
  ],
  "marketComparison": {
    "averagePriceRange": { "min": number, "max": number },
    "currentQuote": number,
    "percentile": number,            // 0~100 (낮을수록 저렴)
    "similarCases": [                // 최대 3개
      {
        "location": "지역명",
        "size": number,              // 평수
        "cost": number,              // 비용
        "year": number               // 연도
      }
    ]
  },
  "expertNotes": {                   // 항목별 전문가 의견
    "카테고리-항목명": "전문가 의견 (100자 이내)"
  }
}

**채점 기준:**
- overallScore: 가격 합리성 40%, 카테고리별 품질 40%, 데이터 신뢰도 20%
- priceRating: 시장가 대비 -10% 이하(low), -10~+5%(reasonable), +5~+15%(high), +15% 이상(very_high)
- 카테고리 rating: -5% 이하(good), -5~+10%(reasonable), +10~+20%(slightly_high), +20% 이상(high)`

	const totalAmount = request.items.reduce((sum, i) => sum + i.totalPrice, 0)

	// 카테고리별 그룹핑
	const categoryMap = new Map<
		string,
		Array<ComprehensiveAnalysisRequest['items'][0]>
	>()
	request.items.forEach(item => {
		if (!categoryMap.has(item.category)) {
			categoryMap.set(item.category, [])
		}
		categoryMap.get(item.category)!.push(item)
	})

	// 카테고리별 요약 (토큰 절약)
	const categoryLines = Array.from(categoryMap.entries())
		.map(([cat, items]) => {
			const catTotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
			const catPercent = ((catTotal / totalAmount) * 100).toFixed(1)
			return `- ${cat}: ${items.length}개 항목, ${catTotal.toLocaleString()}원 (${catPercent}%)`
		})
		.join('\n')

	// 상위 5개 항목만 (토큰 절약)
	const topItems = [...request.items]
		.sort((a, b) => b.totalPrice - a.totalPrice)
		.slice(0, 5)
		.map(
			i =>
				`- ${i.category} > ${i.itemName}: ${i.quantity}${i.unit || '개'} × ${i.unitPrice.toLocaleString()}원 = ${i.totalPrice.toLocaleString()}원`
		)
		.join('\n')

	// 도면 정보 (있는 경우)
	let floorPlanInfo = ''
	if (request.roomAreas && Object.keys(request.roomAreas).length > 0) {
		const totalArea = Object.values(request.roomAreas).reduce(
			(sum, area) => sum + area,
			0
		)
		const rooms = Object.entries(request.roomAreas)
			.map(([room, area]) => `${room} ${area.toFixed(1)}평`)
			.join(', ')
		floorPlanInfo = `\n\n**도면 분석 결과:**\n- 총 면적: ${totalArea.toFixed(1)}평\n- 공간 구성: ${rooms}`
	}

	const userPrompt = `다음 견적서를 분석해주세요.

**견적 정보:**
- 총 금액: ${totalAmount.toLocaleString()}원
- 항목 수: ${request.items.length}개
- 물건 유형: ${request.propertyType || '미상'}
- 면적: ${request.propertySize ? request.propertySize + '평' : '미상'}
- 지역: ${request.region || '미상'}${floorPlanInfo}

**카테고리별 요약:**
${categoryLines}

**주요 항목 (상위 5개):**
${topItems}

**시장 데이터 (실제 시공 사례 기반):**
${marketContext || '시장 데이터 없음'}

위 정보를 바탕으로 JSON 형식으로 종합 분석을 제공하세요. 마지막 줄에 END를 붙이세요.`

	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	]
}

/**
 * JSON 응답 검증 및 파싱
 */
function parseAndValidateResponse(text: string): AnalysisResult {
	// JSON 추출 (코드 블록 제거)
	let jsonText = text
		.replace(/```json\n?/g, '')
		.replace(/```\n?/g, '')
		.replace(/\nEND$/g, '')
		.trim()

	// JSON 파싱
	let parsed: any
	try {
		parsed = JSON.parse(jsonText)
	} catch (error) {
		throw new Error(`JSON 파싱 실패: ${error}`)
	}

	// 필수 필드 검증
	const requiredFields = [
		'overallScore',
		'totalAmount',
		'averageMarketPrice',
		'priceRating',
		'summary',
		'categoryAnalysis',
		'recommendations',
		'marketComparison',
		'expertNotes'
	]

	for (const field of requiredFields) {
		if (!(field in parsed)) {
			throw new Error(`필수 필드 누락: ${field}`)
		}
	}

	// 타입 검증
	if (
		typeof parsed.overallScore !== 'number' ||
		parsed.overallScore < 0 ||
		parsed.overallScore > 100
	) {
		throw new Error('overallScore는 0~100 사이의 숫자여야 합니다')
	}

	if (!Array.isArray(parsed.categoryAnalysis)) {
		throw new Error('categoryAnalysis는 배열이어야 합니다')
	}

	if (!Array.isArray(parsed.recommendations)) {
		throw new Error('recommendations는 배열이어야 합니다')
	}

	return parsed as AnalysisResult
}

/**
 * 종합 분석 메인 함수 (GPT-5 Pro)
 */
export async function comprehensiveAnalysis(
	request: ComprehensiveAnalysisRequest,
	options?: {
		abortSignal?: AbortSignal
		tokenBudget?: number
		maxOutputTokens?: number
		userId?: string
	}
): Promise<ComprehensiveAnalysisResult> {
	const startTime = Date.now()

	console.log(`🎯 Starting Comprehensive Analysis (GPT-5 Pro)`)
	console.log(`   Quote Request ID: ${request.quoteRequestId}`)
	console.log(`   Items: ${request.items.length}`)
	console.log(`   Total Amount: ${request.items.reduce((s, i) => s + i.totalPrice, 0).toLocaleString()}원`)

	// 1. Idempotency Key 생성
	const idemKey = generateIdemKey({ ...request, userId: options?.userId })
	console.log(`   Idempotency Key: ${idemKey}`)

	// 2. 기존 Job 확인 (중복 요청 차단)
	const existingJob = await query(
		`SELECT id, status, actual_tokens_used, actual_cost_usd, created_at
		FROM analysis_jobs
		WHERE idem_key = $1
		ORDER BY created_at DESC
		LIMIT 1`,
		[idemKey]
	)

	if (existingJob.rows.length > 0) {
		const job = existingJob.rows[0]
		if (job.status === 'succeeded') {
			console.log(`✅ Found existing successful job: ${job.id}`)
			// 기존 결과 반환
			const outputResult = await query(
				`SELECT content FROM analysis_job_outputs
				WHERE job_id = $1 AND done = true
				ORDER BY created_at DESC
				LIMIT 1`,
				[job.id]
			)

			if (outputResult.rows.length > 0) {
				console.log(`   Returning cached result`)
				return {
					...outputResult.rows[0].content,
					_meta: {
						jobId: job.id,
						model: 'gpt-5-pro (cached)',
						tokenUsage: {
							prompt_tokens: 0,
							completion_tokens: 0,
							total_tokens: 0
						},
						costUsd: 0,
						duration: 0,
						stopReason: 'cached'
					}
				}
			}
		} else if (job.status === 'running' || job.status === 'queued') {
			console.log(`⚠️  Found existing ${job.status} job: ${job.id}`)
			throw new Error(
				`이미 처리 중인 분석이 있습니다 (Job ID: ${job.id}). 잠시 후 다시 시도하세요.`
			)
		}
	}

	// 3. 새 Job 생성
	const jobResult = await query(
		`INSERT INTO analysis_jobs (
			idem_key, user_id, quote_request_id, status,
			input_token_budget, max_output_tokens, model
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`,
		[
			idemKey,
			options?.userId || 'admin',
			request.quoteRequestId,
			'queued',
			options?.tokenBudget || 50000,
			options?.maxOutputTokens || 3000,
			'gpt-4o' // GPT-5 Pro 출시 전까지는 gpt-4o
		]
	)

	const jobId = jobResult.rows[0].id
	console.log(`   Created Job ID: ${jobId}`)

	try {
		// 4. Job 상태 변경: running
		await query(
			`UPDATE analysis_jobs
			SET status = 'running', started_at = NOW()
			WHERE id = $1`,
			[jobId]
		)

		// 5. 시장 데이터 조회
		console.log(`\n📊 Fetching market context...`)
		const marketContext = await fetchMarketContext(request.items)
		console.log(`   Market data entries: ${marketContext.split('\n').length}`)

		// 6. 프롬프트 생성
		const messages = buildAnalysisPrompt(request, marketContext)

		// 7. 프리플라이트: 토큰 견적
		const preflight = await preflightEstimate(messages)

		// 8. GPT-5 Pro 호출
		console.log(`\n🤖 Calling GPT-5 Pro...`)
		const result: SafeCallResult = await safeGpt5ProCall({
			messages,
			model: 'gpt-4o', // GPT-5 Pro 출시 전까지는 gpt-4o
			tokenBudget: options?.tokenBudget || 50000,
			maxOutputTokens:
				options?.maxOutputTokens || preflight.recommendedOutputTokens,
			timeoutMs: preflight.recommendedTimeout,
			abortSignal: options?.abortSignal,
			temperature: 0.7,
			stop: ['\nEND']
		})

		console.log(`\n✅ GPT-5 Pro call completed:`)
		console.log(`   Stop Reason: ${result.stopReason}`)
		console.log(`   Steps: ${result.steps}`)
		console.log(`   Total Tokens: ${result.usage.total_tokens.toLocaleString()}`)
		console.log(`   Total Cost: $${result.cost.total_usd.toFixed(4)}`)

		// 9. 사용량 로깅
		await query(
			`INSERT INTO analysis_job_usage (
				job_id, step, prompt_tokens, completion_tokens, total_tokens,
				usd_input, usd_output, usd_total, duration_ms, model
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			[
				jobId,
				1,
				result.usage.prompt_tokens,
				result.usage.completion_tokens,
				result.usage.total_tokens,
				result.cost.input_usd,
				result.cost.output_usd,
				result.cost.total_usd,
				Date.now() - startTime,
				'gpt-4o'
			]
		)

		// 10. 응답 파싱 및 검증
		console.log(`\n🔍 Parsing and validating response...`)
		const analysisResult = parseAndValidateResponse(result.text)
		console.log(`   ✅ Response validated successfully`)

		// 11. 결과 저장
		const contentHash = crypto
			.createHash('sha256')
			.update(result.text)
			.digest('hex')

		await query(
			`INSERT INTO analysis_job_outputs (
				job_id, step, content, content_hash, done
			) VALUES ($1, $2, $3, $4, $5)`,
			[jobId, 1, analysisResult, contentHash, true]
		)

		// 12. Job 완료 처리
		await query(
			`UPDATE analysis_jobs
			SET status = 'succeeded',
				completed_at = NOW(),
				actual_tokens_used = $1,
				actual_cost_usd = $2,
				reason = $3
			WHERE id = $4`,
			[result.usage.total_tokens, result.cost.total_usd, result.stopReason, jobId]
		)

		const duration = Date.now() - startTime
		console.log(`\n✅ Comprehensive Analysis completed in ${duration}ms`)

		// 13. 토큰/비용 경고 알림
		const tokenPercentage =
			(result.usage.total_tokens / (options?.tokenBudget || 50000)) * 100
		if (tokenPercentage > 80) {
			notifyTokenWarning({
				quoteRequestId: request.quoteRequestId,
				tokenUsage: result.usage.total_tokens,
				tokenBudget: options?.tokenBudget || 50000,
				percentage: tokenPercentage
			})
		}

		if (result.cost.total_usd > 1.0) {
			notifyCostWarning({
				quoteRequestId: request.quoteRequestId,
				costUsd: result.cost.total_usd,
				budgetUsd: 2.0
			})
		}

		// 14. 슬랙 알림: 분석 완료
		// 견적 데이터 조회 (고객명 필요)
		const quoteData = await query(
			'SELECT customer_name FROM quote_requests WHERE id = $1',
			[request.quoteRequestId]
		)
		const customerName =
			quoteData.rows[0]?.customer_name || `견적 #${request.quoteRequestId}`

		notifyAnalysisComplete({
			quoteRequestId: request.quoteRequestId,
			customerName,
			totalAmount: analysisResult.totalAmount,
			overallScore: analysisResult.overallScore,
			tokenUsage: result.usage,
			costUsd: result.cost.total_usd,
			duration,
			status: 'succeeded'
		})

		// 15. 메타 정보 추가하여 반환
		return {
			...analysisResult,
			_meta: {
				jobId,
				model: 'gpt-4o',
				tokenUsage: result.usage,
				costUsd: result.cost.total_usd,
				duration,
				stopReason: result.stopReason
			}
		}
	} catch (error: any) {
		console.error(`\n❌ Comprehensive Analysis failed:`, error)

		// Job 실패 처리
		const status =
			error.message?.includes('timeout') ||
			error.message?.includes('Request timeout')
				? 'timeout'
				: 'failed'

		await query(
			`UPDATE analysis_jobs
			SET status = $1,
				completed_at = NOW(),
				reason = $2,
				error_message = $3,
				error_stack = $4
			WHERE id = $5`,
			[status, error.message, error.message, error.stack, jobId]
		)

		// 슬랙 알림: 분석 에러
		const errorType: 'timeout' | 'token_budget' | 'json_parse' | 'api_error' | 'unknown' =
			error.message?.includes('timeout')
				? 'timeout'
				: error.message?.includes('Token budget')
					? 'token_budget'
					: error.message?.includes('JSON')
						? 'json_parse'
						: error.message?.includes('API')
							? 'api_error'
							: 'unknown'

		notifyAnalysisError({
			quoteRequestId: request.quoteRequestId,
			error: error.message || 'Unknown error',
			errorType
		})

		throw error
	}
}

/**
 * Job 취소 (외부에서 호출)
 */
export async function cancelAnalysisJob(jobId: string): Promise<void> {
	await query(
		`UPDATE analysis_jobs
		SET status = 'canceled',
			abort_requested = true,
			completed_at = NOW(),
			reason = 'User canceled'
		WHERE id = $1 AND status IN ('queued', 'running')`,
		[jobId]
	)
	console.log(`🚫 Analysis job ${jobId} canceled by user`)
}
