# 페이지별 컴포넌트 기획

## 1. `/` 랜딩 페이지
| 섹션 | 컴포넌트 | 설명/Props | 상호작용 |
| --- | --- | --- | --- |
| Hero | `<HeroSection>` | `title`, `subtitle`, `primaryCta`, `secondaryCta`, `stats` | 버튼 hover/focus, scroll CTA |
| ProblemSolution | `<ProblemSolution>` | `items: {type, title, body}` | 스크롤 등장 애니메이션(optional) |
| FeatureGrid | `<FeatureGrid>` + `<FeatureCard>` | `features: {icon, title, description}` | 아이콘 hover, 네온 glow |
| Testimonials | `<TestimonialsCarousel>` | `items`, `onNavigate` | prev/next 버튼, 자동 슬라이드 |
| Trust Logos | `<TrustLogoStrip>` | `logos` | hover opacity 변화 |
| PricingFAQ | `<PricingSection>`, `<PricingCard>`, `<FAQAccordion>` | `plans`, `faqs` | Accordion open state, CTA focus |
| CTA/Footer | `<CTASection>`, `<Footer>` | 재의뢰 CTA, 소셜/약관 링크 | 버튼 focus/hover |

## 2. `/quote-request` 페이지
| 섹션 | 컴포넌트 | 설명/Props | 상호작용 |
| --- | --- | --- | --- |
| Top Hero | `<PageHero>` | `title`, `breadcrumb` | small CTA, anchor links |
| Pricing Summary | `<PricingSummary>` | 요금 플랜 카드 요약 | 플랜 hover, CTA anchor |
| Process Steps | `<ProcessTimeline>` | `steps: {title, description}` | step highlight on hover |
| Form | `<QuoteForm>` | React Hook Form, fields[name,email,type,msg], `onSubmit` | validation, loading state |
| Consent | `<PrivacyNotice>` | 동의 체크박스 | checked 상태 표시 |
| FAQ | `<FAQAccordion>` (공유) | `faqs` | keyboard navigation |

## 3. `/dashboard` (선택)
| 섹션 | 컴포넌트 | 설명/Props | 상호작용 |
| --- | --- | --- | --- |
| Header | `<DashboardHeader>` | 사용자 이름, 로그아웃, CTA | 메뉴 toggle |
| Filters | `<ReportFilterBar>` | 날짜/상태 필터 | filter change event |
| Report List | `<ReportGrid>` + `<ReportCard>` | `reports: {id, title, status, createdAt}` | hover, open modal |
| Detail Modal | `<ReportDetailModal>` | PDF 링크, status badges, actions | close, download |
| Empty State | `<EmptyState>` | 안내 메시지, CTA | 버튼 focus |

