-- Migration 006: analysis_items에 마진율 + 신뢰도 컬럼 추가
-- Phase 2: 신뢰도 지표 UI 지원

ALTER TABLE analysis_items
  ADD COLUMN IF NOT EXISTS margin_rate NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS margin_bracket TEXT,
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS fair_price_min NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS fair_price_max NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,2) DEFAULT 0.5;
