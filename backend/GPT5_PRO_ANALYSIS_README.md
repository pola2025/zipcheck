# GPT-5 Pro 종합 분석 시스템

현재 `analyzeQuote()` 함수와 동일한 `AnalysisResult` 구조를 반환하지만, GPT-5 Pro를 사용하여 더 정밀하고 종합적인 분석을 수행하는 시스템입니다.

---

## 🎯 핵심 특징

### 1. **무한루프 방지**
- ✅ `max_steps = 6`: 에이전트 툴 호출/스텝 상한 (초과 시 "INSUFFICIENT_DATA"로 종료)
- ✅ 중복 출력 차단: 직전 응답 해시와 동일하면 즉시 중단 (`stop_reason="duplicate"`)
- ✅ 강제 종료 토큰: 프롬프트에 `END`를 계약하고 `stop=["\nEND"]`
- ✅ 툴 호출 정책: 동일 툴 연속 1회 제한 (동일 파라미터 재호출 금지)

### 2. **토큰 낭비 방지** (1회 요청 50k 이내, 평균 30~50k)
- ✅ 하드 예산: `tokenBudget=50,000` (입력+출력 합산), 초과 시 중단
- ✅ 출력 상한: `max_output_tokens = 2,000~4,000` (업무에 맞춰), 초과 생성 금지
- ✅ 입력 샘플링/리트리벌: 전체 본문 대신 필요 섹션 스니펫만 (Top-K=8~12, 각 600–800 tokens)
- ✅ 엄격한 JSON 스키마 + 요약 길이: "표 N행 + 300자 요약" 같은 정형 + 길이 제한

### 3. **타임아웃 중복 호출 방지**
- ✅ 동일 Job 재시작 금지: Idempotency-Key (요청 특징 + 문서셋 해시)로 중복 Job 차단
- ✅ 타임아웃 후 상태 전이: `status="timeout"`으로 저장하고, 자동 재시도 금지 (수동만)
- ✅ 재시도 정책: 429/5xx만 지수 백오프 (최대 2회). 타임아웃/4xx는 재시도 금지
- ✅ 클라이언트 취소 연동: Vercel에서 Abort 시 백엔드가 워커 취소 (job cancel 플래그)

### 4. **평균 30~50k 유지** (가변 제어)
- ✅ 동적 타임아웃/토큰 한도: 입력량·K 값 보고 `max_output_tokens`, `request_timeout` 자동 조절
- ✅ 프리플라이트 (샘플 1~2페이지): 본 실행 전 토큰 견적을 내서 K/길이 한도를 조절

---

## 📊 데이터베이스 스키마

### 테이블 구조

#### 1. `analysis_jobs` - 작업(견적 분석) 단위
```sql
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY,
  idem_key TEXT UNIQUE NOT NULL,                    -- 중복 요청 차단
  user_id TEXT,
  quote_request_id INTEGER REFERENCES quote_requests(id),

  -- 상태 관리
  status TEXT CHECK (status IN ('queued','running','succeeded','failed','timeout','canceled','duplicate')),
  created_at, started_at, completed_at, updated_at TIMESTAMPTZ,

  -- 토큰/비용 예산
  input_token_budget INTEGER DEFAULT 50000,         -- 총 토큰 예산
  max_output_tokens INTEGER DEFAULT 3000,
  actual_tokens_used INTEGER,
  actual_cost_usd NUMERIC(10,4),

  -- 실행 제어
  stop_sequence TEXT DEFAULT '\nEND',
  max_steps INTEGER DEFAULT 6,
  timeout_ms INTEGER DEFAULT 90000,

  -- 결과/에러
  reason TEXT,                                       -- 실패/중단 사유
  error_message TEXT,
  error_stack TEXT
);
```

#### 2. `analysis_job_inputs` - 문서/데이터 입력 묶음
```sql
CREATE TABLE analysis_job_inputs (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES analysis_jobs(id),
  source_type TEXT,          -- 'floor_plan','quote_items','base_costs','market_prices'
  pointer TEXT,              -- S3 키, 파일ID, 또는 벡터 컬렉션ID 등
  tokens_estimate INTEGER    -- 사전 추정 토큰
);
```

#### 3. `analysis_job_usage` - 사용량/비용 로깅
```sql
CREATE TABLE analysis_job_usage (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES analysis_jobs(id),
  step INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  usd_input NUMERIC(10,4),
  usd_output NUMERIC(10,4),
  usd_total NUMERIC(10,4),
  duration_ms INTEGER,
  model TEXT
);
```

#### 4. `analysis_job_outputs` - 출력 결과 (부분/최종)
```sql
CREATE TABLE analysis_job_outputs (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES analysis_jobs(id),
  step INTEGER,
  content JSONB,             -- JSON 스키마에 맞춘 결과
  content_hash TEXT,         -- 중복 출력 차단용
  done BOOLEAN DEFAULT false
);
```

---

## 🚀 API 엔드포인트

