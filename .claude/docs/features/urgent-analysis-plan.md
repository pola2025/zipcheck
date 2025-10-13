# 긴급 분석 요금제 기능 명세서

**상태**: 개발 완료 / 숨김 처리 (추후 오픈 예정)
**작성일**: 2025-10-13
**관련 파일**:
- `frontend/src/pages/PlanSelection.tsx` (Line 201-273)
- `frontend/src/data/marketing.ts` (urgentPlans)

---

## 📋 개요

긴급 분석 요금제는 일반 요금제보다 빠른 SLA를 제공하는 프리미엄 서비스입니다. 심야, 주말, 공휴일에도 견적 분석을 받을 수 있는 옵션을 제공합니다.

## 🎯 기획 의도

### 문제점
- 급하게 시공사를 결정해야 하는 고객의 니즈 존재
- 주말/공휴일에 견적서를 받는 경우 평일까지 기다려야 함
- 심야 시간에 견적서를 검토하고 싶은 고객 존재

### 해결책
- 긴급 분석 요금제 도입
- 시간대/요일별 차등 요금제
- SLA 단축 (2시간 이내 분석 완료)

## 💰 요금 구조

### 1. 긴급 분석 (60,000원)
- **SLA**: 2시간 이내
- **운영시간**: 평일 09:00~18:00
- **특징**:
  - 일반 요금제(24시간) 대비 12배 빠른 분석
  - 최우선 처리
  - 전담 분석가 배정

### 2. 심야 긴급 (120,000원)
- **SLA**: 2시간 이내
- **운영시간**: 평일 18:00~익일 09:00
- **특징**:
  - 야간 전담 팀 운영
  - 24시간 분석 가능
  - 새벽 시공사 미팅 전 분석 가능

### 3. 주말/공휴일 긴급 (120,000원)
- **SLA**: 2시간 이내
- **운영시간**: 주말 및 공휴일 전체
- **특징**:
  - 주말에도 분석 가능
  - 공휴일 지원
  - 휴일 계약 준비 지원

## 🔧 기술 구현

### 프론트엔드 (현재 숨김 처리)

**파일**: `frontend/src/pages/PlanSelection.tsx`

```tsx
// 긴급 요금제 섹션 - 현재 {false &&} 로 숨김 처리
{false && (
  <div className="mb-16">
    <motion.h2 className="text-3xl md:text-4xl font-bold mb-8 text-orange-400">
      긴급 요금제
    </motion.h2>
    {/* ... 긴급 요금제 카드들 ... */}
  </div>
)}
```

**활성화 방법**: `{false && (` 를 `{true && (` 로 변경

### 데이터 구조

**파일**: `frontend/src/data/marketing.ts`

```typescript
export const urgentPlans = [
  {
    name: '긴급 분석',
    price: '60,000원',
    period: '2시간 이내 (평일 09:00~18:00)',
    description: '긴급한 분석이 필요한 경우',
    features: [
      '최우선 분석 처리',
      '2시간 이내 완료',
      '전담 분석가 배정',
      '긴급 문의 대응'
    ]
  },
  {
    name: '심야 긴급',
    price: '120,000원',
    period: '2시간 이내 (평일 18:00~09:00)',
    description: '야간 시간대 긴급 분석',
    features: [
      '심야 전담 팀',
      '24시간 분석 가능',
      '새벽 미팅 대비',
      '긴급 문의 대응'
    ]
  },
  {
    name: '주말/공휴일',
    price: '120,000원',
    period: '2시간 이내 (주말/공휴일)',
    description: '휴일 긴급 분석',
    features: [
      '주말 전담 팀',
      '공휴일 지원',
      '휴일 계약 대비',
      '긴급 문의 대응'
    ]
  }
]
```

### 백엔드 구현 필요사항

#### 1. SLA 추적 시스템
```typescript
// backend/src/services/sla-tracker.ts (미구현)
interface SLAConfig {
  planType: 'basic' | 'fast' | 'urgent' | 'midnight' | 'holiday'
  slaMinutes: number // 60 | 180 | 120
  validFrom: Date
  validUntil: Date
}

// SLA 시간 계산
function calculateSLADeadline(
  submittedAt: Date,
  planType: string
): Date {
  const slaMinutes = getSLAMinutes(planType)
  return new Date(submittedAt.getTime() + slaMinutes * 60 * 1000)
}

// 영업시간 체크
function isWithinBusinessHours(
  date: Date,
  planType: string
): boolean {
  // 긴급: 평일 09:00~18:00
  // 심야: 평일 18:00~09:00
  // 주말/공휴일: 주말 전체
}
```

#### 2. 긴급 요청 큐 시스템
```typescript
// backend/src/services/urgent-queue.ts (미구현)
interface UrgentQueue {
  addUrgentRequest(requestId: string, priority: number): Promise<void>
  getNextUrgentRequest(): Promise<string | null>
  updateQueueStatus(requestId: string, status: string): Promise<void>
}

// 우선순위
// 1 = 심야/주말/공휴일 (최우선)
// 2 = 긴급 (2순위)
// 3 = 일반 (일반 처리)
```

