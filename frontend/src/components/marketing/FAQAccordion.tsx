import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'components/ui/accordion'
import type { FAQItem } from 'data/marketing'

type FAQAccordionProps = {
	items: FAQItem[]
	className?: string
}

export default function FAQAccordion({ items, className }: FAQAccordionProps) {
	return (
		<Accordion
			type='single'
			collapsible
			className={className}
			defaultValue={items[0]?.question}
		>
			{items.map(item => (
				<AccordionItem key={item.question} value={item.question}>
					<AccordionTrigger>{item.question}</AccordionTrigger>
					<AccordionContent>{item.answer}</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	)
}
