# PRD: 견적분석 설계서 ↔ 구현 정합성 수정

**프로젝트**: GOI (ZipCheck) 견적 분석 시스템
**작성일**: 2026-02-05
**기준 문서**: `docs/GOI-견적분석시스템-설계기획서.html` (v1.6)
**대상 코드**: 백엔드(`workers/src/services/auto-analysis.ts`) + 프론트엔드(`frontend/src/`)

---

## 1. 배경 및 목적

설계기획서 v1.6과 현재 구현 코드를 전수조사한 결과, **10개 카테고리**에서 불일치가 발견됨.
점수 정확도에 직결되는 P0 항목부터, 리포트 완전성을 위한 P1, 소규모 차이인 P2까지 체계적으로 수정하여
**설계서 = 구현 = 100% 일치** 상태를 달성하는 것이 목표.

---

## 2. 불일치 전수조사 결과

### 2.1 [P0] 면적 보정계수 4개 값 불일치

| 평수 | 설계서 (line 515-524) | 코드 (backend+frontend) | 차이 |
|------|----------------------|------------------------|------|
| 10평 | 1.35 | 1.35 | ✅ |
| **15평** | **1.20** | **1.25** | **+0.05** |
| **20평** | **1.10** | **1.15** | **+0.05** |
| **25평** | **1.03** | **1.08** | **+0.05** |
| **30평** | **1.00** | **1.03** | **+0.03** |
| 34평 | 1.00 | 1.00 | ✅ |
| 40평 | 0.95 | 0.95 | ✅ |
| 50평 | 0.88 | 0.88 | ✅ |

**영향**: 20평 기준 벤치마크가 5% 과대평가됨. 소형 평수에서 "적정"인 견적이 "약간높음"으로 오판될 수 있음.

**수정 대상 파일 (2곳)**:
- `workers/src/services/auto-analysis.ts` line 133 — `AREA_TABLE`
- `frontend/src/lib/adjustments.ts` line 11-20 — `AREA_TABLE`

**수정 내용**:
```
[15, 1.25] → [15, 1.20]
[20, 1.15] → [20, 1.10]
[25, 1.08] → [25, 1.03]
[30, 1.03] → [30, 1.00]
```

---

### 2.2 [P0] 적정가 비교표 포맷 불일치

**설계서 (line 1484-1503)** — "Fair Target Price Table":

| 항목 | 현재 견적가 | 적정가 (벤치마크) | 차이 (원) | 판정 |
|------|-----------|-----------------|----------|------|
| 바닥재 | 4,200,000 | 3,850,000 | +350,000 | 약간높음 |
| 합계 | 42,000,000 | 39,550,000 | +2,450,000 | B |

**현재 구현 (AnalysisResultView.tsx line 401-442)**:

| 카테고리 | 항목명 | 견적 단가 | 벤치마크 | 보정 후 | 편차(%) |
|---------|--------|----------|---------|--------|--------|

**차이점**:
1. 설계서는 **총액(단가×수량)** 기준 비교 → 코드는 **단가** 기준 비교
2. 설계서는 **원 단위 차이** 표시 → 코드는 **%(편차율)** 만 표시
3. 설계서는 **합계 행** 포함 → 코드에 없음
4. 설계서는 **"절감 가능 금액: X원"** ROI 배지 → 코드에 없음

**수정 대상 파일**:
- `frontend/src/components/analysis/AnalysisResultView.tsx` — 벤치마크 비교 테이블 섹션
- 프론트엔드 `AnalyzedItem` 인터페이스에 `original_quantity`, `original_unit` 추가 필요

**수정 내용**:
- 테이블 컬럼: `항목 | 현재 견적가(총액) | 적정가(벤치마크 총액) | 차이(원) | 판정`
- 총액 = `original_unit_price × original_quantity` (단가×수량)
- 적정가 총액 = `adjusted_benchmark_price × original_quantity`
- 차이 = 견적 총액 - 적정가 총액 (원 단위)
- 합계 행 추가 (전체 견적 총액 vs 전체 적정가 총액)
- ROI 배지: "절감 가능 금액: X원" (차이 합계가 양수일 때)

---

### 2.3 [P0] 단위 Hard Gate 미구현

