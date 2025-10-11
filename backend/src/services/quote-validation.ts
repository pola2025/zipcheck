/**
 * Quote Validation Service
 *
 * Validates quote requests to ensure they have sufficient detail for analysis.
 * Rejects quotes that are too generic or lack detailed breakdown.
 */

interface QuoteItem {
	category: string
	item: string
	quantity: number
	unit: string
	unit_price: number
	total_price: number
	notes?: string
}

interface ValidationResult {
	isValid: boolean
	status: 'approved' | 'rejected_insufficient_detail'
	validationNotes?: string
}

/**
 * Minimum number of detailed items required for analysis
 */
const MIN_ITEMS_REQUIRED = 5

/**
 * Keywords that indicate overly generic/broad items
 */
const GENERIC_KEYWORDS = [
	'전체', '총', '일체', '모두', '합계'
]

/**
 * Validates if a quote has sufficient detail for AI analysis
 */
export function validateQuoteDetail(items: QuoteItem[]): ValidationResult {
	// Check 1: Minimum number of items
	if (items.length < MIN_ITEMS_REQUIRED) {
		return {
			isValid: false,
			status: 'rejected_insufficient_detail',
			validationNotes: `견적 항목이 너무 적습니다. (현재: ${items.length}개, 최소: ${MIN_ITEMS_REQUIRED}개)\n\n정확한 분석을 위해서는 세부 시공 항목별로 견적이 작성되어야 합니다.\n예) '주방 일체 1,000만원'이 아닌 '싱크대 교체', '상판 교체', '타일 시공' 등으로 세분화`
		}
	}

	// Check 2: Look for overly generic items
	const genericItems = items.filter(item => {
		const itemNameLower = item.item.toLowerCase()
		return GENERIC_KEYWORDS.some(keyword => itemNameLower.includes(keyword))
	})

	if (genericItems.length > items.length * 0.5) {
		// If more than 50% of items are generic
		return {
			isValid: false,
			status: 'rejected_insufficient_detail',
			validationNotes: `견적 항목이 너무 포괄적입니다.\n\n다음 항목들이 세부 분류가 필요합니다:\n${genericItems.map(item => `- ${item.category}: ${item.item} (${item.total_price.toLocaleString()}원)`).join('\n')}\n\n정확한 분석을 위해 세부 시공 항목별로 견적을 작성해주세요.`
		}
	}

	// Check 3: Check if all items are just categories (no real item names)
	const categoryOnlyItems = items.filter(item => {
		// If item is same as category or very similar
		return item.item === item.category ||
		       item.item.length < 3 // Very short names are likely not detailed enough
	})

	if (categoryOnlyItems.length > items.length * 0.3) {
		// If more than 30% are just category names
		return {
			isValid: false,
			status: 'rejected_insufficient_detail',
			validationNotes: `견적 항목명이 구체적이지 않습니다.\n\n카테고리명만 있는 항목: ${categoryOnlyItems.length}개\n\n예시: '주방', '화장실' 대신 '주방 싱크대 교체', '화장실 타일 시공' 등으로 구체화해주세요.`
		}
	}

	// All checks passed
	return {
		isValid: true,
		status: 'approved'
	}
}

/**
 * Check if quote needs admin review before analysis
 */
export function needsAdminReview(items: QuoteItem[]): boolean {
	// If items count is borderline (5-7 items), might need review
	if (items.length >= MIN_ITEMS_REQUIRED && items.length <= MIN_ITEMS_REQUIRED + 2) {
		return true
	}

	// If average price per item is very high (might indicate broad grouping)
	const avgPricePerItem = items.reduce((sum, item) => sum + item.total_price, 0) / items.length
	if (avgPricePerItem > 5000000) { // 500만원 per item average is suspicious
		return true
	}

	return false
}
