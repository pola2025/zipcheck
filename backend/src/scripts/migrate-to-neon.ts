/**
 * Neon DB 마이그레이션 스크립트
 * 통합 스키마를 Neon DB에 적용합니다
 */

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function migrateToNeon() {
	console.log('🚀 Starting Neon DB migration...\n')

	if (!process.env.DATABASE_URL) {
		console.error('❌ DATABASE_URL not found in .env file')
		console.error('Please add DATABASE_URL to backend/.env')
		process.exit(1)
	}

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	})

	try {
		// Connect to Neon DB
		console.log('⏳ Connecting to Neon DB...')
		await client.connect()
		console.log('✅ Connected to Neon DB\n')

		// Read SQL schema file
		const schemaPath = path.resolve(__dirname, '../../migrations/neon_complete_schema.sql')
		console.log('📄 Reading schema file:', schemaPath)

		if (!fs.existsSync(schemaPath)) {
			throw new Error(`Schema file not found: ${schemaPath}`)
		}

		const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
		console.log('✅ Schema file loaded\n')

		// Execute schema
		console.log('⏳ Executing schema migration...')
		console.log('This may take a moment...\n')

		await client.query(schemaSql)

		console.log('✅ Schema migration completed successfully!\n')

		// Verify tables
		console.log('📊 Verifying created tables...')
		const result = await client.query(`
			SELECT tablename
			FROM pg_tables
			WHERE schemaname = 'public'
			ORDER BY tablename
		`)

		console.log('\n✅ Tables created:')
		result.rows.forEach(row => {
			console.log(`   - ${row.tablename}`)
		})

		console.log('\n' + '='.repeat(60))
		console.log('✅ Neon DB migration completed successfully!')
		console.log('='.repeat(60))
		console.log('\n💡 Next steps:')
		console.log('   1. Update code to use PostgreSQL client (lib/db.ts)')
		console.log('   2. Replace Supabase API calls with SQL queries')
		console.log('   3. Test locally')
		console.log('   4. Deploy to Railway\n')

	} catch (error: any) {
		console.error('\n❌ Migration failed:', error.message)
		if (error.detail) {
			console.error('Detail:', error.detail)
		}
		if (error.hint) {
			console.error('Hint:', error.hint)
		}
		process.exit(1)
	} finally {
		await client.end()
		console.log('🔌 Disconnected from Neon DB')
	}
}

// Run migration
migrateToNeon()