**설계서 (line 493-506)** — Section 3-3:
```
비교 전 단위 검증:
- customerUnit !== benchmarkUnit이면
  - 변환 가능(㎡↔평, m↔cm): 변환 후 비교
  - 변환 불가(㎡ vs 식, 개 vs LOT): 비교 차단, HIGH_UNCERTAINTY
  - 리포트에 "단위가 달라 직접 비교 불가" 표기
```

**현재 구현**: `findBenchmark()` (auto-analysis.ts line 317-344)가 단위를 완전히 무시하고 카테고리만 매칭.
→ "식" 단가와 "㎡" 단가를 그대로 비교하여 잘못된 편차 발생 가능.

**수정 대상 파일**:
- `workers/src/services/auto-analysis.ts` — 항목 분석 루프 (line 506-560) 내 벤치마크 비교 전

**수정 내용**:
1. 단위 호환성 검증 함수 추가: `isUnitCompatible(customerUnit, benchmarkUnit)`
2. 변환 가능 단위 쌍 정의: `{ '㎡': '평', 'm': 'cm', 'm²': '㎡' }` 등
3. 변환 불가 시: `deviation_percent = null`, `confidence = 0.2`, 별도 플래그 `unit_mismatch: true`
4. AnalyzedItem 인터페이스에 `unit_mismatch: boolean` 추가
5. 프론트엔드 리포트에서 `unit_mismatch === true`인 항목에 "단위 불일치 — 직접 비교 불가" 표시

---

### 2.4 [P1] 고위험 공종 목록 불일치

**설계서 (line 604, 1655-1656)**:
> 고위험 공종: **확장/배관/전기/방수** (발코니 확장, 주배관 교체, 전기 분전반, 방수)

**현재 코드**:
- `auto-analysis.ts` line 397: `['전기', '욕실', '주방']`
- `scoring.ts` line 131: `['전기', '욕실', '주방']`

**수정 대상 파일 (2곳)**:
- `workers/src/services/auto-analysis.ts` line 396-398
- `frontend/src/lib/scoring.ts` line 130-132

**수정 내용**:
```typescript
// 변경 전
['전기', '욕실', '주방']

// 변경 후 — 설계서 기준
// '확장'은 별도 std_category가 아니므로 아이템명 기반 감지 필요
// 일단 std_category 기반으로 매핑 가능한 것만:
// 전기 → '전기', 방수 → 별도 감지 필요
// 확장/배관은 항목명 키워드 매칭으로 처리

// 접근 방식:
// 1) std_category 기반: ['전기']
// 2) 항목명 키워드 기반: ['확장', '배관', '방수', '분전반']
// → 두 조건 OR로 결합
```

**구체적 구현**:
```typescript
const HIGH_RISK_CATEGORIES = ['전기']
const HIGH_RISK_KEYWORDS = ['확장', '배관', '방수', '분전반', '방수공사']

const highRiskItems = items.filter(i => {
  const cat = i.std_category || ''
  const name = (i.original_item_name || '') + (i.original_category || '')
  return HIGH_RISK_CATEGORIES.includes(cat) ||
    HIGH_RISK_KEYWORDS.some(kw => name.includes(kw))
})
```

---

### 2.5 [P1] 현장확인 조건부 패널티 미구현

**설계서 (line 605)**:
> 현장확인 조건부 패널티: "현장 후 확정" 항목 -2점/건

**현재 구현**: 완전 미구현

**수정 대상 파일**:
- `workers/src/services/auto-analysis.ts` — `calculatePenalties()` 함수 내
- `frontend/src/lib/scoring.ts` — `calculatePenalties()` 함수 내 (동기화)

**수정 내용**:
```typescript
// 현장확인 조건부 패널티 (v1.2)
const siteConfirmKeywords = ['현장', '확정', '현장확인', '방문 후', '실측 후']
const siteConfirmItems = items.filter(i => {
  const notes = (i.notes || '') + (i.specification || '') + (i.original_item_name || '')
  return siteConfirmKeywords.some(kw => notes.includes(kw))
})
if (siteConfirmItems.length > 0) {
  penalties.push({
    type: 'site_confirm_conditional',
    label: '현장확인 조건부',
    points: -2 * siteConfirmItems.length,
    reason: `${siteConfirmItems.length}건의 "현장 후 확정" 조건부 항목`,
  })
}
```

**참고**: 백엔드 QuoteItem 인터페이스(auto-analysis.ts line 88-103)에 이미 `notes`, `specification` 필드 있음.
프론트엔드 scoring.ts의 AnalysisItem 타입에도 해당 필드 확인 필요.

