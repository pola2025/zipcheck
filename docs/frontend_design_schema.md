# 프런트엔드 디자인 스키마 (집첵 랜딩 페이지)

## 1. 페이지 스켈레톤 개요
- **경로**: `apps/web/app/(marketing)/quote-request`
- **레이아웃**: `<main>` 내 섹션 6개 구성
  1. Hero
  2. ProblemSolution
  3. FeatureGrid (6 features)
  4. Testimonials & Trust badges
  5. Pricing & FAQ
  6. ContactForm
- **그리드 시스템**: `container mx-auto` + Tailwind 12-column 유사 그리드
  - Mobile (≤ 360): 단일 컬럼, spacing 24
  - Tablet (361~768): 2열, `gap-24`
  - Desktop (≥ 1280): 12-column 레이아웃, `gap-32/48`
- **토큰 사용**: spacing {4,8,12,16,24,32,48}, `--primary`, `--surface`, `--text`, `--muted`, `--accent`
- **폰트 스케일**: 0.875rem, 1rem, 1.125rem, 1.25rem, 1.5rem, 2rem, 2.5rem

## 2. 섹션별 컴포넌트 구조

### 2.1 Hero
- **구성요소**
  - `Heading` (H1, 2.5rem, max-width ~75ch)
  - `BodyText` (1rem~1.125rem, 2 문장 제한)
  - `CTAGroup`
    - Primary 버튼 (`bg-primary text-white focus:ring-2 focus:ring-primary`)
    - Secondary 링크 버튼 (`text-primary underline`)
  - `BenefitsList` (아이콘 + 텍스트, spacing 16)
  - `Illustration` (lazy loaded `<Image>`, 적용: `loading="lazy"`, `aria-hidden="true"`)
- **레이아웃**: `grid md:grid-cols-2 gap-24 items-center`

### 2.2 Problem?Solution
- **구조**: 2단계 카피 (`ProblemCard`, `SolutionCard`)
- **콘텐츠**: 제목(H2 2rem), 본문(1rem), bullet(체크 아이콘)
- **토큰**: `bg-accent`, `text-muted`, `rounded-12`

### 2.3 FeatureGrid (6개)
- **컴포넌트**: `FeatureItem` (아이콘 24px, 제목 1.25rem, 본문 1rem)
- **레이아웃**: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-24`
- **아이콘 배경**: `bg-accent text-primary` (원형 48)

### 2.4 Testimonials & 신뢰 요소
- **구조**: `TestimonialsCarousel` + `TrustLogos`
- **Testimonials**: 별점 아이콘(5점), 사용자 이름, 짧은 문장 2줄 이하
- **TrustLogos**: 4~6개 로고 grayscale (`opacity-70 hover:opacity-90`)
- **ARIA**: `<section aria-labelledby="testimonials-heading">`

### 2.5 Pricing & FAQ
- **PricingCard**
  - 제목(H3 1.5rem), 가격(2rem), 설명(1rem)
  - 혜택 목록(Spacing 12)
  - CTA 버튼(Primary)
- **FAQAccordion** (Radix `Accordion`)
  - 질문 버튼 폰트 1.125rem, 답변 1rem
  - Keyboard focus, `aria-expanded` 반영

### 2.6 ContactForm
- `Form` + Radix `FormField`
- 필드: 이름, 이메일, 메시지, 체크박스(개인정보 동의)
- 검증 메시지: 0.875rem, `text-destructive`
- Submit 버튼: Primary, loading state (spinner)
- 개인정보 고지 링크(1rem, `text-muted`)

## 3. 상태, 인터랙션, 데이터 매핑

### 3.1 상태/Props 설계
| 컴포넌트 | 주요 props | 상태 | 비고 |
| --- | --- | --- | --- |
| `Hero` | `title`, `subtitle`, `primaryCta`, `secondaryCta`, `stats` | 버튼 hover/focus | CTA focus ring 2px (`ring-primary/40`)
| `ProblemSolution` | `items: {type:"problem"|"solution", title, body}` | none | `aria-live="polite"` X
| `FeatureGrid` | `features: {icon, title, description}` | hover (bg `accent/80`) | 아이콘 `aria-hidden`
| `Testimonials` | `items: {quote, author, role, rating}` | carousel index | SR 텍스트 "별점 4.8점" 제공
| `PricingFAQ` | `plans`, `faqs` | Accordion open state | Radix Accordion (`type="single" collapsible`)
| `ContactForm` | submit handler | loading, success, error | use React Hook Form + zod 검증

### 3.2 접근성 규칙
- 각 섹션 `<section aria-labelledby>`와 적절한 heading 계층 유지
- 버튼, 링크 focus ring `outline-none focus-visible:ring-2 focus-visible:ring-primary`
- 폼 필드는 `aria-invalid`, `aria-describedby` 지정
- Testimonials carousel는 SR 전용 "이전/다음 후기" 버튼

### 3.3 퍼포먼스 고려
- Hero 이미지 `loading="lazy"`, `decoding="async"`
- `next/image` 사용 시 `priority=false`
- 아이콘은 `<SvgIcon />` 또는 shadcn `Icon` 래퍼, sprite 활용 가능

### 3.4 디자인 토큰 대응
| 토큰 | 활용 예 |
| --- | --- |
| `--primary` | CTA 배경, 링크 텍스트 |
| `--surface` | 카드 배경, Form 영역 |
| `--text` | 본문 기본 텍스트 |
| `--muted` | 보조 텍스트, FAQ 설명 |
| `--accent` | 카드 하이라이트, 아이콘 배경 |
| spacing (4~48) | margin, padding, gap 통일 |
| font-scale | Tailwind `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl` 매핑 |

### 3.5 데이터 소스 예시
```ts
const features = [
  { icon: "home", title: "실측 기반 견적 비교", description: "실제 견적 데이터와 비교해 과대/과소 요소를 잡아냅니다." },
  ... // 총 6개
];

