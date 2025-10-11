-- ============================================
-- ZipCheck 커뮤니티 기능 스키마
-- 업체 후기, 피해 사례, 댓글, 좋아요, 신고 기능
-- ============================================

-- 1. 업체 후기 테이블
CREATE TABLE IF NOT EXISTS company_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 작성자 정보
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,

    -- 업체 정보
    company_name TEXT NOT NULL,
    company_type TEXT, -- 인테리어 업체 종류 (시공사, 설계사, 자재업체 등)
    region TEXT, -- 지역

    -- 후기 내용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5점 평점

    -- 시공 정보
    project_type TEXT, -- 프로젝트 유형 (신축, 리모델링 등)
    project_size INTEGER, -- 평수
    project_cost INTEGER, -- 시공비용 (만원)
    project_period INTEGER, -- 시공 기간 (일)
    project_date DATE, -- 시공 완료일

    -- 평가 항목 (1-5점)
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    schedule_rating INTEGER CHECK (schedule_rating >= 1 AND schedule_rating <= 5),

    -- 이미지
    images JSONB DEFAULT '[]', -- 시공 전후 사진 URL 배열

    -- 추천 여부
    is_recommended BOOLEAN DEFAULT true,

    -- 통계
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    -- 상태
    status TEXT DEFAULT 'published', -- published, hidden, deleted
    is_verified BOOLEAN DEFAULT false, -- 관리자 검증 여부

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 피해 사례 테이블
CREATE TABLE IF NOT EXISTS damage_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 작성자 정보
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,

    -- 업체 정보
    company_name TEXT, -- 익명 가능
    company_type TEXT,
    region TEXT,

    -- 사례 내용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    damage_type TEXT, -- 피해 유형 (사기, 부실시공, 계약위반, 추가비용 등)
    damage_amount INTEGER, -- 피해 금액 (만원)

    -- 시공 정보
    project_type TEXT,
    project_size INTEGER,
    contract_amount INTEGER, -- 계약 금액
    incident_date DATE, -- 사건 발생일

    -- 진행 상황
    resolution_status TEXT DEFAULT 'unresolved', -- unresolved, in_progress, resolved
    legal_action BOOLEAN DEFAULT false, -- 법적 조치 여부

    -- 증거 자료
    images JSONB DEFAULT '[]', -- 피해 증거 사진
    documents JSONB DEFAULT '[]', -- 계약서 등 문서 (URL)

    -- 통계
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    -- 상태
    status TEXT DEFAULT 'published',
    is_verified BOOLEAN DEFAULT false,
    admin_notes TEXT, -- 관리자 메모

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 댓글 테이블 (후기와 피해사례 공통)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 작성자 정보
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,

    -- 댓글 대상
    target_type TEXT NOT NULL, -- 'review' or 'damage_case'
    target_id UUID NOT NULL, -- company_reviews.id or damage_cases.id

    -- 대댓글 지원
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- 댓글 내용
    content TEXT NOT NULL,

    -- 통계
    like_count INTEGER DEFAULT 0,

    -- 상태
    status TEXT DEFAULT 'published',
    is_deleted BOOLEAN DEFAULT false,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 좋아요 테이블
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 사용자
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- 좋아요 대상
    target_type TEXT NOT NULL, -- 'review', 'damage_case', 'comment'
    target_id UUID NOT NULL,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 중복 방지 (한 사용자가 같은 대상에 한 번만 좋아요)
    UNIQUE(user_id, target_type, target_id)
);

-- 5. 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 신고자
    reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_email TEXT,

    -- 신고 대상
    target_type TEXT NOT NULL, -- 'review', 'damage_case', 'comment'
    target_id UUID NOT NULL,

    -- 신고 내용
    reason TEXT NOT NULL, -- 신고 사유 (스팸, 욕설, 허위정보, 기타)
    description TEXT, -- 상세 설명

    -- 처리 상태
    status TEXT DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- company_reviews 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON company_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_company_name ON company_reviews(company_name);
CREATE INDEX IF NOT EXISTS idx_reviews_region ON company_reviews(region);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON company_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON company_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON company_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_like_count ON company_reviews(like_count DESC);

