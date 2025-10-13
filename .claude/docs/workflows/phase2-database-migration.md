# Phase 2: 데이터베이스 스키마 마이그레이션

## 📋 문서 정보
- **작성일**: 2025-01-13
- **Phase**: 2 / 9
- **상태**: 완료
- **소요 시간**: 1일

---

## 🎯 작업 개요

다중 견적 비교 시스템을 위한 데이터베이스 스키마 변경 작업입니다.

### 주요 변경 사항

1. **quote_requests 테이블 수정**: 결제 및 가격 정보 추가
2. **quote_sets 테이블 생성**: 개별 견적 세트 관리
3. **comparison_analyses 테이블 생성**: 비교 분석 결과 저장
4. **RLS 정책 설정**: 보안 정책 적용
5. **유용한 뷰 생성**: quote_request_details
6. **데이터 무결성 검증**: 트리거 함수

---

## 📊 테이블 구조

### 1. quote_requests 테이블 (수정)

**추가된 컬럼:**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| payment_id | TEXT | 결제 ID (토스페이먼츠 등) |
| plan_id | TEXT | 요금제 ID (basic/fast/urgent/...) |
| plan_name | TEXT | 요금제 이름 |
| quantity | INTEGER | 견적 분석 건수 (1-3) |
| is_comparison | BOOLEAN | 다중 견적 비교 여부 |
| original_amount | INTEGER | 정상 금액 (할인 전) |
| discount_amount | INTEGER | 다건 할인 금액 |
| paid_amount | INTEGER | 실제 결제 금액 (VAT 포함) |
| payment_status | TEXT | 결제 상태 (pending/paid/refunded/failed) |
| paid_at | TIMESTAMPTZ | 결제 완료 시각 |

**제약 조건:**
- `quantity`: 1-3 사이의 값만 허용
- `payment_status`: 'pending', 'paid', 'refunded', 'failed' 중 하나

**인덱스:**
- `idx_quote_requests_payment_id`
- `idx_quote_requests_plan_id`
- `idx_quote_requests_payment_status`
- `idx_quote_requests_quantity`

---

### 2. quote_sets 테이블 (신규)

**전체 컬럼:**

```sql
CREATE TABLE quote_sets (
    -- 기본 정보
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
    set_id TEXT CHECK (set_id IN ('SET_A', 'SET_B', 'SET_C')),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,

    -- 업체 정보
    vendor_name TEXT NOT NULL,
    vendor_phone TEXT,
    vendor_representative TEXT,
    vendor_business_number TEXT,
    vendor_verified BOOLEAN,

    -- 커뮤니티 연동
    community_vendor_id UUID,
    trust_score DECIMAL(3,2),  -- 0.00 - 5.00
    review_count INTEGER,
    complaint_count INTEGER,

    -- 업로드 정보
    upload_type TEXT CHECK (upload_type IN ('image', 'excel')),
    images JSONB,  -- [{url, name, size, uploadedAt}, ...]
    excel_file JSONB,

    -- 파싱된 데이터
    items JSONB,  -- [{name, quantity, unit, price, category}, ...]
    total_amount INTEGER,
    item_count INTEGER,

    -- 검증 상태
    validation_status TEXT CHECK (validation_status IN ('pending', 'passed', 'failed')),
    validation_errors JSONB,
    validation_warnings JSONB,
    validated_at TIMESTAMPTZ,

    -- 분석 결과
    analysis_result JSONB,
    analysis_score DECIMAL(3,2),
    analyzed_at TIMESTAMPTZ,

    UNIQUE (request_id, set_id)
);
```

**핵심 특징:**
- 각 request에 최대 3개의 set (SET_A, SET_B, SET_C)
- 업체 정보는 업체명만 필수, 나머지 선택
- 커뮤니티 데이터와 연동 가능
- Rule-based 검증 결과 저장
- AI 분석 결과 저장

**인덱스:**
- `idx_quote_sets_request_id`
- `idx_quote_sets_vendor_name`
- `idx_quote_sets_validation_status`
- `idx_quote_sets_created_at`

---

### 3. comparison_analyses 테이블 (신규)

**전체 컬럼:**

