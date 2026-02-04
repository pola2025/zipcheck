/**
 * SEO Routes: sitemap.xml, robots.txt, and metadata API
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { findMany, findOne } from '../lib/db'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ─── Static page metadata map ───
const STATIC_META: Record<string, {
	title: string
	description: string
	ogType: string
	jsonLdType: string
}> = {
	'/': {
		title: '원가 기준 인테리어 견적 분석',
		description: '인테리어 리모델링 견적이 적정한지 궁금하다면, 집첵에서 원가 기준으로 분석해보세요. 업체가 알려주지 않는 적정 견적을 확인할 수 있습니다.',
		ogType: 'website',
		jsonLdType: 'WebApplication',
	},
	'/reviews': {
		title: '업체 후기 | 인테리어 시공 후기 모음 | 집첵',
		description: '실제 고객들의 인테리어 시공 후기를 확인하세요. 업체별 평점, 시공 사진, 상세 리뷰를 한눈에 비교할 수 있습니다.',
		ogType: 'website',
		jsonLdType: 'CollectionPage',
	},
	'/damage-cases': {
		title: '피해사례 | 인테리어 피해 사례 모음 | 집첵',
		description: '인테리어 시공 중 발생한 피해 사례를 확인하세요. 동일한 피해를 예방하고 현명한 업체 선택에 도움이 됩니다.',
		ogType: 'website',
		jsonLdType: 'CollectionPage',
	},
	'/plan-selection': {
		title: '요금제 선택 | 집첵',
		description: '집첵의 견적 분석 요금제를 확인하세요. 기본 분석 3만원(48시간), 빠른 분석 4.5만원(24시간).',
		ogType: 'website',
		jsonLdType: 'WebPage',
	},
	'/community': {
		title: '커뮤니티 | 집첵',
		description: '인테리어 후기와 피해사례를 공유하는 커뮤니티. 실제 경험을 바탕으로 현명한 선택을 하세요.',
		ogType: 'website',
		jsonLdType: 'CollectionPage',
	},
	'/privacy': {
		title: '개인정보처리방침 | 집첵',
		description: '집첵의 개인정보처리방침을 확인하세요.',
		ogType: 'website',
		jsonLdType: 'WebPage',
	},
	'/terms': {
		title: '이용약관 | 집첵',
		description: '집첵의 서비스 이용약관을 확인하세요.',
		ogType: 'website',
		jsonLdType: 'WebPage',
	},
}

/**
 * GET /api/seo/meta?path=/reviews/:slug
 * Returns structured metadata for any page path
 */
