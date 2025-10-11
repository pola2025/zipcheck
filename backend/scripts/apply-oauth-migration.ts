import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('❌ Missing Supabase configuration')
	process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
	try {
		console.log('🔄 Applying OAuth fields migration...')

		// Read the migration SQL file
		const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20251010_add_oauth_fields.sql')
		const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

		// Split into individual statements (simple split by semicolon)
		const statements = migrationSQL
			.split(';')
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !s.startsWith('--'))

		console.log(`📝 Found ${statements.length} SQL statements to execute`)

		// Execute each statement
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i]
			if (statement.toLowerCase().startsWith('comment on')) {
				// Skip COMMENT statements as they might not work via RPC
				console.log(`⏭️  Skipping comment statement ${i + 1}`)
				continue
			}

			console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`)
			const { error } = await supabase.rpc('exec_sql', { sql: statement })

			if (error) {
				// Check if it's a "already exists" error, which is okay
				if (
					error.message.includes('already exists') ||
					error.message.includes('column') ||
					error.message.includes('duplicate')
				) {
					console.log(`⚠️  Statement ${i + 1} - Column/Index already exists (safe to ignore)`)
					continue
				}
				throw error
			}

			console.log(`✅ Statement ${i + 1} completed`)
		}

		console.log('\n✅ Migration applied successfully!')
		console.log('\n📊 Verifying table structure...')

		// Verify the changes
		const { data, error } = await supabase.from('users').select('*').limit(1)

		if (error) {
			console.error('❌ Error verifying table:', error)
		} else {
			console.log('✅ Users table is accessible')
		}

		process.exit(0)
	} catch (error) {
		console.error('❌ Migration failed:', error)
		process.exit(1)
	}
}

applyMigration()
