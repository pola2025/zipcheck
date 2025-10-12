import { Button } from 'components/ui/button'
import type { FAQItem, Plan } from 'data/marketing'
import { useState } from 'react'
import FAQAccordion from './FAQAccordion'
import SectionHeading from './SectionHeading'

type PricingSectionProps = {
	plans: Plan[]
	faqs: FAQItem[]
}

// Pricing card with Huly.io-style mouse-following glow effect
function PricingCard({ plan }: { plan: Plan }) {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

	const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		setMousePosition({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		})
	}

	return (
		<article
			onMouseMove={handleMouseMove}
			className='marketing-card relative flex h-full flex-col gap-5 rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-6 py-7 overflow-hidden'
		>
			{/* Mouse-following glow effect */}
			<div
				className='absolute -z-10 flex w-[250px] items-center justify-center transition-transform duration-200 pointer-events-none opacity-30'
				style={{
					transform: `translateX(${mousePosition.x}px) translateY(${mousePosition.y}px) translateZ(0px)`,
					left: '-125px',
					top: '-80px'
				}}
			>
				{/* Green/mint radial gradient for pricing cards */}
				<div
					className='absolute h-[150px] w-[150px]'
					style={{
						background: 'radial-gradient(50% 50% at 50% 50%, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0.25) 50%, rgba(16,185,129,0) 100%)'
					}}
				/>
				{/* Blur effect layer */}
				<div
					className='absolute h-[120px] w-[250px] blur-[25px]'
					style={{
						background: 'radial-gradient(43.3% 44.23% at 50% 49.51%, rgba(16,185,129,0.4) 29%, rgba(16,185,129,0.2) 60%, rgba(16,185,129,0) 100%)'
					}}
				/>
			</div>

			<div className='flex items-start justify-between relative z-10'>
				<div>
					<h3 className='text-lg font-semibold text-foreground'>{plan.name}</h3>
					<p className='text-xs uppercase tracking-[0.35em] text-accent/70'>{plan.period}</p>
				</div>
				{plan.highlighted ? (
					<span className='marketing-chip text-[11px] font-semibold uppercase tracking-[0.35em] text-accent'>
						<span className='marketing-chip__dot' />
						추천
					</span>
				) : null}
			</div>
			<div className='flex items-baseline gap-2 relative z-10'>
				<p className='text-4xl font-semibold text-foreground'>{plan.price}</p>
				<span className='text-sm text-muted-foreground'>/월</span>
			</div>
			<p className='text-sm text-muted-foreground relative z-10'>{plan.description}</p>
			<ul className='marketing-list text-sm text-muted-foreground relative z-10'>
				{plan.features.map(feature => (
					<li key={feature} className='marketing-list__item'>
						<span className='marketing-pulse mt-1' aria-hidden />
						<span>{feature}</span>
					</li>
				))}
			</ul>
			<Button asChild size='lg' className='marketing-glow marketing-cta-gradient mt-5 self-start px-7 py-3 text-base font-semibold relative z-10'>
				<a href='/quote-request'>도입 상담 신청</a>
			</Button>
		</article>
	)
}

export default function PricingSection({ plans, faqs }: PricingSectionProps) {
	return (
		<section
			aria-labelledby='pricing-heading'
			className='marketing-section space-y-12'
		>
			<SectionHeading
				id='pricing-heading'
				eyebrow='Pricing'
			title='비즈니스 규모에 맞춘 단순한 요금제'
			subtitle='복잡한 계약 대신 투명한 월 구독제로 시작하세요. 필요에 따라 맞춤 커스터마이징과 컨설팅 모듈을 추가할 수 있습니다.'
			align='center'
		/>
			<div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
				<div className='grid gap-6 md:grid-cols-2'>
					{plans.map(plan => (
						<PricingCard key={plan.name} plan={plan} />
					))}
				</div>
				<div className='marketing-card rounded-2xl border border-[hsla(var(--glass-border),0.22)] px-6 py-8'>
					<h3 className='text-lg font-semibold text-foreground'>자주 묻는 질문</h3>
					<p className='mt-2 text-sm text-muted-foreground'>
						서비스 구성이나 커스터마이징이 필요하다면 언제든 문의 주세요. 가장 많이 받은 질문을 먼저 안내해 드릴게요.
					</p>
					<FAQAccordion items={faqs} className='mt-6 divide-y divide-white/10' />
				</div>
			</div>
		</section>
	)
}
