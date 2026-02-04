/**
 * company_reviews 테이블에 before_images / after_images 컬럼 추가
 */

import { pool } from '../lib/db'

async function addBeforeAfterImages() {
	console.log('🔄 Adding before_images / after_images columns...\n')

	const client = await pool.connect()

	try {
		console.log('📝 Adding before_images column...')
		await client.query(`
			ALTER TABLE company_reviews
			ADD COLUMN IF NOT EXISTS before_images JSONB DEFAULT '[]'
		`)
		console.log('✅ before_images column added')

		console.log('📝 Adding after_images column...')
		await client.query(`
			ALTER TABLE company_reviews
			ADD COLUMN IF NOT EXISTS after_images JSONB DEFAULT '[]'
		`)
		console.log('✅ after_images column added')

		console.log('\n' + '='.repeat(60))
		console.log('✅ Migration completed!')
		console.log('='.repeat(60))

		// Verify schema
		console.log('\n📊 Updated schema:')
		const result = await client.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'company_reviews'
			ORDER BY ordinal_position
		`)
		result.rows.forEach(col => {
			console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
		})

	} catch (error: any) {
		console.error('\n❌ Migration failed:', error.message)
		if (error.detail) {
			console.error('Detail:', error.detail)
		}
		process.exit(1)
	} finally {
		client.release()
		await pool.end()
		console.log('\n🔌 Database connection closed')
	}
}

addBeforeAfterImages()
