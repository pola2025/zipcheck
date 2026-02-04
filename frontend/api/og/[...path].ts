import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'https://zipcheck-api.zipcheck2025.workers.dev'
const BRAND_GREEN = '#2D5A3D'
const BRAND_SAND = '#F5F0EB'
const BRAND_DARK = '#1F2937'

interface MetaResponse {
	title: string
	description: string
	jsonLdType: string
	data?: Record<string, unknown>
}

function buildSvg(width: number, height: number, content: string): string {
	return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
<defs>
	<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
		<stop offset="0%" style="stop-color:${BRAND_SAND}" />
		<stop offset="100%" style="stop-color:#EDE8E0" />
	</linearGradient>
	<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
		<stop offset="0%" style="stop-color:${BRAND_GREEN}" />
		<stop offset="100%" style="stop-color:#3D7A52" />
	</linearGradient>
</defs>
<rect width="${width}" height="${height}" fill="url(#bg)" />
<rect x="0" y="0" width="${width}" height="8" fill="url(#accent)" />
${content}
<rect x="60" y="${height - 80}" width="200" height="40" rx="8" fill="${BRAND_GREEN}" />
<text x="160" y="${height - 55}" font-family="sans-serif" font-size="18" fill="white" text-anchor="middle" font-weight="bold">ZipCheck</text>
<text x="${width - 60}" y="${height - 55}" font-family="sans-serif" font-size="14" fill="#9CA3AF" text-anchor="end">zcheck.co.kr</text>
</svg>`
}

function truncateText(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text
	return text.substring(0, maxLen - 3) + '...'
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

function renderHomeSvg(): string {
	return buildSvg(1200, 630, `
<text x="600" y="200" font-family="sans-serif" font-size="56" fill="${BRAND_DARK}" text-anchor="middle" font-weight="bold">AI 인테리어 견적 분석</text>
<text x="600" y="270" font-family="sans-serif" font-size="24" fill="#6B7280" text-anchor="middle">견적서를 업로드하면 항목별 적정 가격을 알려드립니다</text>
<rect x="400" y="320" width="400" height="60" rx="12" fill="${BRAND_GREEN}" />
<text x="600" y="358" font-family="sans-serif" font-size="22" fill="white" text-anchor="middle" font-weight="bold">기본 분석 30,000원 ~</text>
<g transform="translate(250, 420)">
	<text x="0" y="0" font-family="sans-serif" font-size="40" fill="${BRAND_GREEN}" font-weight="bold">3,000+</text>
	<text x="0" y="30" font-family="sans-serif" font-size="16" fill="#6B7280">누적 분석</text>
</g>
<g transform="translate(500, 420)">
	<text x="0" y="0" font-family="sans-serif" font-size="40" fill="${BRAND_GREEN}" font-weight="bold">48h</text>
	<text x="0" y="30" font-family="sans-serif" font-size="16" fill="#6B7280">응답 보장</text>
</g>
<g transform="translate(750, 420)">
	<text x="0" y="0" font-family="sans-serif" font-size="40" fill="${BRAND_GREEN}" font-weight="bold">9.2%</text>
	<text x="0" y="30" font-family="sans-serif" font-size="16" fill="#6B7280">평균 절감</text>
</g>
`)
}

function renderReviewSvg(data: Record<string, unknown>): string {
	const companyName = escapeXml(truncateText(String(data.companyName || ''), 20))
	const region = data.region ? escapeXml(String(data.region)) : ''
	const projectType = data.projectType ? escapeXml(String(data.projectType)) : ''
	const rating = Number(data.rating || 0).toFixed(1)
	const stars = '★'.repeat(Math.round(Number(data.rating || 0))) + '☆'.repeat(5 - Math.round(Number(data.rating || 0)))

	return buildSvg(1200, 630, `
<rect x="60" y="60" width="1080" height="440" rx="20" fill="white" opacity="0.8" />
<text x="120" y="130" font-family="sans-serif" font-size="18" fill="${BRAND_GREEN}" font-weight="bold">REVIEW</text>
<text x="120" y="200" font-family="sans-serif" font-size="48" fill="${BRAND_DARK}" font-weight="bold">${companyName}</text>
<text x="120" y="260" font-family="sans-serif" font-size="36" fill="#F59E0B">${stars}</text>
<text x="120" y="310" font-family="sans-serif" font-size="28" fill="${BRAND_DARK}" font-weight="bold">${rating} / 5.0</text>
<text x="120" y="370" font-family="sans-serif" font-size="20" fill="#6B7280">${region}${region && projectType ? ' · ' : ''}${projectType}</text>
`)
}

function renderDamageCaseSvg(data: Record<string, unknown>): string {
	const title = escapeXml(truncateText(String(data.title || ''), 30))
	const category = data.category ? escapeXml(String(data.category)) : ''
	const severityLabel = data.severityLabel ? escapeXml(String(data.severityLabel)) : ''
	const severityColors: Record<string, string> = {
		'경미': '#10B981', '보통': '#F59E0B', '심각': '#F97316', '매우 심각': '#EF4444'
	}
	const sevColor = severityColors[String(data.severityLabel)] || '#6B7280'

	return buildSvg(1200, 630, `
<rect x="60" y="60" width="1080" height="440" rx="20" fill="white" opacity="0.8" />
<text x="120" y="130" font-family="sans-serif" font-size="18" fill="#EF4444" font-weight="bold">DAMAGE CASE</text>
${severityLabel ? `<rect x="280" y="108" width="${severityLabel.length * 18 + 40}" height="32" rx="16" fill="${sevColor}" opacity="0.15" /><text x="300" y="130" font-family="sans-serif" font-size="16" fill="${sevColor}" font-weight="bold">${severityLabel}</text>` : ''}
<text x="120" y="220" font-family="sans-serif" font-size="42" fill="${BRAND_DARK}" font-weight="bold">${title}</text>
${category ? `<rect x="120" y="260" width="${category.length * 18 + 30}" height="36" rx="18" fill="#FEF3C7" /><text x="135" y="284" font-family="sans-serif" font-size="18" fill="#92400E" font-weight="600">${category}</text>` : ''}
`)
}

function renderListSvg(title: string): string {
	const safeTitle = escapeXml(truncateText(title, 30))
	return buildSvg(1200, 630, `
<text x="600" y="250" font-family="sans-serif" font-size="52" fill="${BRAND_DARK}" text-anchor="middle" font-weight="bold">${safeTitle}</text>
<text x="600" y="320" font-family="sans-serif" font-size="24" fill="#6B7280" text-anchor="middle">집첵에서 확인하세요</text>
`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const pathParam = req.query.path
	const path = Array.isArray(pathParam) ? '/' + pathParam.join('/') : `/${pathParam || ''}`

	try {
		// Fetch metadata from backend
		const metaRes = await fetch(
			`${API_URL}/api/seo/meta?path=${encodeURIComponent(path)}`,
			{ headers: { 'Accept': 'application/json' } }
		)

		let svg: string

		if (metaRes.ok) {
			const meta: MetaResponse = await metaRes.json()

			if (path === '/home' || path === '/') {
				svg = renderHomeSvg()
			} else if (meta.jsonLdType === 'Review' && meta.data) {
				svg = renderReviewSvg(meta.data)
			} else if (meta.jsonLdType === 'Article' && meta.data) {
				svg = renderDamageCaseSvg(meta.data)
			} else {
				svg = renderListSvg(meta.title)
			}
		} else {
			svg = renderHomeSvg()
		}

		res.setHeader('Content-Type', 'image/svg+xml')
		res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
		return res.status(200).send(svg)
	} catch (error) {
		console.error('OG image error:', error)
		res.setHeader('Content-Type', 'image/svg+xml')
		res.setHeader('Cache-Control', 'public, s-maxage=60')
		return res.status(200).send(renderHomeSvg())
	}
}
