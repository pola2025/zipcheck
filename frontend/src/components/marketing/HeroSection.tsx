import CTAGroup from 'components/marketing/CTAGroup'
import type { Benefit, CTA } from 'data/marketing'
import { cn } from 'lib/utils'
import {
	LucideIcon,
	Sparkle,
	ShieldCheck,
	Timer,
	ArrowUpRight
} from 'lucide-react'

const benefitIconMap: Record<string, LucideIcon> = {
	Sparkle,
	ShieldCheck,
	Timer
}

type HeroSectionProps = {
	title: string
	subtitle: string
	benefits: Benefit[]
	primaryCta: CTA
	secondaryCta?: CTA
	className?: string
}

export default function HeroSection({
	title,
	subtitle,
	benefits,
	primaryCta,
	secondaryCta,
	className
}: HeroSectionProps) {
	return (
		<section
			aria-labelledby='hero-heading'
			className={cn(
				'relative z-[1] overflow-hidden marketing-panel rounded-[32px] px-10 py-16 md:px-14 md:py-20',
				className
			)}
		>
			<div className='relative grid grid-cols-1 gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center'>
				<div className='space-y-10'>
					<div className='space-y-5'>
						<span className='marketing-chip text-xs font-medium uppercase tracking-[0.35em]'>
							<span className='marketing-chip__dot' />
							브리핑부터 견적까지
						</span>
						<h1
							id='hero-heading'
							className='marketing-section-heading max-w-[42rem] text-4xl font-semibold tracking-tight md:text-5xl lg:text-[60px]'
						>
							{title}
						</h1>
						<p className='max-w-[36rem] text-lg leading-relaxed text-muted-foreground md:text-xl'>
							{subtitle}
						</p>
					</div>

					<CTAGroup primary={primaryCta} secondary={secondaryCta} />

					<ul className='grid gap-4 text-sm text-muted-foreground sm:grid-cols-3'>
						{benefits.map(benefit => {
							const Icon = benefitIconMap[benefit.icon] ?? ArrowUpRight
							return (
								<li
									key={benefit.label}
									className='marketing-card flex items-center gap-3 rounded-2xl px-5 py-4 text-base font-medium text-foreground'
								>
									<span className='marketing-icon-button size-10 text-accent'>
										<Icon className='size-5' aria-hidden />
									</span>
									{benefit.label}
								</li>
							)
						})}
					</ul>
				</div>

				<div
					className='relative h-full min-h-[260px] rounded-[28px] border border-[hsla(var(--glass-border),0.28)] bg-[linear-gradient(140deg,rgba(33,52,84,0.28),rgba(95,38,142,0.18))] p-[1px]'
					aria-hidden='true'
				>
					<div className='marketing-card relative flex h-full w-full items-end justify-between rounded-[24px] p-6'>
						<div className='flex flex-col gap-4'>
							<p className='text-sm font-semibold uppercase tracking-[0.25em] text-accent/80'>
								데이터 기반 진단
							</p>
							<div className='space-y-2 text-left'>
								<p className='text-5xl font-semibold text-foreground drop-shadow'>
									48h
								</p>
								<p className='text-sm text-muted-foreground'>
									빠른 견적 보고 SLA
								</p>
							</div>
						</div>
						<div className='flex flex-col gap-3 text-right'>
							<div className='rounded-2xl border border-[hsla(var(--glass-border),0.28)] bg-[rgba(17,27,46,0.6)] px-4 py-3 text-left text-sm text-muted-foreground'>
								<p className='text-xs uppercase tracking-[0.3em] text-accent'>
									AI + 컨설턴트
								</p>
								<p className='mt-2 text-base font-semibold text-foreground'>
									맞춤형 솔루션
								</p>
							</div>
							<div className='rounded-2xl border border-[hsla(var(--glass-border),0.24)] bg-[linear-gradient(125deg,rgba(34,206,238,0.18),rgba(168,85,247,0.2))] px-4 py-3 text-left text-sm text-foreground'>
								<p className='text-xs uppercase tracking-widest text-white/85'>
									경험 데이터
								</p>
								<p className='mt-2 text-2xl font-semibold'>
									30,000+
								</p>
								<p className='text-xs text-white/65'>
									누적 견적 사례 집계
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
