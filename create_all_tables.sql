-- ============================================
-- ZipCheck 전체 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. 사용자 테이블 (네이버 OAuth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 네이버 로그인 정보
    naver_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    profile_image TEXT,

    -- 권한 관리
    role TEXT NOT NULL DEFAULT 'user',

    -- OAuth 제공자
    oauth_provider TEXT DEFAULT 'naver',

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_naver_id ON users(naver_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. 업체 후기 테이블
CREATE TABLE IF NOT EXISTS company_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    author_name TEXT NOT NULL,
    author_email TEXT,
    company_name TEXT NOT NULL,
    company_type TEXT,
    region TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    project_type TEXT,
    project_size INTEGER,
    project_cost INTEGER,
    project_period INTEGER,
    project_date DATE,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    schedule_rating INTEGER CHECK (schedule_rating >= 1 AND schedule_rating <= 5),
    images JSONB DEFAULT '[]',
    is_recommended BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 피해 사례 테이블
CREATE TABLE IF NOT EXISTS damage_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    author_name TEXT NOT NULL,
    author_email TEXT,
    company_name TEXT,
    company_type TEXT,
    region TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    damage_type TEXT,
    damage_amount INTEGER,
    project_type TEXT,
    project_size INTEGER,
    contract_amount INTEGER,
    incident_date DATE,
    resolution_status TEXT DEFAULT 'unresolved',
    resolution_details TEXT,
    legal_action BOOLEAN DEFAULT false,
    legal_details TEXT,
    images JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    is_verified BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    author_name TEXT NOT NULL,
    author_email TEXT,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    parent_comment_id UUID,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 좋아요 테이블
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- 6. 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID,
    reporter_email TEXT,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- 업체 후기 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON company_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON company_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON company_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_like_count ON company_reviews(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_region ON company_reviews(region);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON company_reviews(user_id);

-- 피해 사례 인덱스
CREATE INDEX IF NOT EXISTS idx_damage_created_at ON damage_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_status ON damage_cases(status);
CREATE INDEX IF NOT EXISTS idx_damage_type ON damage_cases(damage_type);
CREATE INDEX IF NOT EXISTS idx_damage_resolution ON damage_cases(resolution_status);
CREATE INDEX IF NOT EXISTS idx_damage_region ON damage_cases(region);
CREATE INDEX IF NOT EXISTS idx_damage_user_id ON damage_cases(user_id);

-- 댓글 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- 좋아요 인덱스
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 신고 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
