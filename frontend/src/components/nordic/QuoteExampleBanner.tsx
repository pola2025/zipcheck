import { quoteExampleItems, quoteExampleSummary } from 'data/marketing'

export default function QuoteExampleBanner() {
	return (
		<section id="examples" className="relative overflow-hidden">
			{/* Background */}
			<div className="ph-dark absolute inset-0 flex items-center justify-center">
				<span className="text-sand-500/30 text-[120px]">📋</span>
			</div>
			<div className="banner-overlay-forest" />

			<div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
				<div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
					{/* Left: Summary */}
					<div>
						<span className="text-forest-200 font-medium text-xs md:text-sm tracking-widest uppercase">
							Real Example
						</span>
						<h2 className="font-outfit text-[1.65rem] md:text-4xl font-bold text-white mt-3 mb-5 md:mb-6 tracking-tight">
							실제 분석 예시
						</h2>
						<p className="text-white/70 text-sm md:text-lg leading-relaxed mb-6 md:mb-8">
							30평 아파트 주방 리모델링 견적서를 분석한 실제 사례입니다. 원본 3,800만 원
							견적에서 350만 원(9.2%)의 과다 청구를 확인했습니다.
						</p>

						<div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/10">
								<p className="text-white/50 text-xs mb-1">원본 견적</p>
								<p className="text-xl md:text-2xl font-bold text-white font-outfit">
									{quoteExampleSummary.original}
									<span className="text-sm md:text-base font-normal text-white/50">만원</span>
								</p>
							</div>
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/10">
								<p className="text-white/50 text-xs mb-1">적정 견적</p>
								<p className="text-xl md:text-2xl font-bold text-forest-300 font-outfit">
									{quoteExampleSummary.adjusted}
									<span className="text-sm md:text-base font-normal text-forest-300/60">만원</span>
								</p>
							</div>
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/10">
								<p className="text-white/50 text-xs mb-1">절감액</p>
								<p className="text-xl md:text-2xl font-bold text-green-300 font-outfit">
									{quoteExampleSummary.savings}
									<span className="text-sm md:text-base font-normal text-green-300/60">만원</span>
								</p>
							</div>
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/10">
								<p className="text-white/50 text-xs mb-1">절감율</p>
								<p className="text-xl md:text-2xl font-bold text-green-300 font-outfit">
									{quoteExampleSummary.savingsPercent}
									<span className="text-sm md:text-base font-normal text-green-300/60">%</span>
								</p>
							</div>
						</div>

						<a
							href="#"
							className="inline-block px-5 md:px-6 py-2.5 md:py-3 bg-white/15 backdrop-blur-sm text-white rounded-xl font-medium text-sm md:text-base border border-white/20 hover:bg-white/25 transition"
						>
							전체 리포트 예시 보기 &rarr;
						</a>
					</div>

					{/* Right: Sample Report */}
					<div className="relative">
						<div className="bg-white rounded-2xl p-5 md:p-8 shadow-2xl">
							<div className="flex items-center gap-3 mb-5 md:mb-6">
								<img src="/logo.png" alt="집첵" className="h-5 w-auto" />
								<div>
									<p className="text-sm font-bold text-sand-900">
										분석 리포트
									</p>
									<p className="text-xs text-sand-600">
										30평 아파트 주방 리모델링
									</p>
								</div>
							</div>

							<div className="space-y-3">
								{quoteExampleItems.map((item, i) => (
									<div
										key={item.category}
										className={`flex items-center justify-between py-3 ${
											i < quoteExampleItems.length - 1
												? 'border-b border-sand-200'
												: ''
										}`}
									>
										<div>
											<p className="text-sm font-medium text-sand-900">
												{item.category}
											</p>
											<p className="text-xs text-sand-500">{item.detail}</p>
										</div>
										<div className="text-right">
											{item.status === 'overcharged' ? (
												<>
													<p className="text-sm font-bold text-red-500 line-through">
														{item.originalPrice}
													</p>
													<p className="text-sm font-bold text-forest-600">
														{item.adjustedPrice}
													</p>
												</>
											) : (
												<>
													<p className="text-sm font-bold text-sand-600">
														{item.adjustedPrice}
													</p>
													<p className="text-xs text-forest-500">적정 범위</p>
												</>
											)}
										</div>
									</div>
								))}
							</div>

							<div className="mt-4 pt-4 border-t border-sand-300 flex items-center justify-between">
								<span className="text-sm font-semibold text-sand-900">
									분석 코멘트
								</span>
								<span className="text-xs text-forest-600 font-medium">
									&#9656; 2건 과다 청구 확인
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
