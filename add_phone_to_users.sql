-- 사용자 테이블에 전화번호 필드 추가

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 전화번호 인덱스 (선택적 검색용)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 전화번호는 null 허용 (네이버 로그인 시 선택적 제공)
