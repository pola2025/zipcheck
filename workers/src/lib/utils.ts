import type { Context } from 'hono'

/**
 * Extract client IP address from Cloudflare Workers request headers
 */
export function getClientIp(c: Context): string {
	return (
		c.req.header('CF-Connecting-IP') ||
		c.req.header('X-Real-IP') ||
		c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
		'unknown'
	)
}

/**
 * Generate a URL-friendly slug from Korean/English text
 * Pattern: {region}-{type}-{company}-후기-{shortid} or similar
 */
export function generateSlug(parts: {
	region?: string | null
	type?: string | null
	company?: string | null
	suffix?: string
	shortId?: string
}): string {
	const { region, type, company, suffix = '', shortId } = parts

	const id = shortId || generateShortId()

	const segments: string[] = []

	if (region) segments.push(slugify(region))
	if (type) segments.push(slugify(type))
	if (company) segments.push(slugify(company))
	if (suffix) segments.push(suffix)
	segments.push(id)

	return segments.join('-')
}

/**
 * Convert Korean/English text to URL-safe slug segment
 */
function slugify(text: string): string {
	return text
		.trim()
		.toLowerCase()
		// Keep Korean characters, alphanumeric, spaces, hyphens
		.replace(/[^\uAC00-\uD7AF\u3130-\u318Fa-z0-9\s-]/g, '')
		// Replace spaces with hyphens
		.replace(/\s+/g, '-')
		// Remove multiple hyphens
		.replace(/-+/g, '-')
		// Trim hyphens from ends
		.replace(/^-+|-+$/g, '')
		// Limit length
		.substring(0, 50)
}

/**
 * Generate a short random ID (8 chars)
 */
export function generateShortId(): string {
	const arr = new Uint8Array(4)
	crypto.getRandomValues(arr)
	return Array.from(arr).map(b => b.toString(36)).join('').substring(0, 8)
}
