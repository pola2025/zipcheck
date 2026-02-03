import { getGoogleAccessToken, SCOPES } from '../lib/google-auth'
import type { Env } from '../types'

async function getToken(env: Env, scope: string) {
	return getGoogleAccessToken(
		env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
		scope
	)
}

export async function requestIndexing(env: Env, url: string) {
	try {
		const accessToken = await getToken(env, SCOPES.INDEXING)

		const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ url, type: 'URL_UPDATED' }),
		})

		if (!res.ok) {
			const err = await res.text()
			throw new Error(`Indexing API error (${res.status}): ${err}`)
		}

		return { success: true }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { success: false, error: message }
	}
}

export async function requestIndexingForSitemap(env: Env) {
	const siteUrl = env.SEARCH_CONSOLE_SITE_URL
	const urls = [
		`${siteUrl}/`, `${siteUrl}/plan-selection`, `${siteUrl}/quote-submission`,
		`${siteUrl}/payment`, `${siteUrl}/quote-status`, `${siteUrl}/community`,
		`${siteUrl}/community/reviews/create`, `${siteUrl}/community/damage-cases/create`,
	]

	const results: Array<{ url: string; success: boolean; error?: string }> = []

	for (const url of urls) {
		const result = await requestIndexing(env, url)
		results.push({ url, ...result })
		await new Promise(resolve => setTimeout(resolve, 200))
	}

	return {
		total: results.length,
		success: results.filter(r => r.success).length,
		failed: results.filter(r => !r.success).length,
		results,
	}
}

export async function getSearchPerformance(env: Env, days = 28) {
	const accessToken = await getToken(env, SCOPES.SEARCH_CONSOLE)
	const siteUrl = env.SEARCH_CONSOLE_SITE_URL

	const endDate = new Date()
	const startDate = new Date()
	startDate.setDate(startDate.getDate() - days)
	const fmt = (d: Date) => d.toISOString().split('T')[0]

	const res = await fetch(
		`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				startDate: fmt(startDate),
				endDate: fmt(endDate),
				dimensions: ['query', 'page'],
				rowLimit: 100,
				startRow: 0,
			}),
		}
	)

	if (!res.ok) {
		const err = await res.text()
		throw new Error(`Search Console API error (${res.status}): ${err}`)
	}

	const data = await res.json() as {
		rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }>
	}

	const rows = (data.rows || []).map(row => ({
		query: row.keys?.[0] || '',
		page: row.keys?.[1] || '',
		clicks: row.clicks || 0,
		impressions: row.impressions || 0,
		ctr: row.ctr || 0,
		position: row.position || 0,
	}))

	const totals = rows.reduce(
		(acc, row) => ({
			clicks: acc.clicks + row.clicks,
			impressions: acc.impressions + row.impressions,
			ctr: 0,
			position: acc.position + row.position,
		}),
		{ clicks: 0, impressions: 0, ctr: 0, position: 0 }
	)

	if (totals.impressions > 0) totals.ctr = totals.clicks / totals.impressions
	if (rows.length > 0) totals.position = totals.position / rows.length

	return { rows, totals }
}

export async function submitSitemap(env: Env) {
	try {
		const accessToken = await getToken(env, SCOPES.SEARCH_CONSOLE)
		const siteUrl = env.SEARCH_CONSOLE_SITE_URL

		const res = await fetch(
			`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(siteUrl + '/sitemap.xml')}`,
			{
				method: 'PUT',
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		)

		if (!res.ok) {
			const err = await res.text()
			throw new Error(`Sitemap submission failed (${res.status}): ${err}`)
		}

		return { success: true }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { success: false, error: message }
	}
}
