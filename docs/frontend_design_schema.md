# ����Ʈ���� ������ ��Ű�� (��ý ���� ������)

## 1. ������ ���̷��� ����
- **���**: `apps/web/app/(marketing)/quote-request`
- **���̾ƿ�**: `<main>` �� ���� 6�� ����
  1. Hero
  2. ProblemSolution
  3. FeatureGrid (6 features)
  4. Testimonials & Trust badges
  5. Pricing & FAQ
  6. ContactForm
- **�׸��� �ý���**: `container mx-auto` + Tailwind 12-column ���� �׸���
  - Mobile (�� 360): ���� �÷�, spacing 24
  - Tablet (361~768): 2��, `gap-24`
  - Desktop (�� 1280): 12-column ���̾ƿ�, `gap-32/48`
- **��ū ���**: spacing {4,8,12,16,24,32,48}, `--primary`, `--surface`, `--text`, `--muted`, `--accent`
- **��Ʈ ������**: 0.875rem, 1rem, 1.125rem, 1.25rem, 1.5rem, 2rem, 2.5rem

## 2. ���Ǻ� ������Ʈ ����

### 2.1 Hero
- **�������**
  - `Heading` (H1, 2.5rem, max-width ~75ch)
  - `BodyText` (1rem~1.125rem, 2 ���� ����)
  - `CTAGroup`
    - Primary ��ư (`bg-primary text-white focus:ring-2 focus:ring-primary`)
    - Secondary ��ũ ��ư (`text-primary underline`)
  - `BenefitsList` (������ + �ؽ�Ʈ, spacing 16)
  - `Illustration` (lazy loaded `<Image>`, ����: `loading="lazy"`, `aria-hidden="true"`)
- **���̾ƿ�**: `grid md:grid-cols-2 gap-24 items-center`

### 2.2 Problem?Solution
- **����**: 2�ܰ� ī�� (`ProblemCard`, `SolutionCard`)
- **������**: ����(H2 2rem), ����(1rem), bullet(üũ ������)
- **��ū**: `bg-accent`, `text-muted`, `rounded-12`

### 2.3 FeatureGrid (6��)
- **������Ʈ**: `FeatureItem` (������ 24px, ���� 1.25rem, ���� 1rem)
- **���̾ƿ�**: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-24`
- **������ ���**: `bg-accent text-primary` (���� 48)

### 2.4 Testimonials & �ŷ� ���
- **����**: `TestimonialsCarousel` + `TrustLogos`
- **Testimonials**: ���� ������(5��), ����� �̸�, ª�� ���� 2�� ����
- **TrustLogos**: 4~6�� �ΰ� grayscale (`opacity-70 hover:opacity-90`)
- **ARIA**: `<section aria-labelledby="testimonials-heading">`

### 2.5 Pricing & FAQ
- **PricingCard**
  - ����(H3 1.5rem), ����(2rem), ����(1rem)
  - ���� ���(Spacing 12)
  - CTA ��ư(Primary)
- **FAQAccordion** (Radix `Accordion`)
  - ���� ��ư ��Ʈ 1.125rem, �亯 1rem
  - Keyboard focus, `aria-expanded` �ݿ�

### 2.6 ContactForm
- `Form` + Radix `FormField`
- �ʵ�: �̸�, �̸���, �޽���, üũ�ڽ�(�������� ����)
- ���� �޽���: 0.875rem, `text-destructive`
- Submit ��ư: Primary, loading state (spinner)
- �������� ���� ��ũ(1rem, `text-muted`)

## 3. ����, ���ͷ���, ������ ����

### 3.1 ����/Props ����
| ������Ʈ | �ֿ� props | ���� | ��� |
| --- | --- | --- | --- |
| `Hero` | `title`, `subtitle`, `primaryCta`, `secondaryCta`, `stats` | ��ư hover/focus | CTA focus ring 2px (`ring-primary/40`)
| `ProblemSolution` | `items: {type:"problem"|"solution", title, body}` | none | `aria-live="polite"` X
| `FeatureGrid` | `features: {icon, title, description}` | hover (bg `accent/80`) | ������ `aria-hidden`
| `Testimonials` | `items: {quote, author, role, rating}` | carousel index | SR �ؽ�Ʈ "���� 4.8��" ����
| `PricingFAQ` | `plans`, `faqs` | Accordion open state | Radix Accordion (`type="single" collapsible`)
| `ContactForm` | submit handler | loading, success, error | use React Hook Form + zod ����

### 3.2 ���ټ� ��Ģ
- �� ���� `<section aria-labelledby>`�� ������ heading ���� ����
- ��ư, ��ũ focus ring `outline-none focus-visible:ring-2 focus-visible:ring-primary`
- �� �ʵ�� `aria-invalid`, `aria-describedby` ����
- Testimonials carousel�� SR ���� "����/���� �ı�" ��ư

### 3.3 �����ս� ���
- Hero �̹��� `loading="lazy"`, `decoding="async"`
- `next/image` ��� �� `priority=false`
- �������� `<SvgIcon />` �Ǵ� shadcn `Icon` ����, sprite Ȱ�� ����

### 3.4 ������ ��ū ����
| ��ū | Ȱ�� �� |
| --- | --- |
| `--primary` | CTA ���, ��ũ �ؽ�Ʈ |
| `--surface` | ī�� ���, Form ���� |
| `--text` | ���� �⺻ �ؽ�Ʈ |
| `--muted` | ���� �ؽ�Ʈ, FAQ ���� |
| `--accent` | ī�� ���̶���Ʈ, ������ ��� |
| spacing (4~48) | margin, padding, gap ���� |
| font-scale | Tailwind `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl` ���� |

### 3.5 ������ �ҽ� ����
```ts
const features = [
  { icon: "home", title: "���� ��� ���� ��", description: "���� ���� �����Ϳ� ���� ����/���� ��Ҹ� ��Ƴ��ϴ�." },
  ... // �� 6��
];

