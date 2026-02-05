-- ============================================
-- GOI 견적 분석 시스템 v1.5 - Phase 1
-- 6개 테이블: analyses, analysis_items, decision_logs,
--             conflict_rules, benchmark_prices, category_mappings
-- ============================================

-- 1. 분석 마스터 테이블
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 연결: quote_request ID (문자열 참조, FK 없음 - quote_requests는 별도 저장소)
    quote_request_id TEXT,

    -- 상태
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_progress', 'review', 'completed')),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),

    -- 고객/업체 정보 (분석 시점 스냅샷)
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    contractor_name TEXT,
    contractor_license TEXT,
    contractor_license_verified BOOLEAN DEFAULT false,

    -- 건물 정보
    property_type TEXT,                -- 아파트/빌라/오피스텔/단독주택/상가
    property_size_sqm NUMERIC(10,2),   -- 면적 (㎡)
    region TEXT,                        -- 서울/경기/지방
    address TEXT,

    -- 분석 메타데이터
    is_vat_included BOOLEAN NOT NULL DEFAULT false,
    is_blind_labeling BOOLEAN NOT NULL DEFAULT true,
    completeness TEXT DEFAULT 'full'
        CHECK (completeness IN ('full', 'partial', 'minimal')),
    pricing_type TEXT DEFAULT 'itemized'
        CHECK (pricing_type IN ('itemized', 'lump_sum', 'mixed')),
    quote_date DATE,                   -- 견적서 발행일
    construction_start_month INTEGER CHECK (construction_start_month BETWEEN 1 AND 12),

    -- 종합 점수 (완료 시 산출)
    total_score NUMERIC(5,2),
    score_breakdown JSONB,             -- { categories: [...], bonuses: [...], penalties: [...] }

    -- 리뷰어
    reviewed_by TEXT,
    reviewer_notes TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_quote_request ON analyses(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- 2. 분석 항목 테이블 (Gold Standard 라벨)
CREATE TABLE IF NOT EXISTS analysis_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

    -- 원본 데이터 (파싱 결과)
    original_category TEXT,
    original_item_name TEXT,
    original_quantity NUMERIC(12,2),
    original_unit TEXT,
    original_unit_price NUMERIC(12,0),
    original_total_price NUMERIC(12,0),
    original_notes TEXT,

    -- Gold Standard 라벨 (정규화)
    std_category TEXT,                 -- 욕실/바닥/가구/목공/전기/도배/철거/주방/창호/페인트/기타
    std_item TEXT,                     -- 표준 항목명
    sub_category TEXT,                 -- 세부 분류

    -- 속성 (JSONB)
    attributes JSONB DEFAULT '{}'::jsonb,
    -- { brand, grade, unit_type, model, thickness, material, feature_evidence }

    -- 일식 분해 (De-bundling)
    is_bundled BOOLEAN DEFAULT false,
    components JSONB DEFAULT '[]'::jsonb,
    -- [{ name, estimatedRatio, variance_estimate }]
    debundling_logic TEXT,

    -- 라벨링 메타
    correction_reason_code TEXT,       -- WRONG_GRADE, WRONG_CATEGORY, etc.
    success_reason_code TEXT,          -- MATCH_BY_BRAND, MATCH_BY_MARKET_AVG, etc.
    confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
    reviewed_by TEXT,
    reviewer_confidence NUMERIC(3,2) CHECK (reviewer_confidence IS NULL OR reviewer_confidence BETWEEN 0 AND 1),

    -- 에러 분류
    error_type TEXT CHECK (error_type IS NULL OR error_type IN ('parsing_error', 'reasoning_error')),

    -- 벤치마크 비교 결과
    benchmark_price_id UUID,           -- 매칭된 벤치마크 레코드
    benchmark_unit_price NUMERIC(12,0),
    adjusted_benchmark_price NUMERIC(12,0),  -- 보정계수 적용 후
    adjustment_factors JSONB DEFAULT '{}'::jsonb,
    -- { area, region, year, grade, season, exclusive }
    deviation_percent NUMERIC(8,2),    -- (원가 - 보정벤치마크) / 보정벤치마크 × 100
    deviation_bracket TEXT             -- v1.6 비대칭 6단계: dump_risk/under_warning/good/fair/slightly_high/high
        CHECK (deviation_bracket IS NULL OR deviation_bracket IN ('dump_risk', 'under_warning', 'good', 'fair', 'slightly_high', 'high')),

    -- VAT
    is_vat_override BOOLEAN DEFAULT false,
    vat_adjusted_price NUMERIC(12,0),

    -- 정렬
    sort_order INTEGER DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_items_analysis ON analysis_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_items_category ON analysis_items(std_category);
CREATE INDEX IF NOT EXISTS idx_analysis_items_deviation ON analysis_items(deviation_bracket);

-- 3. 합의 판정 로그
CREATE TABLE IF NOT EXISTS decision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

    -- 분쟁 내용
    item_id UUID REFERENCES analysis_items(id) ON DELETE SET NULL,
    dispute_type TEXT NOT NULL,        -- grade_disagreement, category_dispute, price_dispute, bundling_dispute
    dispute_description TEXT NOT NULL,

    -- 해결
    resolution TEXT,
    resolved_by TEXT,
    resolution_reasoning TEXT,

    -- 상태
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'escalated')),

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_decision_logs_analysis ON decision_logs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_status ON decision_logs(status);