```sql
CREATE TABLE comparison_analyses (
    id UUID PRIMARY KEY,
    request_id UUID UNIQUE REFERENCES quote_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ,

    -- 비교 대상
    quote_set_ids UUID[],  -- [set_a_id, set_b_id, set_c_id]

    -- 비교 분석 결과
    comparison_result JSONB,  -- AI 생성 결과

    -- AI 메타 정보
    model_version TEXT,
    processing_time_seconds INTEGER,

    analyzed_at TIMESTAMPTZ
);
```

**comparison_result 구조:**

```json
{
  "summary": {
    "lowestPrice": { "setId": "SET_B", "amount": 13500000 },
    "highestQuality": { "setId": "SET_C", "score": 4.6 },
    "bestValue": { "setId": "SET_A", "reason": "..." }
  },
  "itemComparison": [
    {
      "itemName": "거실 타일",
      "setA": { "price": 800000, "quality": "high", "spec": "..." },
      "setB": { "price": 720000, "quality": "medium", "spec": "..." },
      "setC": { "price": 850000, "quality": "high", "spec": "..." },
      "analysis": "..."
    }
  ],
  "priceAnalysis": {
    "avgDifference": 15.5,
    "outliers": []
  },
  "recommendation": {
    "setId": "SET_A",
    "vendorName": "OO건설",
    "reason": "...",
    "score": 4.5
  }
}
```

---

## 🔒 보안 정책 (RLS)

### quote_sets

**SELECT 정책:**
```sql
-- 본인의 견적만 조회 가능
CREATE POLICY "Users can view their own quote sets"
    ON quote_sets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quote_requests
            WHERE quote_requests.id = quote_sets.request_id
            AND quote_requests.customer_phone = current_setting('app.customer_phone', true)
        )
    );
```

**INSERT 정책:**
```sql
-- 본인의 request에만 quote set 추가 가능
CREATE POLICY "Users can insert quote sets to their requests"
    ON quote_sets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quote_requests
            WHERE quote_requests.id = quote_sets.request_id
            AND quote_requests.customer_phone = current_setting('app.customer_phone', true)
        )
    );
```

### comparison_analyses

**SELECT 정책:**
```sql
-- 본인의 비교 분석만 조회 가능
CREATE POLICY "Users can view their own comparison analyses"
    ON comparison_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quote_requests
            WHERE quote_requests.id = comparison_analyses.request_id
            AND quote_requests.customer_phone = current_setting('app.customer_phone', true)
        )
    );
```

---

## 📊 뷰 (View)

### quote_request_details

모든 quote_sets와 비교 분석 결과를 포함한 견적 요청 상세 정보:

```sql
CREATE VIEW quote_request_details AS
SELECT
    qr.*,
    COUNT(qs.id) as uploaded_set_count,
    ARRAY_AGG(
        json_build_object(
            'id', qs.id,
            'setId', qs.set_id,
            'vendorName', qs.vendor_name,
            'totalAmount', qs.total_amount,
            'validationStatus', qs.validation_status,
            'trustScore', qs.trust_score,
            'itemCount', qs.item_count
        ) ORDER BY qs.set_id
    ) FILTER (WHERE qs.id IS NOT NULL) as quote_sets,
    ca.comparison_result as comparison_analysis
FROM quote_requests qr
LEFT JOIN quote_sets qs ON qr.id = qs.request_id
LEFT JOIN comparison_analyses ca ON qr.id = ca.request_id
GROUP BY qr.id, ca.comparison_result;
```

**사용 예시:**
```sql
-- 특정 견적 요청의 모든 정보 조회
SELECT * FROM quote_request_details WHERE id = 'request-uuid';

-- 2건 이상 업로드된 견적만 조회
SELECT * FROM quote_request_details WHERE uploaded_set_count >= 2;

-- 비교 분석이 완료된 견적만 조회
SELECT * FROM quote_request_details WHERE comparison_analysis IS NOT NULL;
```

---

## ⚙️ 트리거 및 함수

### 1. 자동 타임스탬프 업데이트

```sql
CREATE TRIGGER quote_sets_updated_at
    BEFORE UPDATE ON quote_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_set_timestamp();
```

### 2. quote_sets 개수 검증

