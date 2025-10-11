-- 견적 신청 관리 스키마

-- 1. 견적 신청 테이블
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 고객 정보
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,

    -- 매물 정보
    property_type TEXT NOT NULL, -- 아파트, 빌라, 주택 등
    property_size DECIMAL, -- 평수
    region TEXT NOT NULL, -- 지역
    address TEXT, -- 상세 주소 (선택)

    -- 견적 항목들 (JSON)
    items JSONB NOT NULL,
    -- 예시: [
    --   {
    --     "category": "주방",
    --     "itemName": "씽크대",
    --     "quantity": 1,
    --     "unit": "개",
    --     "unitPrice": 1500000,
    --     "totalPrice": 1500000,
    --     "notes": "프리미엄 모델"
    --   }
    -- ]

    -- 신청 상태
    status TEXT NOT NULL DEFAULT 'pending', -- pending, analyzing, completed, rejected

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 분석 결과 (관리자가 AI 분석 실행 후 저장)
    analysis_result JSONB,
    analyzed_at TIMESTAMPTZ,
    analyzed_by TEXT, -- 분석 실행한 관리자

    -- 관리자 코멘트
    admin_notes TEXT
);

-- 2. 분석 결과 구조 예시 (analysis_result JSONB 필드)
COMMENT ON COLUMN quote_requests.analysis_result IS
'분석 결과 JSON 구조:
{
  "overallScore": 75,
  "priceLevel": "fair",
  "totalEstimate": 5100000,
  "marketAverage": 4800000,
  "savingsPercent": 6.25,
  "marginAnalysis": {
    "estimatedMargin": 15.2,
    "evaluation": "적정",
    "comment": "업체 마진이 정상 범위(10-20%) 내에 있습니다"
  },
  "itemAnalysis": [
    {
      "category": "주방",
      "item": "씽크대",
      "estimatePrice": 1500000,
      "marketAverage": 1350000,
      "differencePercent": 11.1,
      "evaluation": "fair"
    }
  ],
  "criteriaScores": [
    {"criteria": "가격경쟁력", "score": 75, "market": 70},
    {"criteria": "품질", "score": 80, "market": 75}
  ],
  "aiInsights": {
    "summary": "전체적으로 적정한 견적입니다...",
    "warnings": ["씽크대 가격이 시장가보다 약간 높습니다"],
    "recommendations": ["타일 가격 재협상 권장"]
  }
}';

-- 인덱스
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX idx_quote_requests_customer_phone ON quote_requests(customer_phone);

-- RLS 정책
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 신청 가능 (INSERT)
CREATE POLICY "Anyone can submit quote requests"
    ON quote_requests FOR INSERT
    WITH CHECK (true);

-- 본인 견적만 조회 가능 (전화번호 기반)
CREATE POLICY "Users can view their own quote requests"
    ON quote_requests FOR SELECT
    USING (customer_phone = current_setting('app.customer_phone', true));

-- 업데이트 타임스탬프 자동 갱신
CREATE OR REPLACE FUNCTION update_quote_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_request_timestamp
    BEFORE UPDATE ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_request_timestamp();