### 1. **종합 분석 실행**
```http
POST /api/quote-requests/admin/:id/analyze-comprehensive
Authorization: Bearer <admin_token>

Request Body:
{
  "analyzed_by": "admin",
  "user_id": "admin"
}

Response:
{
  "success": true,
  "message": "GPT-5 Pro 종합 분석이 완료되었습니다.",
  "data": {
    "id": 123,
    "analysis_result": {
      "overallScore": 75,
      "totalAmount": 5000000,
      "averageMarketPrice": 4500000,
      "priceRating": "reasonable",
      "summary": {
        "positive": [...],
        "negative": [...],
        "warnings": [...]
      },
      "categoryAnalysis": [...],
      "recommendations": [...],
      "marketComparison": {...},
      "expertNotes": {...}
    },
    "status": "completed",
    ...
  },
  "meta": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "model": "gpt-4o",
    "tokenUsage": {
      "prompt_tokens": 15234,
      "completion_tokens": 2567,
      "total_tokens": 17801
    },
    "costUsd": 0.4521,
    "duration": 12543,
    "stopReason": "single"
  }
}
```

### 2. **분석 작업 취소**
```http
POST /api/quote-requests/admin/analysis-job/:jobId/cancel
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "분석 작업이 취소되었습니다."
}
```

### 3. **분석 작업 상태 조회**
```http
GET /api/quote-requests/admin/analysis-job/:jobId
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "status": "running",
    "actual_tokens_used": 15234,
    "actual_cost_usd": 0.4521,
    "outputs": [...],
    "usage_logs": [...]
  }
}
```

### 4. **분석 작업 목록 조회 (모니터링용)**
```http
GET /api/quote-requests/admin/analysis-jobs?status=all&limit=20&offset=0
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [...],
  "stats": [
    {
      "status": "succeeded",
      "count": 45,
      "avg_tokens": 32145,
      "total_cost": 15.67
    }
  ],
  "pagination": {...}
}
```

---

## 📋 마이그레이션 실행

### 방법 1: 스크립트 실행
```bash
cd backend
npx tsx src/scripts/run-gpt5-migration.ts
```

### 방법 2: 수동 실행
```bash
psql -h <host> -U <user> -d <database> -f src/migrations/20250114_add_gpt5_pro_jobs.sql
```

---

## 🔧 설정

### 환경 변수
```env
# .env 파일에 추가
OPENAI_API_KEY=<your-openai-api-key>         # OpenAI API Key (GPT-4o)
GOOGLE_CLOUD_API_KEY=<your-google-cloud-api-key>  # 도면 분석용
```

### 비용 설정 (기본값)
- 입력 토큰: $15 per million
- 출력 토큰: $120 per million
- 예산: $2.0 per 요청

---

## 📊 응답 구조 (AnalysisResult)

GPT-5 Pro 분석 결과는 기존 `analyzeQuote()` 함수와 **완전히 동일한 구조**를 반환합니다:

```typescript
interface AnalysisResult {
  // 1. 종합 평가
  overallScore: number              // 0-100점
  totalAmount: number               // 총 견적액 (원)
  averageMarketPrice: number        // 시장 평균가 (원)
  priceRating: 'low' | 'reasonable' | 'high' | 'very_high'

  // 2. 요약 (긍정/부정/경고)
  summary: {
    positive: string[]              // 긍정 평가 (최대 3개)
    negative: string[]              // 부정 평가 (최대 3개)
    warnings: string[]              // 주의사항 (최대 3개)
  }

  // 3. 카테고리별 분석
  categoryAnalysis: Array<{
    category: string
    totalCost: number
    marketAverage: number
    rating: 'good' | 'reasonable' | 'slightly_high' | 'high'
    percentage: number              // 전체 대비 비율 (%)
    items: number                   // 항목 수
    findings: string[]              // 발견사항 (최대 3개)
  }>

  // 4. 집첵 권장사항 (최대 5개)
  recommendations: Array<{
    type: 'cost_reduction' | 'quality_improvement' | 'warning'
    title: string
    description: string             // 200자 이내
    potentialSaving?: number        // 절감 가능 금액 (원)
  }>

  // 5. 시장 비교
  marketComparison: {
    averagePriceRange: { min: number, max: number }
    currentQuote: number
    percentile: number              // 0~100 (낮을수록 저렴)
    similarCases: Array<{
      location: string
      size: number                  // 평수
      cost: number
      year: number
    }>
  }

  // 6. 전문가 의견 (항목별)
  expertNotes: Record<string, string>

  // 7. 메타 정보 (GPT-5 Pro 전용)
  _meta?: {
    jobId: string
    model: string
    tokenUsage: TokenUsage
    costUsd: number
    duration: number
    stopReason: string
  }
}
```

---

## 🔍 모니터링

### 통계 뷰 (PostgreSQL)
```sql
SELECT * FROM analysis_job_stats
WHERE date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;
```

### 주요 지표
- **평균 토큰 사용량**: 30,000~50,000 목표
- **평균 비용**: $0.30~$0.70 per 요청
- **성공률**: 95% 이상
- **평균 응답 시간**: 30~90초

