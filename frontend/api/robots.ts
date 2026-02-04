import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'https://zipcheck-api.zipcheck2025.workers.dev'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
	try {
		const response = await fetch(`${API_URL}/robots.txt`)

		if (!response.ok) {
			throw new Error(`Backend robots.txt error: ${response.status}`)
		}

		const txt = await response.text()

		res.setHeader('Content-Type', 'text/plain')
		res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
		return res.status(200).send(txt)
	} catch (error) {
		console.error('Robots.txt proxy error:', error)
		const fallback = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://zcheck.co.kr/sitemap.xml`
		res.setHeader('Content-Type', 'text/plain')
		res.setHeader('Cache-Control', 'public, s-maxage=3600')
		return res.status(200).send(fallback)
	}
}
