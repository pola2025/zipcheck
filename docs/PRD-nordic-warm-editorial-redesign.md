# PRD: ZipCheck Homepage Redesign - Nordic Warm Editorial

**Version**: 1.0
**Date**: 2026-02-03
**Status**: Draft
**Author**: Claude Code Agent
**Approved Design**: `docs/nordic-warm-editorial-final.html`

---

## 1. Overview

### 1.1 목적
ZipCheck 랜딩 페이지를 현재 다크 네온/사이버펑크 테마에서 **Nordic Warm Editorial** 스타일로 전면 리뉴얼한다. 인테리어 견적 분석 서비스의 신뢰감과 전문성을 따뜻하고 편안한 톤으로 전달하는 것이 핵심 목표.

### 1.2 배경
- 현재 테마(다크 + 네온 글로우)는 인테리어 서비스의 따뜻한 이미지와 괴리
- Nordic Warm Editorial 컨셉이 사용자 테스트 및 디자인 리뷰를 통해 최종 확정됨
- 기술 스택은 변경 없이 React + Vite + Tailwind + shadcn/ui 유지

### 1.3 범위
- **In Scope**: 랜딩 페이지 (ZipCheck.tsx) 전면 리디자인, 테마 시스템 변경, 관련 컴포넌트 재작성
- **Out of Scope**: 백엔드 API, 어드민 페이지, 커뮤니티 페이지, 결제/견적 페이지

---

## 2. Design System

### 2.1 Color Palette

```
Forest (Primary)
  50: #F0F5EE   100: #E1EBdd   200: #C3D7BB   300: #8BAF82
  400: #6B9960   500: #4A6741   600: #3D5A35   700: #2E4628
  800: #1F301A   900: #111A0E

Wood (Accent)
  50: #FBF8F4   100: #F5EDE0   200: #EBDBC1
  300: #D4B896   400: #C4956A   500: #A87B4F

Sand (Neutral/Background)
  50: #FEFCF9   100: #FBF7F0   200: #F5F0E8   300: #EDEAE5
  400: #DDD8D0   500: #C4BEB4   600: #9B9588   700: #6B6B6B
  800: #3D3D3D   900: #1A1A1A
```

### 2.2 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| 영문 헤딩 | Outfit | 600-800 | 3.5rem ~ 4.2rem |
| 한글 본문 | Noto Sans KR | 300-700 | 0.875rem ~ 1.25rem |
| 영문 라벨 | Outfit | 500-600 | 0.75rem (tracking-widest, uppercase) |
| 숫자/통계 | Outfit | 700 | 1.875rem ~ 3rem |

### 2.3 Spacing & Layout
- Base grid: 8px
- Max container: `max-w-7xl` (1280px)
- Hero grid: 비대칭 7:5 (md:grid-cols-12, col-span-7 + col-span-5)
- Section padding: `py-24` (96px)
- Card radius: `rounded-2xl` (16px) ~ `rounded-3xl` (24px)

### 2.4 Shadows & Effects
- Card hover: `translateY(-3px)`, `box-shadow: 0 12px 24px rgba(0,0,0,.05)`
- Image card hover: `translateY(-6px)`, `box-shadow: 0 24px 48px rgba(0,0,0,.08)`
- Hero image: `clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%)` (대각선 클리핑)
- Backdrop blur: `backdrop-blur-lg` (네비게이션)

### 2.5 Animation Strategy
- framer-motion 유지하되 **과도한 네온/글로우 제거**
- 스크롤 기반 fade-in/slide-up 애니메이션만 사용
- hover 효과는 `translateY` + `box-shadow` 위주
- `prefers-reduced-motion` 존중

---

## 3. Page Sections & Components

### 3.1 Navigation (`NordicNavigation`)
- Fixed top, `bg-sand-50/85 backdrop-blur-lg`
- 로고 (forest-600 아이콘 + "ZipCheck" Outfit 폰트)
- 메뉴: 서비스, 분석 예시, 요금, 커뮤니티
- CTA 버튼: "견적 분석 신청" (forest-600 배경)

### 3.2 Hero Section (`NordicHero`)
- 비대칭 7:5 그리드
- 좌측 (7col): 서브라벨 + 대형 타이포 + 설명문 + CTA 버튼 2개 + 통계 3개
- 우측 (5col): 대각선 클리핑 인테리어 이미지 + 플로팅 절감액 카드
- **통계**: 3,000+ 누적분석 / 48h 응답보장 / 9.2% 평균절감

### 3.3 Interior Concept Gallery (`ConceptGallery`)
- 이미지 카드 그리드 (3col: 2-span 대형 + 2개 소형)
- 오버레이 그라디언트 + 하단 텍스트
- 카테고리 배지 (glass 스타일)
- **이미지**: 플레이스홀더 → 추후 Gemini AI 생성 이미지 교체

