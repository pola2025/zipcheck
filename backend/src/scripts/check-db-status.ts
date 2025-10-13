/**
 * Neon DB 상태 확인 스크립트
 */

import { Client } from 'pg'
import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function checkDatabaseStatus() {
	console.log('🔍 Checking Neon DB status...\n')

	if (!process.env.DATABASE_URL) {
		console.error('❌ DATABASE_URL not found')
		process.exit(1)
	}

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false }
	})

	try {
		await client.connect()
		console.log('✅ Connected to Neon DB\n')

		// Check tables
		console.log('📊 Tables:')
		const tablesResult = await client.query(`
			SELECT tablename
			FROM pg_tables
			WHERE schemaname = 'public'
			ORDER BY tablename
		`)
		tablesResult.rows.forEach(row => {
			console.log(`   - ${row.tablename}`)
		})

		// Check views
		console.log('\n📊 Views:')
		const viewsResult = await client.query(`
			SELECT viewname
			FROM pg_views
			WHERE schemaname = 'public'
			ORDER BY viewname
		`)
		if (viewsResult.rows.length === 0) {
			console.log('   (none)')
		} else {
			viewsResult.rows.forEach(row => {
				console.log(`   - ${row.viewname}`)
			})
		}

		// Check triggers
		console.log('\n⚡ Triggers:')
		const triggersResult = await client.query(`
			SELECT trigger_name, event_object_table
			FROM information_schema.triggers
			WHERE trigger_schema = 'public'
			ORDER BY event_object_table, trigger_name
		`)
		if (triggersResult.rows.length === 0) {
			console.log('   (none)')
		} else {
			triggersResult.rows.forEach(row => {
				console.log(`   - ${row.trigger_name} on ${row.event_object_table}`)
			})
		}

		// Check row counts
		console.log('\n📈 Row counts:')
		const tableNames = tablesResult.rows.map(r => r.tablename)
		for (const tableName of tableNames) {
			const countResult = await client.query(`SELECT COUNT(*) as count FROM public.${tableName}`)
			console.log(`   - ${tableName}: ${countResult.rows[0].count} rows`)
		}

		console.log('\n✅ Database check complete!')

	} catch (error: any) {
		console.error('\n❌ Error:', error.message)
		process.exit(1)
	} finally {
		await client.end()
	}
}

checkDatabaseStatus()
