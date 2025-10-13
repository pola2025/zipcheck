-- ============================================================================
-- ZipCheck Neon DB Complete Schema
-- 작성일: 2025-10-12
-- 설명: Supabase에서 Neon DB로 마이그레이션을 위한 통합 스키마
-- ============================================================================

-- ============================================================================
-- 1. quote_requests 테이블 (메인 견적 요청)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_requests (
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
    admin_notes TEXT,

    -- 그룹 관련 (다중 견적 비교)
    group_id UUID,
    sequence_in_group INTEGER,

    -- 결제 및 가격 관련
    payment_id TEXT,
    plan_id TEXT,
    plan_name TEXT,
    quantity INTEGER DEFAULT 1 CHECK (quantity BETWEEN 1 AND 3),
    is_comparison BOOLEAN DEFAULT false,
    original_amount INTEGER,
    discount_amount INTEGER DEFAULT 0,
    paid_amount INTEGER,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    paid_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_phone ON public.quote_requests(customer_phone);
CREATE INDEX IF NOT EXISTS idx_quote_requests_group_id ON public.quote_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_payment_id ON public.quote_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_plan_id ON public.quote_requests(plan_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_payment_status ON public.quote_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_quantity ON public.quote_requests(quantity);

-- 컬럼 주석
COMMENT ON TABLE public.quote_requests IS '견적 요청 테이블 (메인)';
COMMENT ON COLUMN public.quote_requests.group_id IS '견적 비교 그룹 ID';
COMMENT ON COLUMN public.quote_requests.sequence_in_group IS '그룹 내 순서 (1, 2, 3)';
COMMENT ON COLUMN public.quote_requests.payment_id IS '결제 ID (토스페이먼츠 등)';
COMMENT ON COLUMN public.quote_requests.plan_id IS '요금제 ID (basic/fast/urgent/urgent-night/urgent-holiday)';
COMMENT ON COLUMN public.quote_requests.plan_name IS '요금제 이름';
COMMENT ON COLUMN public.quote_requests.quantity IS '견적 분석 건수 (1-3)';
COMMENT ON COLUMN public.quote_requests.is_comparison IS '다중 견적 비교 여부 (quantity >= 2)';
COMMENT ON COLUMN public.quote_requests.original_amount IS '정상 금액 (할인 전)';
COMMENT ON COLUMN public.quote_requests.discount_amount IS '다건 할인 금액';
COMMENT ON COLUMN public.quote_requests.paid_amount IS '실제 결제 금액 (VAT 포함)';
COMMENT ON COLUMN public.quote_requests.payment_status IS '결제 상태 (pending/paid/refunded/failed)';
COMMENT ON COLUMN public.quote_requests.paid_at IS '결제 완료 시각';

-- 업데이트 타임스탬프 자동 갱신
CREATE OR REPLACE FUNCTION update_quote_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_request_timestamp
    BEFORE UPDATE ON public.quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_request_timestamp();

-- ============================================================================
-- 2. quote_groups 테이블 (견적 그룹)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Group Info
  group_name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  property_size NUMERIC,
  region TEXT NOT NULL,
  address TEXT,

  -- Status & Pricing
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  quote_count INTEGER NOT NULL DEFAULT 1 CHECK (quote_count >= 1 AND quote_count <= 3),
  total_price INTEGER NOT NULL DEFAULT 30000,

  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quote_groups_customer_phone ON public.quote_groups(customer_phone);
CREATE INDEX IF NOT EXISTS idx_quote_groups_status ON public.quote_groups(status);
CREATE INDEX IF NOT EXISTS idx_quote_groups_expires_at ON public.quote_groups(expires_at);

-- 테이블 주석
COMMENT ON TABLE public.quote_groups IS '견적 비교 그룹 테이블 - 48시간 내 최대 3개 견적 비교 가능';

-- FK 추가 (quote_requests → quote_groups)
ALTER TABLE public.quote_requests
ADD CONSTRAINT fk_quote_requests_group_id
FOREIGN KEY (group_id) REFERENCES public.quote_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. quote_sets 테이블 (다중 견적 세트)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_sets (
    -- 기본 정보
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
    set_id TEXT NOT NULL CHECK (set_id IN ('SET_A', 'SET_B', 'SET_C')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 업체 정보
    vendor_name TEXT NOT NULL,
    vendor_phone TEXT,
    vendor_representative TEXT,
    vendor_business_number TEXT,
    vendor_verified BOOLEAN DEFAULT false,

    -- 커뮤니티 연동 정보 (업체 검증)
    community_vendor_id UUID,
    trust_score DECIMAL(3,2) CHECK (trust_score >= 0 AND trust_score <= 5),
    review_count INTEGER DEFAULT 0,
    complaint_count INTEGER DEFAULT 0,

    -- 업로드 정보
    upload_type TEXT NOT NULL CHECK (upload_type IN ('image', 'excel')),
    images JSONB DEFAULT '[]'::jsonb,
    excel_file JSONB,

    -- 파싱된 데이터
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount INTEGER NOT NULL DEFAULT 0,
    item_count INTEGER NOT NULL DEFAULT 0,

    -- 검증 상태
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'passed', 'failed')),
    validation_errors JSONB DEFAULT '[]'::jsonb,
    validation_warnings JSONB DEFAULT '[]'::jsonb,
    validated_at TIMESTAMPTZ,

    -- 분석 결과
    analysis_result JSONB,
    analysis_score DECIMAL(3,2) CHECK (analysis_score >= 0 AND analysis_score <= 5),
    analyzed_at TIMESTAMPTZ,

    -- 제약 조건: request_id + set_id 조합은 유니크
    UNIQUE (request_id, set_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quote_sets_request_id ON public.quote_sets(request_id);
CREATE INDEX IF NOT EXISTS idx_quote_sets_vendor_name ON public.quote_sets(vendor_name);
CREATE INDEX IF NOT EXISTS idx_quote_sets_validation_status ON public.quote_sets(validation_status);
CREATE INDEX IF NOT EXISTS idx_quote_sets_created_at ON public.quote_sets(created_at DESC);

-- 테이블 주석
COMMENT ON TABLE public.quote_sets IS '견적서 세트 (다중 견적 비교용) - 각 request에 최대 3개의 set (SET_A, SET_B, SET_C)';
COMMENT ON COLUMN public.quote_sets.set_id IS 'SET_A, SET_B, SET_C 중 하나';
COMMENT ON COLUMN public.quote_sets.vendor_name IS '업체명 (필수)';
COMMENT ON COLUMN public.quote_sets.community_vendor_id IS '커뮤니티 업체 ID (검증된 경우)';
COMMENT ON COLUMN public.quote_sets.trust_score IS '신뢰도 점수 (0.00 - 5.00)';
COMMENT ON COLUMN public.quote_sets.upload_type IS 'image 또는 excel';
COMMENT ON COLUMN public.quote_sets.images IS '업로드된 이미지 배열 (최대 3장)';
COMMENT ON COLUMN public.quote_sets.validation_status IS 'pending/passed/failed';
COMMENT ON COLUMN public.quote_sets.analysis_result IS 'AI 분석 결과 JSON';

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_quote_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_sets_updated_at
    BEFORE UPDATE ON public.quote_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_set_timestamp();

-- quote_sets 개수 검증 함수
CREATE OR REPLACE FUNCTION check_quote_sets_count()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_quantity INTEGER;
BEGIN
    SELECT COUNT(*), qr.quantity
    INTO current_count, max_quantity
    FROM public.quote_sets qs
    JOIN public.quote_requests qr ON qs.request_id = qr.id
    WHERE qs.request_id = NEW.request_id
    GROUP BY qr.quantity;

    IF current_count >= max_quantity THEN
        RAISE EXCEPTION 'Cannot add more quote sets. Maximum allowed: %, Current: %', max_quantity, current_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_quote_sets_limit
    BEFORE INSERT ON public.quote_sets
    FOR EACH ROW
    EXECUTE FUNCTION check_quote_sets_count();

-- ============================================================================
-- 4. comparison_analyses 테이블 (비교 분석 결과)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comparison_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES public.quote_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 비교 대상 (quote_sets의 ID 배열)
    quote_set_ids UUID[] NOT NULL,

    -- 비교 분석 결과 (AI 생성)
    comparison_result JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- AI 메타 정보
    model_version TEXT,
    processing_time_seconds INTEGER,

    analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_comparison_analyses_request_id ON public.comparison_analyses(request_id);
CREATE INDEX IF NOT EXISTS idx_comparison_analyses_created_at ON public.comparison_analyses(created_at DESC);

-- 테이블 주석
COMMENT ON TABLE public.comparison_analyses IS '다중 견적 비교 분석 결과 (2건 이상일 때 생성)';
COMMENT ON COLUMN public.comparison_analyses.quote_set_ids IS '비교 대상 quote_sets의 ID 배열';
COMMENT ON COLUMN public.comparison_analyses.comparison_result IS '비교 분석 결과 JSON (summary, itemComparison, recommendation 등)';
COMMENT ON COLUMN public.comparison_analyses.model_version IS 'AI 모델 버전 정보';
COMMENT ON COLUMN public.comparison_analyses.processing_time_seconds IS '분석 소요 시간 (초)';

-- ============================================================================
-- 5. users 테이블 (사용자 정보)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

COMMENT ON TABLE public.users IS '사용자 정보';

-- ============================================================================
-- 6. damage_cases 테이블 (하자 사례)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.damage_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_damage_cases_user_id ON public.damage_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_damage_cases_status ON public.damage_cases(status);
CREATE INDEX IF NOT EXISTS idx_damage_cases_created_at ON public.damage_cases(created_at DESC);

COMMENT ON TABLE public.damage_cases IS '하자 사례 게시판';

-- ============================================================================
-- 7. company_reviews 테이블 (업체 리뷰)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    review_text TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    work_type TEXT,
    work_date DATE,
    images JSONB DEFAULT '[]'::jsonb,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_reviews_user_id ON public.company_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_company_reviews_company_name ON public.company_reviews(company_name);
CREATE INDEX IF NOT EXISTS idx_company_reviews_rating ON public.company_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_company_reviews_created_at ON public.company_reviews(created_at DESC);

COMMENT ON TABLE public.company_reviews IS '업체 리뷰 및 평가';

-- ============================================================================
-- 8. comments 테이블 (커뮤니티 댓글)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('damage_case', 'company_review')),
    parent_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_type_id ON public.comments(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

COMMENT ON TABLE public.comments IS '커뮤니티 댓글';

-- ============================================================================
-- 9. likes 테이블 (좋아요)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('damage_case', 'company_review', 'comment')),
    parent_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, parent_type, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_parent_type_id ON public.likes(parent_type, parent_id);

COMMENT ON TABLE public.likes IS '좋아요 기능';

-- ============================================================================
-- 10. reports 테이블 (신고)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('damage_case', 'company_review', 'comment')),
    parent_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_parent_type_id ON public.reports(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

COMMENT ON TABLE public.reports IS '신고 기능';

-- ============================================================================
-- 11. 유용한 뷰 생성
-- ============================================================================

-- 견적 요청 상세 정보 (quote_sets 포함)
CREATE OR REPLACE VIEW quote_request_details AS
SELECT
    qr.*,
    COUNT(qs.id) as uploaded_set_count,
    ARRAY_AGG(
        json_build_object(
            'id', qs.id,
            'setId', qs.set_id,
            'vendorName', qs.vendor_name,
            'totalAmount', qs.total_amount,
            'validationStatus', qs.validation_status,
            'trustScore', qs.trust_score,
            'itemCount', qs.item_count
        ) ORDER BY qs.set_id
    ) FILTER (WHERE qs.id IS NOT NULL) as quote_sets,
    ca.comparison_result as comparison_analysis
FROM public.quote_requests qr
LEFT JOIN public.quote_sets qs ON qr.id = qs.request_id
LEFT JOIN public.comparison_analyses ca ON qr.id = ca.request_id
GROUP BY qr.id, ca.comparison_result;

COMMENT ON VIEW quote_request_details IS '견적 요청 상세 정보 (모든 quote_sets 및 비교 분석 결과 포함)';

-- ============================================================================
-- 완료
-- ============================================================================
-- Neon DB 마이그레이션 완료
-- 모든 테이블, 인덱스, 트리거, 뷰가 생성되었습니다
-- ============================================================================
