# �������� ������Ʈ ��ȹ

## 1. `/` ���� ������
| ���� | ������Ʈ | ����/Props | ��ȣ�ۿ� |
| --- | --- | --- | --- |
| Hero | `<HeroSection>` | `title`, `subtitle`, `primaryCta`, `secondaryCta`, `stats` | ��ư hover/focus, scroll CTA |
| ProblemSolution | `<ProblemSolution>` | `items: {type, title, body}` | ��ũ�� ���� �ִϸ��̼�(optional) |
| FeatureGrid | `<FeatureGrid>` + `<FeatureCard>` | `features: {icon, title, description}` | ������ hover, �׿� glow |
| Testimonials | `<TestimonialsCarousel>` | `items`, `onNavigate` | prev/next ��ư, �ڵ� �����̵� |
| Trust Logos | `<TrustLogoStrip>` | `logos` | hover opacity ��ȭ |
| PricingFAQ | `<PricingSection>`, `<PricingCard>`, `<FAQAccordion>` | `plans`, `faqs` | Accordion open state, CTA focus |
| CTA/Footer | `<CTASection>`, `<Footer>` | ���Ƿ� CTA, �Ҽ�/��� ��ũ | ��ư focus/hover |

## 2. `/quote-request` ������
| ���� | ������Ʈ | ����/Props | ��ȣ�ۿ� |
| --- | --- | --- | --- |
| Top Hero | `<PageHero>` | `title`, `breadcrumb` | small CTA, anchor links |
| Pricing Summary | `<PricingSummary>` | ��� �÷� ī�� ��� | �÷� hover, CTA anchor |
| Process Steps | `<ProcessTimeline>` | `steps: {title, description}` | step highlight on hover |
| Form | `<QuoteForm>` | React Hook Form, fields[name,email,type,msg], `onSubmit` | validation, loading state |
| Consent | `<PrivacyNotice>` | ���� üũ�ڽ� | checked ���� ǥ�� |
| FAQ | `<FAQAccordion>` (����) | `faqs` | keyboard navigation |

## 3. `/dashboard` (����)
| ���� | ������Ʈ | ����/Props | ��ȣ�ۿ� |
| --- | --- | --- | --- |
| Header | `<DashboardHeader>` | ����� �̸�, �α׾ƿ�, CTA | �޴� toggle |
| Filters | `<ReportFilterBar>` | ��¥/���� ���� | filter change event |
| Report List | `<ReportGrid>` + `<ReportCard>` | `reports: {id, title, status, createdAt}` | hover, open modal |
| Detail Modal | `<ReportDetailModal>` | PDF ��ũ, status badges, actions | close, download |
| Empty State | `<EmptyState>` | �ȳ� �޽���, CTA | ��ư focus |

