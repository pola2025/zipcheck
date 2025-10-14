/**
 * GPT-5 Pro Safe Call Wrapper
 *
 * 안전 장치:
 * 1. 무한루프 방지: max_steps=6, 중복 출력 차단, 강제 종료 토큰
 * 2. 토큰 낭비 방지: 50k 예산, 출력 상한 2~4k
 * 3. 타임아웃 중복 호출 방지: 429/5xx만 재시도, 타임아웃은 재시도 금지
 * 4. 평균 30~50k 유지: 동적 타임아웃/출력 한도
 */

import crypto from 'crypto'
import OpenAI from 'openai'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

export interface TokenUsage {
	prompt_tokens: number
	completion_tokens: number
	total_tokens: number
}

export interface SafeCallResult {
	text: string
	usage: TokenUsage
	stopReason: 'end' | 'duplicate' | 'single' | 'max_steps' | 'token_budget' | 'usd_budget' | 'timeout' | 'abort'
	steps: number
	cost: {
		input_usd: number
		output_usd: number
		total_usd: number
	}
}

export interface SafeCallOptions {
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
	model?: string
	tokenBudget?: number // 입력+출력 합산 상한 (기본 50,000)
	usdBudget?: number // 달러 상한 (기본 2.0)
	maxOutputTokens?: number // 출력 토큰 상한 (기본 3,000, 범위: 2,000~4,000)
	stop?: string[] // 종료 토큰 (기본 ["\nEND"])
	maxRetries?: number // 429/5xx 재시도 횟수 (기본 2)
	timeoutMs?: number // 요청 타임아웃 (기본 90,000ms = 90초)
	maxSteps?: number // 최대 스텝 수 (기본 6)
	temperature?: number // 온도 (기본 0.7)
	abortSignal?: AbortSignal // 외부 취소 시그널
	inPricePerM?: number // 입력 토큰 가격 (per million, 기본 $15)
	outPricePerM?: number // 출력 토큰 가격 (per million, 기본 $120)
}

/**
 * 비용 계산
 */
function calculateCost(
	usage: TokenUsage,
	inPricePerM: number = 15,
	outPricePerM: number = 120
): { input_usd: number; output_usd: number; total_usd: number } {
	const input_usd = (usage.prompt_tokens / 1_000_000) * inPricePerM
	const output_usd = (usage.completion_tokens / 1_000_000) * outPricePerM
	const total_usd = input_usd + output_usd

	return {
		input_usd: parseFloat(input_usd.toFixed(4)),
		output_usd: parseFloat(output_usd.toFixed(4)),
		total_usd: parseFloat(total_usd.toFixed(4))
	}
}

/**
 * 해시 생성 (중복 출력 차단용)
 */
function createHash(text: string): string {
	const snippet = String(text).trim().slice(0, 512)
	return crypto.createHash('sha1').update(snippet).digest('hex')
}

/**
 * 지수 백오프 대기
 */
function exponentialBackoff(attempt: number): Promise<void> {
	const delayMs = 500 * 2 ** attempt
	return new Promise(resolve => setTimeout(resolve, delayMs))
}

/**
 * 동적 타임아웃 계산
 * 입력 토큰과 출력 한도에 따라 타임아웃 자동 조절
 */
export function calculateDynamicTimeout(
	inputTokens: number,
	outputLimit: number
): number {
	const base = 30_000 // 기본 30초
	const inputBonus = Math.min(60_000, (inputTokens / 20_000) * 20_000)
	const outputBonus = Math.min(30_000, (outputLimit / 1000) * 5_000)
	const total = base + inputBonus + outputBonus

	return Math.min(180_000, total) // 최대 180초
}

/**
 * 토큰 수 추정 (간단한 방식: 4 characters ≈ 1 token)
 */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4)
}

/**
 * Safe GPT-5 Pro Call
 *
 * 모든 안전 장치가 내장된 GPT-5 Pro 호출 함수
 */
