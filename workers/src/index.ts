import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, Variables } from './types'
import { handleScheduled } from './services/stats-cron'

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
import imageRoutes from './routes/images'
import seoRoutes from './routes/seo'

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
app.route('/images', imageRoutes)
app.route('/', seoRoutes)

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
