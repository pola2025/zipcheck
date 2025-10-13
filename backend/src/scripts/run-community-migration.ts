import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
})

async function runMigration() {
	const migrationPath = path.join(__dirname, '../../../supabase/migrations/20251013_add_company_contact_fields.sql')
	console.log('📂 Reading migration from:', migrationPath)

	const sql = fs.readFileSync(migrationPath, 'utf8')
	console.log('✅ Loaded SQL migration')

	try {
		console.log('🔧 Executing migration...')
		await pool.query(sql)
		console.log('✅ Migration completed successfully!')

		// Verify columns were added
		const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'company_reviews'
      AND column_name IN ('company_phone', 'business_number')
      ORDER BY column_name;
    `)

		console.log('\n📋 Verified columns in company_reviews:')
		result.rows.forEach((row) => {
			console.log(`  - ${row.column_name}: ${row.data_type}`)
		})

		if (result.rows.length === 2) {
			console.log('\n✅ All columns successfully added!')
		} else {
			console.log('\n⚠️  Some columns may be missing')
		}
	} catch (error) {
		console.error('❌ Migration failed:', error)
		throw error
	} finally {
		await pool.end()
	}
}

runMigration()