### 3.4 Features Section (`WhyZipCheck`)
- 4열 그리드 카드
- 아이콘 (forest-50 배경, hover시 forest-500 전환)
- 카드: white 배경, sand-300 border, hover 리프트 효과

### 3.5 Quote Example Banner (`QuoteExampleBanner`)
- 전폭 이미지 배너 (forest 오버레이)
- 좌측: 분석 요약 (원본/적정/절감/절감율 카드 4개)
- 우측: 샘플 리포트 카드 (white 배경, 항목별 비교)

### 3.6 Process Section (`ProcessSteps`)
- 4단계 (01~04) 세로 나열
- forest 그라디언트 넘버링 (600 → 500 → 400 → 300)
- 우측 배경: wood 톤 이미지 (반폭)

### 3.7 Style Strip (`StyleStrip`)
- 가로 스크롤 이미지 카드 (5개 스타일)
- flex + overflow-x-auto
- 각 카드: w-72, min-height 360px, 이미지 + 오버레이

### 3.8 Pricing Section (`NordicPricing`)
- 2열 카드 (기본 30,000원 / 빠른 45,000원)
- 추천 배지: forest-600 상단 뱃지
- 체크 리스트 + CTA 버튼

### 3.9 CTA Banner (`CtaBanner`)
- 전폭 forest 배경 + 오버레이
- 중앙 정렬 텍스트 + CTA 버튼 (white 배경, forest 텍스트)

### 3.10 Footer (`NordicFooter`)
- sand-900 다크 배경
- 4열: 소개(2col), 서비스 링크, 고객 지원
- 하단: 사업자 정보, 저작권

---

## 4. Data Model Updates

### 4.1 `marketing.ts` 변경 사항

기존 데이터 구조는 대부분 유지. 추가/변경 필요 항목:

```typescript
// 새로 추가
export type ConceptCard = {
  style: string       // e.g. "모던 내추럴"
  title: string       // e.g. "따뜻한 우드톤 리빙룸"
  description: string
  imagePlaceholder: string  // placeholder class name
  colSpan?: number    // grid span (default 1)
  rowSpan?: number
}

export type StyleCard = {
  name: string
  subtitle: string
  imagePlaceholder: string
}

export type QuoteExampleItem = {
  category: string
  detail: string
  originalPrice?: string
  adjustedPrice?: string
  status: 'overcharged' | 'fair'
}

// heroCopy에 stats 추가
export type HeroStat = {
  value: string
  suffix: string
  label: string
}
```

### 4.2 processSteps 업데이트
현재 4단계 데이터에 `stepNumber` 추가 (01, 02, 03, 04)
설명 텍스트를 와이어프레임 기준으로 조정

---

## 5. Implementation Plan

### Phase 1: Design System Foundation
1. Tailwind config에 forest/wood/sand 색상 추가
2. index.css에 Nordic Warm CSS 변수 설정
3. Google Fonts (Outfit + Noto Sans KR) 추가
4. 공통 CSS 클래스 정의 (hero-img-clip, img-card, overlay 등)

### Phase 2: Core Layout Components
5. `NordicNavigation` 컴포넌트 생성
6. `NordicFooter` 컴포넌트 생성
7. `SectionLabel` 유틸리티 컴포넌트 (영문 라벨 + 제목)

### Phase 3: Section Components
8. `NordicHero` 컴포넌트
9. `ConceptGallery` 컴포넌트
10. `WhyZipCheck` 컴포넌트
11. `QuoteExampleBanner` 컴포넌트
12. `ProcessSteps` 컴포넌트
13. `StyleStrip` 컴포넌트
14. `NordicPricing` 컴포넌트
15. `CtaBanner` 컴포넌트

### Phase 4: Page Assembly & Data
16. marketing.ts 데이터 업데이트/추가
17. ZipCheck.tsx 메인 페이지 조립
18. 기존 immersive 컴포넌트 임포트 제거

### Phase 5: Polish & Images
19. 반응형 디자인 검증 (Mobile/Tablet/Desktop)
20. 접근성 검증 (키보드 내비게이션, ARIA, 색상 대비)
21. Gemini API로 인테리어 컨셉 이미지 생성 (별도 태스크)

---

## 6. Testing Strategy (TDD)

### 6.1 Unit Tests
각 컴포넌트별 테스트 파일:

