import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'https://zipcheck-api.zipcheck2025.workers.dev'
const FRONTEND_URL = 'https://zcheck.co.kr'
const BLOG_URL = 'https://blog.zcheck.co.kr'

interface MetaResponse {
	title: string
	description: string
	canonical: string
	ogType: string
	ogImage: string
	jsonLdType: string
	data?: Record<string, unknown>
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

function buildBreadcrumbs(path: string, baseUrl: string = FRONTEND_URL): { name: string; url: string }[] {
	const crumbs = [{ name: '홈', url: baseUrl }]
	const segments = path.split('/').filter(Boolean)

	const nameMap: Record<string, string> = {
		reviews: '업체 후기',
		'damage-cases': '피해사례',
		'plan-selection': '요금제',
		community: '커뮤니티',
		privacy: '개인정보처리방침',
		terms: '이용약관',
		blog: '블로그',
	}

	let currentPath = ''
	for (const segment of segments) {
		currentPath += `/${segment}`
		crumbs.push({
			name: nameMap[segment] || segment,
			url: `${baseUrl}${currentPath}`,
		})
	}

	return crumbs
}

function buildJsonLd(meta: MetaResponse, path: string, baseUrl: string = FRONTEND_URL): string {
	const schemas: object[] = []
	const breadcrumbs = buildBreadcrumbs(path, baseUrl)

	// BreadcrumbList (always)
	schemas.push({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((crumb, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: crumb.name,
			item: crumb.url,
		})),
	})

	const data = meta.data || {}

	// Speakable schema for voice search / AI assistants
	if (path === '/' || path === '') {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: meta.title,
			speakable: {
				'@type': 'SpeakableSpecification',
				cssSelector: ['h1', 'article > p:first-of-type', '.speakable']
			},
			url: meta.canonical,
		})
	}

	if (meta.jsonLdType === 'Review' && data.companyName) {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'Review',
			itemReviewed: {
				'@type': 'LocalBusiness',
				name: data.companyName,
				...(data.region ? { address: { '@type': 'PostalAddress', addressLocality: data.region } } : {}),
			},
			reviewRating: {
				'@type': 'Rating',
				ratingValue: String(data.rating),
				bestRating: '5',
			},
			author: {
				'@type': 'Person',
				name: data.authorName || '익명',
			},
			reviewBody: data.reviewText as string,
			datePublished: data.createdAt as string,
			...(data.updatedAt ? { dateModified: data.updatedAt as string } : {}),
		})
	}

	if (meta.jsonLdType === 'Article' && data.title) {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: data.title as string,
			description: (data.description as string || '').substring(0, 200),
			datePublished: data.createdAt as string,
			dateModified: data.updatedAt || data.createdAt,
			publisher: {
				'@type': 'Organization',
				name: '집첵',
				url: FRONTEND_URL,
			},
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': meta.canonical,
			},
		})
	}

	if (meta.jsonLdType === 'BlogPosting' && data.title) {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			headline: data.title as string,
			description: (data.excerpt as string) || meta.description,
			datePublished: (data.date as string || '').replace(/\./g, '-'),
			dateModified: (data.date as string || '').replace(/\./g, '-'),
			author: { '@type': 'Person', name: data.author as string || '집첵 에디터' },
			publisher: {
				'@type': 'Organization',
				name: '집첵',
				url: FRONTEND_URL,
			},
			keywords: Array.isArray(data.tags) ? (data.tags as string[]).join(', ') : '',
			articleSection: data.category as string,
			inLanguage: 'ko-KR',
			isPartOf: {
				'@type': 'Blog',
				name: '집첵 블로그',
				url: BLOG_URL,
			},
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': meta.canonical,
			},
		})
	}

	if (meta.jsonLdType === 'Blog') {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'Blog',
			name: meta.title,
			description: meta.description,
			url: meta.canonical,
			keywords: '인테리어 견적비교, 인테리어 가격비교, 인테리어 리모델링 견적비교',
			inLanguage: 'ko-KR',
			isPartOf: {
				'@type': 'WebSite',
				name: 'ZipCheck',
				url: FRONTEND_URL,
			},
		})
	}

	return schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')
}

