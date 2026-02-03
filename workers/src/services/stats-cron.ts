import type { Env } from '../types'
import { query } from '../lib/db'
import { notifyDailyStats, sendSlackMessage } from './slack'
import { syncDailyAnalytics } from './airtable-sync'
import { getTrafficReport } from './google-analytics'

export async function handleScheduled(event: ScheduledEvent, env: Env) {
	const hour = new Date(event.scheduledTime).getUTCHours()
	const dayOfWeek = new Date(event.scheduledTime).getUTCDay()
	const dayOfMonth = new Date(event.scheduledTime).getUTCDate()

	// 매일 14:59 UTC = 23:59 KST → 일간 통계
	if (event.cron === '59 14 * * *' && dayOfWeek !== 0) {
		await runDailyStats(env)
	}

	// 매주 일요일 14:59 UTC → 주간 통계
	if (event.cron === '59 14 * * 0') {
		await runWeeklyStats(env)
	}

	// 매월 1일 15:00 UTC → 월간 통계
	if (event.cron === '0 15 1 * *') {
		await runMonthlyStats(env)
	}
}

async function runDailyStats(env: Env) {
	try {
		// Get quote stats from DB
		const statsResult = await query(env.DATABASE_URL, `
			SELECT
				COUNT(*) as total_quotes,
				COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_quotes,
				COUNT(*) FILTER (WHERE status = 'analyzed' AND analyzed_at >= CURRENT_DATE) as completed_analysis
			FROM quote_requests
		`)
		const dbStats = statsResult[0] as { total_quotes: string; new_quotes: string; completed_analysis: string }

		// Get GA4 traffic
		const traffic = await getTrafficReport(env, 1)

		await notifyDailyStats(env, {
			totalQuotes: parseInt(dbStats.total_quotes),
			newQuotes: parseInt(dbStats.new_quotes),
			completedAnalysis: parseInt(dbStats.completed_analysis),
			totalUsers: traffic.totalUsers,
			totalPageViews: traffic.totalPageViews,
		})

		// Sync to Airtable
		await syncDailyAnalytics(env)
	} catch (err) {
		console.error('Daily stats error:', err)
	}
}

async function runWeeklyStats(env: Env) {
	try {
		const traffic = await getTrafficReport(env, 7)
		await sendSlackMessage(env.SLACK_ADMIN_WEBHOOK_URL,
			`📊 주간 통계 요약\n방문자: ${traffic.totalUsers}명\n세션: ${traffic.totalSessions}\nPV: ${traffic.totalPageViews}\n평균 체류: ${Math.round(traffic.avgSessionDuration)}초`
		)
	} catch (err) {
		console.error('Weekly stats error:', err)
	}
}

async function runMonthlyStats(env: Env) {
	try {
		const traffic = await getTrafficReport(env, 30)
		await sendSlackMessage(env.SLACK_ADMIN_WEBHOOK_URL,
			`📊 월간 통계 요약\n방문자: ${traffic.totalUsers}명\n세션: ${traffic.totalSessions}\nPV: ${traffic.totalPageViews}\n이탈률: ${(traffic.bounceRate * 100).toFixed(1)}%`
		)
	} catch (err) {
		console.error('Monthly stats error:', err)
	}
}
