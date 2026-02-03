import SectionLabel from './SectionLabel'

const pricingPlans = [
	{
		name: '기본 분석',
		period: '48시간 이내',
		price: '₩30,000',
		priceNote: 'VAT 별도',
		features: [
			'항목별 적정가 비교',
			'항목별 상세 코멘트',
			'PDF 리포트 제공'
		],
		highlighted: false
	},
	{
		name: '빠른 분석',
		period: '24시간 이내',
		price: '₩45,000',
		priceNote: 'VAT 별도',
		features: [
			'우선 배정 전담 분석팀',
			'추가 Q&A 지원',
			'기본 분석 모든 기능 포함'
		],
		highlighted: true
	}
]

export default function NordicPricing() {
	return (
		<section id="pricing" className="bg-sand-50 py-24">
			<div className="max-w-4xl mx-auto px-8">
				<div className="text-center mb-14">
					<SectionLabel
						label="Pricing"
						title="분석 요금"
						subtitle="3만 원 투자로 수백만 원을 지켜요"
						align="center"
					/>
				</div>

				<div className="grid md:grid-cols-2 gap-8">
					{pricingPlans.map((plan) => (
						<div
							key={plan.name}
							className={`relative nordic-card rounded-2xl p-8 ${
								plan.highlighted ? 'border-2 border-forest-600' : ''
							}`}
						>
							{plan.highlighted && (
								<div className="absolute -top-[10px] left-1/2 -translate-x-1/2 px-4 py-[3px] rounded-2xl text-[11px] font-semibold bg-forest-700 text-white">
									추천
								</div>
							)}

							<h3 className="font-semibold text-sand-900 text-lg">{plan.name}</h3>
							<p className="text-xs text-sand-600 mb-4">{plan.period}</p>
							<p className="text-4xl font-bold text-sand-900 font-outfit mb-6">
								{plan.price}
								<span className="text-sm font-normal text-sand-500 ml-1">
									{plan.priceNote}
								</span>
							</p>

							<ul className="space-y-2.5 mb-8 text-sm text-sand-700">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-center gap-2">
										<span className="text-forest-500 font-bold">&#10003;</span>
										{feature}
									</li>
								))}
							</ul>

							<button
								className={`w-full py-3.5 rounded-xl font-semibold transition ${
									plan.highlighted
										? 'bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15'
										: 'border border-forest-500 text-forest-600 hover:bg-forest-600 hover:text-white'
								}`}
							>
								선택하기
							</button>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