---

### 2.6 [P1] 누락 리포트 섹션 (6개)

**설계서 (line 1458-1475)** 15개 섹션 중 현재 미구현 목록:

| # | 섹션명 | 설계서 라인 | 우선순위 | 구현 방식 |
|---|--------|-----------|---------|----------|
| 3 | 주요 발견 (긍정/부정/주의) | 1462 | P1 | 보너스→긍정, 패널티→부정, 경고→주의 자동 분류 |
| 4 | 비용 절감 포인트 | 1463 | P1 | 편차 양수 항목 → "적정가로 조정 시 X원 절감" |
| 9 | VAT 상태 | 1468 | P2 | is_vat_included 값 표시 (미확인 시 경고) |
| 10 | 견적 완전성 | 1469 | P2 | completeness 값 표시 + 누락 의심 항목 |
| 12 | 안전 결제 스케줄 | 1471, 1506-1519 | P1 | 정적 UI (계약금10%→착공30%→중간30%→준공20%→하자10%) |
| 14 | 데이터 출처 푸터 | 1473 | P1 | "경기도 34평 기준 N건 검증 데이터 기반" |

**수정 대상 파일**:
- `frontend/src/components/analysis/AnalysisResultView.tsx`

**구현 상세**:

#### 2.6.1 주요 발견 섹션
```
긍정: 보너스 항목 → "투명성이 높은 견적입니다" 등
부정: 패널티 항목 → "미분류 항목이 X건 있습니다" 등
주의: dump_risk, under_quantity 등 경고성 항목
```

#### 2.6.2 비용 절감 포인트
```
편차가 양수(비쌈)인 항목들:
- "바닥재를 적정가로 조정 시 350,000원 절감 가능"
- "총 절감 가능 금액: 2,450,000원"
```

#### 2.6.3 안전 결제 스케줄 (정적 UI)
```
계약금 10% (계약 시) → 착공금 30% (철거 완료 시) → 중도금 30% (목공 완료 시)
→ 준공금 20% (입주청소 후) → 하자보수금 10% (입주 1개월 후)
```

#### 2.6.4 데이터 출처 푸터
```
"본 분석은 경기도 34평 기준 N건의 검증된 계약 데이터를 기반으로 산출되었습니다."
(N = benchmarkedItems.length)
```

---

### 2.7 [P2] 연도 보정 공식 불일치

**설계서 (line 538)**: `1 + yearDiff × inflationRate` (단리)
**코드**: `Math.pow(1.04, yearDiff)` (복리)

| 연차 | 설계서 (단리) | 코드 (복리) | 차이 |
|------|-------------|-----------|------|
| 1년 | 1.04 | 1.04 | 0 |
| 2년 | 1.08 | 1.0816 | 0.0016 |
| 3년 | 1.12 | 1.1249 | 0.0049 |
| 5년 | 1.20 | 1.2167 | 0.0167 |

**영향**: 1-2년 차이에서는 무시 가능. 5년 이상 차이 시 1.6% 괴리.

**수정 대상 파일 (2곳)**:
- `workers/src/services/auto-analysis.ts` line 168
- `frontend/src/lib/adjustments.ts` line 64

**수정 내용**:
```typescript
// 변경 전 (복리)
return Math.pow(1.04, yearDiff)

// 변경 후 (단리 — 설계서 기준)
return 1 + yearDiff * 0.04
```

---

### 2.8 [P2] 과대산량 경고 미구현

**설계서 (line 679-682)**:
```
ratio > 1.25 → "수량이 표준 대비 높습니다. 로스율(Loss Rate)을 확인하세요."
flag = "OVER_QUANTITY_WARNING" (감점 없음, 리포트 표시만)
```

**현재 구현**: 과소(ratio < 0.85)만 구현, 과대(ratio > 1.25) 미구현.

**수정 대상 파일**:
- `workers/src/services/auto-analysis.ts` — `calculatePenalties()` 내 수량-면적 루프
- `frontend/src/lib/scoring.ts` — 동일 위치
- `frontend/src/components/analysis/AnalysisResultView.tsx` — 경고 배너 추가

