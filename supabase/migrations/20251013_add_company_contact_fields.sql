-- ============================================
-- 업체 연락처 및 사업자번호 필드 추가
-- company_reviews와 damage_cases 테이블에 추가
-- ============================================

-- company_reviews 테이블에 컬럼 추가
ALTER TABLE company_reviews
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS business_number TEXT;

-- damage_cases 테이블에도 동일하게 추가
ALTER TABLE damage_cases
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS business_number TEXT;

-- 인덱스 추가 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_reviews_company_phone ON company_reviews(company_phone);
CREATE INDEX IF NOT EXISTS idx_reviews_business_number ON company_reviews(business_number);

CREATE INDEX IF NOT EXISTS idx_damage_company_phone ON damage_cases(company_phone);
CREATE INDEX IF NOT EXISTS idx_damage_business_number ON damage_cases(business_number);

-- 코멘트 추가
COMMENT ON COLUMN company_reviews.company_phone IS '업체 연락처';
COMMENT ON COLUMN company_reviews.business_number IS '사업자번호';
COMMENT ON COLUMN damage_cases.company_phone IS '업체 연락처';
COMMENT ON COLUMN damage_cases.business_number IS '사업자번호';
