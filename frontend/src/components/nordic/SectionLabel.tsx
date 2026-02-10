interface SectionLabelProps {
	label: string
	title: string
	subtitle?: string
	align?: 'left' | 'center'
}

export default function SectionLabel({ label, title, subtitle, align = 'left' }: SectionLabelProps) {
	return (
		<div className={align === 'center' ? 'text-center' : ''}>
			<span className="text-forest-600 font-medium text-xs md:text-sm tracking-widest uppercase">
				{label}
			</span>
			<h2 className="font-outfit text-[1.65rem] md:text-4xl font-bold text-sand-900 mt-2 tracking-tight">
				{title}
			</h2>
			{subtitle && <p className="text-sand-600 mt-3 text-sm md:text-base">{subtitle}</p>}
		</div>
	)
}