**수정 내용**: 설계서에서는 **감점 없이 리포트 경고만** 표시.
```typescript
if (ratio > 1.25) {
  // 감점 없이 경고만 — penalties가 아닌 별도 warnings 배열 또는 0점 패널티
  penalties.push({
    type: 'over_quantity',
    label: `${cat} 수량 과다`,
    points: 0,  // 감점 없음
    reason: `${item.std_item || cat}: 수량 ${item.original_quantity}㎡ vs 예상 ${Math.round(expectedQty)}㎡ — 로스율 확인 필요`,
  })
}
```

---

### 2.9 [P1] 수량-면적 교차검증 — 페인트 카테고리 누락

**설계서 (line 660-663)**: 바닥, 도배, **페인트** 3개 카테고리 교차검증
**코드**: 바닥, 도배 2개만 구현

**수정 대상 파일 (2곳)**:
- `workers/src/services/auto-analysis.ts` line 430-431
- `frontend/src/lib/scoring.ts` line 166-167

**수정 내용**:
```typescript
// 변경 전
const areaCategories = [
  { cat: '바닥', stdRatio: 1.05 },
  { cat: '도배', stdRatio: 1.15 },
]

// 변경 후 — 설계서 기준
const areaCategories = [
  { cat: '바닥', stdRatio: 1.05 },
  { cat: '도배', stdRatio: 1.15 },
  { cat: '페인트', stdRatio: 1.10 },  // 설계서 line 663
]
```

---

### 2.10 [P0] 프론트엔드 AnalyzedItem 인터페이스 필드 누락

**백엔드 AnalyzedItem (auto-analysis.ts line 53-69)** — 모든 필드 존재:
- `original_quantity`, `original_unit`, `confidence` 포함

**프론트엔드 AnalyzedItem (AnalysisResultView.tsx line 39-51)** — 3개 필드 누락:
- `original_quantity` — 적정가 비교표 총액 계산에 필수
- `original_unit` — 단위 표시, Hard Gate 경고에 필수
- `confidence` — 매칭 신뢰도 표시에 사용

**수정 대상 파일**:
- `frontend/src/components/analysis/AnalysisResultView.tsx` line 39-51

**수정 내용**:
```typescript
interface AnalyzedItem {
  original_category: string | null
  original_item_name: string | null
  original_quantity: number | null   // 추가
  original_unit: string | null       // 추가
  original_unit_price: number | null
  original_total_price: number | null
  std_category: string | null
  std_item: string | null
  benchmark_unit_price: number | null
  adjusted_benchmark_price: number | null
  deviation_percent: number | null
  deviation_bracket: string | null
  is_bundled: boolean
  confidence: number                 // 추가
  unit_mismatch?: boolean            // 추가 (Hard Gate용)
}
```

---

## 3. 구현 순서 (의존성 기반)

### Phase A: 백엔드 데이터 정확도 (P0)

이 단계의 변경은 분석 결과의 정확도에 직결됨. 프론트엔드보다 먼저 수정.

| 순서 | 항목 | 파일 | 설명 |
|------|------|------|------|
| A1 | 면적 보정계수 수정 | auto-analysis.ts | 4개 값 변경 |
| A2 | 연도 보정 단리 변환 | auto-analysis.ts | Math.pow → 단리 공식 |
| A3 | 단위 Hard Gate 구현 | auto-analysis.ts | findBenchmark 전 단위 검증 |
| A4 | 고위험 공종 목록 수정 | auto-analysis.ts | 전기/욕실/주방 → 확장/배관/전기/방수 |
| A5 | 현장확인 패널티 추가 | auto-analysis.ts | "현장 후 확정" 키워드 탐지 |
| A6 | 페인트 교차검증 추가 | auto-analysis.ts | areaCategories에 페인트 추가 |
| A7 | 과대산량 경고 추가 | auto-analysis.ts | ratio > 1.25 경고 (0점) |

### Phase B: 프론트엔드 동기화 (P0)

백엔드와 동일한 로직을 프론트엔드에도 반영.

| 순서 | 항목 | 파일 | 설명 |
|------|------|------|------|
| B1 | 면적 보정계수 수정 | adjustments.ts | 4개 값 변경 (A1과 동일) |
| B2 | 연도 보정 단리 변환 | adjustments.ts | Math.pow → 단리 (A2와 동일) |
| B3 | 고위험 공종 목록 수정 | scoring.ts | A4와 동일 |
| B4 | 현장확인 패널티 추가 | scoring.ts | A5와 동일 |
| B5 | 페인트 교차검증 추가 | scoring.ts | A6와 동일 |

