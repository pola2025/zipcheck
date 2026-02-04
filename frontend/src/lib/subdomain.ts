export type SubdomainType = 'main' | 'admin' | 'review' | 'report' | 'blog'

/**
 * Detect current subdomain from window.location.hostname
 */
export function getSubdomain(): SubdomainType {
	const hostname = window.location.hostname

	if (hostname.startsWith('admin.')) return 'admin'
	if (hostname.startsWith('review.')) return 'review'
	if (hostname.startsWith('report.')) return 'report'
	if (hostname.startsWith('blog.')) return 'blog'

	return 'main'
}

/**
 * Get base URL for a specific subdomain
 */
export function getSubdomainUrl(sub: SubdomainType): string {
	const hostname = window.location.hostname
	const protocol = window.location.protocol

	// Local development
	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return `${protocol}//${hostname}:${window.location.port}`
	}

	// Extract base domain (e.g., zcheck.co.kr)
	const parts = hostname.split('.')
	const baseDomain = parts.length > 2 ? parts.slice(-3).join('.') : hostname

	if (sub === 'main') return `${protocol}//${baseDomain}`
	return `${protocol}//${sub}.${baseDomain}`
}

/**
 * Check if we're on a content subdomain (not main or admin)
 */
export function isContentSubdomain(): boolean {
	const sub = getSubdomain()
	return sub === 'review' || sub === 'report' || sub === 'blog'
}
