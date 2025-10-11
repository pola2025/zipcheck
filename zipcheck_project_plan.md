# 집첵 서비스 설계 개요

## 1. 서비스 개요
- 목적: AI와 전문가의 하이브리드 분석으로 인테리어 견적의 불확실성과 정보 비대칭을 해소하고, 투명한 가격·위험 인사이트를 제공한다.
- 핵심 가치
  - AI 시각화(그래프·차트)는 자동 생성, 전문가는 항목 코멘트와 주의사항에 집중
  - 업계 20년 이상 경력을 지닌 전문가가 유통 가격 데이터를 근거로 항목별 코멘트를 제공
  - 데이터 기반 AI 견적 등급 평가(위험/평균/프리미엄 3단계, 신호등 시각화)
  - 현직 전문가의 정성 리뷰(자재·공정·계약·협상 포인트 등 8~10개 항목)
  - SLA 기반 리포트 딜리버리로 신뢰성 확보(Standard/Express/Urgent/Late-Night/Holiday)
- 목표 사용자: 30~40대 아파트 거주자, 이사/리모델링 예정 고객, 제휴 채널 유입 B2B2C 고객.

## 2. 사용자 및 전문가 여정

### 2.1 사용자 페르소나
- **김인테리어(36세)**: 첫 아파트 구매, 야간에 견적 비교로 불안감 해소 필요, 전문 의견 의존도가 높다.
- **제휴 유입 고객**: 부동산·이사 플랫폼에서 제공하는 링크/쿠폰으로 집첵 체험, SLA 기반 빠른 분석 기대.

### 2.2 핵심 여정
1. 온보딩 및 본인 인증 → 주거 형태·평형·공사 범위 입력
2. Select space type (residential or commercial), upload the estimate file, choose an SLA plan, and complete payment.
3. 진행 현황 대시보드에서 SLA 카운트다운·상태 확인
4. 하이브리드 리포트 열람: AI 등급 카드, 위험 플래그, 전문가 코멘트, 협상 가이드
5. PDF 다운로드/공유 → 후기 작성 또는 재의뢰

### 2.3 전문가 콘솔 흐름
1. SLA Priority Queue 기반으로 티켓 자동 할당
2. AI 초안 검토: 항목별 평균 대비 편차, 위험 탐지 결과 확인
3. 정성 코멘트·협상 포인트 입력, 위험 플래그 보강
4. QA 담당자 승인 → 리포트 확정 → SLA 준수 모니터

### 2.4 KPI
- 업로드→결제 전환율, SLA 준수율, 리포트 열람률, 고객 재의뢰·추천율
- 전문가 처리 시간, QA 리오픈율, 위험 플래그 정합성
- 제휴 채널별 전환율, ARPU, SLA별 수익 비중

### 2.5 전문가 운영 정책
- 전문가 풀은 관리자(운영팀)가 직접 선발·등록하며, 외부에서 자유 가입은 허용하지 않는다.
- 전문가는 인테리어 업계 20년 이상 경력을 가진 시공/견적 베테랑으로 구성되며, 유통 가격 데이터를 기반으로 코멘트를 작성한다.
- 관리자 포털에서 전문가의 투입 현황과 SLA 진행 상황만 모니터링하며, 현재 단계에서는 자동 평가나 페널티 제도를 도입하지 않는다.

## 3. 데이터 모델 개요

| 도메인 | 주요 엔터티 | 핵심 속성 |
| --- | --- | --- |
| 사용자 | `users`, `user_profiles` | 역할(role), 연락처, 페르소나 태그, 제휴 채널 |
| 견적 | `estimates` | 업로드 사용자, SLA 주문, 공사 범위, 상태, 원본 파일 |
| 견적 항목 | `estimate_items` | 카테고리(자재/공정/인건비/디자인 등), 수량, 단가, 원본 라인 |
| AI 분석 | `analysis_runs`, `risk_flags`, `analysis_metrics` | 모델 버전, 평균 대비 편차, 위험 점수·설명 |
| 전문가 리뷰 | `expert_reviews`, `review_checklist` | 종합 의견, 협상 포인트, 계약 주의사항, QA 상태 |
| SLA/결제 | `sla_orders`, `payments`, `invoices` | 티어, 약속 시간, 처리 시간, 금액, 결제 영수증 |
| 알림/리포트 | `notifications`, `report_deliveries`, `reports` | 발송 채널, 웹 뷰 URL, PDF 경로, 다운로드 로그 |
| 시장 데이터 | `materials`, `labor_rates`, `market_indexes` | 지역별 단가, 변동 추이, 공급망 정보 |
| 마케팅/제휴 | `content_posts`, `trend_reports`, `b2b_partners`, `referral_channels` | 콘텐츠 유형, 리포트 범주, 제휴 조건 |
| 운영 지표 | `operational_metrics` | SLA 준수율, 자동화율, 처리 시간, 고객 만족도 |

