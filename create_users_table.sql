-- ============================================
-- ZipCheck Users 테이블 생성 (네이버 OAuth 지원)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 네이버 OAuth 정보
    naver_id VARCHAR(100) UNIQUE,
    oauth_provider VARCHAR(20) DEFAULT 'naver',

    -- 사용자 기본 정보
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(500),

    -- 타임스탬프
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_naver_id ON users(naver_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE users IS '사용자 정보 테이블 (네이버 OAuth 로그인)';
COMMENT ON COLUMN users.naver_id IS '네이버 고유 ID';
COMMENT ON COLUMN users.oauth_provider IS 'OAuth 제공자 (naver)';
COMMENT ON COLUMN users.email IS '이메일 주소';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.phone IS '전화번호';
COMMENT ON COLUMN users.profile_image IS '프로필 이미지 URL';
