import { supabase } from '../lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function createQuoteRequestsTable() {
	console.log('🔧 Creating quote_requests table...')

	const sqlPath = path.resolve(__dirname, '../../../quote-requests-schema.sql')
	const sql = fs.readFileSync(sqlPath, 'utf-8')

	try {
		// Execute the SQL using Supabase's RPC
		const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

		if (error) {
			console.error('❌ Error creating table:', error)
			throw error
		}

		console.log('✅ quote_requests table created successfully!')
		console.log('📊 Result:', data)
	} catch (error) {
		console.error('❌ Migration failed:', error)
		process.exit(1)
	}
}

createQuoteRequestsTable()