## 4. API 및 모듈 구조

### 4.1 REST API 요약
- **Auth**: `POST /auth/login`, `POST /auth/verify-otp`, `POST /auth/refresh`
- **Estimates**: `POST /estimates`(업로드+S3 사전 서명), `GET /estimates/{id}`, `GET /estimates/{id}/analysis`
- **Expert Review**: `POST /estimates/{id}/expert-review`, `PATCH /estimates/{id}/expert-review`
- **SLA & Billing**: `POST /sla-orders`, `POST /payments/confirm`, `GET /sla-orders/{id}/timeline`
- **Reports**: `GET /reports/{id}`, `GET /reports/{id}/download`, `POST /notifications/send`
- **Data Services**: `GET /materials`, `GET /labor-rates`, `GET /analytics/operations`, `GET /trend-reports`

### 4.2 서비스 모듈
- **Ingestion Service**: 파일 업로드, SLA 분류, 작업 큐 등록
- **AI Worker**: OCR→파싱→등급화→위험 탐지 파이프라인
- **Expert Service**: 전문가 할당, 리뷰 입력, QA 워크플로우
- **Report Composer**: 템플릿 렌더링(PDF/웹), 버전 관리
- **Billing/SLA Service**: 요금 계산, 결제 게이트웨이, SLA 모니터
- **Notification Service**: 알림톡/SMS/이메일 발송, 리마인더
- **Analytics Service**: SLA KPI, 자동화율, B2B 리포트 ETL
- **Content & Partner Service**: 콘텐츠 관리, 제휴 링크/쿠폰 관리

## 5. AI 분석 파이프라인
### 5.1 Space-Type Guidelines
- Analysis pipelines treat residential and commercial projects separately.
- AI baselines, risk thresholds, and expert checklists differ per space type.
- All core tables (`estimates`, `analysis_runs`, `reports`) carry a `space_type` field to keep the two pricing logics isolated.

1. **수집/전처리**: 견적서 업로드 → S3 저장 → Google Vision/AWS Textract로 OCR → 항목 파싱
2. **정량 분석**: 항목 분류 모델, 평형·공종별 평균 대비 편차 계산, 위험 점수 산출
3. **등급화**: 위험/평균/프리미엄 3단계 평가 및 신호등 시각화 데이터 생성
4. **정성 지원**: 전문가에게 위험 플래그, 캠 가격 그래프, 협상 힌트 제공
5. **리포트 합성**: AI 결과 + 전문가 코멘트 → PDF/웹 리포트
6. **피드백 루프**: 분석 데이터→모델 재학습, 개인화 추천, 트렌드 리포트 자동화

## 6. 시스템 아키텍처 및 로드맵
### 6.1 Report Delivery Channels
### 6.2 역할 분리 원칙
- 데이터 시각화(그래프, 비교 차트, 위험 히트맵)는 AI가 자동 생성합니다.
- 전문가는 AI 지표를 참고해 항목 체크와 코멘트, 계약/공정 주의사항, 협상 포인트 서술에 집중합니다.
- 리포트에는 "AI 생성 시각화"와 "전문가 코멘트" 구역을 명확히 구분 표시합니다.

### 6.3 가격 표현 원칙
- 절대 금액 차이를 노출하지 않고, 평균 대비 구간(위험/평균/프리미엄)과 퍼센트 범위로만 안내합니다.
- 예시 표현: "평균 가격대 대비 약 OO% 높은 수준으로, 프리미엄 자재·브랜드 사용 가능성이 높습니다."
- 전문가 코멘트는 자재 품질, 디자인, 공사 마감 등 추가 검증이 필요한 영역을 강조하며 유통망 가격 노출을 피합니다.

### 6.4 저가 견적 경고 및 계약금 가이드
- 평균 대비 현저히 낮은 견적이 감지되면 원가 산정 근거와 누락 항목을 확인하라는 경고 메시지를 표시합니다.
- 동시에 계약금·중도금·잔금 비율이 업계 평균(예: 10%/60%/30%)을 초과하지 않는지 체크리스트로 안내합니다.
- 공사비가 1억 원 이상이면서 저가 견적이 감지된 경우, 건설업 면허 보유 및 보증보험 가입 여부 확인을 의무화한 메시지를 노출합니다.

- SMS/카카오 알림톡/이메일 본문에는 핵심 요약(신호등 등급, 예상 절감·추가 비용, 주요 위험 Top3)만 제공한다.
- 세부 분석은 PDF 리포트로 제공하며, 항목별 그래프·비교표·전문가 코멘트를 시각화한다.
- 웹 리포트는 요약 카드와 PDF 다운로드 링크를 함께 제공해 모바일에서도 빠르게 확인하도록 설계한다.


