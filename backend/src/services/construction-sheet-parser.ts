/**
 * 현장별 실행내역서 엑셀 파서
 * 173개 시트, 각 시트가 하나의 현장(프로젝트)
 */

import * as XLSX from 'xlsx'

export interface ConstructionProject {
	projectName: string
	projectPeriod: string
	year: number
	month?: number
	quarter?: number
	region?: string
	items: ConstructionItem[]
}

export interface ConstructionItem {
	number: string
	category: string // 공종
	itemName: string // 항목명
	vendor?: string // 업체명
	amount: number // 금액
	notes?: string // 비고
}

/**
 * 현장별 실행내역서 엑셀 파일 파싱
 */
export function parseConstructionSheets(buffer: Buffer): ConstructionProject[] {
	try {
		const workbook = XLSX.read(buffer, {
			type: 'buffer',
			codepage: 65001
		})

		console.log(`📊 Found ${workbook.SheetNames.length} sheets`)

		const projects: ConstructionProject[] = []

		for (const sheetName of workbook.SheetNames) {
			try {
				const project = parseSheet(workbook.Sheets[sheetName], sheetName)
				if (project && project.items.length > 0) {
					projects.push(project)
				}
			} catch (error) {
				console.error(`⚠️  Failed to parse sheet "${sheetName}":`, error)
			}
		}

		console.log(`✅ Successfully parsed ${projects.length} projects`)
		return projects

	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`현장별 실행내역서 파싱 실패: ${message}`)
	}
}

/**
 * 단일 시트 파싱
 */
function parseSheet(worksheet: XLSX.WorkSheet, sheetName: string): ConstructionProject | null {
	// 배열 형식으로 변환
	const data = XLSX.utils.sheet_to_json(worksheet, {
		raw: false,
		defval: null,
		header: 1
	}) as any[][]

	if (data.length < 8) {
		console.warn(`⚠️  Sheet "${sheetName}" has too few rows`)
		return null
	}

	// 메타데이터 추출
	const projectName = extractCellValue(data, 1, 2) || sheetName // Row 2, Col C
	const projectPeriod = extractCellValue(data, 2, 2) || '' // Row 3, Col C

	// 년도/월 추출
	const { year, month, quarter } = extractDateInfo(projectPeriod)

	// 지역 추출 (프로젝트명에서)
	const region = extractRegion(projectName)

	// 항목 추출 (Row 8부터)
	const items: ConstructionItem[] = []

	for (let i = 7; i < data.length; i++) {
		const row = data[i]
		if (!row || row.length < 4) continue

		const number = String(row[0] || '').trim()
		const categoryRaw = String(row[1] || '').trim()
		const vendor = String(row[2] || '').trim()
		const amountStr = String(row[3] || '').trim()
		const notes = String(row[6] || '').trim()

		// 번호가 없거나 공종이 없으면 스킵
		if (!number || !categoryRaw || !amountStr) continue

		// 금액 파싱
		const amount = parseAmount(amountStr)
		if (!amount || amount <= 0) continue

		// 카테고리/항목명 분리
		const { category, itemName } = parseCategory(categoryRaw)

		items.push({
			number,
			category,
			itemName,
			vendor: vendor || undefined,
			amount,
			notes: notes || undefined
		})
	}

	if (items.length === 0) {
		console.warn(`⚠️  Sheet "${sheetName}" has no valid items`)
		return null
	}

	return {
		projectName,
		projectPeriod,
		year,
		month,
		quarter,
		region,
		items
	}
}

/**
 * 셀 값 추출 헬퍼
 */
function extractCellValue(data: any[][], row: number, col: number): string | null {
	if (row >= data.length) return null
	const rowData = data[row]
	if (col >= rowData.length) return null
	const value = rowData[col]
	return value ? String(value).trim() : null
}

/**
 * 날짜 정보 추출 (공사기간에서 년도/월/분기)
 */
function extractDateInfo(period: string): { year: number; month?: number; quarter?: number } {
	// 예: "2020.8.4-8.22" → year=2020, month=8, quarter=3
	const match = period.match(/(\d{4})\.(\d{1,2})/)

	if (match) {
		const year = parseInt(match[1])
		const month = parseInt(match[2])
		const quarter = Math.ceil(month / 3)
		return { year, month, quarter }
	}

	// 기본값: 현재 년도
	return { year: new Date().getFullYear() }
}

/**
 * 지역 추출 (프로젝트명에서)
 */
function extractRegion(projectName: string): string | undefined {
	// 지역명 키워드
	const regions = [
		'서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '세종',
		'강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
		'동탄', '화성', '수원', '용인', '성남', '고양', '부천', '안산', '남양주',
		'안양', '평택', '시흥', '파주', '의정부', '김포', '광주', '광명', '군포',
		'하남', '오산', '양주', '구리', '안성', '포천', '의왕', '양평', '여주',
		'과천', '가평', '연천', '송파', '강남', '서초', '강동', '마포', '영등포',
		'구로', '금천', '양천', '강서', '은평', '노원', '도봉', '중랑', '성북',
		'동대문', '중구', '종로', '용산', '광진', '성동', '동작', '관악'
	]

	for (const region of regions) {
		if (projectName.includes(region)) {
			return region
		}
	}

	return undefined
}

/**
 * 금액 파싱
 */
function parseAmount(amountStr: string): number | null {
	// 쉼표, 공백, 원화 기호 제거
	const cleaned = amountStr.replace(/[,₩원\s]/g, '')
	const num = parseFloat(cleaned)
	return isNaN(num) ? null : num
}

/**
 * 카테고리/항목명 파싱
 * 예: "철거/설비" → category="철거", itemName="설비"
 * 예: "목공" → category="목공", itemName="목공"
 */
function parseCategory(categoryRaw: string): { category: string; itemName: string } {
	// 카테고리 매핑
	const categoryMap: Record<string, string> = {
		'철거': '철거',
		'폐기물': '철거',
		'설비': '설비',
		'목공': '목공',
		'목자재': '목공',
		'샷시': '창호',
		'도배': '도배',
		'필름': '필름',
		'타일': '타일',
		'타일자재': '타일',
		'전기': '전기',
		'수도': '배관',
		'배관': '배관',
		'마루': '마루',
		'탄성코트': '바닥',
		'엘레베이터': '기타',
		'관리': '기타'
	}

	// "/" 분리
	if (categoryRaw.includes('/')) {
		const parts = categoryRaw.split('/').map(p => p.trim())
		const category = categoryMap[parts[0]] || parts[0]
		return {
			category,
			itemName: parts.join('/')
		}
	}

	// 단일 항목
	const category = Object.keys(categoryMap).find(key => categoryRaw.includes(key))
	return {
		category: category ? categoryMap[category] : '기타',
		itemName: categoryRaw
	}
}
