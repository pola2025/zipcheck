import type { Env } from '../types'

export async function sendTelegramMessage(env: Env, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
	const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: env.TELEGRAM_CHAT_ID,
			text,
			parse_mode: parseMode,
		}),
	})

	if (!res.ok) {
		const body = await res.text()
		console.error(`Telegram API error (${res.status}): ${body}`)
	}

	return res.ok
}

export async function notifyNewQuoteViaTelegram(
	env: Env,
	data: {
		id: string
		name: string
		phone: string
		propertyType: string
		region: string
		itemCount?: number
		quoteSetCount?: number
	}
) {
	const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })

	const lines = [
		`<b>🏠 새 견적분석 요청 접수</b>`,
		``,
		`<b>접수번호</b>  #${data.id}`,
		`<b>고객명</b>    ${data.name}`,
		`<b>연락처</b>    ${data.phone}`,
		`<b>유형</b>      ${data.propertyType}`,
		`<b>지역</b>      ${data.region}`,
	]

	if (data.quoteSetCount) {
		lines.push(`<b>견적서</b>    ${data.quoteSetCount}건`)
	}
	if (data.itemCount) {
		lines.push(`<b>항목수</b>    ${data.itemCount}개`)
	}

	lines.push(``)
	lines.push(`<i>${now}</i>`)
	lines.push(`<a href="https://admin.zcheck.co.kr">관리자 페이지 →</a>`)

	return sendTelegramMessage(env, lines.join('\n'))
}

export async function notifyAnalysisCompleteViaTelegram(
	env: Env,
	data: {
		id: string
		name: string
		score: number
		grade: string
		itemCount: number
	}
) {
	const scoreEmoji = data.score >= 80 ? '🟢' : data.score >= 60 ? '🟡' : '🔴'

	const lines = [
		`<b>✅ 견적 분석 완료</b>`,
		``,
		`<b>접수번호</b>  #${data.id}`,
		`<b>고객명</b>    ${data.name}`,
		`${scoreEmoji} <b>총점</b>      ${data.score}점 (${data.grade})`,
		`<b>항목수</b>    ${data.itemCount}개`,
		``,
		`<a href="https://admin.zcheck.co.kr">결과 확인 →</a>`,
	]

	return sendTelegramMessage(env, lines.join('\n'))
}

export async function notifyErrorViaTelegram(env: Env, context: string, error: string) {
	const lines = [
		`<b>🚨 에러 발생</b>`,
		``,
		`<b>위치</b>  ${context}`,
		`<code>${error.slice(0, 500)}</code>`,
	]

	return sendTelegramMessage(env, lines.join('\n'))
}