export async function safeGpt5ProCall(
	options: SafeCallOptions
): Promise<SafeCallResult> {
	const {
		messages,
		model = 'gpt-4o', // GPT-5 Pro 출시 전까지는 gpt-4o 사용
		tokenBudget = 50_000,
		usdBudget = 2.0,
		maxOutputTokens = 3_000,
		stop = ['\nEND'],
		maxRetries = 2,
		timeoutMs = 90_000,
		maxSteps = 6,
		temperature = 0.7,
		abortSignal,
		inPricePerM = 15,
		outPricePerM = 120
	} = options

	let totalUsage: TokenUsage = {
		prompt_tokens: 0,
		completion_tokens: 0,
		total_tokens: 0
	}
	let lastHash = ''
	let totalCost = { input_usd: 0, output_usd: 0, total_usd: 0 }

	console.log(`🤖 Starting Safe GPT-5 Pro Call:`)
	console.log(`   Model: ${model}`)
	console.log(`   Token Budget: ${tokenBudget.toLocaleString()}`)
	console.log(`   Max Output Tokens: ${maxOutputTokens.toLocaleString()}`)
	console.log(`   Max Steps: ${maxSteps}`)
	console.log(`   Timeout: ${timeoutMs}ms`)

	// 단일 스텝 실행 (견적 분석은 보통 단일 스텝으로 충분)
	for (let step = 1; step <= maxSteps; step++) {
		console.log(`\n📊 Step ${step}/${maxSteps}`)

		// 외부 취소 확인
		if (abortSignal?.aborted) {
			console.log('⚠️  Abort signal received')
			return {
				text: '',
				usage: totalUsage,
				stopReason: 'abort',
				steps: step - 1,
				cost: totalCost
			}
		}

		// 타임아웃 컨트롤러
		const controller = new AbortController()
		const timer = setTimeout(() => {
			console.log('⏰ Request timeout')
			controller.abort()
		}, timeoutMs)

		let response: OpenAI.Chat.Completions.ChatCompletion | null = null
		let lastError: Error | null = null

		// 재시도 로직 (429/5xx만)
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				console.log(`   🔄 Attempt ${attempt + 1}/${maxRetries + 1}`)

				response = await openai.chat.completions.create(
					{
						model,
						messages,
						max_tokens: maxOutputTokens,
						temperature,
						stop,
						stream: false
					},
					{
						signal: abortSignal || controller.signal,
						timeout: timeoutMs
					}
				)

				// 성공 시 재시도 루프 탈출
				break
			} catch (error: any) {
				clearTimeout(timer)
				lastError = error

				// 재시도 가능 에러 판단
				const status = error?.status || error?.response?.status
				const isRetriable = status === 429 || (status >= 500 && status < 600)

				console.log(
					`   ❌ Error: ${error.message} (status: ${status}, retriable: ${isRetriable})`
				)

				// 재시도 불가능하거나 마지막 시도인 경우
				if (!isRetriable || attempt === maxRetries) {
					// 타임아웃 에러는 재시도 금지
					if (error.message?.includes('timeout') || error.name === 'AbortError') {
						console.log('⏰ Timeout occurred - will not retry')
						throw new Error('Request timeout - automatic retry disabled')
					}
					throw error
				}

				// 지수 백오프 대기
				await exponentialBackoff(attempt)
			}
		}

		clearTimeout(timer)

		if (!response) {
			throw lastError || new Error('No response from API')
		}

		// 응답 추출
		const text = response.choices[0]?.message?.content || ''
		const usage = response.usage || {
			prompt_tokens: 0,
			completion_tokens: 0,
			total_tokens: 0
		}

		console.log(`   ✅ Response received:`)
		console.log(`      Prompt tokens: ${usage.prompt_tokens.toLocaleString()}`)
		console.log(`      Completion tokens: ${usage.completion_tokens.toLocaleString()}`)
		console.log(`      Total tokens: ${usage.total_tokens.toLocaleString()}`)

		// 사용량 누적
		totalUsage.prompt_tokens += usage.prompt_tokens
		totalUsage.completion_tokens += usage.completion_tokens
		totalUsage.total_tokens += usage.total_tokens

		// 비용 계산
		const stepCost = calculateCost(usage, inPricePerM, outPricePerM)
		totalCost.input_usd += stepCost.input_usd
		totalCost.output_usd += stepCost.output_usd
		totalCost.total_usd += stepCost.total_usd

		console.log(
			`      Cost: $${stepCost.total_usd.toFixed(4)} (input: $${stepCost.input_usd.toFixed(4)}, output: $${stepCost.output_usd.toFixed(4)})`
		)

		// 토큰 예산 초과 체크
		if (totalUsage.total_tokens > tokenBudget) {
			console.log(
				`⚠️  Token budget exceeded: ${totalUsage.total_tokens.toLocaleString()} > ${tokenBudget.toLocaleString()}`
			)
			throw new Error(
				`Token budget exceeded: ${totalUsage.total_tokens} > ${tokenBudget}`
			)
		}

		// USD 예산 초과 체크
		if (totalCost.total_usd > usdBudget) {
			console.log(
				`⚠️  USD budget exceeded: $${totalCost.total_usd.toFixed(4)} > $${usdBudget.toFixed(2)}`
			)
			throw new Error(
				`USD budget exceeded: $${totalCost.total_usd.toFixed(4)} > $${usdBudget.toFixed(2)}`
			)
		}

		// 중복 출력 차단 (동일한 응답 반복 시 즉시 중단)
		const textHash = createHash(text)
		if (textHash === lastHash) {
			console.log('⚠️  Duplicate output detected - stopping')
			return {
				text,
				usage: totalUsage,
				stopReason: 'duplicate',
				steps: step,
				cost: totalCost
			}
		}
		lastHash = textHash

		// 강제 종료 토큰 확인
		if (text.trim().endsWith('END')) {
			console.log('✅ END token detected - normal completion')
			return {
				text: text.replace(/\nEND$/, '').trim(), // END 제거
				usage: totalUsage,
				stopReason: 'end',
				steps: step,
				cost: totalCost
			}
		}

		// 단일 스텝으로 완료 (견적 분석은 보통 단일 호출)
		console.log('✅ Single step completion')
		return {
			text,
			usage: totalUsage,
			stopReason: 'single',
			steps: step,
			cost: totalCost
		}
	}

	// 최대 스텝 도달
	console.log('⚠️  Max steps reached')
	throw new Error(`Max steps (${maxSteps}) reached - possible infinite loop`)
}

