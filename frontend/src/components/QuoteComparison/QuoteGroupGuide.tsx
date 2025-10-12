import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Clock, TrendingDown } from 'lucide-react'

interface QuoteGroupGuideProps {
	onContinue: () => void
}

export default function QuoteGroupGuide({ onContinue }: QuoteGroupGuideProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 mb-8"
		>
			<div className="max-w-4xl mx-auto">
				{/* 헤더 */}
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
						📊 견적 비교 분석 서비스
					</h2>
					<p className="text-gray-400 text-lg">
						여러 업체의 견적을 동시에 비교하여 최적의 선택을 하세요
					</p>
				</div>

				{/* 가격 정책 카드 */}
				<div className="grid md:grid-cols-3 gap-4 mb-8">
					<div className="bg-gray-700/50 rounded-2xl p-6 text-center border-2 border-cyan-500/30">
						<div className="text-4xl font-bold text-cyan-400 mb-2">30,000원</div>
						<div className="text-sm text-gray-300 mb-3">첫 번째 견적</div>
						<div className="text-xs text-gray-400">기본 AI 분석</div>
					</div>

					<div className="bg-gray-700/50 rounded-2xl p-6 text-center border-2 border-purple-500/30 relative">
						<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
							추천
						</div>
						<div className="text-4xl font-bold text-purple-400 mb-2">50,000원</div>
						<div className="text-sm text-gray-300 mb-3">두 번째 견적 (48h 내)</div>
						<div className="text-xs text-green-400 font-semibold">+20,000원</div>
					</div>

					<div className="bg-gray-700/50 rounded-2xl p-6 text-center border-2 border-amber-500/30">
						<div className="text-4xl font-bold text-amber-400 mb-2">70,000원</div>
						<div className="text-sm text-gray-300 mb-3">세 번째 견적 (48h 내)</div>
						<div className="text-xs text-green-400 font-semibold">+20,000원</div>
					</div>
				</div>

				{/* 혜택 안내 */}
				<div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
					<div className="flex items-start gap-4">
						<TrendingDown className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-bold text-green-400 mb-2">비교 분석 혜택</h3>
							<p className="text-gray-300 text-sm mb-3">
								48시간 내 추가 견적 제출 시 <span className="text-green-400 font-semibold">건당 33% 할인</span>
								<br />
								(개별 분석 대비 최대 20,000원 절감)
							</p>
							<ul className="space-y-2 text-sm text-gray-400">
								<li className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>여러 업체 견적을 한눈에 비교</span>
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>AI 기반 최적 견적 추천</span>
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>항목별 상세 비교 리포트</span>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* 주의사항 */}
				<div className="space-y-4 mb-8">
					<div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
						<Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
						<div className="text-sm">
							<div className="text-amber-400 font-semibold mb-1">48시간 제한</div>
							<div className="text-gray-300">
								첫 견적 제출 후 48시간 이내에 추가 견적을 등록해야 할인가가 적용됩니다.
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
						<AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
						<div className="text-sm">
							<div className="text-blue-400 font-semibold mb-1">최대 3개까지</div>
							<div className="text-gray-300">
								동일 프로젝트에 대해 최대 3개 업체의 견적을 비교할 수 있습니다.
							</div>
						</div>
					</div>
				</div>

				{/* 진행 버튼 */}
				<div className="text-center">
					<button
						onClick={onContinue}
						className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
					>
						견적 등록 시작하기
					</button>
					<p className="text-xs text-gray-400 mt-3">
						견적 등록 후 관리자가 48시간 내에 분석 결과를 제공합니다
					</p>
				</div>
			</div>
		</motion.div>
	)
}
