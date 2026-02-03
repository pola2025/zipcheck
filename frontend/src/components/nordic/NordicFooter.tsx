export default function NordicFooter() {
	return (
		<footer className="bg-sand-900 text-white py-16">
			<div className="max-w-7xl mx-auto px-8">
				<div className="grid md:grid-cols-4 gap-12">
					<div className="md:col-span-2">
						<div className="mb-4">
							<img src="/logo_white.png" alt="집첵" className="h-7 w-auto" />
						</div>
						<p className="text-sand-500 text-sm leading-relaxed max-w-sm">
							인테리어 견적, 데이터로 편안하게. 3,000건의 실제 시공·유통 데이터를 기반으로
							당신의 견적서를 분석합니다.
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-sm mb-4 text-sand-400">서비스</h4>
						<ul className="space-y-2 text-sm text-sand-500">
							<li>
								<a href="/plan-selection" className="hover:text-white transition">
									견적 분석 신청
								</a>
							</li>
							<li>
								<a href="#examples" className="hover:text-white transition">
									분석 예시
								</a>
							</li>
							<li>
								<a href="#pricing" className="hover:text-white transition">
									이용 요금
								</a>
							</li>
							<li>
								<a href="/community" className="hover:text-white transition">
									커뮤니티
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="font-semibold text-sm mb-4 text-sand-400">고객 지원</h4>
						<ul className="space-y-2 text-sm text-sand-500">
							<li>zipcheck2025@gmail.com</li>
							<li>032-345-9834</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-white/10 text-xs text-sand-600">
					<p>polarad | 대표: 이재호 | 사업자등록번호: 808-03-00327</p>
					<p className="mt-1">
						서울시 금천구 가산디지털2로 98, 2동 11층 1107호(가산동, IT캐슬)
					</p>
					<p className="mt-2 text-sand-700">&copy; 2025 ZipCheck. All rights reserved.</p>
				</div>
			</div>
		</footer>
	)
}
