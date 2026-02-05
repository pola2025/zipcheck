import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'
import type { Env, Variables } from './types'
import { handleScheduled } from './services/stats-cron'
import { sendTelegramMessage } from './services/telegram'

// Route imports
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import quoteRequestsRoutes from './routes/quote-requests'
import companyReviewsRoutes from './routes/company-reviews'
import damageCasesRoutes from './routes/damage-cases'
import communityRoutes from './routes/community'
import googleServicesRoutes from './routes/admin/google-services'
import dataManagementRoutes from './routes/admin/data-management'
import companyReviewsAdminRoutes from './routes/admin/company-reviews-admin'
import damageCasesAdminRoutes from './routes/admin/damage-cases-admin'
import blacklistAdminRoutes from './routes/admin/blacklist-admin'
import analysesRoutes from './routes/admin/analyses'
import conflictRulesRoutes from './routes/admin/conflict-rules'
import benchmarksRoutes from './routes/admin/benchmarks'
import categoryMappingsRoutes from './routes/admin/category-mappings'
import blogRoutes from './routes/blog'
import blogAdminRoutes from './routes/admin/blog-admin'
import imageRoutes from './routes/images'
import seoRoutes from './routes/seo'
import metaRoutes from './routes/meta'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Global CORS
app.use('/*', cors({
	origin: (origin) => {
		// Allow all origins in development, restrict in production
		if (!origin) return '*'
		if (origin.includes('zcheck.co.kr')) return origin
		if (origin.includes('localhost')) return origin
		if (origin.includes('vercel.app')) return origin
		return origin
	},
	allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
	maxAge: 86400,
}))

// China IP block middleware for admin routes
function chinaIpBlock() {
	return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
		const country = c.req.header('CF-IPCountry')
		if (country === 'CN') {
			const ip = c.req.header('CF-Connecting-IP') || 'unknown'
			const path = c.req.path
			c.executionCtx.waitUntil(
				sendTelegramMessage(
					c.env,
					`<b>🚫 중국 IP 차단</b>\n\nIP: <code>${ip}</code>\n경로: <code>${path}</code>\n국가: CN`
				)
			)
			return c.json({ error: 'Access denied' }, 403)
		}
		await next()
	}
}
app.use('/api/admin/*', chinaIpBlock())
app.use('/api/auth/admin/*', chinaIpBlock())

// Mount routes
app.route('/', healthRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/quote-requests', quoteRequestsRoutes)
app.route('/api/company-reviews', companyReviewsRoutes)
app.route('/api/damage-cases', damageCasesRoutes)
app.route('/api/community', communityRoutes)
app.route('/api/admin/google', googleServicesRoutes)
app.route('/api/admin', dataManagementRoutes)
app.route('/api/company-reviews/admin', companyReviewsAdminRoutes)
app.route('/api/damage-cases/admin', damageCasesAdminRoutes)
app.route('/api/admin/blacklist', blacklistAdminRoutes)
app.route('/api/admin/analyses', analysesRoutes)
app.route('/api/admin/conflict-rules', conflictRulesRoutes)
app.route('/api/admin/benchmarks', benchmarksRoutes)
app.route('/api/admin/category-mappings', categoryMappingsRoutes)
app.route('/api/blog', blogRoutes)
app.route('/api/admin/blog', blogAdminRoutes)
app.route('/images', imageRoutes)
app.route('/', seoRoutes)  // sitemap.xml, robots.txt, /api/seo/meta
app.route('/api/meta', metaRoutes)

// 404 fallback
app.notFound((c) => {
	return c.json({ error: 'Not Found', path: c.req.path }, 404)
})

// Global error handler
app.onError((err, c) => {
	console.error(`Error on ${c.req.method} ${c.req.path}:`, err)
	return c.json({
		error: err.message || 'Internal Server Error',
	}, 500)
})

// Export Workers handlers
export default {
	fetch: app.fetch,

	// Cron Triggers
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(handleScheduled(event, env))
	},
}
