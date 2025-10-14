/**
 * 엑셀 파일 구조 분석 스크립트
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

async function analyzeExcel() {
	const filePath = path.resolve('F:\\GOI\\현장별실행내역서.xlsx')

	console.log('📂 Analyzing Excel file...')
	console.log(`📁 File: ${filePath}\n`)

	try {
		// 파일 읽기
		const buffer = fs.readFileSync(filePath)
		const workbook = XLSX.read(buffer, {
			type: 'buffer',
			codepage: 65001
		})

		console.log(`📊 Sheets found: ${workbook.SheetNames.length}`)
		workbook.SheetNames.forEach((name, idx) => {
			console.log(`   ${idx + 1}. ${name}`)
		})
		console.log('')

		// 첫 번째 시트 분석
		const sheetName = workbook.SheetNames[0]
		const worksheet = workbook.Sheets[sheetName]

		console.log(`🔍 Analyzing sheet: "${sheetName}"\n`)

		// JSON 변환
		const data = XLSX.utils.sheet_to_json(worksheet, {
			raw: false,
			defval: null
		})

		console.log(`📝 Total rows: ${data.length}\n`)

		if (data.length > 0) {
			const firstRow = data[0] as any
			console.log('🔑 Columns found:')
			Object.keys(firstRow).forEach((key, idx) => {
				console.log(`   ${idx + 1}. "${key}"`)
			})
			console.log('')

			console.log('📋 First row data:')
			console.log(JSON.stringify(firstRow, null, 2))
			console.log('')

			console.log('📋 Second row data (if exists):')
			if (data.length > 1) {
				console.log(JSON.stringify(data[1], null, 2))
			}
			console.log('')

			// 기대하는 컬럼과 비교
			console.log('✅ Expected columns for Construction Data:')
			const expectedColumns = [
				'카테고리 (필수)',
				'항목명 (필수)',
				'년도 (필수)',
				'총액 (필수)',
				'분기 (선택)',
				'월 (선택)',
				'지역 (선택)',
				'자재비 (선택)',
				'인건비 (선택)',
				'간접비 (선택)',
				'평수 (선택)',
				'건물유형 (선택)',
				'시공사 (선택)',
				'비고 (선택)'
			]
			expectedColumns.forEach(col => console.log(`   - ${col}`))
			console.log('')

			// 매칭 확인
			const actualColumns = Object.keys(firstRow)
			const missingRequired = ['카테고리', '항목명', '년도', '총액'].filter(
				col => !actualColumns.includes(col)
			)

			if (missingRequired.length > 0) {
				console.log('⚠️  Missing required columns:')
				missingRequired.forEach(col => console.log(`   ❌ ${col}`))
				console.log('')
				console.log('💡 Suggestion: Please rename columns to match expected names')
			} else {
				console.log('✅ All required columns are present!')
			}
		}

	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	}
}

analyzeExcel()
