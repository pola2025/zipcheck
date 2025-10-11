# 페이지 기획 (집첵 프런트엔드)

## 1. 페이지 목록 및 라우팅
| 경로 | 목적 | 설명 |
| --- | --- | --- |
| `/` | 랜딩 페이지 | 집첵 서비스 소개, CTA 유도 |
| `/quote-request` | 견적 분석 의뢰 | 요금/SLA 안내 + 업로드/문의 폼 |
| `/dashboard` (선택) | 고객 결과 확인 (후속) | 분석 결과/히스토리 열람 |

## 2. 페이지 구조 요약
### 2.1 `/` 랜딩
- Hero → ProblemSolution → FeatureGrid → Testimonials → PricingFAQ → CTA/Footer

### 2.2 `/quote-request`
- Hero(짧은) → 요금 요약 → 업로드 프로세스 안내 → ContactForm → FAQ

### 2.3 `/dashboard` (MVP 이후)
- 최근 리포트 카드 → 상태 필터 → 상세 모달 (PDF 다운로드)

## 3. 네비게이션 흐름
- 헤더: 로고 + 메뉴(`서비스 소개`, `의뢰하기`, `로그인`)
- CTA 버튼(`/quote-request`로 이동)
- 푸터: 회사 정보, 문의, 개인정보/약관 링크

## 4. 데이터 연결
- 랜딩의 Pricing/FAQ 데이터 → `apps/web/data/marketing.ts`
- quote-request 폼 제출 → API (POST `/api/quote-request`), SLA 별 메시지
- dashboard → 인증 후 사용, `GET /api/reports`

## 5. 향후 확장
- `/case-studies`: 성공 사례, 블로그 형식
- `/partners`: 제휴사 소개/제안

