# 다중 견적 비교 시스템 기획서

## 📋 문서 정보
- **작성일**: 2025-10-12
- **버전**: 1.0
- **상태**: 승인 대기중
- **작성자**: Claude Code

---

## 🎯 프로젝트 개요

### 목적
ZipCheck 서비스에 다중 견적 비교 기능을 추가하여 사용자가 여러 업체의 견적서를 동시에 분석하고 최적의 선택을 할 수 있도록 지원합니다.

### 핵심 가치
1. **비용 효율성**: 다건 동시 신청 시 할인 제공 (2건째부터 66.67% 가격)
2. **객관적 비교**: AI 기반 다중 견적 비교 분석
3. **업체 검증**: 커뮤니티 데이터와 자동 연계한 업체 신뢰도 평가
4. **리소스 보호**: 결제 후 업로드로 무분별한 AI 리소스 사용 방지

---

## 📊 요구사항 정리

### 1. 기능적 요구사항

#### 1.1 가격 정책
- **최대 신청 건수**: 3건
- **할인 구조**:
  - 1건째: 기본가 × 100%
  - 2건째: 기본가 × 2/3 (66.67%)
  - 3건째: 기본가 × 2/3 (66.67%)

#### 1.2 요금제 (기본가)
| 요금제 | 기본가 | SLA | 특징 |
|--------|--------|-----|------|
| 기본 분석 | 30,000원 | 48시간 | 일반 분석 |
| 빠른 분석 | 45,000원 | 24시간 | 빠른 처리 |
| 긴급 분석 | 60,000원 | 3시간 | 긴급 처리 |
| 심야 긴급 | 120,000원 | 3시간 | 21:00-09:00 |
| 휴일 긴급 | 120,000원 | 3시간 | 주말/공휴일 |

#### 1.3 가격 예시
```
예시 1: 기본 분석 3건
- 1건째: 30,000원
- 2건째: 20,000원 (30,000 × 2/3)
- 3건째: 20,000원 (30,000 × 2/3)
- 합계: 70,000원 (정상가 90,000원에서 20,000원 할인)

예시 2: 긴급 분석 2건
- 1건째: 60,000원
- 2건째: 40,000원 (60,000 × 2/3)
- 합계: 100,000원 (정상가 120,000원에서 20,000원 할인)

예시 3: 심야 긴급 3건
- 1건째: 120,000원
- 2건째: 80,000원 (120,000 × 2/3)
- 3건째: 80,000원 (120,000 × 2/3)
- 합계: 280,000원 (정상가 360,000원에서 80,000원 할인)
```

#### 1.4 견적서 업로드
- **건당 이미지 수**: 최대 3장
- **전체 이미지 수**: 최대 9장 (3건 × 3장)
- **업로드 방식**: 이미지 또는 Excel
- **업체 정보 수집** (선택사항):
  - 업체명 (필수)
  - 전화번호
  - 대표자명
  - 사업자번호

#### 1.5 업체 검증 연동
- 입력된 업체 정보를 커뮤니티 데이터베이스와 자동 매칭
- 연동 데이터:
  - 업체 후기 (평점, 리뷰 수)
  - 피해 사례 (신고 이력, 분쟁 이력)
  - 신뢰도 점수 자동 계산

### 2. 비기능적 요구사항

#### 2.1 보안
- 결제 완료 후에만 견적서 업로드 가능
- 업로드된 견적서는 암호화하여 저장
- 개인정보(업체 정보) 접근 권한 관리

#### 2.2 성능
- 이미지 업로드: 각 5MB 이하
- OCR 처리 시간: 이미지당 평균 10초
- AI 분석 시간: SLA 준수

#### 2.3 사용성
- 모바일 반응형 UI
- 드래그 앤 드롭 파일 업로드
- 실시간 진행 상황 표시

---

## 🔄 시스템 플로우

### 전체 프로세스
```
1. 요금제 선택 (PlanSelection)
   ↓
2. 견적 건수 선택 (1-3건)
   - 할인 가격 실시간 표시
   ↓
3. 결제 (Payment)
   - 고객 정보 입력
   - 결제 진행
   - 결제 완료 → quote_request 생성 (status: 'paid')
   ↓
4. 견적서 업로드 (QuoteSubmission)
   - 결제 정보 자동 입력 (읽기 전용)
   - 선택한 건수만큼 QuoteSet 입력 폼 표시
   - 각 QuoteSet:
     * 업체 정보 입력 (필수: 업체명, 선택: 전화번호, 대표자명, 사업자번호)
     * 이미지 업로드 (최대 3장)
     * 또는 Excel 업로드
   ↓
5. 자동 검증 (Rule-based, No AI)
   ├─ FAIL → 피드백 표시 → 수정 후 재제출
   └─ PASS
       ↓
6. 관리자 승인 대기 (Admin Dashboard)
   - 업로드된 견적서 검토
   - 승인 → AI 분석 시작
   - 반려 → 사용자에게 수정 요청
   ↓
7. AI 분석 진행
   - OCR 처리 (이미지 → 텍스트)
   - 항목별 분석
   - 가격 적정성 검증
   - 다중 견적 비교 분석 (2건 이상인 경우)
   ↓
8. 결과 제공
   - 개별 견적서 분석 리포트
   - 비교 분석 리포트 (2건 이상)
   - 추천 견적 (최적 선택 제안)
   - 업체 신뢰도 정보 (입력 시)
```

