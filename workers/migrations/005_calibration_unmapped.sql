-- Migration 005: Benchmark calibration log + Unmapped terms
-- Phase 2: 분석 품질 향상

-- 벤치마크 보정 로그
CREATE TABLE IF NOT EXISTS benchmark_calibration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_price_id UUID REFERENCES benchmark_prices(id) ON DELETE SET NULL,
  std_category TEXT NOT NULL,
  std_item TEXT NOT NULL,
  grade TEXT NOT NULL,
  old_unit_price NUMERIC(12,0) NOT NULL,
  new_unit_price NUMERIC(12,0) NOT NULL,
  change_percent NUMERIC(8,2) NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  avg_quoted_price NUMERIC(12,0),
  median_quoted_price NUMERIC(12,0),
  confidence TEXT DEFAULT 'low' CHECK (confidence IN ('high','medium','low')),
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','approved','rejected')),
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calibration_status ON benchmark_calibration_log(status);
CREATE INDEX IF NOT EXISTS idx_calibration_category ON benchmark_calibration_log(std_category, std_item);

-- 미매핑 용어 수집
CREATE TABLE IF NOT EXISTS unmapped_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_category TEXT,
  original_item_name TEXT,
  combined_search_text TEXT NOT NULL UNIQUE,
  quote_request_id TEXT,
  analysis_id UUID,
  frequency INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','mapped','ignored')),
  mapped_to_category TEXT,
  mapped_to_item TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unmapped_status ON unmapped_terms(status);
CREATE INDEX IF NOT EXISTS idx_unmapped_frequency ON unmapped_terms(frequency DESC);