### 6.1 MVP(2025~2026)
- 백엔드: NestJS(REST) + PostgreSQL + TypeORM, Redis(세션/큐), AWS S3, SQS
- AI: Python(FastAPI), PyTorch/Scikit-learn, OCR SDK, Docker 기반 배치/실시간 워커
- 프런트: Next.js 사용자 포털, React Admin(전문가 콘솔), Tailwind UI
- 인프라: AWS ECS/Fargate 또는 EKS, GitHub Actions CI/CD, CloudWatch+Grafana 모니터링
- SLA/결제: 토스페이먼츠·Stripe 등 결제 게이트웨이 연동, 카카오 알림톡/SMS 발송

### 6.2 확장 단계(2026~2027)
- AI Feature Store 구축, 벡터 검색 기반 개인화 추천
- B2B 트렌드 리포트 API, API Key 발급/제휴 분석 대시보드
- 고객 데이터 플랫폼/CDP 연동, SLA 멀티리전 아키텍처 준비

### 6.3 플랫폼 단계(2027~2028)
- 3D 시뮬레이션/시각화 서비스, 메시징·에스크로, 분쟁 조정 워크플로우
- 멀티테넌트 전문가/운영 콘솔, FinOps 비용 가드레일, 보안 감사 로그 강화

## 7. 후속 작업 제안
1. 상세 ERD(컬럼 타입, 인덱스)와 권한 매트릭스 도출
2. OpenAPI 스펙 문서화 및 BFF/프런트 계약 확정
3. AI 파이프라인 PoC(샘플 견적 20건 OCR→항목 추출→평균 대비 모델)
4. SLA 결제·알림 구성(게이트웨이 선정, 카카오 알림톡 계약)
5. 전문가 운영 프로세스 매뉴얼 및 QA 체크리스트 정리

## 8. 상세 ERD 개요

