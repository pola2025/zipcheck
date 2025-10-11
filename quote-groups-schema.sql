-- 견적 그룹 관리 테이블
CREATE TABLE quote_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,

    -- 그룹 정보
    group_name TEXT NOT NULL,  -- "강남 아파트 32평 리모델링"
    property_type TEXT NOT NULL,
    property_size DECIMAL,
    region TEXT NOT NULL,
    address TEXT,

    -- 시간 관리
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),

    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'active',  -- active, expired, completed

    -- 가격 정보
    quote_count INTEGER NOT NULL DEFAULT 0,  -- 현재 등록된 견적 수 (최대 3)
    total_price INTEGER NOT NULL DEFAULT 30000,  -- 총 가격

    -- 메타데이터
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- quote_requests 테이블에 group_id 컬럼 추가
ALTER TABLE quote_requests
ADD COLUMN group_id UUID REFERENCES quote_groups(id) ON DELETE SET NULL,
ADD COLUMN sequence_in_group INTEGER;  -- 그룹 내 순서 (1, 2, 3)

-- 인덱스
CREATE INDEX idx_quote_groups_phone ON quote_groups(customer_phone);
CREATE INDEX idx_quote_groups_status ON quote_groups(status);
CREATE INDEX idx_quote_groups_expires_at ON quote_groups(expires_at);
CREATE INDEX idx_quote_requests_group_id ON quote_requests(group_id);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_quote_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_groups_updated_at
    BEFORE UPDATE ON quote_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_group_timestamp();

-- RLS 정책
ALTER TABLE quote_groups ENABLE ROW LEVEL SECURITY;

-- 누구나 그룹 생성 가능
CREATE POLICY "Anyone can create quote groups"
    ON quote_groups FOR INSERT WITH CHECK (true);

-- 전화번호로 자신의 그룹 조회 가능
CREATE POLICY "Users can view their own groups by phone"
    ON quote_groups FOR SELECT
    USING (customer_phone = current_setting('app.current_phone', true));

-- 관리자는 모든 그룹 조회 가능 (백엔드에서 service key 사용)
CREATE POLICY "Service role can view all groups"
    ON quote_groups FOR SELECT
    USING (true);

-- 견적 그룹 뷰 (상세 정보 포함)
CREATE OR REPLACE VIEW quote_group_details AS
SELECT
    qg.*,
    COUNT(qr.id) as actual_quote_count,
    ARRAY_AGG(
        json_build_object(
            'id', qr.id,
            'sequence', qr.sequence_in_group,
            'status', qr.status,
            'created_at', qr.created_at,
            'total_amount', (
                SELECT SUM((item->>'totalPrice')::numeric)
                FROM jsonb_array_elements(qr.items) item
            )
        ) ORDER BY qr.sequence_in_group
    ) FILTER (WHERE qr.id IS NOT NULL) as quotes
FROM quote_groups qg
LEFT JOIN quote_requests qr ON qg.id = qr.group_id
GROUP BY qg.id;

COMMENT ON TABLE quote_groups IS '견적 비교 그룹 관리 - 48시간 내 최대 3건까지 묶음';
COMMENT ON COLUMN quote_groups.expires_at IS '48시간 윈도우 만료 시간';
COMMENT ON COLUMN quote_groups.total_price IS '1건: 30,000원, 2건: 50,000원, 3건: 70,000원';