### 검증 로직 (Rule-based)
```typescript
interface ValidationRule {
  check: (quote: ParsedQuote) => boolean
  errorMessage: string
  severity: 'error' | 'warning'
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    check: (quote) => quote.items.length >= 10,
    errorMessage: '견적 항목이 10개 미만입니다. 상세한 견적서를 업로드해주세요.',
    severity: 'error'
  },
  {
    check: (quote) => {
      // 모호한 항목 체크: "거실 1천만원" 같은 패턴
      const vague = quote.items.filter(item =>
        item.name.length < 5 && item.price > 1000000
      )
      return vague.length === 0
    },
    errorMessage: '너무 간략한 항목이 포함되어 있습니다. 상세한 내역이 필요합니다.',
    severity: 'error'
  },
  {
    check: (quote) => {
      // 필수 필드 체크
      return quote.items.every(item =>
        item.name && item.quantity && item.unit && item.price
      )
    },
    errorMessage: '일부 항목에 필수 정보(품명, 수량, 단위, 단가)가 누락되었습니다.',
    severity: 'error'
  },
  {
    check: (quote) => {
      // 가격 합계 검증
      const calculatedTotal = quote.items.reduce((sum, item) =>
        sum + (item.quantity * item.price), 0
      )
      const diff = Math.abs(calculatedTotal - quote.totalAmount)
      return diff < calculatedTotal * 0.05  // 5% 오차 허용
    },
    errorMessage: '항목별 금액 합계와 총액이 일치하지 않습니다.',
    severity: 'warning'
  },
  {
    check: (quote) => {
      // 카테고리 다양성 체크
      const categories = new Set(quote.items.map(item => item.category))
      return categories.size >= 3
    },
    errorMessage: '견적 항목의 카테고리가 너무 단조롭습니다.',
    severity: 'warning'
  }
]
```

---

## 🗄️ 데이터베이스 스키마

### 1. quote_requests 테이블 수정
```sql
-- 기존 테이블에 컬럼 추가
ALTER TABLE quote_requests
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 3),
ADD COLUMN is_comparison BOOLEAN DEFAULT FALSE,
ADD COLUMN total_sets INTEGER DEFAULT 1,
ADD COLUMN discount_amount INTEGER DEFAULT 0,
ADD COLUMN original_amount INTEGER,
ADD COLUMN paid_amount INTEGER;

-- 기존 컬럼 주석
COMMENT ON COLUMN quote_requests.quantity IS '신청한 견적 분석 건수 (1-3)';
COMMENT ON COLUMN quote_requests.is_comparison IS '다중 견적 비교 여부';
COMMENT ON COLUMN quote_requests.total_sets IS '업로드된 QuoteSet 개수';
COMMENT ON COLUMN quote_requests.discount_amount IS '할인 금액';
COMMENT ON COLUMN quote_requests.original_amount IS '정상 금액';
COMMENT ON COLUMN quote_requests.paid_amount IS '실제 결제 금액';
```

### 2. quote_sets 테이블 (신규 생성)
```sql
CREATE TABLE quote_sets (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  set_id VARCHAR(10) NOT NULL,  -- 'SET_A', 'SET_B', 'SET_C'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 업체 정보
  vendor_name VARCHAR(100) NOT NULL,
  vendor_phone VARCHAR(20),
  vendor_representative VARCHAR(100),
  vendor_business_number VARCHAR(20),
  vendor_verified BOOLEAN DEFAULT FALSE,

  -- 커뮤니티 연동 정보 (업체 검증)
  community_vendor_id UUID REFERENCES community_vendors(id),
  trust_score DECIMAL(3,2),  -- 0.00 - 5.00
  review_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,

  -- 업로드 정보
  upload_type VARCHAR(10) NOT NULL CHECK (upload_type IN ('image', 'excel')),
  images JSONB,  -- [{url, name, size, uploadedAt}, ...]
  excel_file JSONB,  -- {url, name, size, uploadedAt}

  -- 파싱된 데이터
  items JSONB NOT NULL,  -- [{name, quantity, unit, price, category}, ...]
  total_amount INTEGER NOT NULL,
  item_count INTEGER NOT NULL,

  -- 검증 상태
  validation_status VARCHAR(20) DEFAULT 'pending',  -- pending, passed, failed
  validation_errors JSONB,  -- [{rule, message, severity}, ...]
  validation_warnings JSONB,
  validated_at TIMESTAMP,

  -- 분석 결과
  analysis_result JSONB,  -- AI 분석 결과
  analysis_score DECIMAL(3,2),  -- 0.00 - 5.00
  analyzed_at TIMESTAMP,

  -- 인덱스
  UNIQUE (request_id, set_id)
);

CREATE INDEX idx_quote_sets_request_id ON quote_sets(request_id);
CREATE INDEX idx_quote_sets_vendor_name ON quote_sets(vendor_name);
CREATE INDEX idx_quote_sets_validation_status ON quote_sets(validation_status);

COMMENT ON TABLE quote_sets IS '견적서 세트 (다중 견적 비교용)';
```

### 3. comparison_analyses 테이블 (신규 생성)
```sql
CREATE TABLE comparison_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL UNIQUE REFERENCES quote_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- 비교 대상
  quote_set_ids UUID[] NOT NULL,  -- [set_a_id, set_b_id, set_c_id]

  -- 비교 분석 결과
  comparison_result JSONB NOT NULL,
  /*
  {
    summary: {
      lowestPrice: { setId, amount },
      highestQuality: { setId, score },
      bestValue: { setId, reason }
    },
    itemComparison: [
      {
        itemName: "거실 타일",
        setA: { price, quality, spec },
        setB: { price, quality, spec },
        setC: { price, quality, spec },
        analysis: "..."
      }
    ],
    priceAnalysis: {
      avgDifference: 15.5,  // %
      outliers: [...]
    },
    recommendation: {
      setId: "SET_A",
      reason: "가격 대비 품질이 우수하며...",
      score: 4.8
    }
  }
  */

  -- AI 메타 정보
  model_version VARCHAR(50),
  processing_time_seconds INTEGER,

  analyzed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comparison_analyses_request_id ON comparison_analyses(request_id);

COMMENT ON TABLE comparison_analyses IS '다중 견적 비교 분석 결과';
```

### 4. community_vendors 테이블 (기존 테이블 참조용)
```sql
-- 커뮤니티에 이미 존재하는 업체 정보 테이블과 연동
-- 실제 구조는 커뮤니티 시스템에 따라 다름
CREATE TABLE IF NOT EXISTS community_vendors (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  representative VARCHAR(100),
  business_number VARCHAR(20) UNIQUE,

  -- 평판 정보
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API 엔드포인트

### 1. 가격 계산 API
```
POST /api/pricing/calculate
Request:
{
  "planId": "basic" | "fast" | "urgent" | "urgent-night" | "urgent-holiday",
  "quantity": 1 | 2 | 3
}

