import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { heroStats } from 'data/marketing'
import { getApiUrl } from 'lib/api-config'

export default function NordicHero() {
	const [freeRemaining, setFreeRemaining] = useState<number | null>(null)
	const [freeUsed, setFreeUsed] = useState(0)

	useEffect(() => {
		fetch(getApiUrl('/api/quote-requests/free-slots'))
			.then(r => r.json())
			.then(data => {
				setFreeRemaining(data.remaining)
				setFreeUsed(data.used)
			})
			.catch(() => {})
	}, [])

	const isClosed = freeRemaining !== null && freeRemaining <= 0

	return (
		<section className="pt-20 md:pt-28 bg-gradient-to-br from-sand-50/95 to-sand-200/90">
			<div className="max-w-7xl mx-auto px-5 md:px-8">
				<div className="grid md:grid-cols-12 gap-6 md:gap-8 items-center md:min-h-[90vh] py-10 md:py-16">
					{/* Text: 7 columns */}
					<div className="md:col-span-7 md:pr-8">
						<div className="flex items-center gap-3 mb-5 md:mb-8">
							<div className="w-8 md:w-12 h-[2px] bg-forest-500" />
							<span className="text-forest-600 font-medium text-xs md:text-sm tracking-widest uppercase">
								Interior Quote Analysis
							</span>
						</div>

						<h1 className="font-outfit text-[1.85rem] md:text-[3.5rem] lg:text-[4.2rem] font-bold text-sand-900 leading-[1.1] tracking-tight mb-4 md:mb-6">
							인테리어 견적,
							<br />
							데이터로
							<br />
							<span className="text-forest-500">편안하게.</span>
						</h1>

						<p className="text-sm md:text-xl text-sand-700 leading-relaxed mb-5 md:mb-8 max-w-lg font-light">
							실제 공사 데이터와 유통망 가격을 기반으로
							48시간 안에 꼼꼼하게 분석해 드립니다.
						</p>

						{/* Free Promo Badge */}
						<div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-5 md:mb-6 flex-wrap">
							<span className="text-red-600 font-bold text-xs md:text-sm">한시적 무료</span>
							<span className="text-red-300">|</span>
							<span className="text-red-500 text-xs md:text-sm">선착순 <strong>50</strong>명</span>
							<span className="text-red-300">|</span>
							<span className="text-sand-400 text-xs md:text-sm line-through">9,900원</span>
							<span className="text-red-600 text-xs md:text-sm font-bold ml-0.5">&rarr; 0원</span>
						</div>

						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5">
							{isClosed ? (
								<button
									disabled
									className="px-7 md:px-8 py-3.5 md:py-4 bg-sand-300 text-sand-500 rounded-2xl font-semibold text-base md:text-lg cursor-not-allowed text-center"
								>
									마감되었습니다
								</button>
							) : (
								<Link
									to="/quote-submission"
									className="px-7 md:px-8 py-3.5 md:py-4 bg-forest-600 text-white rounded-2xl font-semibold text-base md:text-lg hover:bg-forest-700 transition shadow-lg shadow-forest-600/15 text-center"
								>
									무료 견적 분석 받기 &rarr;
								</Link>
							)}
							<a
								href="#examples"
								className="text-sand-600 font-medium hover:text-forest-600 transition underline underline-offset-4 decoration-sand-300 text-center sm:text-left"
							>
								분석 예시 보기
							</a>
						</div>

						{/* Counter */}
						{freeRemaining !== null && (
							<p className="text-xs text-sand-500 mt-3">
								현재 <strong className="text-forest-600">{freeUsed}</strong>/50명 접수 완료
							</p>
						)}

						{/* Trust Stats */}
						<div className="flex items-center gap-5 md:gap-10 mt-8 md:mt-14 pt-5 md:pt-8 border-t border-sand-300">
							{heroStats.map((stat) => (
								<div key={stat.label}>
									<p className="text-xl md:text-3xl font-bold text-sand-900 font-outfit">
										{stat.value}
										<span className="text-forest-500">{stat.suffix}</span>
									</p>
									<p className="text-[10px] md:text-xs text-sand-600 mt-1">{stat.label}</p>
								</div>
							))}
						</div>
					</div>

					{/* Image: 5 columns - Diagonal Clip */}
					<div className="md:col-span-5 relative mt-6 md:mt-0">
						<div className="hero-img-clip rounded-3xl overflow-hidden shadow-2xl shadow-sand-900/10">
							<img
								src="https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/hero-living.webp"
								alt="따뜻한 우드톤 거실 인테리어"
								className="aspect-[4/3] md:aspect-[3/4] w-full object-cover"
								loading="eager"
							/>
						</div>

						{/* Floating Savings Card */}
						<div className="absolute -bottom-4 left-4 md:-bottom-6 md:-left-8 nordic-card rounded-2xl p-3.5 md:p-5 shadow-lg max-w-[180px] md:max-w-[220px] bg-white">
							<div className="flex items-center gap-2.5 md:gap-3 mb-1 md:mb-2">
								<div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 text-sm md:text-lg font-bold">
									&darr;
								</div>
								<div>
									<p className="text-xs md:text-sm font-bold text-sand-900">평균 절감액</p>
									<p className="text-sm md:text-lg font-bold text-forest-600">350만원</p>
								</div>
							</div>
							<p className="text-[10px] md:text-xs text-sand-600">견적 대비 평균 9.2% 절감</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
