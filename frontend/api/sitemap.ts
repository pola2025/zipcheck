import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'https://zipcheck-api.zipcheck2025.workers.dev'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
	try {
		const response = await fetch(`${API_URL}/sitemap.xml`)

		if (!response.ok) {
			throw new Error(`Backend sitemap error: ${response.status}`)
		}

		const xml = await response.text()

		res.setHeader('Content-Type', 'application/xml')
		res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
		return res.status(200).send(xml)
	} catch (error) {
		console.error('Sitemap proxy error:', error)
		// Fallback minimal sitemap
		const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://zcheck.co.kr/</loc><priority>1.0</priority></url>
  <url><loc>https://zcheck.co.kr/reviews</loc><priority>0.9</priority></url>
  <url><loc>https://zcheck.co.kr/damage-cases</loc><priority>0.9</priority></url>
</urlset>`
		res.setHeader('Content-Type', 'application/xml')
		res.setHeader('Cache-Control', 'public, s-maxage=60')
		return res.status(200).send(fallback)
	}
}
