/**
 * 업로드된 데이터 통계 확인
 */

import { pool } from '../lib/db'

async function checkUploadedData() {
	console.log('📊 Checking uploaded data statistics...\n')

	try {
		// 1. 카테고리 수
		const categoriesResult = await pool.query('SELECT COUNT(*) as count FROM categories')
		console.log(`📂 Categories: ${categoriesResult.rows[0].count}`)

		// 2. 항목 수
		const itemsResult = await pool.query('SELECT COUNT(*) as count FROM items')
		console.log(`📦 Items: ${itemsResult.rows[0].count}`)

		// 3. 시공 기록 수
		const recordsResult = await pool.query('SELECT COUNT(*) as count FROM construction_records')
		console.log(`📝 Construction Records: ${recordsResult.rows[0].count}`)

		// 4. 업로드 히스토리
		const historyResult = await pool.query(`
			SELECT
				id,
				dataset_type,
				file_name,
				status,
				total_rows,
				success_rows,
				error_rows,
				created_at
			FROM upload_history
			ORDER BY created_at DESC
			LIMIT 5
		`)

		console.log(`\n📋 Recent Upload History (last 5):`)
		historyResult.rows.forEach((row, idx) => {
			console.log(`\n${idx + 1}. ${row.file_name}`)
			console.log(`   Type: ${row.dataset_type}`)
			console.log(`   Status: ${row.status}`)
			console.log(`   Total: ${row.total_rows}, Success: ${row.success_rows}, Errors: ${row.error_rows}`)
			console.log(`   Date: ${new Date(row.created_at).toLocaleString()}`)
		})

		// 5. 카테고리별 통계
		const categoryStatsResult = await pool.query(`
			SELECT
				c.name as category,
				COUNT(cr.id) as record_count,
				SUM(cr.total_cost) as total_cost,
				AVG(cr.total_cost) as avg_cost
			FROM categories c
			LEFT JOIN items i ON i.category_id = c.id
			LEFT JOIN construction_records cr ON cr.item_id = i.id
			GROUP BY c.name
			ORDER BY total_cost DESC NULLS LAST
		`)

		console.log(`\n📊 Category Statistics:`)
		categoryStatsResult.rows.forEach(row => {
			if (row.record_count > 0) {
				console.log(`   ${row.category.padEnd(15)} | ${String(row.record_count).padStart(5)} records | ₩${parseInt(row.total_cost).toLocaleString().padStart(18)} | Avg: ₩${parseInt(row.avg_cost).toLocaleString()}`)
			}
		})

		// 6. 지역별 통계
		const regionStatsResult = await pool.query(`
			SELECT
				region,
				COUNT(*) as count,
				SUM(total_cost) as total_cost
			FROM construction_records
			WHERE region IS NOT NULL
			GROUP BY region
			ORDER BY total_cost DESC
			LIMIT 10
		`)

		console.log(`\n🗺️  Top 10 Regions:`)
		regionStatsResult.rows.forEach(row => {
			console.log(`   ${row.region.padEnd(10)} | ${String(row.count).padStart(4)} records | ₩${parseInt(row.total_cost).toLocaleString()}`)
		})

		// 7. 연도별 통계
		const yearStatsResult = await pool.query(`
			SELECT
				year,
				COUNT(*) as count,
				SUM(total_cost) as total_cost
			FROM construction_records
			GROUP BY year
			ORDER BY year DESC
		`)

		console.log(`\n📅 Year Statistics:`)
		yearStatsResult.rows.forEach(row => {
			console.log(`   ${row.year} | ${String(row.count).padStart(5)} records | ₩${parseInt(row.total_cost).toLocaleString()}`)
		})

		console.log('\n✅ Data check completed!')

	} catch (error) {
		console.error('❌ Error:', error)
	} finally {
		await pool.end()
	}
}

checkUploadedData()
