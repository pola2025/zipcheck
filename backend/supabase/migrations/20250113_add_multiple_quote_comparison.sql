-- ============================================================================
-- 다중 견적 비교 시스템 (Phase 2)
-- 작성일: 2025-01-13
-- 설명: Payment-first 워크플로우를 위한 테이블 구조 변경
-- ============================================================================

-- ============================================================================
-- 1. quote_requests 테이블 수정
-- ============================================================================

-- 결제 및 가격 관련 컬럼 추가
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity BETWEEN 1 AND 3),
ADD COLUMN IF NOT EXISTS is_comparison BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_amount INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount INTEGER,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_quote_requests_payment_id ON public.quote_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_plan_id ON public.quote_requests(plan_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_payment_status ON public.quote_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_quantity ON public.quote_requests(quantity);

-- 컬럼 주석
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

-- ============================================================================
-- 2. quote_sets 테이블 생성
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
    community_vendor_id UUID,  -- community_vendors 테이블 참조 (FK는 나중에 추가)
    trust_score DECIMAL(3,2) CHECK (trust_score >= 0 AND trust_score <= 5),
    review_count INTEGER DEFAULT 0,
    complaint_count INTEGER DEFAULT 0,

    -- 업로드 정보
    upload_type TEXT NOT NULL CHECK (upload_type IN ('image', 'excel')),
    images JSONB DEFAULT '[]'::jsonb,  -- [{url, name, size, uploadedAt}, ...]
    excel_file JSONB,  -- {url, name, size, uploadedAt}

    -- 파싱된 데이터
    items JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{name, quantity, unit, price, category}, ...]
    total_amount INTEGER NOT NULL DEFAULT 0,
    item_count INTEGER NOT NULL DEFAULT 0,

    -- 검증 상태
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'passed', 'failed')),
    validation_errors JSONB DEFAULT '[]'::jsonb,  -- [{rule, message, severity}, ...]
    validation_warnings JSONB DEFAULT '[]'::jsonb,
    validated_at TIMESTAMPTZ,

    -- 분석 결과
    analysis_result JSONB,  -- AI 분석 결과
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
COMMENT ON COLUMN public.quote_sets.vendor_phone IS '업체 전화번호 (선택)';
COMMENT ON COLUMN public.quote_sets.vendor_representative IS '대표자명 (선택)';
COMMENT ON COLUMN public.quote_sets.vendor_business_number IS '사업자번호 (선택)';
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

-- ============================================================================
-- 3. comparison_analyses 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comparison_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES public.quote_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 비교 대상 (quote_sets의 ID 배열)
    quote_set_ids UUID[] NOT NULL,

    -- 비교 분석 결과 (AI 생성)
    comparison_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    예시 구조:
    {
      "summary": {
        "lowestPrice": { "setId": "SET_B", "amount": 13500000 },
        "highestQuality": { "setId": "SET_C", "score": 4.6 },
        "bestValue": { "setId": "SET_A", "reason": "가격 대비 품질이 우수하며..." }
      },
      "itemComparison": [
        {
          "itemName": "거실 타일",
          "setA": { "price": 800000, "quality": "high", "spec": "..." },
          "setB": { "price": 720000, "quality": "medium", "spec": "..." },
          "setC": { "price": 850000, "quality": "high", "spec": "..." },
          "analysis": "SET_B가 가장 저렴하지만 품질이 낮음..."
        }
      ],
      "priceAnalysis": {
        "avgDifference": 15.5,
        "outliers": []
      },
      "recommendation": {
        "setId": "SET_A",
        "vendorName": "OO건설",
        "reason": "중간 가격대에 신뢰도와 품질이 모두 우수합니다...",
        "score": 4.5
      }
    }
    */

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
-- 4. RLS (Row Level Security) 정책
-- ============================================================================

-- quote_sets RLS 활성화
ALTER TABLE public.quote_sets ENABLE ROW LEVEL SECURITY;

-- 본인의 견적만 조회 가능 (request의 customer_phone 기반)
CREATE POLICY "Users can view their own quote sets"
    ON public.quote_sets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quote_requests
            WHERE quote_requests.id = quote_sets.request_id
            AND quote_requests.customer_phone = current_setting('app.customer_phone', true)
        )
    );

-- 본인의 request에만 quote set 추가 가능
CREATE POLICY "Users can insert quote sets to their requests"
    ON public.quote_sets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quote_requests
            WHERE quote_requests.id = quote_sets.request_id
            AND quote_requests.customer_phone = current_setting('app.customer_phone', true)
        )
    );

-- comparison_analyses RLS 활성화
ALTER TABLE public.comparison_analyses ENABLE ROW LEVEL SECURITY;

-- 본인의 비교 분석만 조회 가능
CREATE POLICY "Users can view their own comparison analyses"
    ON public.comparison_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quote_requests
            WHERE quote_requests.id = comparison_analyses.request_id
            AND quote_requests.customer_phone = current_setting('app.customer_phone', true)
        )
    );

-- ============================================================================
-- 5. 유용한 뷰 생성
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
-- 6. 데이터 무결성 검증 함수
-- ============================================================================

-- quote_sets 개수 검증 함수
CREATE OR REPLACE FUNCTION check_quote_sets_count()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_quantity INTEGER;
BEGIN
    -- 해당 request의 현재 quote_sets 개수 조회
    SELECT COUNT(*), qr.quantity
    INTO current_count, max_quantity
    FROM public.quote_sets qs
    JOIN public.quote_requests qr ON qs.request_id = qr.id
    WHERE qs.request_id = NEW.request_id
    GROUP BY qr.quantity;

    -- quantity를 초과하면 에러
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
-- 완료
-- ============================================================================
-- 마이그레이션 완료: 다중 견적 비교 시스템 테이블 구조 생성
-- ============================================================================