#### 3. 알림 시스템
```typescript
// backend/src/services/urgent-notifications.ts (미구현)
interface UrgentNotification {
  // 슬랙/이메일/SMS 알림
  notifyAnalystTeam(requestId: string, planType: string): Promise<void>

  // SLA 초과 경고
  warnSLABreach(requestId: string, minutesRemaining: number): Promise<void>

  // 완료 알림
  notifyCompletion(requestId: string, customerId: string): Promise<void>
}
```

#### 4. 데이터베이스 스키마 추가
```sql
-- quote_requests 테이블에 추가 필요
ALTER TABLE quote_requests ADD COLUMN plan_type VARCHAR(20);
ALTER TABLE quote_requests ADD COLUMN sla_deadline TIMESTAMPTZ;
ALTER TABLE quote_requests ADD COLUMN sla_status VARCHAR(20); -- 'within_sla', 'breached', 'completed'
ALTER TABLE quote_requests ADD COLUMN urgent_priority INTEGER; -- 1, 2, 3
```

## 🎨 UI/UX 고려사항

### 긴급 요금제 표시 방법
1. **오렌지 계열 색상** 사용 (긴급성 강조)
2. **불타는 효과** 또는 **펄스 애니메이션** 적용
3. **SLA 카운트다운** 실시간 표시
4. **재고 제한** 표시 (동시 처리 가능한 긴급 요청 수 제한)

### 사용자 안내
- "현재 X개의 긴급 슬롯 남음" 표시
- "평균 X분 내 완료" 통계 표시
- "야간/휴일 추가 요금 안내" 명확히 표시

## 📊 비즈니스 고려사항

### 운영 리소스
- **전담 분석가 필요**: 심야/주말 근무자 배치
- **교대 근무 시스템**: 24시간 운영을 위한 3교대 필요
- **긴급 대응 프로세스**: 2시간 내 완료를 위한 최적화된 워크플로우

### 수익성 분석
- 긴급 요금 (60,000원) = 일반 요금 (30,000원) × 2배
- 심야/주말 (120,000원) = 일반 요금 × 4배
- 추가 인건비 고려 시 최소 2배 이상 요금 책정 필요

### 리스크
- **SLA 미달성 시**: 환불 정책 필요
- **동시 긴급 요청 폭주**: 슬롯 제한 또는 대기열 시스템 필요
- **품질 저하 우려**: 빠른 분석이 분석 품질에 영향 없도록 프로세스 최적화 필요

## 🚀 오픈 준비 사항

### Phase 1: 테스트 운영 (2주)
1. 긴급 요금제 UI 공개 (선택 불가)
2. "곧 출시" 배너 표시
3. 베타 신청자 모집

### Phase 2: 베타 오픈 (1개월)
1. 제한된 슬롯으로 오픈 (일 5건)
2. 베타 테스터 대상 할인가 제공
3. 피드백 수집 및 프로세스 개선

### Phase 3: 정식 오픈
1. 전체 기능 활성화
2. 마케팅 캠페인 진행
3. 고객 후기 및 사례 수집

## 🔄 코드 활성화 방법

### 1. PlanSelection.tsx 수정
```tsx
// Line 205: {false && ( 를 {true && ( 로 변경
{true && (
  <div className="mb-16">
    {/* 긴급 요금제 섹션 */}
  </div>
)}
```

### 2. 백엔드 SLA 로직 구현
```bash
# SLA 추적 서비스 생성
npx tsx src/scripts/setup-sla-tracker.ts

# 긴급 큐 시스템 초기화
npx tsx src/scripts/init-urgent-queue.ts
```

### 3. 데이터베이스 마이그레이션
```bash
# 긴급 분석 스키마 추가
npx tsx src/scripts/migrate-urgent-plans.ts
```

### 4. 모니터링 설정
- SLA 달성률 대시보드
- 긴급 요청 처리 시간 통계
- 분석가 워크로드 모니터링

## 📝 참고사항

### 경쟁사 분석
- **오늘의집**: 24시간 내 응답 (무료)
- **집닥**: 48시간 내 응답 (무료)
- **호미파이**: 긴급 상담 (50,000원 추가)

### 차별화 포인트
- **AI 기반 빠른 분석**: 2시간 내 완료
- **24시간 운영**: 심야/주말/공휴일 지원
- **전문가 검증**: AI + 전문가 더블 체크

## ✅ 체크리스트

오픈 전 확인 사항:
- [ ] SLA 추적 시스템 구현
- [ ] 긴급 큐 시스템 구현
- [ ] 알림 시스템 (슬랙/이메일/SMS) 연동
- [ ] 데이터베이스 스키마 마이그레이션
- [ ] 전담 분석가 채용 및 교육
- [ ] 교대 근무 일정 수립
- [ ] SLA 미달성 시 환불 정책 확정
- [ ] 긴급 요청 처리 프로세스 매뉴얼 작성
- [ ] 모니터링 대시보드 구축
- [ ] 베타 테스트 진행
- [ ] 마케팅 자료 준비

---

**마지막 업데이트**: 2025-10-13
**작성자**: Claude (AI Assistant)
**검토 필요**: 제품 팀, 운영 팀, 개발 팀
