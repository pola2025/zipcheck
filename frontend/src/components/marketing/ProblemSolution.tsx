import type { ProblemSolutionItem } from 'data/marketing'
import SectionHeading from './SectionHeading'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

const ICONS = {
	problem: AlertTriangle,
	solution: CheckCircle2
}

type ProblemSolutionProps = {
	items: ProblemSolutionItem[]
}

export default function ProblemSolution({ items }: ProblemSolutionProps) {
	return (
		<section
			aria-labelledby='problem-solution-heading'
			className='marketing-section space-y-12'
		>
			<SectionHeading
				id='problem-solution-heading'
				eyebrow='Problem & Solution'
			title='ZipCheck이 해결하는 대표적인 문제와 해법'
			subtitle='복잡한 심사 프로세스로 인해 발생하는 병목을 파악하고, 자동화된 커뮤니케이션과 데이터 기반 의사결정으로 해결합니다.'
			align='center'
		/>
			<div className='grid gap-6 md:grid-cols-2'>
				{items.map(item => {
					const Icon = ICONS[item.type] ?? CheckCircle2
					const tone = item.type === 'problem'
						? 'bg-[linear-gradient(160deg,rgba(52,22,39,0.55),rgba(25,15,32,0.55))]'
						: 'bg-[linear-gradient(160deg,rgba(12,26,44,0.78),rgba(18,34,56,0.62))]'
					return (
						<article
							key={item.title}
							className={`marketing-card relative flex h-full flex-col gap-5 rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-6 py-7 ${tone}`}
						>
							<div className='flex items-center gap-3'>
								<span className='marketing-icon-button size-12 text-accent'>
									<Icon className='size-6' aria-hidden />
								</span>
								<div>
									<p className='text-xs font-semibold uppercase tracking-[0.35em] text-accent/70'>
										{item.type === 'problem' ? 'Problem' : 'Solution'}
									</p>
									<h3 className='text-lg font-semibold text-foreground'>{item.title}</h3>
								</div>
							</div>
							<p className='text-sm leading-relaxed text-muted-foreground'>
								{item.body}
							</p>
							<ul className='marketing-list text-sm text-muted-foreground'>
								{item.bullets.map(bullet => (
									<li key={bullet} className='marketing-list__item'>
										<span className='marketing-pulse mt-1' aria-hidden />
										<span>{bullet}</span>
									</li>
								))}
							</ul>
						</article>
					)
				})}
			</div>
		</section>
	)
}