| 테이블 | 주요 컬럼 | 설명 / 인덱스 |
| --- | --- | --- |
| `users` | `id (UUID PK)`, `role (enum: customer, expert, qa, admin)`, `email`, `phone`, `password_hash`, `status`, `created_at`, `updated_at` | `role`, `email`, `phone`에 유니크 인덱스. RBAC 적용. |
| `user_profiles` | `user_id (FK users.id)`, `name`, `preferred_contact`, `persona_tag`, `referral_channel_id`, `address`, `housing_type`, `floor_area`, `marketing_opt_in` | `user_id`에 PK, `referral_channel_id` FK. |
| `experts` | `user_id (PK/FK)`, `certifications`, `specialty_tags`, `availability_status`, `avg_response_time` | 전문가 정보 확장, SLA 라우팅에서 `availability_status` 인덱스. |
| `estimates` | `id (UUID PK)`, `user_id`, `sla_order_id`, `status (enum: pending, processing, ready, delivered, archived)`, `housing_type`, `floor_area`, `original_filename`, `file_url`, `uploaded_at`, `submitted_channel`, `notes` | `user_id`, `status`, `uploaded_at` 복합 인덱스. 파일은 S3 키 저장. |
| `estimate_items` | `id (UUID PK)`, `estimate_id`, `line_number`, `category (enum)`, `subcategory`, `description`, `quantity`, `unit`, `unit_price`, `total_price`, `source_text` | `estimate_id` 인덱스. 자재/공정/인건비/디자인/기타 카테고리. |
| `sla_orders` | `id (UUID PK)`, `user_id`, `tier (Standard/Express/Urgent/LateNight/Holiday)`, `price`, `currency`, `request_time`, `promised_time`, `completed_time`, `status (pending, paid, processing, done, cancelled)`, `payment_id`, `timezone` | `user_id`, `tier`, `status`, `promised_time` 인덱스. SLA 준수율 계산. |
| `payments` | `id (UUID PK)`, `user_id`, `sla_order_id`, `provider`, `provider_tx_id`, `amount`, `currency`, `status`, `paid_at`, `receipt_url` | `provider_tx_id` 유니크, `status` 인덱스. |
| `analysis_runs` | `id (UUID PK)`, `estimate_id`, `pipeline_stage (ocr, parsing, scoring, report)`, `model_version`, `status`, `executed_at`, `duration_ms`, `scorecard (JSONB)` | `estimate_id`, `pipeline_stage`, `executed_at` 복합 인덱스. JSONB에 세부 지표 저장. |
| `risk_flags` | `id (UUID PK)`, `analysis_run_id`, `estimate_item_id`, `flag_type (missing_item, underpriced, overpriced, risk_contract, risk_schedule)`, `severity (0~100)`, `message`, `evidence (JSONB)` | `analysis_run_id`, `flag_type` 인덱스. |
| `expert_reviews` | `id (UUID PK)`, `estimate_id`, `reviewer_id`, `summary`, `recommendations`, `risk_summary`, `contract_notes`, `ready_for_publish`, `submitted_at`, `qa_status`, `qa_reviewer_id` | `estimate_id`, `reviewer_id`, `qa_status` 인덱스. |
| `review_checklist_items` | `id`, `expert_review_id`, `category`, `status (ok, attention, critical)`, `comment` | 디테일 체크 포인트. |
| `reports` | `id (UUID PK)`, `estimate_id`, `version`, `title`, `summary_json`, `pdf_url`, `web_view_url`, `generated_at`, `expires_at`, `status` | `estimate_id`, `status` 인덱스. 버전 관리. |
| `report_deliveries` | `id`, `report_id`, `channel (web, email, kakao, sms)`, `delivered_at`, `status`, `metadata` | 발송 로그. |
| `notifications` | `id`, `user_id`, `channel`, `template_id`, `payload`, `sent_at`, `status`, `provider_message_id` | `user_id`, `channel`, `status` 인덱스. |
| `materials` | `id`, `name`, `category`, `supplier`, `unit`, `avg_price`, `price_index`, `region`, `effective_from`, `effective_to` | 지역·카테고리 인덱스. |
| `labor_rates` | `id`, `trade`, `region`, `experience_level`, `avg_hourly_rate`, `last_updated` | 지역·직종 인덱스. |
| `market_indexes` | `id`, `region`, `housing_type`, `floor_band`, `avg_total_cost`, `data_source`, `reported_at` | 시장 평균 비교용. |
| `content_posts` | `id`, `slug`, `title`, `type (blog, video, case)`, `status`, `published_at`, `author_id`, `tags` | 콘텐츠 마케팅 관리. |
| `trend_reports` | `id`, `title`, `region`, `period`, `download_url`, `summary`, `published_at` | B2B 리포트. |
| `b2b_partners` | `id`, `name`, `channel_type`, `contact`, `referral_code`, `terms`, `status`, `created_at` | 제휴 정보. |
| `referral_channels` | `id`, `partner_id`, `name`, `tracking_code`, `landing_url`, `status` | 사용자 유입 트래킹. |
| `operational_metrics` | `id`, `metric_date`, `metric_name`, `value`, `dimension (JSONB)`, `collected_at` | SLA, 자동화율, 고객 만족도 등 집계. |
| `audit_logs` | `id`, `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `metadata`, `created_at` | 보안 감사, 이벤트 소스. |

### 8.1 관계 요약
- `users` 1:N `estimates`, `sla_orders`, `payments`, `notifications`.
- `estimates` 1:N `estimate_items`, `analysis_runs`, `expert_reviews`, `reports`.
- `analysis_runs` 1:N `risk_flags`.
- `expert_reviews` 1:N `review_checklist_items`.
- `reports` 1:N `report_deliveries`.
- `sla_orders` 1:1 `payments`, N:1 `users`, N:1 `estimates`.
- `referral_channels` N:1 `b2b_partners`; `user_profiles.referral_channel_id`로 연결.
- `operational_metrics`는 ETL 결과로 저장하며 다른 테이블과는 논리적 연관.

### 8.2 인덱스/성능 고려
- 분석 조회는 `estimate_id`를 파티션 키로 사용하여 범위 검색 최적화.
- JSONB 필드(`scorecard`, `evidence`, `summary_json`, `dimension`)에는 GIN 인덱스 적용.
- SLA 마감 모니터링을 위해 `sla_orders`에 `promised_time` 기반 B-Tree 인덱스.
- 장기 보관 리포트는 `reports` 테이블을 버전·만료일 기반으로 아카이빙.

### 8.3 ERD 다이어그램 (Mermaid)
```mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ ESTIMATES : submits
    USERS ||--o{ SLA_ORDERS : requests
    USERS ||--o{ PAYMENTS : makes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ EXPERT_REVIEWS : writes

    USER_PROFILES }o--|| REFERRAL_CHANNELS : via
    REFERRAL_CHANNELS }o--|| B2B_PARTNERS : belongs_to

    ESTIMATES ||--o{ ESTIMATE_ITEMS : contains
    ESTIMATES ||--o{ ANALYSIS_RUNS : generates
    ESTIMATES ||--o{ EXPERT_REVIEWS : reviewed_by
    ESTIMATES ||--o{ REPORTS : produces
    ESTIMATES ||--o| SLA_ORDERS : tied_to

    ANALYSIS_RUNS ||--o{ RISK_FLAGS : flags
    EXPERT_REVIEWS ||--o{ REVIEW_CHECKLIST_ITEMS : covers
    REPORTS ||--o{ REPORT_DELIVERIES : delivered_as

    SLA_ORDERS ||--|| PAYMENTS : settled_by
    PAYMENTS ||--o{ AUDIT_LOGS : recorded_in
    REPORTS ||--o{ AUDIT_LOGS : audited_by

    MATERIALS ||--o{ ANALYSIS_RUNS : reference
    LABOR_RATES ||--o{ ANALYSIS_RUNS : reference
    MARKET_INDEXES ||--o{ ANALYSIS_RUNS : reference

    OPERATIONAL_METRICS {
        uuid id
        date metric_date
        string metric_name
        float value
        jsonb dimension
        timestamptz collected_at
    }
```

## 9. OpenAPI 스펙 초안

### 9.1 인증
```yaml
POST /auth/login
  request:
    fields: email | phone, password | otp_request
  responses:
    200: { otp_required: boolean, session_id }
POST /auth/verify-otp
  request: { session_id, otp_code }
  responses:
    200: { access_token, refresh_token, user: { id, role, name } }
POST /auth/refresh
  request: { refresh_token }
  responses:
    200: { access_token, expires_in }
```

### 9.2 견적 업로드 및 상태
```yaml
POST /estimates
  consumes: multipart/form-data
  fields:
    file: 견적서 (PDF, JPG, PNG)
    housing_type, floor_area, project_scope, sla_tier
  responses:
    201: { estimate_id, sla_order_id, upload_url?, status: "pending" }

GET /estimates/{estimateId}
  responses:
    200: {
      id, status, sla_order: {...},
      progress: { stage, percent, eta },
      customer_summary
    }

GET /estimates/{estimateId}/analysis
  responses:
    200: {
      ai_grade: { level: "risk|normal|premium", score },
      cost_comparison: [...],
      risk_flags: [{ id, type, severity, message }],
      metrics: { avg_delta, missing_items, overprice_ratio },
      last_run: { executed_at, model_version }
    }
```

### 9.3 전문가 리뷰/QA
```yaml
GET /expert/queue
  query: { tier?, status? }
  responses:
    200: [{ estimate_id, sla_tier, due_time, summary }]

POST /estimates/{estimateId}/expert-review
  request: {
    summary, recommendations, risk_summary, contract_notes,
    checklist: [{ category, status, comment }],
    visibility: "internal|customer"
  }
  responses: 201 { review_id, status: "submitted" }

PATCH /expert-reviews/{reviewId}
  request: { ready_for_publish, qa_status, qa_comment }
  responses: 200 { status }
```

### 9.4 SLA/결제
```yaml
POST /sla-orders
  request: { estimate_id, tier, payment_method, coupon_code? }
  responses:
    201: { sla_order_id, amount, currency, payment_intent_secret }

POST /payments/confirm
  request: { payment_intent_id }
  responses:
    200: { payment_id, status: "paid", receipt_url }

GET /sla-orders/{slaOrderId}/timeline
  responses:
    200: {
      tier, request_time, promised_time, completed_time,
      checkpoints: [{ stage, timestamp, actor }]
    }
```

### 9.5 리포트/알림
```yaml
GET /reports/{reportId}
  responses:
    200: {
      estimate_id, version, generated_at,
      sections: [...], download_url, share_link
    }

POST /notifications/send
  request: { user_id, channel, template_id, params }
  responses: 202 { notification_id, status: "queued" }
```

### 9.6 데이터/분석
```yaml
GET /materials
  query: { category?, region?, page?, size? }
  responses: 200: { items: [...], meta: { total, page } }

GET /analytics/operations
  query: { from, to, group_by: day|week|month }
  responses:
    200: {
      metrics: [
        { name: "sla_on_time_rate", value, dimension: { tier } },
        { name: "automation_rate", value },
        ...
      ]
    }
```

### 9.7 에러 모델
```yaml
ErrorResponse:
  status: "error"
  code: "VALIDATION_ERROR|AUTH_FAILED|NOT_FOUND|SLA_VIOLATION|PAYMENT_FAILED"
  message: string
  details?: object
```

### 9.8 인증/인가 전략
- OAuth2 password/OTP + refresh 토큰, 내부 서비스 간은 서비스 계정(Client Credentials)
- 역할 기반 스코프: `customer`, `expert`, `qa`, `admin`, `system`
- 모든 API는 `x-request-id`, `x-sla-tier` 헤더로 추적, 감사 로그 기록

## 10. AI 파이프라인 PoC 설계

### 10.1 목표
- 샘플 견적 20~30건으로 OCR→항목 추출→평균 대비 편차 모델의 초기 성능 검증
- 위험 플래그(누락, 저가/고가 이상, 계약/공정 리스크) 탐지 정확도 ≥70%
- 전문가 피드백 루프 설계: 모델 결과와 현업 코멘트 비교

### 10.2 데이터 세트 준비
| 유형 | 규모 | 비고 |
| --- | --- | --- |
| 실물 견적 PDF | 15건 | 다양한 평형/공정, 협력사 제공 |
| 이미지(JPG/PNG) | 5건 | 모바일 촬영본 포함 |
| 표준 계약서/시공 명세 | 5건 | 계약 조건 비교용 |
| 시장 단가 데이터 | 자재 200종, 공정 30종 | 외부 공개 API + 협력사 견적 |

#### 10.2.1 수집 일정 및 역할
- **주차 1**: 협력 시공사/견적 플랫폼으로부터 샘플 확보, NDA·비식별 조항 체결
- **주차 2**: 모바일 촬영 견적 수집(촬영 가이드 제공), 해상도/왜곡 보정
- **주차 3**: 공공데이터/협력사 DB에서 자재·공정 단가 추출 및 정제
- 담당: Data Ops 1명(수집·정제), 파트너 매니저 1명(협력사 커뮤니케이션), 보안 담당 1명(비식별 검토)

#### 10.2.2 비식별화·보안 가이드
- OCR 이전 단계에서 고객명/연락처/주소는 정규식+NER 기반 마스킹, 검수 체크리스트에 기록
- 계약서의 개인 식별 정보는 가명 처리 후 원본은 암호화된 보안 영역에 별도 보관
- PoC용 S3 버킷은 전용 IAM Role과 KMS 암호화, VPC 엔드포인트로 접근 제어
- 접근 로그와 다운로드 기록을 `audit_logs`에 자동 기록해 추적 가능하도록 구성

### 10.3 파이프라인 단계
### 10.3.1 학습·참고 데이터 구성
- 기본 데이터셋: 최근 1년간 수집된 실제 실행 견적서와 주요 자재 유통사 가격 데이터.
- AI 분석 시 위 데이터를 참조하여 평균 단가, 편차 범위, 위험 패턴을 산출하고 실시간 분석에 활용한다.
- 월/분기 단위로 시장 가격과 실행 견적 데이터를 업데이트하여 재학습에 반영한다.

1. **OCR & 전처리**  
   - 라이브러리: Google Vision, Tesseract 비교  
   - 출력: 텍스트 블록, 좌표, 신뢰도  
   - 정규화: 통화/수량/단위 파싱, 한글+숫자 혼합 처리

2. **항목 파싱/정규화**  
   - 모델: Rule-based + CRF/트랜스포머 토큰 분류  
   - 출력: `category`, `description`, `quantity`, `unit_price`, `total_price`  
   - 평가: Precision/Recall(0.8 이상 목표), 수동 레이블과 비교

3. **평균 대비 편차 계산**  
   - 기준: `market_indexes`, `materials`, `labor_rates`  
   - 메트릭: Z-score, 퍼센타일, 지역/평형 교정 값  
   - 출력: `avg_delta`, `percentile_rank`, `recommendation`

4. **위험 탐지 모델**  
   - 알고리즘: Gradient Boosting/Isolation Forest  
   - 특징: 가격 편차, 누락 빈도, 공정 조합 패턴  
   - 평가지표: F1-score(≥0.7), False Positive Rate 제어

5. **리포트 요약 생성**  
   - 템플릿 기반 + LLM 보조(프롬프트 가이드)  
   - 출력: 위험 요약, 협상 포인트 초안, 그래프 데이터

### 10.4 실험/운영 계획
- 실험 환경: Jupyter + MLflow 추적, Docker 컨테이너화
- 버전 관리: `analysis_runs.model_version`으로 파이프라인 버저닝
- 피드백 루프: 전문가가 flag 수용 여부를 체크, 학습 데이터로 회수
- CI/CD: GitHub Actions로 모델 빌드, S3 모델 아티팩트 배포

### 10.5 라벨링 전략
- **정량 라벨**: 항목 카테고리, 수량, 단가, 총액 → Label Studio 프로젝트로 구조화 입력
- **정성 라벨**: 위험 유형(누락/저가/고가/계약/일정)과 심각도(0~100) → 전문가 2인 교차 검토
- **품질 관리**: 20% 표본에 대해 Cohen의 κ ≥ 0.75 목표, 미달 시 가이드 재교육
- **저장 포맷**: JSON Lines(`estimate_id`, `line_number`, `label`, `annotator_id`, `timestamp`, `confidence`)
- **프리라벨링**: 규칙 기반 초기 라벨 생성 후 사람 검수, 수정 로그는 피처 엔지니어링에 활용

### 10.6 성공 기준
- OCR 후 항목 추출 정확도 80% 이상
- 위험 플래그 재현율/정밀도 70% 이상
- 평균 대비 편차 설명이 전문 리뷰의 협상 포인트와 70% 이상 일치
- SLA 기준 Express(24시간) 내 분석 완료를 위한 처리시간 <30분/건

## 11. SLA 결제·알림 로드맵

### 11.1 결제 인프라
- **게이트웨이 후보**: 토스페이먼츠(카드/계좌/간편), Stripe(구독/해외), KG이니시스(대량결제)
- **구성**: 프런트에서 Payment Intent 생성 → 백엔드 검증 → `payments` 기록 → 영수증 발송
- **요금제 매핑**:
  | 티어 | 금액(원) | 처리 시간 SLA | 비고 |
  | --- | --- | --- | --- |
  | Standard | 30,000 | 48시간 | 기본 |
  | Express | 45,000 | 24시간 | +50% |
  | Urgent | 60,000 | 3시간(영업시간) | +100% |
  | Late-Night Urgent | 120,000 | 익일 12시 전 | +300% |
  | Holiday Urgent | 120,000 | 3시간(주말/공휴일) | +300% |

- **향후 과금 확장**: 방문 컨설팅, 추가 견적 비교, B2B 정액제(월간 리포트)

### 11.2 알림 체계
- **채널**: 카카오 알림톡(1차), SMS 대체, 이메일, 앱 푸시(향후)
- **주요 트리거**
  1. 결제 완료 / SLA 카운트다운 시작
  2. 분석 단계 전환(접수→AI→전문가→QA→발송)
  3. SLA 지연 위험 발생 시 사전 안내
  4. 리포트 발송 및 다운로드 링크 제공
  5. 후기 요청, 재의뢰/추천 유도
- **템플릿 관리**: `notifications` 테이블 + 외부 템플릿 ID 매핑, 다국어/정책 버전 관리
- **재시도 정책**: 실패 시 3분/10분/30분 간격 최대 3회, 이후 CS 티켓 생성

### 11.6 SLA 위반 대응 정책
- **지연 감지**: `promised_time - now()`가 0에 근접하면 운영자 및 고객에게 경고 알림 발송, 15분/1시간 기준.
- **보상 기준**: 티어별 SLA를 초과할 경우 자동으로 다음 조치를 적용:
  - Standard/Express: 다음 주문 50% 할인 쿠폰 또는 부분 환불(10%).
  - Urgent/Late-Night/Holiday: 100% 환불 + 추가 쿠폰 (운영 설정값).
- **환불 프로세스**: 결제 시스템에서 자동 환불 API 호출 → 환불 영수증 발송 → `payments` 기록 업데이트.
- **사례 관리**: 지연 원인을 `operational_metrics`에 기록하고, 반복 시 근본 원인(전문가 부족, 데이터 지연 등) 분석.
- **긴급 Escalation**: 야간/주말 SLA 지연 발생 시 온콜 담당자에게 즉시 알림, 30분 내 대응하도록 당직 스케줄 운영.
- **분석 제공 후 환불 제한**: AI·전문가 리포트가 발송된 시점부터는 디지털 분석 서비스 특성상 환불이 불가하며, 이의 제기는 재검토 절차(QA 담당 재확인, 추가 코멘트 제공)로 처리한다.

### 11.3 SLA 모니터링
- `sla_orders.promised_time - now()`로 남은 시간 계산, 15분/1시간 경고 임계치
- SLA 대시보드: 티어별 on-time rate, 평균 처리시간, 지연 사유 로그
- SLA 위반 시 자동 보상/쿠폰 발급 로직 고려(신뢰 확보)

### 11.4 보안·컴플라이언스
- 결제 정보는 게이트웨이에 위임, 서버에는 토큰/마스킹 데이터만 보관
- HTTPS/TLS, 카드정보 비저장, 개인정보 암호화
- 알림 이력과 감사 로그(`audit_logs`) 연동, 고객 동의 내역 관리

### 11.5 실행 체크리스트
- [ ] 토스페이먼츠/Stripe 등 게이트웨이 계약 체결 및 API 키 발급
- [ ] Webhook 엔드포인트 인증서 설치, 서명 검증 로직 구현
- [ ] 결제 실패/부분 승인 시나리오 플로우차트 확정 및 테스트 케이스 작성
- [ ] 알림톡 템플릿 심의(결제 완료, SLA 지연, 리포트 발송) 신청 및 승인 수취
- [ ] SMS 대체 메시지 작성, 발신번호 등록, 스팸 문구 필터링 점검
- [ ] SLA 타이머 모니터링 배치 작업/워커 구성, 경고 슬랙 채널 연결
- [ ] 개인정보 영향평가(PIA) 필요 여부 판단 및 법무 검토
- [ ] 고객 동의/철회 UI 와 연동, 로그 보관 기간 정책 수립
- [ ] 재무팀 정산 프로세스(일별 매출 리포트, 부가세/세금계산서) 합의
- [ ] 비상 대응 매뉴얼: 게이트웨이 장애/알림 서비스 장애 시 우회 절차 마련
### 11.7 ���������ö��̾� �غ� �׸�
- **�̿� ���/�������� ó����ħ**: ������ �м� ���� ȯ�� ����, ������ ���� �Ⱓ, ��3�� ���� ���θ� �����ϰ� ���� üũ�ڽ��� ���� �޴´�.
- **�������� ������(PIA)**: �ΰ� ���� ó�� ������ �����Ͽ� �ʿ� �� ������ ����, ����� ���� ���� ���� ��ȭ.
- **������ �������ı� ��å**: ���� ���� ���ϰ� �м� ����Ʈ ���� �Ⱓ(��: 1��) ����, ���� ���� ��û �� ��� ���� ���� ����.
- **������ ���� ����/���� ��ġ**: Ŭ���� ������ ���� ����, ���� ���� �� ���� ���� ���� ����.
- **������ ���/��� ����**: ������ �뿪 ��࿡ ��� ������å�� ���������� ���� ���� ����.
- **����/���� Ȯ��**: ����� 1�� �̻� ������Ʈ�� �Ǽ��� ���� �� �������� ���� ���ε带 �����ϰ� �ȳ� ���� ����.
- **����/���� ���� ����**: ���� ���� ���� �� ����� �� ��� �뺸 ���μ��� ����, �α׿� ����� �ּ� 1�� ����.
- **���� �α� ����**: `audit_logs`�� ���١����� ����� �����ϰ� ���������� �����Ѵ�.
## 12. ��ǥ �� ������ ���� ����
- **��ȯ �۳�**: �湮 �� �α��� �� ���ε� �� ���� �� ����Ʈ ���� �� ���Ƿ�. �� �ܰ躰 ��ȯ���� `operational_metrics`�� �Ϻ� �����ϰ� ��ú���� �ð�ȭ.
- **SLA ǰ�� ��ǥ**: Ƽ� ó�� �ð�, SLA �ؼ���, �ڵ� ���� �߻� �Ǽ��� �ǽð� �����.
- **���� ��ǥ**: ���� ����/ä�κ� ARPU, ���Ƿ���, ���� ������, ���� ��� �߻���.
- **������ ��Ʈ�����**: ���� ä��, ķ���� �ڵ�, ������ ������ CAC/LTV ����� ���� �̺�Ʈ �±�.
- **������ ����**: ������ ����Ʈ ��ȸ��, ü�� �ı� Ŭ����, �������� ������.
- **���� ü��**: � �� �ְ� ����Ʈ(�ٽ� KPI ���), �濵�� ���� ����Ʈ(�߼�/����/�̽�) �ڵ� ����.
- **������ ����������**: �̺�Ʈ �α� �� ������ �����Ͽ콺 �� BI ��(Tableau/Looker) ����, ��ǥ ���Ǽ� ���� ����.
## 13. ������ �����Ͽ콺 �� BI ������
- **���� ����**: ���ø����̼� �̺�Ʈ �α�, ����/�˸� ����, AI ���������� ����� Kafka �Ǵ� Kinesis�� ����.
- **���� ����**: Amazon Redshift Serverless Ȥ�� Snowflake�� �� ������ �����Ͽ콺�� ����, ����/���� ���̾� �и�(S3 Staging �� DWH).
- **ETL/ELT ����������**: dbt + Airflow(or AWS MWAA)�� �� 1�ð� ��ġ ó��, SLA ��ǥ�� �ǽð� ��Ʈ����(5�� �̸�)���� ����.
- **��Ÿ������/īŻ�α�**: Data Catalog(Glue)�� dbt Docs�� ��/��ǥ ���� ����.
- **BI/��ú���**: Looker Ȥ�� Tableau Cloud�� �/�濵 ��ú��� ����, Self-service�� ����� �� ���̾ ����ȭ.
- **���� ����**: ���� ��� ����(RBAC)�� row-level security�� ���� ������ ���� ����, ���� �α� ����.
- **������ �Ź��ͽ�**: ��ǥ ���Ǽ�(��ȯ��, SLA �ؼ��� ��) ���� ����, �������� ������ ǰ�� ���� üũ����Ʈ �.
