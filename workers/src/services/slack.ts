import type { Env } from '../types'

export async function sendSlackMessage(webhookUrl: string, text: string, blocks?: unknown[]) {
	const body: Record<string, unknown> = { text }
	if (blocks) body.blocks = blocks

	const res = await fetch(webhookUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	if (!res.ok) {
		console.error(`Slack webhook failed (${res.status})`)
	}
}

export async function notifyNewQuote(env: Env, data: { id: string; name: string; phone: string; planName: string }) {
	await sendSlackMessage(env.SLACK_ADMIN_WEBHOOK_URL,
		`🏠 새 견적 신청!\n이름: ${data.name}\n연락처: ${data.phone}\n플랜: ${data.planName}\nID: #${data.id}`
	)
}

export async function notifyAnalysisComplete(env: Env, data: { id: string; name: string }) {
	await sendSlackMessage(env.SLACK_ADMIN_WEBHOOK_URL,
		`✅ 분석 완료: #${data.id} (${data.name})`
	)
}

export async function notifyError(env: Env, context: string, error: string) {
	await sendSlackMessage(env.SLACK_DEV_WEBHOOK_URL,
		`🚨 에러 발생\n위치: ${context}\n내용: ${error}`
	)
}

export async function notifyDailyStats(env: Env, stats: {
	totalQuotes: number; newQuotes: number; completedAnalysis: number;
	totalUsers: number; totalPageViews: number
}) {
	await sendSlackMessage(env.SLACK_ADMIN_WEBHOOK_URL,
		`📊 일간 통계\n견적 총: ${stats.totalQuotes}건\n신규: ${stats.newQuotes}건\n분석완료: ${stats.completedAnalysis}건\n방문자: ${stats.totalUsers}명\nPV: ${stats.totalPageViews}`
	)
}
