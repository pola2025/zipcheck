-- ============================================================================
-- Migration: Add representative_name column to damage_cases and company_reviews
-- Date: 2026-02-04
-- Description: 대표자/담당자 이름 컬럼 추가 + 블랙리스트 매칭 인덱스
-- ============================================================================

-- damage_cases 테이블에 representative_name 컬럼 추가
ALTER TABLE damage_cases ADD COLUMN IF NOT EXISTS representative_name TEXT;

-- company_reviews 테이블에 representative_name 컬럼 추가
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS representative_name TEXT;

-- 블랙리스트 매칭용 인덱스
CREATE INDEX IF NOT EXISTS idx_dc_representative ON damage_cases(representative_name);
CREATE INDEX IF NOT EXISTS idx_dc_business_number ON damage_cases(business_number);
CREATE INDEX IF NOT EXISTS idx_dc_company_phone ON damage_cases(company_phone);
