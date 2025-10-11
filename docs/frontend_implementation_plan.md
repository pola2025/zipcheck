# 집첵 프런트엔드 구현 계획 (마케팅/랜딩)

## 참고 문서
- `docs/frontend_design_schema.md`
- `docs/page_plan.md`
- `docs/page_components.md`
- `docs/agent_guidelines.md`

## 1. 공통 작업 구조
- `src/data/marketing.ts`에 랜딩/견적 의뢰 페이지용 정적 데이터 정의
- Tailwind 토큰을 활용한 `marketing-theme` 클래스 추가 (`--surface`, `--primary`, `--accent`, `--muted` 등)
- 공통 컴포넌트: `SectionHeading`, `NeonCard`, `GlowIcon`, `CTAGroup`, `TrustLogoStrip`, `FAQAccordion`
- Radix 기반 아코디언, React Hook Form + Zod 유효성 검증 도입

## 2. `/` 랜딩 페이지 구현 순서
1. **HeroSection**: 히어로 카피, CTA, 베네핏 리스트, 일러스트 플레이스홀더
2. **ProblemSolution**: 문제-해결 비교 카드 2개
3. **FeatureGrid**: 6개 카드 (아이콘, 타이틀, 설명)
4. **Testimonials + TrustLogos**: 캐러셀은 1단계에서는 수동 Prev/Next 및 페이징 처리
5. **PricingFAQ**: 플랜 카드 + 공유 FAQ 아코디언
6. **ContactCTA/Footer**: 견적 의뢰 CTA, 푸터 링크/정책 연결

## 3. `/quote-request` 페이지 구현 순서
1. **PageHero**: 간결한 헤딩 + 브레드크럼/CTA
2. **PricingSummary**: 플랜 카드 요약 (랜딩 플랜 재사용)
3. **ProcessTimeline**: 단계별 안내 (아이콘 + 설명)
4. **QuoteForm**: 이름/이메일/전화/메시지 + 개인정보 동의, 제출 로딩 상태
5. **FAQAccordion**: 랜딩과 공유 데이터를 활용

## 4. 라우팅 및 레이아웃
- `App.tsx` 라우팅 업데이트: `/`, `/quote-request`, `/ai`, `/ai/:id`, `/ai/shared/:id`
- 마케팅 페이지용 레이아웃/헤더/푸터 분리 (`MarketingLayout`)
- 네비게이션: 로고 + 섹션 스크롤 링크 + CTA(견적 의뢰), 로그인 링크 플레이스홀더

## 5. 누락 확인 체크리스트
- [x] 모든 섹션에 `aria-labelledby` 및 적절한 heading 계층 적용
- [x] CTA/폼 컴포넌트에 `focus-visible` 링 적용
- [x] Testimonials 캐러셀 SR 텍스트 및 Prev/Next 버튼 라벨 제공
- [x] Contact/Quote 폼에 Zod 기반 검증 및 에러 메시지 노출
- [x] 신규 의존성(`react-hook-form`, `@hookform/resolvers`, `zod`, `@radix-ui/react-accordion`) 추가 여부 반영
- [x] `/quote-request` 페이지에서 FAQ/플랜 데이터 공유
- [x] Theme 토큰(`--surface`, `--primary`, `--accent`, `--muted`) 적용으로 글라스모픽/네온 스타일 재현

## 6. 테스트 및 QA 가이드
- 자동화
  - `pnpm run test`로 `src/__tests__/marketing.test.ts` 실행 (폼 스키마 및 마케팅 데이터 무결성 검증)
- 수동 확인
  1. `/` 이동 후 헤더 내 해시 네비게이션이 부드럽게 스크롤되는지 확인
  2. 모바일 뷰(DevTools)에서 햄버거 메뉴 열기/이동 시 메뉴가 닫히는지 확인
  3. `/quote-request` 폼에 유효하지 않은 값 입력 시 오류 메시지 검사
  4. 폼 제출 시 성공/실패 토스트 대신 상단 상태 메시지가 표시되는지 확인
  5. 스크린 리더용 "본문으로 바로가기" 링크가 포커스에 노출되는지 확인