-- damage_cases 인덱스
CREATE INDEX IF NOT EXISTS idx_damage_user_id ON damage_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_damage_company_name ON damage_cases(company_name);
CREATE INDEX IF NOT EXISTS idx_damage_region ON damage_cases(region);
CREATE INDEX IF NOT EXISTS idx_damage_type ON damage_cases(damage_type);
CREATE INDEX IF NOT EXISTS idx_damage_status ON damage_cases(status);
CREATE INDEX IF NOT EXISTS idx_damage_created_at ON damage_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_resolution ON damage_cases(resolution_status);

-- comments 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- likes 인덱스
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);

-- reports 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- 트리거: 통계 자동 업데이트
-- ============================================

-- 후기 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 댓글 수 업데이트
    IF TG_TABLE_NAME = 'comments' AND NEW.target_type = 'review' THEN
        UPDATE company_reviews
        SET comment_count = (
            SELECT COUNT(*) FROM comments
            WHERE target_type = 'review'
            AND target_id = NEW.target_id
            AND is_deleted = false
        )
        WHERE id = NEW.target_id;
    END IF;

    -- 좋아요 수 업데이트
    IF TG_TABLE_NAME = 'likes' AND NEW.target_type = 'review' THEN
        UPDATE company_reviews
        SET like_count = (
            SELECT COUNT(*) FROM likes
            WHERE target_type = 'review'
            AND target_id = NEW.target_id
        )
        WHERE id = NEW.target_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 피해사례 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_damage_case_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 댓글 수 업데이트
    IF TG_TABLE_NAME = 'comments' AND NEW.target_type = 'damage_case' THEN
        UPDATE damage_cases
        SET comment_count = (
            SELECT COUNT(*) FROM comments
            WHERE target_type = 'damage_case'
            AND target_id = NEW.target_id
            AND is_deleted = false
        )
        WHERE id = NEW.target_id;
    END IF;

    -- 좋아요 수 업데이트
    IF TG_TABLE_NAME = 'likes' AND NEW.target_type = 'damage_case' THEN
        UPDATE damage_cases
        SET like_count = (
            SELECT COUNT(*) FROM likes
            WHERE target_type = 'damage_case'
            AND target_id = NEW.target_id
        )
        WHERE id = NEW.target_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 댓글 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'likes' AND NEW.target_type = 'comment' THEN
        UPDATE comments
        SET like_count = (
            SELECT COUNT(*) FROM likes
            WHERE target_type = 'comment'
            AND target_id = NEW.target_id
        )
        WHERE id = NEW.target_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_review_stats_comments
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION update_review_stats();

CREATE TRIGGER trigger_update_review_stats_likes
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_review_stats();

CREATE TRIGGER trigger_update_damage_case_stats_comments
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION update_damage_case_stats();

CREATE TRIGGER trigger_update_damage_case_stats_likes
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_damage_case_stats();

CREATE TRIGGER trigger_update_comment_stats_likes
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_stats();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- company_reviews RLS
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews"
ON company_reviews FOR SELECT
USING (status = 'published');

CREATE POLICY "Users can insert their own reviews"
ON company_reviews FOR INSERT
WITH CHECK (user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own reviews"
ON company_reviews FOR UPDATE
USING (user_id::text = current_setting('app.user_id', true));

-- damage_cases RLS
ALTER TABLE damage_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published damage cases"
ON damage_cases FOR SELECT
USING (status = 'published');

CREATE POLICY "Users can insert their own cases"
ON damage_cases FOR INSERT
WITH CHECK (user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own cases"
ON damage_cases FOR UPDATE
USING (user_id::text = current_setting('app.user_id', true));

-- comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published comments"
ON comments FOR SELECT
USING (status = 'published' AND is_deleted = false);

CREATE POLICY "Users can insert comments"
ON comments FOR INSERT
WITH CHECK (user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (user_id::text = current_setting('app.user_id', true));

-- likes RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own likes"
ON likes FOR ALL
USING (user_id::text = current_setting('app.user_id', true));

-- reports RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
USING (reporter_user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can insert reports"
ON reports FOR INSERT
WITH CHECK (reporter_user_id::text = current_setting('app.user_id', true));

-- ============================================
-- 테이블 코멘트
-- ============================================

COMMENT ON TABLE company_reviews IS '인테리어 업체 후기 게시판';
COMMENT ON TABLE damage_cases IS '인테리어 피해 사례 게시판';
COMMENT ON TABLE comments IS '댓글 (후기/피해사례 공통)';
COMMENT ON TABLE likes IS '좋아요 (후기/피해사례/댓글)';
COMMENT ON TABLE reports IS '신고 (후기/피해사례/댓글)';
