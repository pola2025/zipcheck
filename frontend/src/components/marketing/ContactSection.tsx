import SectionHeading from './SectionHeading'
import QuoteForm from './QuoteForm'
import type { ContactCopy, FAQItem, Plan } from 'data/marketing'
import FAQAccordion from './FAQAccordion'

type ContactSectionProps = {
	copy: ContactCopy
	faqs?: FAQItem[]
	plans?: Plan[]
}

export default function ContactSection({ copy, faqs, plans }: ContactSectionProps) {
	return (
		<section aria-labelledby='contact-heading' className='marketing-section space-y-12'>
			<SectionHeading
				id='contact-heading'
				eyebrow='Contact'
			title={copy.title}
			subtitle={copy.subtitle}
		/>
			<div className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr]'>
				<div className='marketing-card rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-8 py-9'>
					<QuoteForm copy={copy} />
				</div>
				<div className='space-y-8'>
					{plans ? (
						<div className='marketing-card space-y-4 rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-7 py-8'>
							<h3 className='text-base font-semibold text-foreground'>권장 구성</h3>
							<ul className='marketing-list text-sm text-muted-foreground'>
								{plans.map(plan => (
									<li key={plan.name} className='marketing-list__item justify-between'>
										<div>
											<p className='text-sm font-semibold text-foreground'>{plan.name}</p>
											<p>{plan.description}</p>
										</div>
										<span className='text-sm font-semibold text-accent'>{plan.price}</span>
									</li>
								))}
							</ul>
						</div>
					) : null}
					{faqs ? (
						<div className='marketing-card rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-7 py-8'>
							<h3 className='text-base font-semibold text-foreground'>자주 묻는 질문</h3>
							<FAQAccordion items={faqs} className='mt-6 divide-y divide-white/12' />
						</div>
					) : null}
				</div>
			</div>
		</section>
	)
}
