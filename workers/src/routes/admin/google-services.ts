import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import * as ga4 from '../../services/google-analytics'
import type { SiteFilter } from '../../services/google-analytics'
import * as searchConsole from '../../services/google-search-console'
import * as gmail from '../../services/google-gmail'
import { syncDailyAnalytics } from '../../services/airtable-sync'

function parseSiteParam(c: any): SiteFilter {
	const site = c.req.query('site')
	if (site === 'blog') return 'blog'
	if (site === 'main') return 'main'
	return undefined
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// All routes require admin auth
app.use('/*', authenticateToken(), requireAdmin())

// GA4 Analytics
app.get('/analytics/traffic', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getTrafficReport(c.env, days, site)
	return c.json(data)
})

app.get('/analytics/realtime', async (c) => {
	const site = parseSiteParam(c)
	const count = await ga4.getRealtimeUsers(c.env, site)
	return c.json({ activeUsers: count })
})

app.get('/analytics/devices', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getDeviceReport(c.env, days, site)
	return c.json(data)
})

app.get('/analytics/geo', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getGeoReport(c.env, days, site)
	return c.json(data)
})

app.get('/analytics/funnel', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getFunnelReport(c.env, days, site)
	return c.json(data)
})

app.get('/analytics/hourly', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getHourlyReport(c.env, days, site)
	return c.json(data)
})

app.get('/analytics/new-returning', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getNewVsReturningReport(c.env, days, site)
	return c.json(data)
})

app.get('/analytics/conversion-trend', async (c) => {
	const days = parseInt(c.req.query('days') || '30')
	const site = parseSiteParam(c)
	const data = await ga4.getConversionTrend(c.env, days, site)
	return c.json(data)
})

// Airtable sync
app.post('/analytics/sync-airtable', async (c) => {
	const result = await syncDailyAnalytics(c.env)
	return c.json(result)
})

// Search Console
app.get('/search/performance', async (c) => {
	const days = parseInt(c.req.query('days') || '28')
	const data = await searchConsole.getSearchPerformance(c.env, days)
	return c.json(data)
})

app.post('/search/index', async (c) => {
	const { url } = await c.req.json<{ url: string }>()
	const result = await searchConsole.requestIndexing(c.env, url)
	return c.json(result)
})

app.post('/search/index-all', async (c) => {
	const result = await searchConsole.requestIndexingForSitemap(c.env)
	return c.json(result)
})

app.post('/search/submit-sitemap', async (c) => {
	const result = await searchConsole.submitSitemap(c.env)
	return c.json(result)
})

// Gmail
app.post('/email/test', async (c) => {
	const { to, subject, html } = await c.req.json<{ to: string; subject: string; html: string }>()
	const result = await gmail.sendEmail(c.env, { to, subject, html })
	return c.json(result)
})

export default app