| Component | Test File | Key Assertions |
|-----------|-----------|----------------|
| NordicNavigation | `__tests__/NordicNavigation.test.tsx` | 메뉴 렌더링, CTA 링크, 스크롤 시 backdrop-blur |
| NordicHero | `__tests__/NordicHero.test.tsx` | 통계 3개 렌더링, CTA 클릭 내비게이션, 반응형 그리드 |
| ConceptGallery | `__tests__/ConceptGallery.test.tsx` | 카드 3개 렌더링, 배지 텍스트, 이미지 영역 |
| WhyZipCheck | `__tests__/WhyZipCheck.test.tsx` | 피처 4개 렌더링, 아이콘 존재, hover 클래스 |
| QuoteExampleBanner | `__tests__/QuoteExampleBanner.test.tsx` | 금액 4개 표시, 리포트 항목 렌더링 |
| ProcessSteps | `__tests__/ProcessSteps.test.tsx` | 4단계 렌더링, 넘버링 01~04 |
| StyleStrip | `__tests__/StyleStrip.test.tsx` | 5개 스타일 카드, 가로 스크롤 컨테이너 |
| NordicPricing | `__tests__/NordicPricing.test.tsx` | 2개 플랜 렌더링, 가격/기간 표시, 추천 배지 |
| CtaBanner | `__tests__/CtaBanner.test.tsx` | CTA 텍스트, 버튼 링크 |
| NordicFooter | `__tests__/NordicFooter.test.tsx` | 사업자 정보, 이메일, 전화번호 |

### 6.2 Integration Tests
- `__tests__/ZipCheckPage.integration.test.tsx`: 전체 페이지 렌더링, 섹션 순서 검증, 내비게이션 동작

### 6.3 Visual Regression (수동)
- 브라우저에서 각 섹션 스크린샷 비교
- 와이어프레임(`docs/nordic-warm-editorial-final.html`)과 실제 구현 대조

### 6.4 Test Tool
- Vitest + @testing-library/react (기존 테스트 인프라 활용)
- jsdom 환경

---

## 7. File Structure

```
frontend/src/
  components/
    nordic/                          # 새 Nordic Warm 컴포넌트
      NordicNavigation.tsx
      NordicHero.tsx
      ConceptGallery.tsx
      WhyZipCheck.tsx
      QuoteExampleBanner.tsx
      ProcessSteps.tsx
      StyleStrip.tsx
      NordicPricing.tsx
      CtaBanner.tsx
      NordicFooter.tsx
      SectionLabel.tsx               # 공통 섹션 라벨
      index.ts                       # barrel export
  data/
    marketing.ts                     # 기존 파일 업데이트 (새 타입/데이터 추가)
  pages/
    Marketing/
      ZipCheck.tsx                   # Nordic 컴포넌트로 교체
  __tests__/
    nordic/                          # Nordic 컴포넌트 테스트
      NordicNavigation.test.tsx
      NordicHero.test.tsx
      ...
    ZipCheckPage.integration.test.tsx
```

---

## 8. Migration Strategy

### 8.1 접근 방식: 병행 운영 후 교체
1. `components/nordic/` 디렉토리에 새 컴포넌트를 독립적으로 개발
2. 기존 `components/immersive/`, `components/marketing/` 코드는 유지
3. 모든 Nordic 컴포넌트 완성 후 ZipCheck.tsx에서 임포트만 교체
4. 검증 완료 후 기존 immersive 컴포넌트 정리 (별도 태스크)

### 8.2 롤백 계획
- Git 브랜치로 관리 (`feature/nordic-warm-redesign`)
- 기존 코드 삭제하지 않고 새 디렉토리에 작성
- 문제 발생 시 ZipCheck.tsx의 임포트만 되돌리면 즉시 복구

---

## 9. Success Criteria

- [ ] 모든 10개 섹션 컴포넌트 구현 완료
- [ ] 와이어프레임(nordic-warm-editorial-final.html)과 시각적 일치
- [ ] 모든 유닛 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 모바일/태블릿/데스크톱 반응형 정상 동작
- [ ] WCAG 2.1 AA 접근성 기준 충족
- [ ] Lighthouse Performance 90+ (이미지 제외)
- [ ] 기존 라우팅/네비게이션 정상 동작

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 이미지 플레이스홀더가 최종 이미지와 크게 다를 수 있음 | Medium | CSS 그라디언트 플레이스홀더로 비율 유지, 이미지 교체는 별도 phase |
| framer-motion 애니메이션 성능 이슈 | Low | 과도한 애니메이션 제거, will-change 최적화 |
| 기존 shadcn/ui 테마와 충돌 | Medium | Nordic 전용 CSS 변수를 :root에 추가, 기존 변수 공존 |
| Outfit 폰트 한글 미지원 | Low | 한글은 Noto Sans KR fallback, 영문만 Outfit 사용 |