const testimonials = [
  { quote: "��ý ���п� �Ƚ��ϰ� ���縦 �����߾��.", author: "��OO", role: "�д� ����" , rating: 4.8 },
];

const plans = [
  { name: "Standard", price: "30,000", description: "48�ð� �м�", features: [...] },
];

const faqs = [
  { question: "�м� �ҿ� �ð���?", answer: "������� SLA �� ���޵˴ϴ�." },
];
```

## 4. ���־� �� & ��Ÿ�� ���̵� (Glassmorphism + Dark Neon)
- **���̽�**: ��ũ ���(`--surface`�� ��ο� ������ ����) ���� ������ ī�� (`bg-surface/70 backdrop-blur`)
- **�׿� �׼�Ʈ**: `--accent`�� �׿� ���/���� �׶��̼����� ���� (`bg-[linear-gradient(135deg,var(--accent)_0%,var(--primary)_100%)]` �� Utility ����)
- **�۶� ȿ��**: ī��/��޿� `border border-white/10 shadow-[0_8px_32px_rgb(15_23_42_/0.35)] rounded-12`
- **Ÿ���� ���**: ���� `text-[#E5E7FF]`, ���� �ؽ�Ʈ�� `text-muted`; ����� `text-white drop-shadow` ����
- **������/��ư**: Primary ��ư�� �׿� �׶��̼� + `hover:bg-primary/80`, Secondary�� �۶� ���� (`bg-white/10 hover:bg-white/20`)
- **��ȣ�ۿ� �� Glow**: focus-visible���� `ring-2 ring-offset-2 ring-accent ring-offset-surface`
- **��� ����**: Hero�� `bg-[radial-gradient(circle_at_top,var(--accent)_0%,transparent_60%)]` �߰� ����
- **��ũ/����Ʈ ���**: �⺻�� ��ũ, ����Ʈ ��� �� ���� `bg-white/60 backdrop-blur`�� ��ȯ
## 5. ���׸��� ���� ���� & ��� ����
- **�÷� �ȷ�Ʈ (������ ��ū ����)**
  - �⺻ ���(`--surface`): #0B1220 (������ ��ũ ���̺�) �� �ǳ� ���� �Ʒ��� ��޽����� �� ������ ǥ��
  - �ֿ� ����Ʈ(`--primary`): #1B65F1 (�׿� ���) + ����(#7C3AED) �׶��̼� �� ����Ʈ/�̷����� ����
  - ����(`--accent`): #20E3B2 (�׿� ��Ʈ) �� ��Ŀ��/������ �۷ο쿡 Ȱ��
  - �ؽ�Ʈ(`--text`): #F8FAFC (ȭ��Ʈ) / `--muted`: #94A3B8 (�� �׷���)
- **���׸��� ���� ��Ƽ��**
  - �������ݼ� ���� �� Glassmorphism ī��, �ݻ籤 ǥ��
  - ���� ����/LED �� ���� ���м��� `border-t border-white/5` + �׿� �۷ο�(�ڽ�������)
  - �÷ξ��÷�/���� ���� �� FeatureGrid���� ī�� �������� ��� ���� ��Ÿ�Ϸ�, ���� 12 ����
- **�̹���/�Ϸ���Ʈ ����**
  - ����� �Ϸ���Ʈ: �ǳ� ������ �׿� ��Ʈ������ ���ߴ� 3D/� ���� ��Ÿ��
  - Testimonials: �� ���� ��� ���׸��� ������ + �� ��������, quote ī�忡 ���� ������
  - Pricing ���� ���: �׸��� ���� + ������ ���� ����(gradient overlay)
- **����ũ�� ����**
  - ��濡 `before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-white/5`�������� LED ���� ����
  - ��ư/�� ��Ŀ�� �� `shadow-[0_0_15px_rgba(32,227,178,0.45)]` �׿� �۷ο� ����
- **Ÿ�����׷��� ����**
  - ���: �ణ�� letter-spacing(0.02em)���� �������� ���׸��� ��ν��� ����
  - ĸ��/���̺�: �빮�� + Ʈ��ŷ(0.08em)���� ���� ���� ���� �� ��Ÿ�� �ݿ�
