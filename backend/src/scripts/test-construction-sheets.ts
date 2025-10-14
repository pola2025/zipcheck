/**
 * 현장별 실행내역서 파싱 테스트
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseConstructionSheets } from '../services/construction-sheet-parser'

async function testParsing() {
	const filePath = path.resolve('F:\\GOI\\현장별실행내역서.xlsx')

	console.log('📂 Testing Construction Sheets Parser...')
	console.log(`📁 File: ${filePath}\n`)

	try {
		const buffer = fs.readFileSync(filePath)

		console.log('🔄 Parsing file...\n')
		const projects = parseConstructionSheets(buffer)

		console.log('='.repeat(80))
		console.log(`✅ Successfully parsed ${projects.length} projects\n`)

		// 첫 5개 프로젝트 상세 정보
		projects.slice(0, 5).forEach((project, idx) => {
			console.log(`\n📋 Project ${idx + 1}: ${project.projectName}`)
			console.log(`   Period: ${project.projectPeriod}`)
			console.log(`   Year: ${project.year}, Month: ${project.month || 'N/A'}, Quarter: ${project.quarter || 'N/A'}`)
			console.log(`   Region: ${project.region || 'N/A'}`)
			console.log(`   Items: ${project.items.length}`)

			if (project.items.length > 0) {
				console.log(`\n   📦 First 3 items:`)
				project.items.slice(0, 3).forEach((item, itemIdx) => {
					console.log(`      ${itemIdx + 1}. [${item.category}] ${item.itemName}`)
					console.log(`         Amount: ${item.amount.toLocaleString()}원`)
					console.log(`         Vendor: ${item.vendor || 'N/A'}`)
					if (item.notes) {
						console.log(`         Notes: ${item.notes}`)
					}
				})
			}
		})

		console.log('\n' + '='.repeat(80))
		console.log('\n📊 Summary by Category:\n')

		// 카테고리별 집계
		const categoryStats = new Map<string, { count: number; total: number }>()

		projects.forEach(project => {
			project.items.forEach(item => {
				const stat = categoryStats.get(item.category) || { count: 0, total: 0 }
				stat.count++
				stat.total += item.amount
				categoryStats.set(item.category, stat)
			})
		})

		const sortedCategories = Array.from(categoryStats.entries())
			.sort((a, b) => b[1].total - a[1].total)

		sortedCategories.forEach(([category, stat]) => {
			console.log(`   ${category.padEnd(10)} | ${stat.count.toString().padStart(4)} items | ${stat.total.toLocaleString().padStart(15)}원`)
		})

		console.log('\n' + '='.repeat(80))
		const totalItems = projects.reduce((sum, p) => sum + p.items.length, 0)
		const totalAmount = Array.from(categoryStats.values()).reduce((sum, s) => sum + s.total, 0)
		console.log(`\n📈 Grand Total:`)
		console.log(`   Projects: ${projects.length}`)
		console.log(`   Items: ${totalItems}`)
		console.log(`   Total Amount: ${totalAmount.toLocaleString()}원`)
		console.log(`   Average per Project: ${(totalAmount / projects.length).toLocaleString()}원`)
		console.log(`   Average per Item: ${(totalAmount / totalItems).toLocaleString()}원`)

	} catch (error) {
		console.error('❌ Error:', error)
		if (error instanceof Error) {
			console.error('Stack:', error.stack)
		}
		process.exit(1)
	}
}

testParsing()
