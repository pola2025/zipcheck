-- ============================================
-- ZipCheck Community Schema Migration
-- Adds: Google OAuth, IP tracking, slug, enhanced fields
-- Run against Neon PostgreSQL
-- ============================================

-- 1. Users table: Add Google OAuth fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'phone';

-- Update existing users without auth_provider
UPDATE users SET auth_provider = 'naver' WHERE naver_id IS NOT NULL AND auth_provider = 'phone';

-- 2. Company Reviews: Add IP, slug, and enhanced fields
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS business_number TEXT;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS before_images JSONB DEFAULT '[]';
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS after_images JSONB DEFAULT '[]';
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS disclaimer_agreed BOOLEAN DEFAULT false;

-- 3. Damage Cases: Add IP, slug, and enhanced fields
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS disclaimer_agreed BOOLEAN DEFAULT false;
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS disclaimer_agreed_at TIMESTAMPTZ;

-- 4. Comments: Add IP tracking
ALTER TABLE comments ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 5. Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_reviews_slug ON company_reviews(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_company_name ON company_reviews(company_name);
CREATE INDEX IF NOT EXISTS idx_reviews_business_number ON company_reviews(business_number);

CREATE INDEX IF NOT EXISTS idx_damage_slug ON damage_cases(slug);
CREATE INDEX IF NOT EXISTS idx_damage_company_name ON damage_cases(company_name);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
