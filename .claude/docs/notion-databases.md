# Notion 데이터베이스 구조

ZipCheck 프로젝트는 **2개의 독립적인 Notion 데이터베이스**를 사용합니다.

---

## 1️⃣ ZipCheck 개발 로그 (Dev Log)

### 📍 정보
- **Database ID:** `28cd286a320981bfa4aefbb746b3adef`
- **환경 변수:** `NOTION_DATABASE_ID`
- **URL:** https://www.notion.so/28cd286a320981bfa4aefbb746b3adef

### 🎯 목적
개발팀의 작업 내역, 기능 구현, 버그 수정 등 **개발 활동**을 기록

### 📝 기록 내용
- 새로운 기능 구현
- 버그 수정
- 시스템 개선
- 배포 내역
- 기술 결정 사항

### 🔧 사용 함수
```typescript
import { logToNotion } from '../services/notion-log'

await logToNotion({
  title: '작업 제목',
  category: '구현' | '버그수정' | '개선' | '배포',
  description: '작업 설명',
  details: ['상세 내용...'],
  codeChanges: [{ file: '파일경로', summary: '변경 요약' }],
  author: 'Claude Code',
  timestamp: new Date()
})
```

### 📂 스키마
- **제목** (Title)
- **카테고리** (Select): 구현, 버그수정, 개선, 배포, 기타
- **작성자** (Text)
- **일시** (Date)
- **설명** (Rich Text)

### 📌 기록 예시
- "집첵고객여정DB 구현 완료"
- "결제 시스템 Toss Payments 연동"
- "관리자 페이지 성능 최적화"
- "프로덕션 배포 - v2.1.0"

### ⏰ 기록 시점
**수동**: 개발자가 작업 완료 시 스크립트 실행으로 기록

---

## 2️⃣ ZipCheck 고객여정DB (Customer Journey Log)

### 📍 정보
- **Database ID:** `28cd286a32098138bd0df11e83f10fb6`
- **환경 변수:** `NOTION_CUSTOMER_REQUEST_DB_ID`
- **URL:** https://www.notion.so/28cd286a32098138bd0df11e83f10fb6

### 🎯 목적
실제 고객의 활동과 요청사항을 실시간으로 추적 및 기록

### 📝 기록 내용
- 고객 결제 완료
- 견적 신청 접수
- 도면/GPT 분석 완료
- 견적 발송 (웹 조회, SMS, 이메일)

### 🔧 사용 함수
```typescript
import {
  logPaymentComplete,
  logQuoteRequest,
  logAnalysisComplete,
  logQuoteDelivery
} from '../services/notion-customer-log'

// 1. 결제 완료 시
await logPaymentComplete({
  orderId: string,
  planType: string,
  amount: number,
  customerName?: string
})

// 2. 견적 신청 시
await logQuoteRequest({
  quoteRequestId: number,
  customerName: string,
  customerPhone?: string,
  propertyInfo: string,
  amount: number,
  itemCount: number
})

// 3. 분석 완료 시
await logAnalysisComplete({
  quoteRequestId: number,
  customerName: string,
  analysisType: '도면분석' | 'GPT분석',
  totalAmount?: number,
  overallScore?: number,
  status: 'succeeded' | 'failed'
})

// 4. 견적 발송 시
await logQuoteDelivery({
  quoteRequestId: number,
  customerName: string,
  customerPhone?: string,
  deliveryMethod: 'web' | 'sms' | 'email' | 'api',
  overallScore?: number,
  totalAmount?: number
})
```

### 📂 스키마
- **제목** (Title)
- **요청타입** (Select): 견적신청, 결제완료, 도면분석, GPT분석, 견적발송, 기타
- **고객명** (Text)
- **연락처** (Phone)
- **매물정보** (Text)
- **금액** (Number)
- **상태** (Select): 신규, 처리중, 완료, 취소
- **일시** (Date)
- **견적ID** (Number)

### 📌 기록 예시
- "견적 신청 - 홍길동 (서울시 강남구 아파트)"
- "결제 완료 - 50,000원 (베이직 플랜)"
- "GPT 분석 완료 - 점수 85 (견적 #1234)"
- "견적 발송 - 웹 조회 (견적 #1234)"

### ⏰ 기록 시점
**자동**: 고객 행동 발생 시 즉시 자동 기록 (API 엔드포인트 내부에서)

---

## 🔄 고객 여정 플로우와 로깅

```
💳 고객이 결제
   ↓
   [자동 기록] → 고객여정DB: "결제완료" (green)
   ↓
📝 고객이 견적 신청
   ↓
   [자동 기록] → 고객여정DB: "견적신청" (blue)
   ↓
🔍 관리자가 분석 수행
   ↓
   [자동 기록] → 고객여정DB: "도면분석" (purple)
   [자동 기록] → 고객여정DB: "GPT분석" (pink)
   ↓
📤 고객이 견적 조회
   ↓
   [자동 기록] → 고객여정DB: "견적발송" (yellow)
```

**개발 로그는 이 플로우와 무관합니다.**

---

## 📊 데이터 흐름 비교

| 구분 | 개발 로그 | 고객여정DB |
|------|-----------|------------|
| **목적** | 개발 작업 추적 | 고객 활동 추적 |
| **기록 주체** | 개발자 | 시스템 (자동) |
| **기록 시점** | 작업 완료 시 수동 | 고객 행동 시 자동 |
| **기록 빈도** | 낮음 (주 1-5회) | 높음 (하루 수십-수백회) |
| **사용자** | 개발팀 | 운영팀, CS팀 |
| **예시** | "결제 시스템 개선" | "홍길동님 결제 완료" |

---

## 🔗 관련 파일

### 개발 로그
- `backend/src/services/notion-log.ts` - logToNotion()
- `backend/src/scripts/log-*.ts` - 개발 로그 기록 스크립트

### 고객여정DB
- `backend/src/services/notion-customer-log.ts` - 4개 로깅 함수
- `backend/src/routes/quote-requests.ts` - 자동 로깅 통합

---

## 🔐 환경 변수

**backend/.env:**
```bash
# Notion API Key
NOTION_API_KEY=your_notion_api_key_here

# 개발 로그 Database ID
NOTION_DATABASE_ID=28cd286a320981bfa4aefbb746b3adef

# 고객여정DB Database ID
NOTION_CUSTOMER_REQUEST_DB_ID=28cd286a32098138bd0df11e83f10fb6
```

**참고:**
- API 키는 `.env` 파일에만 저장하고 Git에 커밋하지 마세요
- 두 DB 모두 같은 API 키를 사용하지만, Database ID는 다릅니다

---

## ✅ 요약

1. **개발 로그** = 개발자가 수동으로 기록하는 작업 일지
2. **고객여정DB** = 고객 행동 시 시스템이 자동으로 기록하는 활동 로그
3. **완전히 별개의 DB**이며, 용도와 기록 방식이 다릅니다.

---

**작성일:** 2025-10-14
**작성자:** Claude Code
