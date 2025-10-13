/**
 * 테이블 스키마 확인
 */

import { pool } from '../lib/db'

async function checkSchema() {
	try {
		const tables = ['company_reviews', 'damage_cases']

		for (const table of tables) {
			console.log(`\n📊 ${table} columns:`)
			const result = await pool.query(`
				SELECT column_name, data_type
				FROM information_schema.columns
				WHERE table_name = $1
				ORDER BY ordinal_position
			`, [table])

			result.rows.forEach(c => {
				console.log(`   - ${c.column_name}: ${c.data_type}`)
			})
		}

	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

checkSchema()