### Phase C: 프론트엔드 UI 개편 (P0-P1)

적정가 비교표 재구현 + 누락 리포트 섹션 추가.

| 순서 | 항목 | 파일 | 설명 |
|------|------|------|------|
| C1 | AnalyzedItem 인터페이스 보강 | AnalysisResultView.tsx | 3+1 필드 추가 |
| C2 | 적정가 비교표 재구현 | AnalysisResultView.tsx | 총액 기준 + 원 차이 + 합계 |
| C3 | 주요 발견 섹션 추가 | AnalysisResultView.tsx | 긍정/부정/주의 |
| C4 | 비용 절감 포인트 추가 | AnalysisResultView.tsx | 편차 양수 항목 절감액 |
| C5 | 안전 결제 스케줄 추가 | AnalysisResultView.tsx | 정적 UI |
| C6 | 데이터 출처 푸터 추가 | AnalysisResultView.tsx | N건 기반 문구 |
| C7 | 단위 불일치 경고 표시 | AnalysisResultView.tsx | unit_mismatch 항목 표시 |
| C8 | 과대산량 경고 배너 추가 | AnalysisResultView.tsx | over_quantity 배너 |

### Phase D: 검증 및 배포

| 순서 | 항목 | 설명 |
|------|------|------|
| D1 | tsc --noEmit | 타입 검증 |
| D2 | vite build | 프론트엔드 빌드 검증 |
| D3 | wrangler deploy | 백엔드 배포 |
| D4 | vercel --prod | 프론트엔드 배포 |
| D5 | 테스트 분석 실행 | 실제 견적 데이터로 분석 결과 확인 |

---

## 4. 수정하지 않는 항목 (Phase 2 이후)

설계서에 명시되어 있지만 Phase 1에서는 구현하지 않는 항목:

| 항목 | 설계서 위치 | 사유 |
|------|-----------|------|
| 유사 사례 비교 (#6) | line 1465 | Phase 2 Feature 가중 검색 필요 |
| 일식 분해 분석 (#7) | line 1466 | Phase 2 자동 De-bundling 필요 |
| 누락 항목 감지 (#5) | line 1464 | 필수 항목 목록 정의 필요 (Phase 2) |
| 협상 스크립트 (#13) | line 1472 | 백분위 계산 데이터 부족 (50건 미만) |
| VAT 상태 (#9) | line 1468 | 백엔드가 항상 false 설정 중 → 데이터 수집 후 |
| 견적 완전성 (#10) | line 1469 | completenessRating 수동 입력 체계 필요 |

---

## 5. 리스크 및 주의사항

### 5.1 프론트/백엔드 동기화
- `scoring.ts`(프론트)와 `auto-analysis.ts`(백엔드)의 스코어링 로직이 **반드시 동일**해야 함
- 하나만 수정하고 다른 쪽을 빠뜨리면 관리자 화면과 자동분석 결과가 상이해짐

### 5.2 기존 분석 데이터
- 이미 완료된 분석 결과의 점수는 변경되지 않음 (DB에 저장된 값)
- 설계서 기준으로 재분석하려면 별도의 재계산 스크립트 필요 (이 PRD 범위 밖)

### 5.3 단위 Hard Gate의 영향
- 기존에 단위 무시하고 매칭되던 항목들이 "비교 불가"로 전환될 수 있음
- benchmarkCoverage가 떨어질 수 있으므로 데이터 부족 경고 임계치 재검토 필요

### 5.4 고위험 공종 변경의 영향
- '욕실', '주방'이 고위험에서 제외됨 → 기존 -15점이 -5점으로 변경
- '확장', '배관', '방수'는 std_category에 없으므로 항목명 키워드 매칭 의존 → false positive 가능성

---

## 6. 성공 기준

1. **모든 보정계수 값이 설계서와 100% 일치** (면적, 연도, 계절, 등급, 지역)
2. **적정가 비교표가 설계서 포맷과 일치** (총액 기준, 원 차이, 합계 행)
3. **단위 Hard Gate 작동** — ㎡ vs 식 비교가 차단되고 리포트에 표시
4. **누락 리포트 섹션 4개 이상 추가** (주요 발견, 비용 절감, 안전 결제, 데이터 출처)
5. **tsc --noEmit + vite build 통과**
6. **양쪽 배포 완료** (Workers + Vercel)
