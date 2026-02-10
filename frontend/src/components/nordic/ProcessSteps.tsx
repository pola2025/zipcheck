import { nordicProcessSteps } from 'data/marketing'
import SectionLabel from './SectionLabel'

const stepColors = [
	'bg-forest-600 shadow-forest-600/20',
	'bg-forest-500 shadow-forest-500/20',
	'bg-forest-400 shadow-forest-400/20'
]

export default function ProcessSteps() {
	return (
		<section className="relative bg-sand-50 overflow-hidden">
			{/* Background Image (right side) */}
			<img
				src="https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/process-wood-bg.webp"
				alt=""
				aria-hidden="true"
				className="absolute right-0 top-0 bottom-0 w-1/2 object-cover hidden md:block"
			/>
			<div
				className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block"
				style={{
					background:
						'linear-gradient(to right, #F5F0E8 0%, rgba(245,240,232,0.6) 40%, transparent 100%)'
				}}
			/>

			<div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-24">
				<div className="max-w-xl">
					<SectionLabel label="Process" title="간단한 3단계" />

					<div className="space-y-6 md:space-y-8 mt-8 md:mt-12">
						{nordicProcessSteps.map((step, i) => (
							<div key={step.number} className="flex gap-3.5 md:gap-5">
								<div
									className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl text-white flex items-center justify-center text-sm md:text-lg font-bold flex-shrink-0 shadow-lg ${stepColors[i]}`}
								>
									{step.number}
								</div>
								<div>
									<h4 className="font-semibold text-sand-900 text-sm md:text-lg mb-1">
										{step.title}
									</h4>
									<p className="text-sand-600 text-xs md:text-sm">{step.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
