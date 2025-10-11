import { supabase } from '../src/lib/supabase'

async function addOAuthFields() {
	try {
		console.log('🔄 Checking users table structure...')

		// Test query to see current structure
		const { data: testUser, error: testError } = await supabase
			.from('users')
			.select('*')
			.limit(1)
			.single()

		console.log('📊 Current table structure:', testUser || 'No users yet')
		console.log('Note: If you see column errors, the migration needs to be applied.')
		console.log('\n⚠️  Please run the following SQL manually in Supabase Dashboard SQL Editor:\n')

		const migrationSQL = `
-- Add OAuth-related fields to users table

-- Add phone field
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add oauth_provider field
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT 'naver';

-- Add joined_at field
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT now();

-- Make naver_id nullable
ALTER TABLE users ALTER COLUMN naver_id DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
`

		console.log(migrationSQL)
		console.log('\n📝 Steps to apply:')
		console.log('1. Go to https://supabase.com/dashboard/project/qfnqxzabcuzhkwptfnpa/sql/new')
		console.log('2. Copy and paste the SQL above')
		console.log('3. Click "Run" to execute')
		console.log('\nOr run via Supabase CLI:')
		console.log(
			'psql "postgresql://postgres.[password]@db.qfnqxzabcuzhkwptfnpa.supabase.co:5432/postgres" -f supabase/migrations/20251010_add_oauth_fields.sql\n'
		)
	} catch (error) {
		console.error('❌ Error:', error)
	}
}

addOAuthFields()
