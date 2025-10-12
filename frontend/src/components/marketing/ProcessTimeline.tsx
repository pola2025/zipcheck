import type { ProcessStep } from 'data/marketing'
import SectionHeading from './SectionHeading'
import { CircleDot } from 'lucide-react'

type ProcessTimelineProps = {
	steps: ProcessStep[]
}

export default function ProcessTimeline({ steps }: ProcessTimelineProps) {
	return (
		<section
			aria-labelledby='process-heading'
			className='marketing-section space-y-12'
		>
			<SectionHeading
				id='process-heading'
				eyebrow='Process'
			title='진단부터 실행까지 이어지는 5단계 여정'
			subtitle='각 단계마다 전담 어드바이저가 함께하며, 필요 시 AI 자동화를 조정해 가장 효율적인 결과를 도출합니다.'
		/>
			<ol className='relative space-y-6 before:absolute before:left-[1.05rem] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-[hsla(var(--glass-border),0.32)] md:before:left-[1.35rem]'>
				{steps.map((step, index) => (
					<li
						key={step.title}
						className='marketing-card relative ml-12 flex flex-col gap-3 rounded-2xl border border-[hsla(var(--glass-border),0.24)] px-6 py-6 md:ml-16'
					>
						<span className='marketing-icon-button absolute left-[-2.8rem] top-6 size-10 text-accent md:left-[-3.4rem]'>
							<CircleDot className='size-5' aria-hidden />
						</span>
						<p className='text-xs font-semibold uppercase tracking-[0.35em] text-accent/70'>
							Step {index + 1}
						</p>
						<h3 className='text-lg font-semibold text-foreground'>{step.title}</h3>
						<p className='text-sm leading-relaxed text-muted-foreground md:text-base'>
							{step.description}
						</p>
					</li>
				))}
			</ol>
		</section>
	)
}