```sql
CREATE TRIGGER check_quote_sets_limit
    BEFORE INSERT ON quote_sets
    FOR EACH ROW
    EXECUTE FUNCTION check_quote_sets_count();
```

**동작:**
- quote_sets INSERT 시 자동 실행
- request의 quantity를 초과하면 에러 발생
- 예: quantity=2인 request에 3번째 set 추가 시도 → 에러

---

## 🚀 마이그레이션 실행 방법

### 사전 준비

1. **환경 변수 설정** (backend/.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

2. **의존성 설치**
```bash
cd backend
npm install
```

### 실행

```bash
# 방법 1: npm script 사용 (권장)
npm run migrate:multiple-quote

# 방법 2: 직접 실행
tsx src/scripts/run-multiple-quote-migration.ts
```

### 예상 출력

```
🔧 Starting Multiple Quote Comparison Migration...

📂 Reading migration file: /path/to/migration.sql
✅ Migration file loaded (12345 characters)

📝 Found 42 SQL statements to execute

⏳ [1/42] Executing: ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS...
✅ Success

⏳ [2/42] Executing: CREATE INDEX IF NOT EXISTS idx_quote_requests_payment_id...
✅ Success

...

============================================================
📊 Migration Summary:
   Total statements: 42
   ✅ Successful: 42
   ❌ Failed: 0
============================================================

🎉 Migration completed successfully!

🔍 Verifying changes...

  Checking quote_requests table...
  ✅ quote_requests: 10 new columns found
  Checking quote_sets table...
  ✅ quote_sets table: EXISTS
  Checking comparison_analyses table...
  ✅ comparison_analyses table: EXISTS
  Checking quote_request_details view...
  ✅ quote_request_details view: EXISTS

✅ Verification completed!
```

---

## ✅ 검증 체크리스트

마이그레이션 완료 후 다음을 확인하세요:

### 테이블 존재 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('quote_requests', 'quote_sets', 'comparison_analyses');
```

### 컬럼 확인
```sql
-- quote_requests 새 컬럼
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quote_requests'
AND column_name IN ('payment_id', 'plan_id', 'quantity', 'paid_amount')
ORDER BY column_name;
```

### 인덱스 확인
```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('quote_requests', 'quote_sets', 'comparison_analyses')
ORDER BY tablename, indexname;
```

### RLS 정책 확인
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('quote_sets', 'comparison_analyses');
```

---

## 🔄 롤백 방법

만약 마이그레이션을 되돌려야 한다면:

```sql
-- 1. 새로 생성된 테이블 삭제 (CASCADE로 연관된 것들도 함께 삭제)
DROP TABLE IF EXISTS public.comparison_analyses CASCADE;
DROP TABLE IF EXISTS public.quote_sets CASCADE;

-- 2. 추가된 컬럼 제거
ALTER TABLE public.quote_requests
DROP COLUMN IF EXISTS payment_id,
DROP COLUMN IF EXISTS plan_id,
DROP COLUMN IF EXISTS plan_name,
DROP COLUMN IF EXISTS quantity,
DROP COLUMN IF EXISTS is_comparison,
DROP COLUMN IF EXISTS original_amount,
DROP COLUMN IF EXISTS discount_amount,
DROP COLUMN IF EXISTS paid_amount,
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS paid_at;

-- 3. 추가된 인덱스 제거
DROP INDEX IF EXISTS public.idx_quote_requests_payment_id;
DROP INDEX IF EXISTS public.idx_quote_requests_plan_id;
DROP INDEX IF EXISTS public.idx_quote_requests_payment_status;
DROP INDEX IF EXISTS public.idx_quote_requests_quantity;

-- 4. 뷰 제거
DROP VIEW IF EXISTS public.quote_request_details;
```

---

## 📝 다음 단계

Phase 2 완료 후 진행할 작업:

- **Phase 3**: 견적서 업로드 UI 구현
  - QuoteSubmission 페이지 대폭 수정
  - QuoteSetForm 컴포넌트 개발
  - 파일 업로드 API 연동

---

## 📚 참고 문서

- [다중 견적 비교 시스템 기획서](./multiple-quote-comparison-system.md)
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

**마지막 업데이트**: 2025-01-13
**작성자**: Claude Code
**상태**: ✅ 완료