-- 4. 규칙 충돌 계층 Rulebook
CREATE TABLE IF NOT EXISTS conflict_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 규칙 내용
    rule_name TEXT NOT NULL,
    description TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'GLOBAL'
        CHECK (scope IN ('GLOBAL', 'CATEGORY', 'CASE_SPECIFIC')),
    category TEXT,                     -- scope=CATEGORY일 때 적용 카테고리

    -- 규칙 조건/액션 (JSONB)
    conditions JSONB DEFAULT '{}'::jsonb,   -- 적용 조건
    actions JSONB DEFAULT '{}'::jsonb,      -- 적용 액션

    -- 계층 관리
    priority INTEGER NOT NULL DEFAULT 0,    -- 높을수록 우선
    supersedes TEXT[] DEFAULT '{}',          -- 이전 규칙 대체 추적 (rule_name 배열)

    -- 상태
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflict_rules_scope ON conflict_rules(scope);
CREATE INDEX IF NOT EXISTS idx_conflict_rules_active ON conflict_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_conflict_rules_category ON conflict_rules(category);

-- 5. 벤치마크 단가 (Master Price Pulse)
CREATE TABLE IF NOT EXISTS benchmark_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 분류
    std_category TEXT NOT NULL,
    std_item TEXT NOT NULL,
    sub_category TEXT,

    -- 단가 정보
    unit_price NUMERIC(12,0) NOT NULL,
    unit TEXT NOT NULL,                 -- ㎡, 개, 세트, 식 등
    grade TEXT DEFAULT '중급'
        CHECK (grade IN ('가성비', '중급', '고급', '프리미엄')),

    -- Feature 속성
    brand TEXT,
    model TEXT,
    material TEXT,
    thickness TEXT,

    -- 메타데이터
    source TEXT,                        -- 출처 (시공사 견적, 유통사, 실거래)
    region TEXT DEFAULT '서울',
    reference_date DATE,               -- 기준일
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_category ON benchmark_prices(std_category, std_item);
CREATE INDEX IF NOT EXISTS idx_benchmark_grade ON benchmark_prices(grade);
CREATE INDEX IF NOT EXISTS idx_benchmark_active ON benchmark_prices(is_active);

-- 6. 정규화 매핑 테이블
CREATE TABLE IF NOT EXISTS category_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 매핑
    original_name TEXT NOT NULL,        -- 원본 항목명 (견적서에서 사용되는 이름)
    std_category TEXT NOT NULL,         -- 표준 카테고리
    std_item TEXT NOT NULL,             -- 표준 항목명

    -- 자동완성용 메타
    aliases TEXT[] DEFAULT '{}',        -- 대체 이름 목록
    frequency INTEGER DEFAULT 1,       -- 사용 빈도 (자동완성 정렬)

    -- 상태
    is_verified BOOLEAN DEFAULT false,
    verified_by TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 중복 방지
    UNIQUE(original_name, std_category, std_item)
);

CREATE INDEX IF NOT EXISTS idx_category_mappings_original ON category_mappings(original_name);
CREATE INDEX IF NOT EXISTS idx_category_mappings_std ON category_mappings(std_category, std_item);
