import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionLabel from './SectionLabel'
import { getApiUrl } from 'lib/api-config'

export default function NordicPricing() {
	const navigate = useNavigate()
	const [freeRemaining, setFreeRemaining] = useState<number | null>(null)

	useEffect(() => {
		fetch(getApiUrl('/api/quote-requests/free-slots'))
			.then(r => r.json())
			.then(data => setFreeRemaining(data.remaining))
			.catch(() => {})
	}, [])

	const isClosed = freeRemaining !== null && freeRemaining <= 0

	return (
		<section id="pricing" className="bg-sand-50 py-16 md:py-24">
			<div className="max-w-3xl mx-auto px-5 md:px-8">
				<div className="text-center mb-10 md:mb-14">
					<SectionLabel
						label="Pricing"
						title="분석 요금"
						subtitle="지금은 무료로 체험해 보세요"
						align="center"
					/>
				</div>

				<div className="max-w-md mx-auto">
					<div className="relative nordic-card rounded-2xl p-6 md:p-8 border-2 border-forest-600">
						<div className="absolute -top-[10px] left-1/2 -translate-x-1/2 px-4 py-[3px] rounded-2xl text-[11px] font-semibold bg-red-500 text-white whitespace-nowrap">
							선착순 50명 무료
						</div>

						<h3 className="font-semibold text-sand-900 text-lg">견적 분석</h3>
						<p className="text-xs text-sand-600 mb-4">48시간 이내</p>

						<div className="flex items-baseline gap-3 mb-6">
							<p className="text-xl md:text-2xl text-sand-400 line-through font-outfit">
								₩9,900
							</p>
							<p className="text-3xl md:text-4xl font-bold text-forest-600 font-outfit">
								₩0
							</p>
							<span className="text-sm text-red-500 font-semibold">무료</span>
						</div>

						{freeRemaining !== null && (
							<div className="mb-6 p-3 bg-forest-50 rounded-xl text-center">
								<p className="text-sm text-sand-700">
									잔여 <strong className="text-forest-600">{freeRemaining}</strong>/50명
								</p>
							</div>
						)}

						<ul className="space-y-2.5 mb-8 text-sm text-sand-700">
							{[
								'항목별 적정가 비교',
								'항목별 상세 코멘트',
								'과다 청구 탐지',
								'시장 데이터 기반 분석',
							].map((feature) => (
								<li key={feature} className="flex items-center gap-2">
									<span className="text-forest-500 font-bold">&#10003;</span>
									{feature}
								</li>
							))}
						</ul>

						{isClosed ? (
							<button
								disabled
								className="w-full py-3.5 rounded-xl font-semibold bg-sand-300 text-sand-500 cursor-not-allowed"
							>
								마감되었습니다
							</button>
						) : (
							<button
								onClick={() => navigate('/quote-submission')}
								className="w-full py-3.5 rounded-xl font-semibold transition bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
							>
								무료 분석 받기
							</button>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}
