import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
})

async function migrate() {
	console.log('🔧 Running quote_requests table migration...\n')

	try {
		// Check if table already exists
		const { data: existing, error: checkError } = await supabase
			.from('quote_requests')
			.select('id')
			.limit(1)

		if (!checkError) {
			console.log('⚠️  Table quote_requests already exists!')
			console.log('✅ Migration complete (table already exists)')
			return
		}

		console.log('📝 Table does not exist, creating...\n')

		// Execute the SQL schema
		const sqlStatements = `
-- 견적 신청 테이블
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 고객 정보
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,

    -- 매물 정보
    property_type TEXT NOT NULL,
    property_size DECIMAL,
    region TEXT NOT NULL,
    address TEXT,

    -- 견적 항목들 (JSON)
    items JSONB NOT NULL,

    -- 신청 상태
    status TEXT NOT NULL DEFAULT 'pending',

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 분석 결과
    analysis_result JSONB,
    analyzed_at TIMESTAMPTZ,
    analyzed_by TEXT,

    -- 관리자 코멘트
    admin_notes TEXT
);

-- 인덱스
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX idx_quote_requests_customer_phone ON quote_requests(customer_phone);

-- RLS 정책
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 신청 가능 (INSERT)
CREATE POLICY "Anyone can submit quote requests"
    ON quote_requests FOR INSERT
    WITH CHECK (true);

-- 본인 견적만 조회 가능 (전화번호 기반)
CREATE POLICY "Users can view their own quote requests"
    ON quote_requests FOR SELECT
    USING (customer_phone = current_setting('app.customer_phone', true));

-- 업데이트 타임스탬프 자동 갱신
CREATE OR REPLACE FUNCTION update_quote_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_request_timestamp
    BEFORE UPDATE ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_request_timestamp();
		`

		// Use the Supabase SQL query (this requires proper permissions)
		const { data, error } = await supabase.rpc('exec_sql', { sql: sqlStatements })

		if (error) {
			console.error('❌ Error executing SQL:', error.message)
			console.log('\n📋 Please execute the SQL manually in Supabase Dashboard:')
			console.log('1. Go to https://supabase.com/dashboard')
			console.log('2. Select your project')
			console.log('3. Click on "SQL Editor" in the left sidebar')
			console.log('4. Paste and run the contents of: quote-requests-schema.sql\n')
			process.exit(1)
		}

		console.log('✅ Migration completed successfully!')
		console.log('📊 Table quote_requests has been created')
	} catch (error) {
		console.error('❌ Migration failed:', error)
		console.log('\n📋 Please execute the SQL manually in Supabase Dashboard:')
		console.log('1. Go to https://supabase.com/dashboard')
		console.log('2. Select your project')
		console.log('3. Click on "SQL Editor" in the left sidebar')
		console.log('4. Paste and run the contents of: quote-requests-schema.sql\n')
		process.exit(1)
	}
}

migrate()