Response:
{
  "planId": "basic",
  "planName": "기본 분석",
  "basePrice": 30000,
  "quantity": 3,
  "breakdown": [
    { "index": 1, "price": 30000, "discount": 0 },
    { "index": 2, "price": 20000, "discount": 10000 },
    { "index": 3, "price": 20000, "discount": 10000 }
  ],
  "originalAmount": 90000,
  "discountAmount": 20000,
  "totalAmount": 70000,
  "slaHours": 48
}
```

### 2. 견적서 업로드 API
```
POST /api/quote-requests/:requestId/sets
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

FormData:
  setId: "SET_A" | "SET_B" | "SET_C"
  vendorName: string (required)
  vendorPhone?: string
  vendorRepresentative?: string
  vendorBusinessNumber?: string
  uploadType: "image" | "excel"
  images?: File[] (최대 3개)
  excelFile?: File

Response:
{
  "success": true,
  "quoteSet": {
    "id": "uuid",
    "setId": "SET_A",
    "vendorName": "OO건설",
    "uploadType": "image",
    "images": [
      { "url": "...", "name": "견적서1.jpg" }
    ],
    "validationStatus": "pending"
  }
}
```

### 3. 자동 검증 API
```
POST /api/quote-requests/:requestId/sets/:setId/validate
Request:
{
  "quoteSetId": "uuid"
}

Response:
{
  "validationStatus": "passed" | "failed",
  "errors": [
    {
      "rule": "minimum_items",
      "message": "견적 항목이 10개 미만입니다.",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "rule": "price_calculation",
      "message": "항목별 금액 합계와 총액이 일치하지 않습니다.",
      "severity": "warning"
    }
  ],
  "parsedData": {
    "items": [...],
    "totalAmount": 15000000,
    "itemCount": 45
  }
}
```

### 4. 업체 검증 API
```
POST /api/vendors/verify
Request:
{
  "vendorName": "OO건설",
  "vendorPhone"?: "010-1234-5678",
  "businessNumber"?: "123-45-67890"
}

Response:
{
  "verified": true,
  "vendor": {
    "id": "uuid",
    "name": "OO건설",
    "trustScore": 4.5,
    "reviewCount": 127,
    "complaintCount": 3,
    "rating": 4.3,
    "recentReviews": [
      {
        "author": "user***",
        "rating": 5,
        "comment": "꼼꼼하고 친절했습니다",
        "date": "2025-09-15"
      }
    ],
    "complaints": [
      {
        "type": "delay",
        "description": "일정 지연",
        "status": "resolved",
        "date": "2025-08-01"
      }
    ]
  }
}
```

### 5. 비교 분석 조회 API
```
GET /api/quote-requests/:requestId/comparison

Response:
{
  "requestId": "uuid",
  "quoteSets": [
    {
      "setId": "SET_A",
      "vendorName": "OO건설",
      "totalAmount": 15000000,
      "trustScore": 4.5,
      "analysisScore": 4.2
    },
    {
      "setId": "SET_B",
      "vendorName": "XX인테리어",
      "totalAmount": 13500000,
      "trustScore": 3.8,
      "analysisScore": 4.0
    },
    {
      "setId": "SET_C",
      "vendorName": "△△시공",
      "totalAmount": 16000000,
      "trustScore": 4.8,
      "analysisScore": 4.6
    }
  ],
  "comparison": {
    "summary": {
      "lowestPrice": { "setId": "SET_B", "amount": 13500000 },
      "highestQuality": { "setId": "SET_C", "score": 4.6 },
      "bestValue": { "setId": "SET_A", "reason": "가격과 품질의 균형" }
    },
    "recommendation": {
      "setId": "SET_A",
      "vendorName": "OO건설",
      "reason": "중간 가격대에 신뢰도와 품질이 모두 우수합니다...",
      "score": 4.5
    },
    "itemComparison": [...]
  }
}
```

---

## 🎨 UI/UX 명세

### 1. PlanSelection 페이지 수정

#### 현재 상태
- 5개 요금제 카드 표시
- 각 카드에 단일 가격 표시

#### 수정 사항
```typescript
// 가격 표시 간소화
<div className="price">
  <span className="amount">{basePrice.toLocaleString()}원</span>
  <span className="period">/ 건</span>
</div>

// 복잡한 할인 구조는 표시하지 않음
// "2건 이상 신청 시 할인" 같은 힌트만 추가
```

#### 새로운 요소
- 견적 건수 선택 UI는 **Payment 페이지로 이동**

### 2. Payment 페이지 수정

#### 추가 UI: 견적 건수 선택
```typescript
// 위치: 고객 정보 입력 전
<section className="quantity-selection">
  <h3>견적 분석 건수 선택</h3>
  <p className="hint">여러 업체의 견적을 동시에 비교하면 할인 혜택이 적용됩니다</p>

  <div className="quantity-options">
    {[1, 2, 3].map(qty => (
      <button
        className={`qty-option ${selectedQty === qty ? 'active' : ''}`}
        onClick={() => setSelectedQty(qty)}
      >
        <div className="qty-number">{qty}건</div>
        <div className="qty-price">
          {calculatePrice(planId, qty).totalAmount.toLocaleString()}원
        </div>
        {qty > 1 && (
          <div className="qty-discount">
            {calculatePrice(planId, qty).discountAmount.toLocaleString()}원 할인
          </div>
        )}
      </button>
    ))}
  </div>

  {/* 가격 상세 분석 */}
  <div className="price-breakdown">
    <div className="breakdown-item">
      <span>정상 금액</span>
      <span>{priceInfo.originalAmount.toLocaleString()}원</span>
    </div>
    {priceInfo.discountAmount > 0 && (
      <div className="breakdown-item discount">
        <span>할인 금액</span>
        <span>-{priceInfo.discountAmount.toLocaleString()}원</span>
      </div>
    )}
    <div className="breakdown-item total">
      <span>최종 결제 금액</span>
      <span>{priceInfo.totalAmount.toLocaleString()}원</span>
    </div>
  </div>
