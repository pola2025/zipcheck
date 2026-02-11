/**
 * SEO Routes: sitemap.xml, robots.txt, and metadata API
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { findMany, findOne } from '../lib/db'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

const BLOG_SLUGS = [
	'apartment-remodeling-checklist-2026',
	'questions-before-choosing-contractor',
	'remodeling-cost-guide-30-pyeong',
	'material-selection-guide',
	'site-inspection-checklist',
	'contract-verification-checklist',
	'interior-scam-prevention-top5',
	'fake-estimate-detection',
	'additional-cost-response-guide',
	'defective-construction-guide',
]

const BLOG_META_MAP: Record<string, {
	title: string
	excerpt: string
	date: string
	author: string
	category: string
	tags: string[]
	readTime: string
}> = {
	'apartment-remodeling-checklist-2026': {
		title: '2026년 아파트 리모델링, 이것만은 꼭 확인하세요',
		excerpt: '인테리어 견적 시 흔히 놓치는 5가지 항목과 적정 가격 범위를 알려드립니다.',
		date: '2026-02-03',
		author: '집첵 에디터',
		category: '정보 및 참고사항',
		tags: ['리모델링', '체크리스트', '아파트', '인테리어 견적비교'],
		readTime: '5분',
	},
	'questions-before-choosing-contractor': {
		title: '업체 선택 시 꼭 물어봐야 할 질문 7가지',
		excerpt: '계약 전 이 질문들만 던져도 부실업체를 거를 수 있습니다.',
		date: '2026-01-30',
		author: '집첵 에디터',
		category: '정보 및 참고사항',
		tags: ['업체선택', '질문', '계약'],
		readTime: '4분',
	},
	'remodeling-cost-guide-30-pyeong': {
		title: '30평대 전체 리모델링 평균 비용은?',
		excerpt: '2026년 기준 지역별, 시공 범위별 평균 비용을 데이터로 분석했습니다.',
		date: '2026-01-25',
		author: '집첵 에디터',
		category: '정보 및 참고사항',
		tags: ['비용', '30평', '리모델링', '가격', '인테리어 가격비교'],
		readTime: '6분',
	},
	'material-selection-guide': {
		title: '올바른 자재 선택법 A to Z',
		excerpt: '바닥재부터 페인트까지, 자재별 특성과 가격대를 비교 분석합니다.',
		date: '2026-01-22',
		author: '집첵 에디터',
		category: '정보 및 참고사항',
		tags: ['자재', '바닥재', '타일', '페인트'],
		readTime: '7분',
	},
	'site-inspection-checklist': {
		title: '인테리어 계약 전 현장 확인 필수 체크리스트',
		excerpt: '계약 전 현장 방문에서 반드시 확인해야 할 항목들을 정리했습니다.',
		date: '2026-01-18',
		author: '집첵 에디터',
		category: '정보 및 참고사항',
		tags: ['현장확인', '체크리스트', '계약'],
		readTime: '4분',
	},
	'contract-verification-checklist': {
		title: '계약서 작성 전 반드시 확인할 체크리스트',
		excerpt: '피해 사례의 80%는 계약서 미비에서 시작됩니다. 필수 확인사항을 정리했습니다.',
		date: '2026-01-28',
		author: '집첵 에디터',
		category: '피해예방',
		tags: ['계약서', '피해예방', '체크리스트', '인테리어 리모델링 견적비교'],
		readTime: '5분',
	},
	'interior-scam-prevention-top5': {
		title: '인테리어 사기 수법 TOP 5와 예방법',
		excerpt: '실제 피해 사례를 분석하여 가장 흔한 사기 수법과 대처법을 정리했습니다.',
		date: '2026-01-20',
		author: '집첵 에디터',
		category: '피해예방',
		tags: ['사기', '예방', '피해사례'],
		readTime: '6분',
	},
	'fake-estimate-detection': {
		title: '견적서 허위 항목 구별하는 법',
		excerpt: '견적서에 숨겨진 부풀리기와 허위 항목을 식별하는 방법을 알려드립니다.',
		date: '2026-01-15',
		author: '집첵 에디터',
		category: '피해예방',
		tags: ['견적서', '허위항목', '비교', '인테리어 견적비교'],
		readTime: '5분',
	},
	'additional-cost-response-guide': {
		title: '공사 중 추가 비용 요구, 어떻게 대응할까?',
		excerpt: '인테리어 공사 중 추가 비용을 요구받았을 때 현명하게 대처하는 방법입니다.',
		date: '2026-01-10',
		author: '집첵 에디터',
		category: '피해예방',
		tags: ['추가비용', '대응', '공사중'],
		readTime: '4분',
	},
	'defective-construction-guide': {
		title: '부실시공 발견 시 대처 가이드',
		excerpt: '완공 후 하자를 발견했을 때, 단계별로 대처하는 방법을 안내합니다.',
		date: '2026-01-05',
		author: '집첵 에디터',
		category: '피해예방',
		tags: ['부실시공', '하자', '대처'],
		readTime: '5분',
	},
}

// ─── Static page metadata map ───
const STATIC_META: Record<string, {
	title: string
	description: string
	ogType: string
	jsonLdType: string
}> = {
	'/': {
		title: '원가 기준 인테리어 견적 분석',
		description: '인테리어 견적비교, 인테리어 가격비교의 새로운 기준. 유통원가 기반으로 견적서를 항목별 분석해 자재등급별 적정 가격을 알려드립니다. 인테리어 리모델링 견적비교도 간편하게, 48시간 내 분석 리포트 제공.',
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
				ogImage: `${frontendUrl}/og-image.png`,
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
				ogImage: `${frontendUrl}/og-image.png`,
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
				ogImage: `${frontendUrl}/og-image.png`,
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

		// 3a. Blog landing
		if (normalizedPath === '/blog') {
			return c.json({
				title: '집첵 블로그 | 인테리어 견적비교 가이드 & 정보',
				description: '인테리어 견적비교, 가격비교, 리모델링 견적비교 정보를 제공합니다. 현명한 인테리어를 위한 필수 가이드.',
				canonical: 'https://blog.zcheck.co.kr',
				ogType: 'website',
				ogImage: `${frontendUrl}/og-image.png`,
				jsonLdType: 'Blog',
			})
		}

		// 3b. Blog post
		const blogMatch = normalizedPath.match(/^\/blog\/([^/]+)$/)
		if (blogMatch) {
			const slug = blogMatch[1]
			const blogMeta = BLOG_META_MAP[slug]
			if (blogMeta) {
				return c.json({
					title: `${blogMeta.title} | 집첵 블로그`,
					description: blogMeta.excerpt,
					canonical: `https://blog.zcheck.co.kr/${slug}`,
					ogType: 'article',
					ogImage: `${frontendUrl}/og-image.png`,
					jsonLdType: 'BlogPosting',
					data: {
						title: blogMeta.title,
						excerpt: blogMeta.excerpt,
						date: blogMeta.date,
						author: blogMeta.author,
						category: blogMeta.category,
						tags: blogMeta.tags,
						readTime: blogMeta.readTime,
					},
				})
			}
		}

		// 4. Fallback
		return c.json({
			title: '원가 기준 인테리어 견적 분석',
			description: '인테리어 리모델링 견적이 적정한지 궁금하다면, 집첵에서 원가 기준으로 분석해보세요.',
			canonical: `${frontendUrl}${normalizedPath}`,
			ogType: 'website',
			ogImage: `${frontendUrl}/og-image.png`,
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

		// Blog landing
		xml += `  <url>
    <loc>https://blog.zcheck.co.kr</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`
		// Blog posts
		for (const slug of BLOG_SLUGS) {
			const blogMeta = BLOG_META_MAP[slug]
			const lastmod = blogMeta ? blogMeta.date.replace(/\./g, '-') : today
			xml += `  <url>
    <loc>https://blog.zcheck.co.kr/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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
Allow: /blog/
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
Sitemap: https://blog.zcheck.co.kr/sitemap.xml
`

	return new Response(txt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400',
		},
	})
})

export default app
