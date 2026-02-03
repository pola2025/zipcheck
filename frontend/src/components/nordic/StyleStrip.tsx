import { styleCards } from 'data/marketing'
import SectionLabel from './SectionLabel'

export default function StyleStrip() {
	return (
		<section className="bg-white py-20 overflow-hidden">
			<div className="max-w-7xl mx-auto px-8">
				<div className="flex items-end justify-between mb-8">
					<SectionLabel
						label="Styles We Analyze"
						title="모든 스타일의 견적을 분석합니다"
					/>
				</div>

				<div
					className="flex gap-5 overflow-x-auto pb-4"
					style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
				>
					{styleCards.map((card) => (
						<div
							key={card.name}
							className="flex-shrink-0 w-72 img-card relative"
							style={{ minHeight: 360 }}
						>
							{card.image ? (
								<img
									src={card.image}
									alt={card.name}
									className="absolute inset-0 w-full h-full object-cover rounded-[20px]"
									loading="lazy"
								/>
							) : (
								<div
									className={`${card.placeholder} absolute inset-0 rounded-[20px]`}
								/>
							)}
							<div className="img-card-overlay" />
							<div className="relative z-10 absolute bottom-0 left-0 right-0 p-6">
								<h3 className="text-white font-bold text-lg mb-1">{card.name}</h3>
								<p className="text-white/60 text-xs">{card.subtitle}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