</section>
```

#### 결제 완료 후 리다이렉트
```typescript
// Payment.tsx에서 결제 완료 시
const handlePaymentSuccess = async () => {
  const quoteRequest = await createQuoteRequest({
    planId,
    quantity: selectedQty,
    customerInfo,
    paymentInfo,
    status: 'paid'
  })

  navigate('/quote-submission', {
    state: {
      requestId: quoteRequest.id,
      planId,
      quantity: selectedQty,
      customerInfo,
      paymentInfo
    }
  })
}
```

### 3. QuoteSubmission 페이지 대폭 수정

#### 페이지 구조
```typescript
interface QuoteSubmissionState {
  requestId: string
  planId: string
  quantity: 1 | 2 | 3
  customerInfo: CustomerInfo
  paymentInfo: PaymentInfo
}

function QuoteSubmission() {
  const location = useLocation()
  const state = location.state as QuoteSubmissionState

  // 결제 정보가 없으면 리다이렉트
  useEffect(() => {
    if (!state || !state.requestId) {
      navigate('/plans')
    }
  }, [state])

  const [quoteSets, setQuoteSets] = useState<QuoteSetForm[]>([
    { setId: 'SET_A', vendorInfo: {}, files: [], uploadType: 'image' }
  ])

  // quantity에 따라 폼 개수 조절
  useEffect(() => {
    if (state?.quantity) {
      const setIds = ['SET_A', 'SET_B', 'SET_C']
      setQuoteSets(
        Array.from({ length: state.quantity }, (_, i) => ({
          setId: setIds[i],
          vendorInfo: {},
          files: [],
          uploadType: 'image'
        }))
      )
    }
  }, [state?.quantity])
}
```

#### UI 레이아웃
```
┌─────────────────────────────────────────┐
│ 견적서 업로드                             │
├─────────────────────────────────────────┤
│ 📋 결제 정보 (읽기 전용)                   │
│ ┌─────────────────────────────────────┐ │
│ │ 요금제: 기본 분석 (48시간)             │ │
│ │ 분석 건수: 3건                        │ │
│ │ 결제 금액: 70,000원                   │ │
│ │ 고객명: 홍길동                        │ │
│ │ 연락처: 010-1234-5678                │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 📝 견적서 1 (SET_A)                       │
│ ┌─────────────────────────────────────┐ │
│ │ * 업체명: [입력]                      │ │
│ │ 전화번호: [입력] (선택)                │ │
│ │ 대표자명: [입력] (선택)                │ │
│ │ 사업자번호: [입력] (선택)              │ │
│ │                                      │ │
│ │ [이미지 업로드] 또는 [Excel 업로드]     │ │
│ │                                      │ │
│ │ 📷 [이미지 1] [이미지 2] [이미지 3]    │ │
│ │    (최대 3장)                         │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 📝 견적서 2 (SET_B)                       │
│ [동일한 폼 구조]                          │
├─────────────────────────────────────────┤
│ 📝 견적서 3 (SET_C)                       │
│ [동일한 폼 구조]                          │
├─────────────────────────────────────────┤
│ 📊 업로드 현황                            │
│ - 총 9장 중 6장 업로드 완료               │
│ - SET_A: 3/3 ✓                         │
│ - SET_B: 3/3 ✓                         │
│ - SET_C: 0/3                           │
├─────────────────────────────────────────┤
│              [제출하기]                   │
└─────────────────────────────────────────┘
```

#### QuoteSet 입력 폼 컴포넌트
```typescript
interface QuoteSetFormProps {
  setId: 'SET_A' | 'SET_B' | 'SET_C'
  index: number
  value: QuoteSetForm
  onChange: (value: QuoteSetForm) => void
}

