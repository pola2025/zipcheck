/**
 * Apply upload_history and market data tables migration
 * Uses Neon DB (PostgreSQL) connection
 */

import { pool } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function applyMigration() {
	console.log('🔧 Applying upload_history migration to Neon DB...\n')

	const migrationPath = path.resolve(
		__dirname,
		'../../migrations/add_upload_history_table.sql'
	)

	console.log(`📂 Reading: ${migrationPath}`)

	try {
		const sql = fs.readFileSync(migrationPath, 'utf-8')
		console.log(`✅ Loaded ${sql.length} characters\n`)

		// Execute the entire SQL file as a transaction
		const client = await pool.connect()

		try {
			await client.query('BEGIN')
			console.log('📝 Executing migration...\n')

			await client.query(sql)

			await client.query('COMMIT')
			console.log('\n✅ Migration applied successfully!')

			// Verify tables were created
			const tableCheckResult = await client.query(`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = 'public'
				AND table_name IN ('upload_history', 'categories', 'items', 'construction_records', 'distributor_prices', 'market_averages')
				ORDER BY table_name
			`)

			console.log('\n📊 Verified tables:')
			tableCheckResult.rows.forEach(row => {
				console.log(`   ✅ ${row.table_name}`)
			})

		} catch (error: any) {
			await client.query('ROLLBACK')
			console.error('❌ Migration failed, rolled back:', error.message)
			throw error
		} finally {
			client.release()
		}

		console.log('\n' + '='.repeat(60))
		console.log('🎉 Upload history migration completed successfully!')
		console.log('='.repeat(60))

	} catch (error: any) {
		console.error('\n❌ Failed to apply migration:', error.message)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

applyMigration()
