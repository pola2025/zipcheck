/**
 * company_reviews 테이블 스키마 업데이트
 * 연락처와 사업자번호 컬럼 추가
 */

import { pool } from '../lib/db'

async function updateCompanyReviewsSchema() {
	console.log('🔄 Updating company_reviews schema...\n')

	const client = await pool.connect()

	try {
		// 1. 연락처 컬럼 추가
		console.log('📝 Adding company_phone column...')
		await client.query(`
			ALTER TABLE company_reviews
			ADD COLUMN IF NOT EXISTS company_phone TEXT
		`)
		console.log('✅ company_phone column added')

		// 2. 사업자번호 컬럼 추가
		console.log('📝 Adding business_number column...')
		await client.query(`
			ALTER TABLE company_reviews
			ADD COLUMN IF NOT EXISTS business_number TEXT
		`)
		console.log('✅ business_number column added')

		console.log('\n' + '='.repeat(60))
		console.log('✅ Schema update completed!')
		console.log('='.repeat(60))

		// 스키마 확인
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
		console.error('\n❌ Schema update failed:', error.message)
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

// Run update
updateCompanyReviewsSchema()
