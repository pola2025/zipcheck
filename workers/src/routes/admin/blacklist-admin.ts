/**
 * Admin endpoints for IP blacklist management
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findOne, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// All routes require admin auth
app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /all
 * List all blacklisted IPs
 */
app.get('/all', async (c) => {
	try {
		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM blacklists ORDER BY created_at DESC`
		)

		return c.json({ data: rows })
	} catch (error) {
		console.error('[Admin] Get blacklists error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * POST /
 * Add IP to blacklist
 */
app.post('/', async (c) => {
	try {
		const { ip_address, reason } = await c.req.json<{ ip_address: string; reason?: string }>()

		if (!ip_address || !ip_address.trim()) {
			return c.json({ error: 'IP 주소는 필수입니다.' }, 400)
		}

		const trimmedIp = ip_address.trim()

		// Check if already exists
		const existing = await findOne(
			c.env.DATABASE_URL,
			'SELECT id FROM blacklists WHERE ip_address = $1',
			[trimmedIp]
		)

		if (existing) {
			return c.json({ error: '이미 차단된 IP입니다.' }, 409)
		}

		console.log(`[Admin] Blocking IP: ${trimmedIp}`)

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO blacklists (ip_address, reason) VALUES ($1, $2) RETURNING *`,
			[trimmedIp, reason || null]
		)

		console.log(`[Admin] IP blocked: ${trimmedIp}`)

		return c.json({
			success: true,
			message: 'IP가 차단되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('[Admin] Add to blacklist error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * DELETE /:id
 * Remove IP from blacklist
 */
app.delete('/:id', async (c) => {
	try {
		const id = c.req.param('id')

		console.log(`[Admin] Removing blacklist entry: ${id}`)

		const rows = await query(
			c.env.DATABASE_URL,
			'DELETE FROM blacklists WHERE id = $1 RETURNING *',
			[id]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '블랙리스트 항목을 찾을 수 없습니다.' }, 404)
		}

		console.log(`[Admin] Blacklist entry removed: ${id}`)

		return c.json({
			success: true,
			message: 'IP 차단이 해제되었습니다.'
		})
	} catch (error) {
		console.error('[Admin] Remove from blacklist error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

export default app