function QuoteSetForm({ setId, index, value, onChange }: QuoteSetFormProps) {
  const [vendorVerification, setVendorVerification] = useState(null)

  // 업체 정보 입력 시 자동 검증
  const handleVendorInfoChange = async (field: string, val: string) => {
    const updated = { ...value, vendorInfo: { ...value.vendorInfo, [field]: val } }
    onChange(updated)

    // 사업자번호 입력 시 자동 검증
    if (field === 'businessNumber' && val.length >= 10) {
      const verification = await verifyVendor(updated.vendorInfo)
      setVendorVerification(verification)
    }
  }

  return (
    <div className="quote-set-form">
      <h3>견적서 {index + 1}</h3>

      {/* 업체 정보 */}
      <div className="vendor-info">
        <Input
          label="업체명 *"
          value={value.vendorInfo.name}
          onChange={(v) => handleVendorInfoChange('name', v)}
          required
        />

        <Input
          label="전화번호"
          placeholder="010-1234-5678"
          value={value.vendorInfo.phone}
          onChange={(v) => handleVendorInfoChange('phone', v)}
        />

        <Input
          label="대표자명"
          value={value.vendorInfo.representative}
          onChange={(v) => handleVendorInfoChange('representative', v)}
        />

        <Input
          label="사업자번호"
          placeholder="123-45-67890"
          value={value.vendorInfo.businessNumber}
          onChange={(v) => handleVendorInfoChange('businessNumber', v)}
        />

        {/* 업체 검증 결과 표시 */}
        {vendorVerification && (
          <div className="vendor-verification">
            {vendorVerification.verified ? (
              <div className="verified">
                <CheckCircle className="icon" />
                <div className="info">
                  <h4>{vendorVerification.vendor.name}</h4>
                  <p>신뢰도: {vendorVerification.vendor.trustScore}/5.0</p>
                  <p>리뷰: {vendorVerification.vendor.reviewCount}건</p>
                  {vendorVerification.vendor.complaintCount > 0 && (
                    <p className="warning">
                      피해사례: {vendorVerification.vendor.complaintCount}건
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="not-verified">
                <AlertCircle className="icon" />
                <p>커뮤니티에 등록된 업체 정보가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 업로드 타입 선택 */}
      <div className="upload-type-selector">
        <button
          className={value.uploadType === 'image' ? 'active' : ''}
          onClick={() => onChange({ ...value, uploadType: 'image' })}
        >
          📷 이미지 업로드
        </button>
        <button
          className={value.uploadType === 'excel' ? 'active' : ''}
          onClick={() => onChange({ ...value, uploadType: 'excel' })}
        >
          📊 Excel 업로드
        </button>
      </div>

      {/* 파일 업로드 */}
      {value.uploadType === 'image' ? (
        <ImageUploader
          maxFiles={3}
          files={value.files}
          onChange={(files) => onChange({ ...value, files })}
        />
      ) : (
        <ExcelUploader
          file={value.files[0]}
          onChange={(file) => onChange({ ...value, files: [file] })}
        />
      )}
    </div>
  )
}
```

### 4. 비교 분석 결과 페이지 (신규)

#### 페이지 경로
```
/quote-requests/:requestId/comparison
```

#### UI 구조
```
┌─────────────────────────────────────────┐
│ 견적 비교 분석 결과                        │
├─────────────────────────────────────────┤
│ 🎯 추천 견적                              │
│ ┌─────────────────────────────────────┐ │
│ │ ⭐ OO건설 (SET_A)                     │ │
│ │ 15,000,000원                         │ │
│ │ 신뢰도: 4.5/5.0                       │ │
│ │ 분석 점수: 4.2/5.0                    │ │
│ │                                      │ │
│ │ "중간 가격대에 신뢰도와 품질이 모두     │ │
│ │  우수합니다. 자재 품질이 검증된 제품을  │ │
│ │  사용하며, 시공 경험이 풍부합니다."     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 📊 견적 비교                              │
│ ┌─────────────────────────────────────┐ │
│ │ 항목         SET_A    SET_B    SET_C │ │
│ │ ────────────────────────────────────│ │
│ │ 거실 타일    800만    720만    850만  │ │
│ │ 주방 상판    250만    200만    300만  │ │
│ │ 조명 공사    150만    180만    140만  │ │
│ │ ...                                 │ │
│ │ ────────────────────────────────────│ │
│ │ 총액       1500만   1350만   1600만  │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 📈 상세 분석                              │
│ - 가격 분석                              │
│ - 품질 분석                              │
│ - 업체 신뢰도                            │
│ - 항목별 비교                            │
└─────────────────────────────────────────┘
```

---

## 🔗 커뮤니티 연동

### 1. 업체 데이터 매칭 로직

```typescript
async function matchVendorWithCommunity(vendorInfo: VendorInfo) {
  // 1단계: 사업자번호로 정확 매칭 (가장 신뢰도 높음)
  if (vendorInfo.businessNumber) {
    const vendor = await db.query(
      'SELECT * FROM community_vendors WHERE business_number = $1',
      [vendorInfo.businessNumber]
    )
    if (vendor) return { matched: true, vendor, confidence: 'high' }
  }

  // 2단계: 업체명 + 전화번호로 매칭
  if (vendorInfo.phone) {
    const vendor = await db.query(
      'SELECT * FROM community_vendors WHERE name = $1 AND phone = $2',
      [vendorInfo.name, vendorInfo.phone]
    )
    if (vendor) return { matched: true, vendor, confidence: 'medium' }
  }

  // 3단계: 업체명으로 유사 검색 (확신도 낮음)
  const similarVendors = await db.query(
    'SELECT *, similarity(name, $1) as sim FROM community_vendors WHERE similarity(name, $1) > 0.6 ORDER BY sim DESC LIMIT 5',
    [vendorInfo.name]
  )
  if (similarVendors.length > 0) {
    return { matched: false, suggestions: similarVendors, confidence: 'low' }
  }

  return { matched: false, confidence: 'none' }
}
```

### 2. 신뢰도 점수 계산

```typescript
function calculateTrustScore(vendor: CommunityVendor): number {
  let score = 3.0  // 기본 점수

  // 리뷰 점수 반영 (최대 +1.5점)
  if (vendor.reviewCount > 0) {
    score += Math.min(1.5, (vendor.rating - 3.0) * 0.5)
  }

  // 리뷰 개수 반영 (최대 +0.5점)
  if (vendor.reviewCount >= 10) {
    score += 0.2
  }
  if (vendor.reviewCount >= 50) {
    score += 0.2
  }
  if (vendor.reviewCount >= 100) {
    score += 0.1
  }

  // 피해 사례 반영 (최대 -1.0점)
  if (vendor.complaintCount > 0) {
    score -= Math.min(1.0, vendor.complaintCount * 0.2)
  }

  // 검증 여부 반영 (+0.5점)
  if (vendor.verified) {
    score += 0.5
  }

  return Math.max(0, Math.min(5.0, score))
}
```

### 3. 분석 리포트에 통합

```typescript
interface ComparisonAnalysis {
  summary: {
    lowestPrice: { setId: string; amount: number }
    highestQuality: { setId: string; score: number }
    bestValue: { setId: string; reason: string }
  }
  recommendation: {
    setId: string
    vendorName: string
    reason: string
    score: number
    // 신뢰도 정보 추가
    trustInfo?: {
      trustScore: number
      reviewCount: number
      complaintCount: number
      recentReviews: Review[]
      complaints: Complaint[]
    }
  }
}
```

---

## 🧪 TDD (Test-Driven Development) 접근법

### 1. 단위 테스트 (Unit Tests)

#### 1.1 가격 계산 로직
```typescript
// lib/pricing.test.ts
describe('calculatePrice', () => {
  test('1건 신청 시 기본가 100%', () => {
    const result = calculatePrice('basic', 1)
    expect(result.totalAmount).toBe(30000)
    expect(result.discountAmount).toBe(0)
  })

  test('2건 신청 시 2건째 66.67% 적용', () => {
    const result = calculatePrice('basic', 2)
    expect(result.totalAmount).toBe(50000)  // 30000 + 20000
    expect(result.discountAmount).toBe(10000)
  })

  test('3건 신청 시 2건째, 3건째 66.67% 적용', () => {
    const result = calculatePrice('basic', 3)
    expect(result.totalAmount).toBe(70000)  // 30000 + 20000 + 20000
    expect(result.discountAmount).toBe(20000)
  })

  test('긴급 분석 3건 가격 계산', () => {
    const result = calculatePrice('urgent', 3)
    expect(result.totalAmount).toBe(140000)  // 60000 + 40000 + 40000
  })

  test('심야 긴급 2건 가격 계산', () => {
    const result = calculatePrice('urgent-night', 2)
    expect(result.totalAmount).toBe(200000)  // 120000 + 80000
  })
})

describe('getPriceBreakdown', () => {
  test('가격 상세 내역 반환', () => {
    const breakdown = getPriceBreakdown('fast', 3)
    expect(breakdown).toEqual([
      { index: 1, price: 45000, discount: 0, percentage: 100 },
      { index: 2, price: 30000, discount: 15000, percentage: 66.67 },
      { index: 3, price: 30000, discount: 15000, percentage: 66.67 }
    ])
  })
})
```

#### 1.2 검증 로직
```typescript
// lib/validation.test.ts
describe('validateQuote', () => {
  test('항목 10개 미만 시 에러', () => {
    const quote = { items: Array(9).fill({ name: 'item' }), totalAmount: 1000000 }
    const result = validateQuote(quote)
    expect(result.status).toBe('failed')
    expect(result.errors).toContainEqual({
      rule: 'minimum_items',
      severity: 'error'
    })
  })

  test('모호한 항목 포함 시 에러', () => {
    const quote = {
      items: [
        ...Array(9).fill({ name: '타일 공사', price: 500000 }),
        { name: '거실', price: 10000000 }  // 모호함
      ],
      totalAmount: 14500000
    }
    const result = validateQuote(quote)
    expect(result.errors).toContainEqual({
      rule: 'vague_items',
      severity: 'error'
    })
  })

  test('가격 합계 불일치 시 경고', () => {
    const quote = {
      items: Array(15).fill({ name: 'item', quantity: 1, price: 100000 }),
      totalAmount: 2000000  // 실제 합계: 1,500,000
    }
    const result = validateQuote(quote)
    expect(result.warnings).toContainEqual({
      rule: 'price_calculation',
      severity: 'warning'
    })
  })
})
```

#### 1.3 업체 매칭 로직
```typescript
// lib/vendor-matching.test.ts
describe('matchVendorWithCommunity', () => {
  test('사업자번호로 정확 매칭', async () => {
    const result = await matchVendorWithCommunity({
      name: 'OO건설',
      businessNumber: '123-45-67890'
    })
    expect(result.matched).toBe(true)
    expect(result.confidence).toBe('high')
  })

  test('업체명 + 전화번호로 매칭', async () => {
    const result = await matchVendorWithCommunity({
      name: 'OO건설',
      phone: '010-1234-5678'
    })
    expect(result.matched).toBe(true)
    expect(result.confidence).toBe('medium')
  })

  test('매칭 실패 시 유사 업체 제안', async () => {
    const result = await matchVendorWithCommunity({
      name: 'OO건설'
    })
    expect(result.matched).toBe(false)
    expect(result.suggestions).toBeDefined()
  })
})

describe('calculateTrustScore', () => {
  test('기본 점수 3.0', () => {
    const vendor = { reviewCount: 0, rating: 0, complaintCount: 0, verified: false }
    expect(calculateTrustScore(vendor)).toBe(3.0)
  })

  test('높은 평점 시 점수 증가', () => {
    const vendor = { reviewCount: 50, rating: 4.8, complaintCount: 0, verified: false }
    const score = calculateTrustScore(vendor)
    expect(score).toBeGreaterThan(3.5)
  })

  test('피해 사례 많으면 점수 감소', () => {
    const vendor = { reviewCount: 30, rating: 4.0, complaintCount: 5, verified: false }
    const score = calculateTrustScore(vendor)
    expect(score).toBeLessThan(3.5)
  })
})
```

### 2. 통합 테스트 (Integration Tests)

#### 2.1 견적서 업로드 플로우
```typescript
// api/quote-upload.integration.test.ts
describe('Quote Upload Flow', () => {
  test('결제 후 견적서 업로드 가능', async () => {
    // 1. 결제 생성
    const payment = await createPayment({
      planId: 'basic',
      quantity: 2,
      customerInfo: { /* ... */ }
    })

    // 2. 견적서 업로드
    const upload = await uploadQuoteSet({
      requestId: payment.requestId,
      setId: 'SET_A',
      vendorInfo: { name: 'OO건설' },
      files: [/* ... */]
    })

    expect(upload.success).toBe(true)
    expect(upload.quoteSet.validationStatus).toBe('pending')
  })

  test('결제 없이 업로드 시 실패', async () => {
    await expect(
      uploadQuoteSet({
        requestId: 'non-existent',
        setId: 'SET_A',
        vendorInfo: { name: 'OO건설' },
        files: [/* ... */]
      })
    ).rejects.toThrow('Payment required')
  })

  test('quantity 초과 업로드 시 실패', async () => {
    const payment = await createPayment({
      planId: 'basic',
      quantity: 1,  // 1건만 결제
      customerInfo: { /* ... */ }
    })

    // SET_A 업로드 성공
    await uploadQuoteSet({ requestId: payment.requestId, setId: 'SET_A', /* ... */ })

    // SET_B 업로드 실패 (quantity 초과)
    await expect(
      uploadQuoteSet({ requestId: payment.requestId, setId: 'SET_B', /* ... */ })
    ).rejects.toThrow('Exceeded quantity limit')
  })
})
```

#### 2.2 자동 검증 플로우
```typescript
describe('Validation Flow', () => {
  test('유효한 견적서 통과', async () => {
    const quoteSet = await uploadQuoteSet({ /* valid data */ })
    const validation = await validateQuoteSet(quoteSet.id)

    expect(validation.status).toBe('passed')
    expect(validation.errors).toHaveLength(0)
  })

  test('검증 실패 시 피드백 제공', async () => {
    const quoteSet = await uploadQuoteSet({ /* invalid data - 항목 5개 */ })
    const validation = await validateQuoteSet(quoteSet.id)

    expect(validation.status).toBe('failed')
    expect(validation.errors.length).toBeGreaterThan(0)
    expect(validation.errors[0].message).toContain('10개 미만')
  })
})
```

#### 2.3 업체 검증 플로우
```typescript
describe('Vendor Verification Flow', () => {
  test('사업자번호 입력 시 자동 검증', async () => {
    const verification = await verifyVendor({
      name: 'OO건설',
      businessNumber: '123-45-67890'
    })

    expect(verification.verified).toBe(true)
    expect(verification.vendor.trustScore).toBeDefined()
    expect(verification.vendor.reviewCount).toBeGreaterThan(0)
  })

  test('커뮤니티 데이터 연동', async () => {
    const verification = await verifyVendor({
      name: 'OO건설',
      businessNumber: '123-45-67890'
    })

    expect(verification.vendor.recentReviews).toBeDefined()
    expect(verification.vendor.complaints).toBeDefined()
  })
})
```

### 3. E2E 테스트 (End-to-End Tests)

#### 3.1 전체 사용자 플로우
```typescript
// e2e/quote-comparison.e2e.test.ts
describe('Complete Quote Comparison Flow', () => {
  test('사용자가 3건 견적 비교 신청부터 결과 조회까지', async () => {
    // 1. 요금제 선택
    await page.goto('/plans')
    await page.click('[data-plan="basic"]')

    // 2. 견적 건수 선택 (3건)
    await page.click('[data-quantity="3"]')
    expect(await page.textContent('.total-amount')).toContain('70,000')

    // 3. 고객 정보 입력 및 결제
    await page.fill('[name="customerName"]', '홍길동')
    await page.fill('[name="phone"]', '010-1234-5678')
    await page.click('[data-payment-method="card"]')
    await page.click('button[type="submit"]')

    // 4. 결제 완료 후 QuoteSubmission으로 리다이렉트
    await page.waitForURL('/quote-submission')
    expect(await page.textContent('.payment-info')).toContain('70,000')

    // 5. 견적서 1 업로드
    await page.fill('[data-set="SET_A"] [name="vendorName"]', 'OO건설')
    await page.fill('[data-set="SET_A"] [name="businessNumber"]', '123-45-67890')
    // 업체 검증 자동 표시 확인
    await page.waitForSelector('[data-set="SET_A"] .vendor-verification')

    await page.setInputFiles('[data-set="SET_A"] input[type="file"]', [
      'test-fixtures/quote1-1.jpg',
      'test-fixtures/quote1-2.jpg',
      'test-fixtures/quote1-3.jpg'
    ])

    // 6. 견적서 2, 3 업로드 (동일 과정)
    // ...

    // 7. 제출
    await page.click('button[type="submit"]')

    // 8. 검증 진행 및 결과
    await page.waitForSelector('.validation-result')
    expect(await page.textContent('.validation-result')).toContain('검증 통과')

    // 9. 관리자 승인 (시뮬레이션)
    // ...

    // 10. AI 분석 완료 대기
    await page.waitForSelector('.analysis-complete', { timeout: 60000 })

    // 11. 비교 분석 결과 조회
    await page.click('a[href*="/comparison"]')
    await page.waitForSelector('.recommendation')

    expect(await page.textContent('.recommendation .vendor-name')).toBeDefined()
    expect(await page.textContent('.comparison-table')).toContain('SET_A')
    expect(await page.textContent('.comparison-table')).toContain('SET_B')
    expect(await page.textContent('.comparison-table')).toContain('SET_C')
  })
})
```

### 4. 테스트 커버리지 목표

```
┌────────────────┬──────────┬──────────┐
│ Category       │ Target   │ Priority │
├────────────────┼──────────┼──────────┤
│ 가격 계산       │ 100%     │ High     │
│ 검증 로직       │ 95%      │ High     │
│ 업체 매칭       │ 90%      │ Medium   │
│ API 엔드포인트  │ 85%      │ High     │
│ UI 컴포넌트     │ 80%      │ Medium   │
│ E2E 플로우      │ 70%      │ Medium   │
└────────────────┴──────────┴──────────┘
```

---

## 📅 구현 단계

### Phase 1: 가격 시스템 (1-2일)
- [ ] `lib/pricing.ts` 생성 및 테스트
- [ ] Payment 페이지에 견적 건수 선택 UI 추가
- [ ] 할인 가격 실시간 계산 및 표시
- [ ] 테스트: 모든 요금제 × 3가지 수량 조합 검증

### Phase 2: 데이터베이스 스키마 (1일)
- [ ] `quote_requests` 테이블 수정 (quantity, discount 등)
- [ ] `quote_sets` 테이블 생성
- [ ] `comparison_analyses` 테이블 생성
- [ ] Migration 스크립트 작성 및 실행

### Phase 3: 견적서 업로드 UI (2-3일)
- [ ] QuoteSubmission 페이지 대폭 수정
  - [ ] 결제 정보 표시 (읽기 전용)
  - [ ] QuoteSetForm 컴포넌트 개발
  - [ ] 업체 정보 입력 폼
  - [ ] 이미지/Excel 업로드 UI
  - [ ] 진행 상황 표시 (9장 중 N장)
- [ ] 파일 업로드 API 연동
- [ ] 테스트: 1건, 2건, 3건 업로드 시나리오

### Phase 4: 자동 검증 시스템 (2일)
- [ ] `lib/validation.ts` 구현
- [ ] 5가지 검증 규칙 개발
- [ ] 검증 API 엔드포인트
- [ ] 검증 결과 UI (에러/경고 표시)
- [ ] 테스트: 각 검증 규칙 실패/통과 케이스

### Phase 5: 업체 검증 연동 (2-3일)
- [ ] `community_vendors` 테이블 스키마 확정
- [ ] 업체 매칭 로직 (`lib/vendor-matching.ts`)
- [ ] 신뢰도 점수 계산
- [ ] 업체 검증 API
- [ ] 업체 검증 결과 UI
- [ ] 테스트: 매칭 정확도, 신뢰도 계산

### Phase 6: AI 비교 분석 (3-4일)
- [ ] 비교 분석 프롬프트 설계
- [ ] 다중 견적 비교 로직
- [ ] 추천 알고리즘
- [ ] 비교 분석 API
- [ ] 테스트: 2건, 3건 비교 시나리오

### Phase 7: 결과 UI (2일)
- [ ] 비교 분석 결과 페이지 개발
- [ ] 추천 견적 표시
- [ ] 항목별 비교 테이블
- [ ] 상세 분석 섹션
- [ ] PDF 다운로드 기능

### Phase 8: 통합 테스트 및 QA (2-3일)
- [ ] E2E 테스트 작성 및 실행
- [ ] 성능 테스트 (이미지 업로드, OCR 처리)
- [ ] 모바일 반응형 테스트
- [ ] 버그 수정

### Phase 9: 문서화 (1일)
- [ ] API 문서 작성
- [ ] 사용자 가이드 작성
- [ ] 관리자 매뉴얼 작성

---

## 🎨 디자인 시스템 적용

### 색상 (Quepal Gradient)
```css
/* 메인 그라디언트 */
.gradient-primary {
  background: linear-gradient(135deg, #11998e, #38ef7d);
}

/* 텍스트 그라디언트 */
.text-gradient {
  background: linear-gradient(135deg, #11998e, #38ef7d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 테두리 */
.border-gradient {
  border: 2px solid transparent;
  background: linear-gradient(135deg, #11998e, #38ef7d) border-box;
}

/* 입력 필드 */
.input-field {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(17, 153, 142, 0.3);
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #38ef7d;
  outline: none;
}
```

### 컴포넌트 스타일
```typescript
// QuoteSetForm 스타일
const styles = {
  form: "bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-[#11998e]/30",
  title: "text-2xl font-bold bg-gradient-to-r from-[#11998e] to-[#38ef7d] bg-clip-text text-transparent",
  input: "w-full px-5 py-4 bg-black/60 border border-[#11998e]/30 rounded-xl text-white focus:border-[#38ef7d] transition-colors",
  button: "px-8 py-4 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-[#11998e]/50 transition-all",
  verificationCard: "mt-4 p-4 bg-[#11998e]/10 border border-[#11998e]/30 rounded-xl"
}
```

---

## 🔒 보안 고려사항

### 1. 파일 업로드 보안
- 파일 타입 검증 (이미지: jpg, png, pdf / Excel: xlsx, xls)
- 파일 크기 제한 (각 5MB)
- 바이러스 스캔 (ClamAV 등)
- S3 Pre-signed URL 사용

### 2. 개인정보 보호
- 업체 정보 암호화 저장 (AES-256)
- 사업자번호 마스킹 표시 (123-**-**890)
- RBAC 권한 관리 (사용자는 자신의 견적만 조회)

### 3. API 보안
- JWT 토큰 인증
- Rate Limiting (IP당 분당 요청 제한)
- CSRF 토큰 검증

---

## 📊 모니터링 및 로깅

### 1. 주요 메트릭
- 견적 건수별 신청 비율 (1건/2건/3건)
- 업로드 성공률
- 검증 통과율
- 평균 처리 시간 (SLA 준수율)
- 업체 검증 매칭률

### 2. 에러 추적
- Sentry 통합
- 업로드 실패 원인 분석
- 검증 실패 패턴 분석

### 3. 사용자 행동 분석
- 견적 건수 선택 분포
- 중도 이탈 지점 파악
- 비교 분석 결과 만족도

---

## ✅ 완료 기준

### 기능 완료
- [ ] 모든 요금제에서 1-3건 가격 계산 정확
- [ ] Payment 페이지에서 견적 건수 선택 가능
- [ ] 결제 후 QuoteSubmission에서 quantity만큼 입력 폼 표시
- [ ] 각 QuoteSet에 업체 정보 입력 가능 (업체명 필수, 나머지 선택)
- [ ] 최대 9장 이미지 업로드 가능 (3건 × 3장)
- [ ] 업체 정보 입력 시 커뮤니티 DB와 자동 매칭
- [ ] 신뢰도 점수 및 리뷰/피해사례 표시
- [ ] 자동 검증 5가지 규칙 모두 작동
- [ ] 검증 실패 시 명확한 피드백 제공
- [ ] 2건 이상 신청 시 비교 분석 결과 제공
- [ ] 추천 견적 표시

### 테스트 완료
- [ ] 단위 테스트: 가격 계산, 검증 로직, 업체 매칭
- [ ] 통합 테스트: 업로드 플로우, 검증 플로우
- [ ] E2E 테스트: 전체 사용자 플로우 (선택 → 결제 → 업로드 → 결과)
- [ ] 성능 테스트: 9장 이미지 동시 업로드
- [ ] 모바일 반응형 테스트

### 문서화 완료
- [ ] API 문서 (Swagger/OpenAPI)
- [ ] 컴포넌트 문서 (Storybook)
- [ ] 사용자 가이드
- [ ] 관리자 매뉴얼

---

## 🚀 다음 단계

### 향후 개선 사항
1. **AI 학습 개선**
   - 비교 분석 정확도 향상
   - 업체 추천 알고리즘 고도화

2. **커뮤니티 연동 강화**
   - 실시간 업체 평판 업데이트
   - 사용자 리뷰 자동 수집

3. **기능 확장**
   - 견적서 템플릿 제공
   - AI 챗봇 상담 연동
   - 계약서 자동 생성

---

## 📝 변경 이력

### 2025-10-12 (v1.0)
- 초안 작성
- 다중 견적 비교 시스템 전체 기획 완료
- TDD 접근법 정의
- 구현 단계별 계획 수립

---

**승인 대기중** - 이 기획서를 검토하시고 진행 여부를 알려주세요.

구현 예상 기간: **약 20-25일** (Phase 1-9 합계)

주요 리스크:
1. 커뮤니티 DB 스키마 불확실성 → 조기 확인 필요
2. AI 비교 분석 품질 → 프롬프트 엔지니어링 반복 필요
3. 대용량 이미지 처리 성능 → 초기 테스트 필수
