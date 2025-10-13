import ZipCheckLogo from 'components/ZipCheckLogo'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ZipCheckFooter() {
	return (
		<footer className="relative glass-dark border-t border-cyan-500/20 mt-32">
			<div className="container mx-auto px-6 py-16">
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
					{/* Company Info */}
					<div>
						<div className="flex items-center gap-3 mb-6">
							<ZipCheckLogo className="h-10 w-10 text-cyan-400" />
							<span className="text-2xl font-bold gradient-text-cyan-purple">
								집첵
							</span>
						</div>
						<p className="text-gray-400 leading-relaxed mb-4">
							AI와 전문가가 함께하는
							<br />
							정확한 견적 분석 서비스
						</p>
					</div>

					{/* Quick Links */}
					<div>
						<h4 className="text-lg font-bold text-cyan-400 mb-4">바로가기</h4>
						<ul className="space-y-3">
							<li>
								<a
									href="#features"
									className="text-gray-400 hover:text-cyan-400 transition-colors"
								>
									기능 소개
								</a>
							</li>
							<li>
								<a
									href="#process"
									className="text-gray-400 hover:text-cyan-400 transition-colors"
								>
									이용 방법
								</a>
							</li>
							<li>
								<a
									href="#pricing"
									className="text-gray-400 hover:text-cyan-400 transition-colors"
								>
									요금제
								</a>
							</li>
							<li>
								<a
									href="/plan-selection"
									className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
								>
									견적 분석 신청
								</a>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<h4 className="text-lg font-bold text-cyan-400 mb-4">문의하기</h4>
						<ul className="space-y-3">
							<li className="flex items-start gap-2">
								<Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
								<a
									href="mailto:zipcheck2025@gmail.com"
									className="text-gray-400 hover:text-cyan-400 transition-colors break-all"
								>
									zipcheck2025@gmail.com
								</a>
							</li>
							<li className="flex items-start gap-2">
								<Phone className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
								<a
									href="tel:032-345-9834"
									className="text-gray-400 hover:text-cyan-400 transition-colors"
								>
									032-345-9834
								</a>
							</li>
							<li className="flex items-start gap-2">
								<MapPin className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
								<span className="text-gray-400 text-sm leading-relaxed">
									서울시 금천구 가산디지털2로 98,
									<br />
									2동 11층 1107호(가산동, IT캐슬)
								</span>
							</li>
						</ul>
					</div>

					{/* Company Details */}
					<div>
						<h4 className="text-lg font-bold text-cyan-400 mb-4">사업자 정보</h4>
						<ul className="space-y-2 text-sm text-gray-400">
							<li>
								<span className="text-gray-500">상호명:</span> polarad
							</li>
							<li>
								<span className="text-gray-500">사업자등록번호:</span> 808-03-00327
							</li>
							<li>
								<span className="text-gray-500">대표자:</span> 이재호
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-cyan-500/10">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<p className="text-gray-500 text-sm">
							© 2025 polarad. All rights reserved.
						</p>
						<div className="flex gap-6 text-sm">
							<a
								href="/legal/privacy"
								className="text-gray-500 hover:text-cyan-400 transition-colors"
							>
								개인정보처리방침
							</a>
							<a
								href="/legal/terms"
								className="text-gray-500 hover:text-cyan-400 transition-colors"
							>
								이용약관
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Background Glow */}
			<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
		</footer>
	)
}