app.get('/api/seo/meta', async (c) => {
	const path = c.req.query('path') || '/'
	const frontendUrl = c.env.FRONTEND_URL

	try {
		// 1. Check static pages first
		const normalizedPath = path.replace(/\/$/, '') || '/'
		if (STATIC_META[normalizedPath]) {
			const meta = STATIC_META[normalizedPath]
			return c.json({
				title: meta.title,
				description: meta.description,
				canonical: `${frontendUrl}${normalizedPath === '/' ? '' : normalizedPath}`,
				ogType: meta.ogType,
				ogImage: `${frontendUrl}/api/og${normalizedPath === '/' ? '/home' : normalizedPath}`,
				jsonLdType: meta.jsonLdType,
			})
		}

		// 2. Dynamic: /reviews/:slug
		const reviewMatch = normalizedPath.match(/^\/reviews\/([^/]+)$/)
		if (reviewMatch) {
			const slug = reviewMatch[1]
			const review = await findOne<{
				id: string; slug: string; company_name: string; region: string | null;
				project_type: string | null; rating: number; review_text: string;
				author_name: string; created_at: string; updated_at: string;
				quality_rating: number | null; price_rating: number | null;
				communication_rating: number | null; schedule_rating: number | null;
				images: string | null; before_images: string | null; after_images: string | null;
			}>(
				c.env.DATABASE_URL,
				"SELECT id, slug, company_name, region, project_type, rating, review_text, author_name, created_at, updated_at, quality_rating, price_rating, communication_rating, schedule_rating, images, before_images, after_images FROM company_reviews WHERE slug = $1 AND status = 'published'",
				[slug]
			)

			if (!review) {
				return c.json({ error: 'Not found' }, 404)
			}

			const desc = review.review_text.substring(0, 160).replace(/\n/g, ' ')
			const title = `${review.company_name} ${review.project_type || '시공'} 후기 | 집첵`

			return c.json({
				title,
				description: desc,
				canonical: `${frontendUrl}/reviews/${slug}`,
				ogType: 'article',
				ogImage: `${frontendUrl}/api/og/reviews/${slug}`,
				jsonLdType: 'Review',
				data: {
					companyName: review.company_name,
					region: review.region,
					projectType: review.project_type,
					rating: review.rating,
					authorName: review.author_name,
					reviewText: review.review_text,
					createdAt: review.created_at,
					updatedAt: review.updated_at,
					qualityRating: review.quality_rating,
					priceRating: review.price_rating,
					communicationRating: review.communication_rating,
					scheduleRating: review.schedule_rating,
				},
			})
		}

		// 3. Dynamic: /damage-cases/:slug
		const dcMatch = normalizedPath.match(/^\/damage-cases\/([^/]+)$/)
		if (dcMatch) {
			const slug = dcMatch[1]
			const dc = await findOne<{
				id: string; slug: string; title: string; description: string;
				category: string | null; severity: string | null; status: string;
				created_at: string; updated_at: string; images: string | null;
			}>(
				c.env.DATABASE_URL,
				"SELECT id, slug, title, description, category, severity, status, created_at, updated_at, images FROM damage_cases WHERE slug = $1 AND status NOT IN ('deleted', 'closed')",
				[slug]
			)

			if (!dc) {
				return c.json({ error: 'Not found' }, 404)
			}

			const desc = dc.description.substring(0, 160).replace(/\n/g, ' ')
			const title = `${dc.title} | 피해사례 | 집첵`
			const severityLabel: Record<string, string> = {
				low: '경미', medium: '보통', high: '심각', critical: '매우 심각'
			}

			return c.json({
				title,
				description: desc,
				canonical: `${frontendUrl}/damage-cases/${slug}`,
				ogType: 'article',
				ogImage: `${frontendUrl}/api/og/damage-cases/${slug}`,
				jsonLdType: 'Article',
				data: {
					title: dc.title,
					description: dc.description,
					category: dc.category,
					severity: dc.severity,
					severityLabel: dc.severity ? severityLabel[dc.severity] || dc.severity : null,
					status: dc.status,
					createdAt: dc.created_at,
					updatedAt: dc.updated_at,
				},
			})
		}

		// 4. Fallback
		return c.json({
			title: '원가 기준 인테리어 견적 분석',
			description: '인테리어 리모델링 견적이 적정한지 궁금하다면, 집첵에서 원가 기준으로 분석해보세요.',
			canonical: `${frontendUrl}${normalizedPath}`,
			ogType: 'website',
			ogImage: `${frontendUrl}/api/og/home`,
			jsonLdType: 'WebPage',
		})

	} catch (error) {
		console.error('SEO meta error:', error)
		return c.json({ error: 'Internal server error' }, 500)
	}
})

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

		const today = new Date().toISOString().split('T')[0]
		const staticPages = [
			{ loc: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
			{ loc: '/reviews', priority: '0.9', changefreq: 'daily', lastmod: today },
			{ loc: '/damage-cases', priority: '0.9', changefreq: 'daily', lastmod: today },
			{ loc: '/community', priority: '0.8', changefreq: 'daily', lastmod: today },
			{ loc: '/plan-selection', priority: '0.7', changefreq: 'monthly', lastmod: today },
			{ loc: '/write/review', priority: '0.5', changefreq: 'monthly', lastmod: today },
			{ loc: '/write/damage-case', priority: '0.5', changefreq: 'monthly', lastmod: today },
			{ loc: '/quote-submission', priority: '0.5', changefreq: 'monthly', lastmod: today },
			{ loc: '/privacy', priority: '0.3', changefreq: 'yearly', lastmod: today },
			{ loc: '/terms', priority: '0.3', changefreq: 'yearly', lastmod: today },
		]

		let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

		// Static pages
		for (const page of staticPages) {
			xml += `  <url>
    <loc>${frontendUrl}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
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
Allow: /reviews/
Allow: /damage-cases/
Allow: /community
Allow: /plan-selection
Allow: /privacy
Allow: /terms
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /write/
Disallow: /payment
Disallow: /quote-submission
Disallow: /quote-status

# AI Crawlers - explicitly allowed for GEO/AEO
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot
Allow: /

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