### 알림 조건
- ⚠️ 단일 호출 40k 토큰 초과
- ⚠️ `timeout` 상태 발생
- ⚠️ 비용 $1.00 초과
- ⚠️ 성공률 90% 미만

---

## 🎨 프롬프트 엔지니어링

### 시스템 프롬프트 핵심
```
당신은 집첵(ZipCheck) 인테리어 견적 분석 전문가입니다.

**핵심 규칙:**
1. 반드시 JSON 객체 하나만 출력하고, 마지막 줄에 **END**를 붙이세요.
2. 최대 출력 토큰 3000 이내로 간결하게 작성하세요.
3. 불확실한 정보는 생성하지 말고 "데이터 부족"이라고 명시하세요.
4. 아래 JSON 스키마를 정확히 따르세요.
```

### 토큰 절약 기법
- ✅ 상위 5개 항목만 전달
- ✅ 카테고리별 요약 사용
- ✅ 컬럼명/키 짧게 압축
- ✅ 불필요한 필드 제거

---

## 🔐 보안 및 안전

### Idempotency Key
```typescript
idemKey = hash(userId + quoteRequestId + params)
```
- 동일한 요청은 1번만 실행
- 기존 결과가 있으면 캐시 반환

### 재시도 정책
- ✅ 429 (Rate Limit): 지수 백오프 (최대 2회)
- ✅ 5xx (Server Error): 지수 백오프 (최대 2회)
- ❌ 4xx (Client Error): 재시도 금지
- ❌ Timeout: 재시도 금지 (수동만)

### 예산 초과 방지
```typescript
if (totalUsage.total_tokens > tokenBudget) {
  throw new Error(`Token budget exceeded: ${totalUsage.total_tokens} > ${tokenBudget}`)
}

if (totalCost.total_usd > usdBudget) {
  throw new Error(`USD budget exceeded: $${totalCost.total_usd} > $${usdBudget}`)
}
```

---

## 🧪 테스트

### 로컬 테스트
```bash
# 1. 마이그레이션 실행
npx tsx src/scripts/run-gpt5-migration.ts

# 2. 서버 시작
npm run dev

# 3. API 호출 (예: curl)
curl -X POST http://localhost:3001/api/quote-requests/admin/1/analyze-comprehensive \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"analyzed_by":"admin"}'
```

### 예상 응답 시간
- 간단한 견적 (10개 항목): 15~30초
- 중간 견적 (20~30개 항목): 30~60초
- 복잡한 견적 (50개+ 항목): 60~90초

### 예상 비용
- 간단한 견적: $0.20~$0.40
- 중간 견적: $0.40~$0.70
- 복잡한 견적: $0.70~$1.20

---

## 📚 참고 문서

### 코드 위치
- **Safe Call Wrapper**: `backend/src/services/gpt5-pro-safe-call.ts`
- **종합 분석 서비스**: `backend/src/services/comprehensive-analysis.ts`
- **API 엔드포인트**: `backend/src/routes/quote-requests.ts` (라인 1065~1393)
- **마이그레이션**: `backend/src/migrations/20250114_add_gpt5_pro_jobs.sql`

### 주요 함수
```typescript
// Safe Call Wrapper
export async function safeGpt5ProCall(options: SafeCallOptions): Promise<SafeCallResult>

// 종합 분석
export async function comprehensiveAnalysis(
  request: ComprehensiveAnalysisRequest,
  options?: { abortSignal?, tokenBudget?, maxOutputTokens?, userId? }
): Promise<ComprehensiveAnalysisResult>

// 작업 취소
export async function cancelAnalysisJob(jobId: string): Promise<void>

// 프리플라이트 견적
export async function preflightEstimate(messages): Promise<{
  estimatedInputTokens: number
  recommendedOutputTokens: number
  recommendedTimeout: number
}>
```

---

## 🚨 트러블슈팅

### 문제: 토큰 예산 초과
```
Error: Token budget exceeded: 52145 > 50000
```
**해결책**: `tokenBudget` 증가 또는 입력 데이터 샘플링

### 문제: 타임아웃 발생
```
Error: Request timeout - automatic retry disabled
```
**해결책**: `recommendedTimeout` 동적 계산 사용, 또는 수동으로 `timeoutMs` 증가

### 문제: JSON 파싱 실패
```
Error: JSON 파싱 실패: Unexpected token
```
**해결책**: 프롬프트에 JSON 형식 강조, `stop=["\nEND"]` 확인

### 문제: 중복 요청 차단
```
Error: 이미 처리 중인 분석이 있습니다 (Job ID: xxx)
```
**해결책**: 기존 Job 완료 대기 또는 취소 후 재시도

---

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- 로그 확인: `backend/logs/`
- 데이터베이스 확인: `SELECT * FROM analysis_jobs WHERE status = 'failed'`

---

**마지막 업데이트**: 2025-01-14
**버전**: 1.0.0
**상태**: ✅ 프로덕션 준비 완료
