/**
 * R2 Image Serving Route
 * Serves images from Cloudflare R2 with proper headers and caching
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../types'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * GET /images/*
 * Serve images from R2 bucket
 * Supports keys like: reviews/uuid.webp, damage-cases/uuid.webp
 */
app.get('/*', async (c) => {
	try {
		// Extract the key from the URL path (everything after /images/)
		const url = new URL(c.req.url)
		const key = url.pathname.replace(/^\/images\//, '')

		if (!key) {
			return c.json({ error: 'Image key is required' }, 400)
		}

		const object = await c.env.R2.get(key)

		if (!object) {
			return c.json({ error: 'Image not found' }, 404)
		}

		const headers = new Headers()
		headers.set('Content-Type', object.httpMetadata?.contentType || 'image/webp')
		headers.set('Cache-Control', 'public, max-age=31536000, immutable')
		headers.set('ETag', object.httpEtag)

		return new Response(object.body, { headers })
	} catch (error) {
		console.error('Image serving error:', error)
		return c.json({ error: 'Failed to serve image' }, 500)
	}
})

export default app
