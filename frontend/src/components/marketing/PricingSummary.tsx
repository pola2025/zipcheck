import type { Plan } from 'data/marketing'
import { Button } from 'components/ui/button'

type PricingSummaryProps = {
	plans: Plan[]
}

export default function PricingSummary({ plans }: PricingSummaryProps) {
	return (
		<section className='marketing-section space-y-10'>
			<header className='flex flex-col gap-4'>
				<div className='space-y-3'>
					<span className='marketing-chip text-xs font-semibold uppercase tracking-[0.35em]'>
						<span className='marketing-chip__dot' />
						Pricing Summary
					</span>
					<p className='marketing-section__title'>전체 플랜을 한 번에 비교하세요</p>
					<p className='marketing-section__subtitle'>
						스타트업부터 엔터프라이즈까지, 필요한 기능만 골라 쓸 수 있도록 설계했습니다.
					</p>
				</div>
			</header>
			<div className='grid gap-6 lg:grid-cols-3'>
				{plans.map(plan => (
					<article
						key={plan.name}
						className='marketing-card flex h-full flex-col gap-4 rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-6 py-7'
					>
						<div className='flex items-start justify-between'>
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
						<div className='flex items-baseline gap-1.5'>
							<p className='text-3xl font-semibold text-foreground'>{plan.price}</p>
							<span className='text-xs text-muted-foreground'>/월</span>
						</div>
						<p className='text-sm text-muted-foreground'>{plan.description}</p>
						<ul className='marketing-list text-sm text-muted-foreground'>
							{plan.features.slice(0, 3).map(feature => (
								<li key={feature} className='marketing-list__item'>
									<span className='marketing-pulse mt-1' aria-hidden />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</section>
	)
}
