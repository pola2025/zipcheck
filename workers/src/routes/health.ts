import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { query } from '../lib/db'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.get('/health', async (c) => {
	try {
		await query(c.env.DATABASE_URL, 'SELECT 1')
		return c.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			runtime: 'cloudflare-workers',
		})
	} catch (err) {
		return c.json({
			status: 'error',
			timestamp: new Date().toISOString(),
			error: err instanceof Error ? err.message : 'DB connection failed',
		}, 500)
	}
})

export default app
