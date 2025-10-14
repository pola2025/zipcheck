/**
 * 특정 시트의 상세 구조 분석
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

async function analyzeSheet() {
	const filePath = path.resolve('F:\\GOI\\현장별실행내역서.xlsx')

	try {
		const buffer = fs.readFileSync(filePath)
		const workbook = XLSX.read(buffer, {
			type: 'buffer',
			codepage: 65001
		})

		// 첫 번째 시트 상세 분석
		const sheetName = workbook.SheetNames[0]
		const worksheet = workbook.Sheets[sheetName]

		console.log(`🔍 Detailed analysis of: "${sheetName}"\n`)

		// JSON 변환 (헤더 없이)
		const data = XLSX.utils.sheet_to_json(worksheet, {
			raw: false,
			defval: null,
			header: 1 // 배열로 반환
		})

		console.log(`Total rows: ${data.length}\n`)

		// 처음 20행만 출력
		console.log('📋 First 20 rows:\n')
		data.slice(0, 20).forEach((row: any, idx) => {
			console.log(`Row ${idx + 1}:`, row)
		})

		console.log('\n' + '='.repeat(80))
		console.log('\n🔍 Looking for patterns...\n')

		// 항목 찾기
		const itemRows: any[] = []
		data.forEach((row: any, idx) => {
			const firstCell = row[0]
			if (firstCell && typeof firstCell === 'string') {
				// 숫자나 특정 패턴이 있는 행 찾기
				if (
					firstCell.includes('철거') ||
					firstCell.includes('목공') ||
					firstCell.includes('전기') ||
					firstCell.includes('타일') ||
					firstCell.includes('도배') ||
					firstCell.includes('수도') ||
					firstCell.includes('설비') ||
					/^\d+\./.test(firstCell) // "1.", "2." 같은 번호
				) {
					itemRows.push({ row: idx + 1, data: row })
				}
			}
		})

		if (itemRows.length > 0) {
			console.log(`✅ Found ${itemRows.length} potential item rows:\n`)
			itemRows.slice(0, 10).forEach(({ row, data }) => {
				console.log(`Row ${row}:`, data)
			})
		}

	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	}
}

analyzeSheet()