function buildSemanticBody(meta: MetaResponse, path: string, baseUrl: string = FRONTEND_URL): string {
	const data = meta.data || {}
	const breadcrumbs = buildBreadcrumbs(path, baseUrl)

	const breadcrumbNav = `<nav aria-label="breadcrumb"><ol>${breadcrumbs
		.map((c, i) =>
			i === breadcrumbs.length - 1
				? `<li>${escapeHtml(c.name)}</li>`
				: `<li><a href="${c.url}">${escapeHtml(c.name)}</a></li>`
		)
		.join(' &gt; ')}</ol></nav>`

	if (meta.jsonLdType === 'Review' && data.companyName) {
		const rating = data.rating ? `평점 ${Number(data.rating).toFixed(1)}/5` : ''
		const region = data.region ? `지역: ${data.region}` : ''
		const projectType = data.projectType ? `시공유형: ${data.projectType}` : ''
		const bodyExcerpt = (data.reviewText as string || '').substring(0, 500)

		return `<article>
	${breadcrumbNav}
	<header>
		<h1>${escapeHtml(data.companyName as string)} ${escapeHtml((data.projectType as string) || '시공')} 후기</h1>
		<p>${rating} | ${region} | ${projectType}</p>
	</header>
	<section>
		<p>${escapeHtml(bodyExcerpt)}</p>
	</section>
</article>`
	}

	if (meta.jsonLdType === 'Article' && data.title) {
		const severity = data.severityLabel ? `심각도: ${data.severityLabel}` : ''
		const category = data.category ? `카테고리: ${data.category}` : ''
		const bodyExcerpt = (data.description as string || '').substring(0, 500)

		return `<article>
	${breadcrumbNav}
	<header>
		<h1>${escapeHtml(data.title as string)}</h1>
		<p>${severity} | ${category}</p>
	</header>
	<section>
		<p>${escapeHtml(bodyExcerpt)}</p>
	</section>
</article>`
	}

	if (meta.jsonLdType === 'BlogPosting' && data.title) {
		const bodyExcerpt = (data.excerpt as string || '').substring(0, 500)
		return `<article>
	${breadcrumbNav}
	<header>
		<h1>${escapeHtml(data.title as string)}</h1>
		<p>${escapeHtml(data.author as string || '')} | ${data.readTime || ''} 읽기 | ${data.date || ''}</p>
	</header>
	<section>
		<p>${escapeHtml(bodyExcerpt)}</p>
	</section>
</article>`
	}

	// Static pages
	return `<main>
	${breadcrumbNav}
	<h1>${escapeHtml(meta.title)}</h1>
	<p>${escapeHtml(meta.description)}</p>
</main>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const path = (req.query.path as string) || '/'
	const host = req.headers.host || ''
	const isBlog = host.startsWith('blog.')
	const baseUrl = isBlog ? BLOG_URL : FRONTEND_URL

	try {
		const metaRes = await fetch(`${API_URL}/api/seo/meta?path=${encodeURIComponent(path)}`, {
			headers: { 'Accept': 'application/json' },
		})

		if (!metaRes.ok) {
			// Fallback meta for 404 or errors
			res.setHeader('Content-Type', 'text/html; charset=utf-8')
			res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
			return res.status(200).send(buildFallbackHtml(path, baseUrl))
		}

		const meta: MetaResponse = await metaRes.json()
		const jsonLdTags = buildJsonLd(meta, path, baseUrl)
		const semanticBody = buildSemanticBody(meta, path, baseUrl)

		const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<link rel="canonical" href="${meta.canonical}">
<meta name="theme-color" content="#2D5A3D">

<!-- Open Graph -->
<meta property="og:type" content="${meta.ogType}">
<meta property="og:title" content="${escapeHtml(meta.title)}">
<meta property="og:description" content="${escapeHtml(meta.description)}">
<meta property="og:url" content="${meta.canonical}">
<meta property="og:image" content="${meta.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="집첵">
<meta property="og:locale" content="ko_KR">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(meta.title)}">
<meta name="twitter:description" content="${escapeHtml(meta.description)}">
<meta name="twitter:image" content="${meta.ogImage}">

${isBlog ? '<meta name="keywords" content="인테리어 견적비교, 인테리어 가격비교, 인테리어 리모델링 견적비교, 인테리어 가이드">' : ''}
${jsonLdTags}
</head>
<body>
${semanticBody}
</body>
</html>`

		res.setHeader('Content-Type', 'text/html; charset=utf-8')
		res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
		return res.status(200).send(html)
	} catch (error) {
		console.error('SEO render error:', error)
		res.setHeader('Content-Type', 'text/html; charset=utf-8')
		return res.status(200).send(buildFallbackHtml(path, baseUrl))
	}
}

function buildFallbackHtml(path: string, baseUrl: string = FRONTEND_URL): string {
	return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>원가 기준 인테리어 견적 분석</title>
<meta name="description" content="인테리어 리모델링 견적이 적정한지 궁금하다면, 집첵에서 원가 기준으로 분석해보세요.">
<link rel="canonical" href="${baseUrl}${path}">
<meta property="og:title" content="원가 기준 인테리어 견적 분석">
<meta property="og:description" content="인테리어 리모델링 견적이 적정한지 궁금하다면, 집첵에서 원가 기준으로 분석해보세요.">
<meta property="og:image" content="${baseUrl}/og-image.png">
<meta property="og:url" content="${baseUrl}${path}">
</head>
<body>
<h1>집첵 - 내 인테리어 견적 분석</h1>
<p>인테리어 리모델링 견적이 적정한지 궁금하다면, 집첵에서 원가 기준으로 분석해보세요.</p>
</body>
</html>`
}
