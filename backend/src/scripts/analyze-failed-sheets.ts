/**
 * 파싱 실패한 시트들 분석
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const failedSheets = [
	"불광로16길15 2층",
	"보라매네일샾",
	"구산동세화아파트",
	"서초태동스위트아파트"
]

async function analyzeFailedSheets() {
	const filePath = path.resolve('F:\\GOI\\현장별실행내역서.xlsx')

	try {
		const buffer = fs.readFileSync(filePath)
		const workbook = XLSX.read(buffer, {
			type: 'buffer',
			codepage: 65001
		})

		for (const sheetName of failedSheets) {
			console.log('\n' + '='.repeat(80))
			console.log(`🔍 Analyzing: "${sheetName}"`)
			console.log('='.repeat(80))

			if (!workbook.Sheets[sheetName]) {
				console.log('❌ Sheet not found!')
				continue
			}

			const worksheet = workbook.Sheets[sheetName]

			// 배열 형식으로 변환
			const data = XLSX.utils.sheet_to_json(worksheet, {
				raw: false,
				defval: null,
				header: 1
			}) as any[][]

			console.log(`\nTotal rows: ${data.length}`)

			if (data.length === 0) {
				console.log('⚠️  Empty sheet!')
				continue
			}

			console.log('\n📋 First 15 rows:\n')
			data.slice(0, 15).forEach((row: any, idx) => {
				console.log(`Row ${idx + 1}:`, row)
			})

			// 항목 찾기 시도
			console.log('\n🔍 Looking for item rows (starting from row 8):\n')
			for (let i = 7; i < Math.min(data.length, 30); i++) {
				const row = data[i]
				if (!row || row.length < 4) continue

				const number = String(row[0] || '').trim()
				const category = String(row[1] || '').trim()
				const vendor = String(row[2] || '').trim()
				const amount = String(row[3] || '').trim()

				console.log(`Row ${i + 1}:`)
				console.log(`   [0] Number: "${number}"`)
				console.log(`   [1] Category: "${category}"`)
				console.log(`   [2] Vendor: "${vendor}"`)
				console.log(`   [3] Amount: "${amount}"`)

				// 검증
				if (!number) {
					console.log(`   ❌ No number`)
				} else if (!category) {
					console.log(`   ❌ No category`)
				} else if (!amount) {
					console.log(`   ❌ No amount`)
				} else {
					const parsedAmount = parseFloat(amount.replace(/[,₩원\s]/g, ''))
					if (isNaN(parsedAmount) || parsedAmount <= 0) {
						console.log(`   ❌ Invalid amount: ${parsedAmount}`)
					} else {
						console.log(`   ✅ Valid item!`)
					}
				}
			}
		}

	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	}
}

analyzeFailedSheets()
