import CTAGroup from './CTAGroup'
import type { CTA } from 'data/marketing'

type Breadcrumb = {
	label: string
	href?: string
}

type PageHeroProps = {
	title: string
	subtitle: string
	breadcrumbs: Breadcrumb[]
	primaryCta?: CTA
}

export default function PageHero({ title, subtitle, breadcrumbs, primaryCta }: PageHeroProps) {
	return (
		<section className='marketing-section marketing-section--compact space-y-6'>
			<nav aria-label='breadcrumb'>
				<ol className='flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-muted-foreground'>
					{breadcrumbs.map((crumb, index) => (
						<li key={crumb.label} className='flex items-center gap-2'>
							{crumb.href ? (
								<a className='neon-link transition hover:text-accent' href={crumb.href}>
									{crumb.label}
								</a>
							) : (
								<span className='text-accent'>{crumb.label}</span>
							)}
							{index < breadcrumbs.length - 1 ? <span aria-hidden>/</span> : null}
						</li>
					))}
				</ol>
			</nav>
			<div className='space-y-5'>
				<h1 className='marketing-section-heading max-w-4xl text-4xl font-semibold md:text-[44px]'>
					{title}
				</h1>
				<p className='marketing-section__subtitle'>{subtitle}</p>
				{primaryCta ? <CTAGroup primary={primaryCta} /> : null}
			</div>
		</section>
	)
}