/**
 * 프리플라이트: 토큰 견적 계산
 * 본 실행 전 입력 데이터의 토큰 수를 추정하여 K/길이 한도 조절
 */
export async function preflightEstimate(
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<{
	estimatedInputTokens: number
	recommendedOutputTokens: number
	recommendedTimeout: number
}> {
	// 전체 메시지 텍스트 합산
	const fullText = messages.map(m => m.content).join('\n')
	const estimatedInputTokens = estimateTokens(fullText)

	// 출력 토큰 추천 (입력의 20~40% 또는 최소 2000)
	const recommendedOutputTokens = Math.max(
		2000,
		Math.min(4000, Math.ceil(estimatedInputTokens * 0.3))
	)

	// 타임아웃 추천
	const recommendedTimeout = calculateDynamicTimeout(
		estimatedInputTokens,
		recommendedOutputTokens
	)

	console.log(`🔍 Preflight Estimate:`)
	console.log(`   Estimated Input Tokens: ${estimatedInputTokens.toLocaleString()}`)
	console.log(
		`   Recommended Output Tokens: ${recommendedOutputTokens.toLocaleString()}`
	)
	console.log(`   Recommended Timeout: ${recommendedTimeout}ms`)

	return {
		estimatedInputTokens,
		recommendedOutputTokens,
		recommendedTimeout
	}
}
