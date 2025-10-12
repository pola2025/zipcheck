import { useId, useMemo, useState } from 'react'
import type { Testimonial, TrustLogo } from 'data/marketing'
import SectionHeading from './SectionHeading'
import { Star, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from 'lib/utils'

type TestimonialsSectionProps = {
	items: Testimonial[]
	trustLogos: TrustLogo[]
}

export default function TestimonialsSection({ items, trustLogos }: TestimonialsSectionProps) {
	const [activeIndex, setActiveIndex] = useState(0)
	const headingId = useId()

	const activeItem = useMemo(
		() => items[activeIndex % items.length],
		[activeIndex, items]
	)

	const goNext = () => setActiveIndex(prev => (prev + 1) % items.length)
	const goPrev = () => setActiveIndex(prev => (prev - 1 + items.length) % items.length)

	return (
		<section aria-labelledby={headingId} className='marketing-section space-y-12'>
			<SectionHeading
				id={headingId}
				eyebrow='Testimonials'
			title='ZipCheck를 신뢰하는 고객들의 목소리'
			subtitle='실제 프로젝트에서 전달된 피드백을 그대로 전합니다. 네온 라이트 아래에서도 묵직한 결과를 약속합니다.'
			align='center'
		/>
			<div className='grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
				<div className='space-y-6'>
					<article className='marketing-card relative overflow-hidden rounded-3xl border border-[hsla(var(--glass-border),0.24)] px-8 py-9'>
						<header className='flex items-start justify-between gap-6'>
							<div>
								<p className='text-xs uppercase tracking-[0.35em] text-accent/80'>Customer Voice</p>
								<div className='mt-3 flex items-center gap-1 text-accent'>
									{Array.from({ length: 5 }).map((_, index) => (
										<Star
											key={index}
											className={cn('size-4', index + 1 <= Math.round(activeItem.rating) ? 'fill-current' : 'opacity-25')}
											aria-hidden
										/>
									))}
								</div>
							</div>
							<div className='text-right text-sm text-muted-foreground'>
								<p className='text-base font-semibold text-foreground'>{activeItem.author}</p>
								<p>{activeItem.role}</p>
								<p className='sr-only'>평점 {activeItem.rating.toFixed(1)}점</p>
							</div>
						</header>
						<p className='mt-8 text-lg leading-relaxed text-foreground' aria-live='polite'>
							“{activeItem.quote}”
						</p>
					</article>
					<div className='flex items-center justify-between gap-4'>
						<div className='flex items-center gap-2'>
							<button
								type='button'
								onClick={goPrev}
								className='marketing-icon-button size-11'
								aria-label='이전 후기'
							>
									<ArrowLeft className='size-5' aria-hidden />
								</button>
							<button
								type='button'
								onClick={goNext}
								className='marketing-icon-button size-11'
								aria-label='다음 후기'
							>
									<ArrowRight className='size-5' aria-hidden />
								</button>
						</div>
						<ol className='flex items-center gap-2'>
							{items.map((_, index) => (
								<li key={index}>
									<button
										type='button'
										onClick={() => setActiveIndex(index)}
										className={cn(
											'h-2.5 w-6 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-accent',
											index === activeIndex
												? 'bg-accent'
												: 'bg-[rgba(18,28,46,0.5)] hover:bg-[rgba(22,32,52,0.72)]'
										)}
										aria-label={`후기 ${index + 1}번 보기`}
										aria-pressed={index === activeIndex}
									/>
								</li>
							))}
						</ol>
					</div>
				</div>

				<div className='space-y-6'>
					<h3 className='text-sm font-semibold uppercase tracking-[0.3em] text-accent'>Trusted by leading teams</h3>
					<ul className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
						{trustLogos.map(logo => (
							<li key={logo.name}>
								{logo.href ? (
									<a
										className='marketing-card flex h-20 items-center justify-center rounded-xl border border-[hsla(var(--glass-border),0.22)] text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-[hsla(var(--glow-mint),0.4)] hover:text-foreground'
										href={logo.href}
										target='_blank'
										rel='noreferrer'
									>
											{logo.name}
										</a>
								) : (
									<div
										className='marketing-card flex h-20 items-center justify-center rounded-xl border border-[hsla(var(--glass-border),0.22)] text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground'
										role='img'
										aria-label={`${logo.name} 로고`}
									>
											{logo.name}
										</div>
								)}
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	)
}
