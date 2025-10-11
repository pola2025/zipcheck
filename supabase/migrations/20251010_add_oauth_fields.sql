-- Add OAuth-related fields to users table
-- Migration created: 2025-10-10

-- Add phone field for storing user phone number from Naver
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add oauth_provider field to track which OAuth provider was used
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT 'naver';

-- Add joined_at field to track when user first registered
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT now();

-- Make naver_id nullable to support multiple OAuth providers in the future
ALTER TABLE users ALTER COLUMN naver_id DROP NOT NULL;

-- Add index on oauth_provider for faster queries
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);

-- Add index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update RLS policies to work with nullable naver_id
-- (existing policies remain the same as they use id field)

-- Comments for documentation
COMMENT ON COLUMN users.phone IS '사용자 휴대폰번호 (네이버 OAuth에서 제공)';
COMMENT ON COLUMN users.oauth_provider IS 'OAuth 제공자 (naver, kakao, google 등)';
COMMENT ON COLUMN users.joined_at IS '최초 가입 일시';
