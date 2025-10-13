/**
 * 테스트 데이터 status 업데이트
 */

import { pool } from '../lib/db'

async function updateStatus() {
	console.log('🔄 Updating status columns...')

	try {
		// Update company_reviews status to 'published'
		const reviewsResult = await pool.query(`
			UPDATE company_reviews
			SET status = 'published'
			WHERE status IS NULL OR status = ''
		`)
		console.log(`✅ Updated ${reviewsResult.rowCount} company reviews to 'published'`)

		// Update damage_cases status to 'open'
		const damageResult = await pool.query(`
			UPDATE damage_cases
			SET status = 'open'
			WHERE status IS NULL OR status = ''
		`)
		console.log(`✅ Updated ${damageResult.rowCount} damage cases to 'open'`)

		console.log('\n✅ Status update complete!')

	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

updateStatus()
