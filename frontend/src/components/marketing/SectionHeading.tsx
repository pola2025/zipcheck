import { cn } from 'lib/utils'
import type { ReactNode } from 'react'

type SectionHeadingProps = {
	id?: string
	eyebrow?: string
	title: string
	subtitle?: string | ReactNode
	align?: 'left' | 'center'
	className?: string
}

export default function SectionHeading({
	id,
	eyebrow,
	title,
	subtitle,
	align = 'left',
	className
}: SectionHeadingProps) {
	return (
		<div
			className={cn(
				'marketing-section__header',
				align === 'center' && 'items-center text-center mx-auto',
				className
			)}
		>
			{eyebrow ? (
				<span
					className='marketing-chip text-xs font-semibold uppercase tracking-[0.35em]'
					data-testid={id ? `${id}-eyebrow` : undefined}
				>
					<span className='marketing-chip__dot' />
					{eyebrow}
				</span>
			) : null}
			<h2
				id={id}
				className={cn(
					'marketing-section__title',
					align === 'center' ? 'max-w-[50rem]' : 'max-w-[46rem]'
				)}
			>
				{title}
			</h2>
			{subtitle ? (
				<p className='marketing-section__subtitle'>
					{subtitle}
				</p>
			) : null}
		</div>
	)
}
