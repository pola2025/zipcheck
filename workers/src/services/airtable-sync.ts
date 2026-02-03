import type { Env } from '../types'
import { getTrafficReport } from './google-analytics'

export async function syncDailyAnalytics(env: Env) {
	const report = await getTrafficReport(env, 1)

	const todayData = report.dailyData[report.dailyData.length - 1]
	if (!todayData) return { success: false, error: 'No data for today' }

	const dateStr = todayData.date
	const fields = {
		date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
		users: todayData.users,
		sessions: todayData.sessions,
		pageViews: todayData.pageViews,
		avgSessionDuration: Math.round(todayData.avgSessionDuration),
	}

	// Check existing record
	const checkRes = await fetch(
		`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/analytics_daily?filterByFormula={date}='${fields.date}'`,
		{ headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` } }
	)

	const existing = await checkRes.json() as { records: Array<{ id: string }> }

	if (existing.records?.length > 0) {
		// Update existing
		await fetch(
			`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/analytics_daily/${existing.records[0].id}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fields }),
			}
		)
	} else {
		// Create new
		await fetch(
			`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/analytics_daily`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fields }),
			}
		)
	}

	return { success: true, date: fields.date }
}
