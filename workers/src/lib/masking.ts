/**
 * PII masking utilities for public API responses
 */

/**
 * Mask company name: show first 2 and last 2 chars
 * "가나다인테리어" → "가나***리어"
 * "AB건설" → "AB*설"
 */
export function maskCompanyName(name: string | null | undefined): string | null {
	if (!name) return null
	const trimmed = name.trim()
	if (trimmed.length <= 2) return trimmed.charAt(0) + '*'
	if (trimmed.length <= 4) return trimmed.charAt(0) + trimmed.charAt(1) + '*'.repeat(trimmed.length - 3) + trimmed.charAt(trimmed.length - 1)
	const showFront = 2
	const showBack = 2
	const masked = trimmed.length - showFront - showBack
	return trimmed.slice(0, showFront) + '*'.repeat(Math.max(masked, 1)) + trimmed.slice(-showBack)
}

/**
 * Mask person name
 * "김철수" → "김*수"
 * "김수" → "김*"
 * "김" → "김"
 */
export function maskName(name: string | null | undefined): string | null {
	if (!name) return null
	const trimmed = name.trim()
	if (trimmed.length <= 1) return trimmed
	if (trimmed.length === 2) return trimmed.charAt(0) + '*'
	return trimmed.charAt(0) + '*'.repeat(trimmed.length - 2) + trimmed.charAt(trimmed.length - 1)
}

/**
 * Fields to completely remove from public API responses
 */
const SENSITIVE_FIELDS = ['company_phone', 'business_number', 'ip_address', 'user_id'] as const

/**
 * Strip sensitive PII fields from a row object
 */
export function stripSensitiveFields<T extends Record<string, unknown>>(row: T): Omit<T, typeof SENSITIVE_FIELDS[number]> {
	const result = { ...row }
	for (const field of SENSITIVE_FIELDS) {
		delete (result as Record<string, unknown>)[field]
	}
	return result as Omit<T, typeof SENSITIVE_FIELDS[number]>
}

/**
 * Apply full masking pipeline to a damage case row for public display:
 * - Strip sensitive fields (phone, business_number, ip_address, user_id)
 * - Mask company_name
 * - Mask representative_name
 */
export function maskDamageCase<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
	const stripped = stripSensitiveFields(row)
	return {
		...stripped,
		company_name: maskCompanyName(row.company_name as string | null),
		representative_name: maskName(row.representative_name as string | null),
	}
}

/**
 * Apply masking to a company review row for public display
 */
export function maskReview<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
	const stripped = stripSensitiveFields(row)
	return {
		...stripped,
		company_name: maskCompanyName(row.company_name as string | null),
		representative_name: maskName(row.representative_name as string | null),
	}
}
