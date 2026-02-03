/**
 * SEO Routes: sitemap.xml and robots.txt
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { findMany } from '../lib/db'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * GET /sitemap.xml
 * Auto-generated sitemap with all published reviews and damage cases
 */
app.get('/sitemap.xml', async (c) => {
	try {
		const frontendUrl = c.env.FRONTEND_URL

		// Fetch published reviews with slugs
		const reviews = await findMany<{ slug: string; updated_at: string }>(
			c.env.DATABASE_URL,
			"SELECT slug, updated_at FROM company_reviews WHERE status = 'published' AND slug IS NOT NULL ORDER BY updated_at DESC"
		)

		// Fetch published damage cases with slugs
		const damageCases = await findMany<{ slug: string; updated_at: string }>(
			c.env.DATABASE_URL,
			"SELECT slug, updated_at FROM damage_cases WHERE status NOT IN ('deleted', 'closed') AND slug IS NOT NULL ORDER BY updated_at DESC"
		)

		const staticPages = [
			{ loc: '/', priority: '1.0', changefreq: 'daily' },
			{ loc: '/community', priority: '0.8', changefreq: 'daily' },
			{ loc: '/write/review', priority: '0.7', changefreq: 'monthly' },
			{ loc: '/write/damage-case', priority: '0.7', changefreq: 'monthly' },
			{ loc: '/plan-selection', priority: '0.6', changefreq: 'monthly' },
			{ loc: '/quote-submission', priority: '0.6', changefreq: 'monthly' },
		]

		let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

		// Static pages
		for (const page of staticPages) {
			xml += `  <url>
    <loc>${frontendUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
		}

		// Review pages
		for (const review of reviews) {
			const lastmod = review.updated_at ? new Date(review.updated_at).toISOString().split('T')[0] : ''
			xml += `  <url>
    <loc>${frontendUrl}/reviews/${review.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
		}

		// Damage case pages
		for (const dc of damageCases) {
			const lastmod = dc.updated_at ? new Date(dc.updated_at).toISOString().split('T')[0] : ''
			xml += `  <url>
    <loc>${frontendUrl}/damage-cases/${dc.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
		}

		xml += `</urlset>`

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600',
			},
		})
	} catch (error) {
		console.error('Sitemap generation error:', error)
		return c.text('Error generating sitemap', 500)
	}
})

/**
 * GET /robots.txt
 */
app.get('/robots.txt', (c) => {
	const frontendUrl = c.env.FRONTEND_URL
	const txt = `User-agent: *
Allow: /
Allow: /community
Allow: /reviews/
Allow: /damage-cases/
Allow: /write/
Disallow: /admin/
Disallow: /api/

Sitemap: ${frontendUrl}/sitemap.xml
`

	return new Response(txt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400',
		},
	})
})

export default app
