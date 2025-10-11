import * as XLSX from 'xlsx'

/**
 * Excel/CSV 파일을 파싱해서 JSON 배열로 변환
 */
export function parseExcelFile(buffer: Buffer): any[] {
	try {
		const workbook = XLSX.read(buffer, {
			type: 'buffer',
			codepage: 65001 // UTF-8 인코딩 명시
		})
		const sheetName = workbook.SheetNames[0]
		const worksheet = workbook.Sheets[sheetName]

		// JSON으로 변환 (헤더를 키로 사용)
		const data = XLSX.utils.sheet_to_json(worksheet, {
			raw: false, // 날짜/숫자를 문자열로 유지
			defval: null // 빈 셀은 null
		})

		return data
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Excel 파일 파싱 실패: ${message}`)
	}
}

/**
 * 숫자 파싱 (콤마, 원화 기호 제거)
 */
export function parseNumber(value: any): number | undefined {
	if (value === null || value === undefined || value === '') {
		return undefined
	}

	if (typeof value === 'number') {
		return value
	}

	if (typeof value === 'string') {
		// 쉼표, 원 기호, 공백 제거
		const cleaned = value.replace(/[,₩원\s]/g, '')
		const num = parseFloat(cleaned)
		return isNaN(num) ? undefined : num
	}

	return undefined
}

/**
 * 날짜 파싱
 */
export function parseDate(value: any): Date | null {
	if (!value) return null

	// Excel 날짜 시리얼 번호인 경우
	if (typeof value === 'number') {
		const date = XLSX.SSF.parse_date_code(value)
		return new Date(date.y, date.m - 1, date.d)
	}

	// 문자열인 경우
	if (typeof value === 'string') {
		const parsed = new Date(value)
		return isNaN(parsed.getTime()) ? null : parsed
	}

	return null
}

/**
 * 분기 계산 (월 → 분기)
 */
export function getQuarterFromMonth(month: number): number {
	return Math.ceil(month / 3)
}

/**
 * 시공 데이터 행 검증
 */
export interface ConstructionRow {
	카테고리?: string
	항목명?: string
	설명?: string
	년도?: any
	분기?: any
	월?: any
	지역?: string
	자재비?: any
	인건비?: any
	간접비?: any
	총액?: any
	평수?: any
	건물유형?: string
	시공사?: string
	비고?: string
}

export function validateConstructionRow(row: ConstructionRow, rowIndex: number): {
	isValid: boolean
	error?: string
	data?: {
		category: string
		itemName: string
		year: number
		quarter?: number
		month?: number
		region?: string
		materialCost?: number
		laborCost?: number
		overheadCost?: number
		totalCost: number
		propertySize?: number
		propertyType?: string
		contractorId?: string
		notes?: string
	}
} {
	// 필수 필드 체크
	if (!row.카테고리) {
		return { isValid: false, error: `행 ${rowIndex}: 카테고리가 없습니다` }
	}

	if (!row.항목명) {
		return { isValid: false, error: `행 ${rowIndex}: 항목명이 없습니다` }
	}

	const year = parseNumber(row.년도)
	if (!year || year < 2020 || year > 2030) {
		return { isValid: false, error: `행 ${rowIndex}: 유효하지 않은 년도 (${row.년도})` }
	}

	const totalCost = parseNumber(row.총액)
	if (!totalCost || totalCost <= 0) {
		return { isValid: false, error: `행 ${rowIndex}: 유효하지 않은 총액 (${row.총액})` }
	}

	// 분기/월 파싱
	const quarter = parseNumber(row.분기)
	const month = parseNumber(row.월)

	return {
		isValid: true,
		data: {
			category: row.카테고리.trim(),
			itemName: row.항목명.trim(),
			year,
			quarter: quarter || (month ? getQuarterFromMonth(month) : undefined),
			month: month || undefined,
			region: row.지역?.trim(),
			materialCost: parseNumber(row.자재비),
			laborCost: parseNumber(row.인건비),
			overheadCost: parseNumber(row.간접비),
			totalCost,
			propertySize: parseNumber(row.평수),
			propertyType: row.건물유형?.trim(),
			contractorId: row.시공사?.trim(),
			notes: row.비고?.trim()
		}
	}
}

/**
 * 유통사 가격 데이터 행 검증
 */
export interface DistributorRow {
	카테고리?: string
	항목명?: string
	유통사?: string
	브랜드?: string
	모델명?: string
	도매가?: any
	소매가?: any
	할인율?: any
	단위?: string
	년월?: string
	비고?: string
}

export function validateDistributorRow(row: DistributorRow, rowIndex: number): {
	isValid: boolean
	error?: string
	data?: {
		category: string
		itemName: string
		distributorName: string
		brand?: string
		model?: string
		wholesalePrice?: number
		retailPrice?: number
		discountRate?: number
		unit?: string
		year: number
		month: number
		notes?: string
	}
} {
	// 필수 필드 체크
	if (!row.카테고리) {
		return { isValid: false, error: `행 ${rowIndex}: 카테고리가 없습니다` }
	}

	if (!row.항목명) {
		return { isValid: false, error: `행 ${rowIndex}: 항목명이 없습니다` }
	}

	if (!row.유통사) {
		return { isValid: false, error: `행 ${rowIndex}: 유통사가 없습니다` }
	}

	// 년월 파싱 (예: "2024-12" 또는 "2024/12")
	if (!row.년월) {
		return { isValid: false, error: `행 ${rowIndex}: 년월이 없습니다` }
	}

	const yearMonth = row.년월.toString().replace(/\//g, '-')
	const [yearStr, monthStr] = yearMonth.split('-')
	const year = parseInt(yearStr)
	const month = parseInt(monthStr)

	if (!year || !month || month < 1 || month > 12) {
		return { isValid: false, error: `행 ${rowIndex}: 유효하지 않은 년월 (${row.년월})` }
	}

	// 가격 중 하나는 있어야 함
	const wholesalePrice = parseNumber(row.도매가)
	const retailPrice = parseNumber(row.소매가)

	if (!wholesalePrice && !retailPrice) {
		return { isValid: false, error: `행 ${rowIndex}: 도매가 또는 소매가가 필요합니다` }
	}

	return {
		isValid: true,
		data: {
			category: row.카테고리.trim(),
			itemName: row.항목명.trim(),
			distributorName: row.유통사.trim(),
			brand: row.브랜드?.trim(),
			model: row.모델명?.trim(),
			wholesalePrice,
			retailPrice,
			discountRate: parseNumber(row.할인율),
			unit: row.단위?.trim(),
			year,
			month,
			notes: row.비고?.trim()
		}
	}
}
