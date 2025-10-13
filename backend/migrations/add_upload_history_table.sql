-- ============================================================================
-- 데이터 관리 시스템: upload_history 테이블 추가
-- 작성일: 2025-10-13
-- 설명: 엑셀 파일 업로드 이력 추적
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 데이터셋 정보
    dataset_type TEXT NOT NULL CHECK (dataset_type IN ('construction', 'distributor')),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,

    -- 처리 상태
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_upload_history_dataset_type ON public.upload_history(dataset_type);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON public.upload_history(status);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON public.upload_history(created_at DESC);

-- 테이블 주석
COMMENT ON TABLE public.upload_history IS '데이터 업로드 이력 (시공 데이터, 유통사 가격 데이터)';
COMMENT ON COLUMN public.upload_history.dataset_type IS 'construction: 시공 데이터, distributor: 유통사 가격 데이터';
COMMENT ON COLUMN public.upload_history.status IS 'processing: 처리 중, completed: 완료, failed: 실패';
COMMENT ON COLUMN public.upload_history.errors IS '업로드 중 발생한 오류 목록 (JSON 배열)';

-- 자동 타임스탬프 업데이트 트리거
CREATE OR REPLACE FUNCTION update_upload_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER upload_history_updated_at
    BEFORE UPDATE ON public.upload_history
    FOR EACH ROW
    EXECUTE FUNCTION update_upload_history_timestamp();

-- ============================================================================
-- 시장 데이터 테이블들 추가 (AI 분석용)
-- ============================================================================

-- 카테고리 테이블
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
COMMENT ON TABLE public.categories IS '시공 항목 카테고리 (예: 철거, 목공, 전기, 배관 등)';

-- 항목 테이블
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}', -- 동의어/별칭
    unit TEXT, -- 기본 단위 (예: ㎡, 개, 식)
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);
COMMENT ON TABLE public.items IS '시공 항목 (예: 거실 바닥 타일, 주방 싱크대 등)';
COMMENT ON COLUMN public.items.aliases IS '검색을 위한 동의어/별칭 배열';

-- 시공 기록 테이블
CREATE TABLE IF NOT EXISTS public.construction_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,

    -- 시간 정보
    year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    month INTEGER CHECK (month BETWEEN 1 AND 12),

    -- 지역 정보
    region TEXT NOT NULL,

    -- 비용 정보
    material_cost INTEGER, -- 자재비
    labor_cost INTEGER, -- 인건비
    overhead_cost INTEGER, -- 경비
    total_cost INTEGER NOT NULL, -- 총 비용

    -- 매물 정보
    property_size DECIMAL, -- 시공 면적 (㎡)
    property_type TEXT, -- 매물 유형

    -- 시공자 정보
    contractor_id TEXT,

    -- 메타데이터
    notes TEXT,
    source_file TEXT, -- 원본 파일명
    raw_data JSONB, -- 원본 데이터 (디버깅용)

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_construction_records_item_id ON public.construction_records(item_id);
CREATE INDEX IF NOT EXISTS idx_construction_records_year_quarter ON public.construction_records(year, quarter);
CREATE INDEX IF NOT EXISTS idx_construction_records_region ON public.construction_records(region);
CREATE INDEX IF NOT EXISTS idx_construction_records_created_at ON public.construction_records(created_at DESC);

COMMENT ON TABLE public.construction_records IS '실제 시공 기록 데이터';

-- 유통사 가격 테이블
CREATE TABLE IF NOT EXISTS public.distributor_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,

    -- 유통사 정보
    distributor_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,

    -- 가격 정보
    wholesale_price INTEGER, -- 도매가
    retail_price INTEGER, -- 소매가
    discount_rate DECIMAL(5,2), -- 할인율 (%)
    unit TEXT, -- 단위

    -- 시간 정보
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

    -- 유효성
    is_current BOOLEAN DEFAULT true, -- 현재가 여부
    valid_from DATE,
    valid_until DATE,

    -- 메타데이터
    notes TEXT,
    source_file TEXT,
    raw_data JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributor_prices_item_id ON public.distributor_prices(item_id);
CREATE INDEX IF NOT EXISTS idx_distributor_prices_distributor_name ON public.distributor_prices(distributor_name);
CREATE INDEX IF NOT EXISTS idx_distributor_prices_year_month ON public.distributor_prices(year, month);
CREATE INDEX IF NOT EXISTS idx_distributor_prices_is_current ON public.distributor_prices(is_current);

COMMENT ON TABLE public.distributor_prices IS '유통사 가격 데이터';

-- 시장 평균가 테이블 (분기별 집계)
CREATE TABLE IF NOT EXISTS public.market_averages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,

    -- 시간 정보
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),

    -- 평균 비용
    avg_material_cost INTEGER,
    avg_labor_cost INTEGER,
    avg_overhead_cost INTEGER,
    avg_total_cost INTEGER NOT NULL,

    -- 가격 범위
    min_cost INTEGER,
    max_cost INTEGER,

    -- 샘플 수
    sample_count INTEGER DEFAULT 0,

    -- 지역별 평균 (JSON)
    regional_averages JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (item_id, year, quarter)
);

CREATE INDEX IF NOT EXISTS idx_market_averages_item_id ON public.market_averages(item_id);
CREATE INDEX IF NOT EXISTS idx_market_averages_year_quarter ON public.market_averages(year, quarter);

COMMENT ON TABLE public.market_averages IS '분기별 시장 평균가 (AI 분석용)';
COMMENT ON COLUMN public.market_averages.regional_averages IS '지역별 평균가 JSON (예: {"서울": 150000, "경기": 130000})';

-- ============================================================================
-- 완료
-- ============================================================================
