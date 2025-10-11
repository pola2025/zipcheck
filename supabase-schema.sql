-- ============================================
-- ZipCheck 데이터베이스 스키마
-- ============================================

-- 1. 카테고리 테이블 (주방, 바닥, 조명 등 대분류)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 항목 테이블 (씽크대, 강마루 등 세부 항목)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT, -- 단위: ㎡, 개, 식 등
  aliases TEXT[], -- 동의어 배열 (검색용)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- 3. 시공 데이터 (2024-2025 실제 시공 비용)
CREATE TABLE construction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,

  -- 시기
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  month INTEGER CHECK (month >= 1 AND month <= 12),

  -- 지역
  region TEXT,

  -- 비용 정보
  material_cost DECIMAL(12, 2), -- 자재비
  labor_cost DECIMAL(12, 2), -- 인건비
  overhead_cost DECIMAL(12, 2), -- 간접비
  total_cost DECIMAL(12, 2) NOT NULL, -- 총 원가

  -- 메타데이터
  contractor_id TEXT, -- 시공사 (익명화)
  property_size DECIMAL(10, 2), -- 평수
  property_type TEXT, -- 아파트, 빌라, 주택
  notes TEXT,

  -- 원본 데이터
  source_file TEXT, -- 업로드한 파일명
  raw_data JSONB, -- 원본 Excel 행 데이터

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. 유통사 가격 데이터
CREATE TABLE distributor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,

  -- 유통/브랜드 정보
  distributor_name TEXT NOT NULL, -- 유통사명
  brand TEXT, -- 브랜드
  model TEXT, -- 모델명

  -- 가격 정보
  wholesale_price DECIMAL(12, 2), -- 도매가
  retail_price DECIMAL(12, 2), -- 소매가
  discount_rate DECIMAL(5, 2), -- 할인율 (%)

  -- 단위
  unit TEXT,
  quantity DECIMAL(10, 2) DEFAULT 1, -- 수량

  -- 시기
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT TRUE, -- 현재 유효한 가격인지

  -- 유효기간
  valid_from DATE,
  valid_until DATE,

  notes TEXT,
  source_file TEXT,
  raw_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. 시장 평균 가격 (자동 계산)
CREATE TABLE market_averages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,

  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,

  -- 통계
  avg_material_cost DECIMAL(12, 2),
  avg_labor_cost DECIMAL(12, 2),
  avg_total_cost DECIMAL(12, 2),

  min_cost DECIMAL(12, 2),
  max_cost DECIMAL(12, 2),
  median_cost DECIMAL(12, 2),

  sample_count INTEGER, -- 샘플 개수

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, year, quarter)
);

-- 6. 데이터셋 업로드 이력
CREATE TABLE upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  dataset_type TEXT NOT NULL, -- 'construction' | 'distributor'
  file_name TEXT NOT NULL,
  file_size INTEGER,

  total_rows INTEGER,
  success_rows INTEGER,
  error_rows INTEGER,
  errors JSONB, -- 오류 목록

  status TEXT DEFAULT 'processing', -- processing | completed | failed

  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 인덱스 생성 (검색 성능 향상)
-- ============================================

CREATE INDEX idx_construction_item ON construction_records(item_id);
CREATE INDEX idx_construction_year_quarter ON construction_records(year, quarter);
CREATE INDEX idx_construction_region ON construction_records(region);

CREATE INDEX idx_distributor_item ON distributor_prices(item_id);
CREATE INDEX idx_distributor_current ON distributor_prices(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_distributor_year_month ON distributor_prices(year, month);

CREATE INDEX idx_market_item_period ON market_averages(item_id, year, quarter);

-- 한글 검색을 위한 인덱스 (simple 설정 사용)
CREATE INDEX idx_items_name ON items USING gin(to_tsvector('simple', name));
CREATE INDEX idx_items_name_pattern ON items(name text_pattern_ops);

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_averages ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- 정책: 누구나 읽기 가능 (공개 데이터)
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON construction_records FOR SELECT USING (true);
CREATE POLICY "Public read access" ON distributor_prices FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_averages FOR SELECT USING (true);

-- 정책: 인증된 사용자만 쓰기 가능
CREATE POLICY "Authenticated users can insert" ON construction_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert" ON distributor_prices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert" ON upload_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 함수: 시장 평균 재계산
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_market_averages()
RETURNS void AS $$
DECLARE
  item_record RECORD;
  year_val INTEGER;
  quarter_val INTEGER;
  costs DECIMAL[];
  avg_val DECIMAL;
  min_val DECIMAL;
  max_val DECIMAL;
  median_val DECIMAL;
  count_val INTEGER;
BEGIN
  -- 모든 항목에 대해
  FOR item_record IN SELECT id FROM items LOOP
    -- 최근 2년치 데이터
    FOR year_val IN SELECT DISTINCT year FROM construction_records
                    WHERE year >= EXTRACT(YEAR FROM NOW()) - 1 LOOP
      FOR quarter_val IN 1..4 LOOP
        -- 해당 분기 데이터 수집
        SELECT
          ARRAY_AGG(total_cost),
          AVG(total_cost),
          MIN(total_cost),
          MAX(total_cost),
          COUNT(*)
        INTO costs, avg_val, min_val, max_val, count_val
        FROM construction_records
        WHERE item_id = item_record.id
          AND year = year_val
          AND quarter = quarter_val;

        -- 데이터가 있으면 저장
        IF count_val > 0 THEN
          -- 중앙값 계산
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY unnest)
          INTO median_val
          FROM unnest(costs);

          -- Upsert
          INSERT INTO market_averages (
            item_id, year, quarter,
            avg_total_cost, min_cost, max_cost, median_cost, sample_count
          )
          VALUES (
            item_record.id, year_val, quarter_val,
            avg_val, min_val, max_val, median_val, count_val
          )
          ON CONFLICT (item_id, year, quarter) DO UPDATE SET
            avg_total_cost = EXCLUDED.avg_total_cost,
            min_cost = EXCLUDED.min_cost,
            max_cost = EXCLUDED.max_cost,
            median_cost = EXCLUDED.median_cost,
            sample_count = EXCLUDED.sample_count,
            updated_at = NOW();
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 초기 카테고리 데이터
-- ============================================

INSERT INTO categories (name, description) VALUES
  ('주방', '씽크대, 상판, 후드 등'),
  ('바닥', '마루, 타일, 장판 등'),
  ('욕실', '타일, 욕조, 세면대 등'),
  ('조명', '등기구, LED, 스위치 등'),
  ('가구', '붙박이장, 수납장 등'),
  ('도배', '벽지, 도배 공사'),
  ('창호', '문, 창문, 샷시 등'),
  ('전기', '콘센트, 배선, 분전반 등'),
  ('공사비', '인건비, 폐기물 처리 등')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 완료!
-- ============================================

SELECT '✅ Database schema created successfully!' as message;
