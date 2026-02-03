import { conceptCards } from 'data/marketing'
import SectionLabel from './SectionLabel'

export default function ConceptGallery() {
	return (
		<section className="bg-white py-16 md:py-24">
			<div className="max-w-7xl mx-auto px-5 md:px-8">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-12">
					<SectionLabel
						label="Interior Concept"
						title="이런 공간을 꿈꾸시나요?"
					/>
					<p className="text-sand-600 text-sm max-w-xs md:text-right">
						어떤 스타일이든, 견적서만 보내주시면
						<br />
						꼼꼼하게 분석해 드려요.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-4 md:gap-5">
					{conceptCards.map((card) => {
						const isLarge = (card.colSpan ?? 1) > 1
						return (
							<div
								key={card.title}
								className={`img-card relative ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}
								style={{ minHeight: isLarge ? 280 : 200 }}
							>
								{card.image ? (
									<img
										src={card.image}
										alt={card.title}
										className="absolute inset-0 w-full h-full object-cover rounded-[20px]"
										loading="lazy"
									/>
								) : (
									<div
										className={`${card.placeholder} absolute inset-0 rounded-[20px]`}
									/>
								)}
								<div className="img-card-overlay" />
								<div className="relative z-10 absolute bottom-0 left-0 right-0 p-5 md:p-8">
									<span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium mb-2 md:mb-3 border border-white/10">
										{card.style}
									</span>
									<h3 className={`text-white font-bold ${isLarge ? 'text-xl md:text-2xl mb-1 md:mb-2' : 'text-lg'}`}>
										{card.title}
									</h3>
									{card.description && (
										<p className="text-white/70 text-sm hidden md:block">{card.description}</p>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