const testimonials = [
  { quote: "집첵 덕분에 안심하고 공사를 진행했어요.", author: "김OO", role: "분당 거주" , rating: 4.8 },
];

const plans = [
  { name: "Standard", price: "30,000", description: "48시간 분석", features: [...] },
];

const faqs = [
  { question: "분석 소요 시간은?", answer: "요금제별 SLA 내 전달됩니다." },
];
```

## 4. 비주얼 톤 & 스타일 가이드 (Glassmorphism + Dark Neon)
- **베이스**: 다크 배경(`--surface`를 어두운 색으로 설정) 위에 반투명 카드 (`bg-surface/70 backdrop-blur`)
- **네온 액센트**: `--accent`를 네온 블루/퍼플 그라데이션으로 지정 (`bg-[linear-gradient(135deg,var(--accent)_0%,var(--primary)_100%)]` 등 Utility 구성)
- **글라스 효과**: 카드/모달에 `border border-white/10 shadow-[0_8px_32px_rgb(15_23_42_/0.35)] rounded-12`
- **타이포 대비**: 본문 `text-[#E5E7FF]`, 보조 텍스트는 `text-muted`; 헤딩은 `text-white drop-shadow` 적용
- **아이콘/버튼**: Primary 버튼은 네온 그라데이션 + `hover:bg-primary/80`, Secondary는 글라스 느낌 (`bg-white/10 hover:bg-white/20`)
- **상호작용 시 Glow**: focus-visible에서 `ring-2 ring-offset-2 ring-accent ring-offset-surface`
- **배경 패턴**: Hero에 `bg-[radial-gradient(circle_at_top,var(--accent)_0%,transparent_60%)]` 추가 가능
- **다크/라이트 모드**: 기본은 다크, 라이트 모드 시 투명도 `bg-white/60 backdrop-blur`로 전환
## 5. 인테리어 연계 색상 & 요소 컨셉
- **컬러 팔레트 (디자인 토큰 매핑)**
  - 기본 배경(`--surface`): #0B1220 (심플한 다크 네이비) → 실내 조명 아래의 고급스러운 밤 분위기 표현
  - 주요 포인트(`--primary`): #1B65F1 (네온 블루) + 퍼플(#7C3AED) 그라데이션 → 스마트/미래지향 느낌
  - 보조(`--accent`): #20E3B2 (네온 민트) → 포커스/아이콘 글로우에 활용
  - 텍스트(`--text`): #F8FAFC (화이트) / `--muted`: #94A3B8 (쿨 그레이)
- **인테리어 연상 모티브**
  - 유리·금속 질감 → Glassmorphism 카드, 반사광 표현
  - 라인 조명/LED → 섹션 구분선에 `border-t border-white/5` + 네온 글로우(박스쉐도우)
  - 플로어플랜/공간 분할 → FeatureGrid에서 카드 아이콘을 평면 도면 스타일로, 라운드 12 유지
- **이미지/일러스트 방향**
  - 히어로 일러스트: 실내 공간을 네온 스트립으로 비추는 3D/등각 투시 스타일
  - Testimonials: 고객 사진 대신 인테리어 스냅샷 + 블러 오버레이, quote 카드에 유리 프레임
  - Pricing 섹션 배경: 그리드 패턴 + 은은한 라인 조명(gradient overlay)
- **마이크로 패턴**
  - 배경에 `before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-white/5`형식으로 LED 라인 연출
  - 버튼/폼 포커스 시 `shadow-[0_0_15px_rgba(32,227,178,0.45)]` 네온 글로우 적용
- **타이포그래피 감성**
  - 헤딩: 약간의 letter-spacing(0.02em)으로 현대적인 인테리어 브로슈어 느낌
  - 캡션/레이블: 대문자 + 트래킹(0.08em)으로 공간 설계 도면 라벨 스타일 반영
