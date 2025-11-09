import { motion } from 'framer-motion'
import { ScrollSection } from 'components/immersive'
import { TrendingDown, Award, AlertCircle } from 'lucide-react'
import QuoteAnalysisItem from './QuoteAnalysisItem'
import { quoteExample } from 'data/quoteExample'
import GradeBadge from './GradeBadge'
import GlowButton from 'components/ui/glow-button'

export default function QuoteExampleSection() {
	const { summary, items, analyses } = quoteExample

	return (
		<ScrollSection className="py-32 px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
			<div className="container mx-auto max-w-6xl">
				{/* Section Title */}
				<motion.h2
					className="text-4xl md:text-6xl font-bold text-center mb-8 text-glow-cyan"
					style={{
						background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent'
					}}
				>
					ZipCheck 분석 예시
				</motion.h2>
				<p className="text-xl text-gray-400 text-center max-w-3xl mx-auto mb-16 leading-relaxed">
					ZipCheck가 실제 견적서를 어떻게 풀어내는지 확인해 보세요
				</p>

				{/* Summary Cards */}
				<div className="grid md:grid-cols-3 gap-6 mb-16">
					{/* 원본 견적 */}
					<motion.div
						className="glass-dark rounded-2xl p-6 text-center"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.1 }}
					>
						<div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
							<AlertCircle className="w-6 h-6 text-gray-400" />
						</div>
						<div className="text-sm text-gray-400 mb-2">원래 받은 견적 금액</div>
						<div className="text-3xl font-bold text-white mb-1">
							₩{summary.originalAmount.toLocaleString()}
						</div>
					</motion.div>

					{/* 적정 견적 */}
					<motion.div
						className="glass-neon rounded-2xl p-6 text-center border-2 border-cyan-400/40"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.2 }}
					>
						<div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4 glow-cyan">
							<Award className="w-6 h-6 text-cyan-400" />
						</div>
						<div className="text-sm text-gray-400 mb-2">ZipCheck가 제안한 금액</div>
						<div className="text-3xl font-bold text-cyan-400 mb-1">
							₩{summary.appropriateAmount.toLocaleString()}
						</div>
					</motion.div>

					{/* 절감 가능한 금액 */}
					<motion.div
						className="glass-strong rounded-2xl p-6 text-center border-2 border-green-400/40"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.3 }}
					>
						<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
							<TrendingDown className="w-6 h-6 text-green-400" />
						</div>
						<div className="text-sm text-gray-400 mb-2">절감 가능한 금액</div>
						<div className="text-3xl font-bold text-green-400 mb-1">
							₩{summary.savingsAmount.toLocaleString()}
						</div>
						<div className="text-sm text-green-400">({summary.savingsPercent}%)</div>
					</motion.div>
				</div>

				{/* Overall Grade */}
				<motion.div
					className="glass-neon rounded-2xl p-8 mb-12 text-center"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
				>
					<div className="flex items-center justify-center gap-4 mb-4">
						<span className="text-sm text-gray-400">전체 평가</span>
					<GradeBadge
					grade={summary.overallGrade}
					displayText={summary.overallGradeDisplay}
					size="lg"
				/>
					</div>
					<p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">
						{summary.overallComment}
					</p>
						{summary.premiumFactors && summary.premiumFactors.length > 0 && (
					<div className="mt-6">
						<p className="text-sm text-purple-400 font-semibold mb-3">프리미엄이 붙은 이유</p>
						<div className="flex flex-wrap justify-center gap-2">
							{summary.premiumFactors.map((factor, index) => (
								<span
									key={index}
									className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-sm"
								>
									{factor}
								</span>
							))}
						</div>
					</div>
				)}
				</motion.div>

				{/* Analysis Items */}
				<div className="space-y-4">
					<h3 className="text-2xl font-bold text-cyan-400 mb-6">
						📊 주요 항목별 코멘트
					</h3>
					{items.map((item) => {
						const analysis = analyses.find((a) => a.itemId === item.id)
						if (!analysis) return null

						return <QuoteAnalysisItem key={item.id} item={item} analysis={analysis} />
					})}
				</div>

				{/* CTA */}
				<motion.div
					className="mt-16 text-center"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
				>
					<p className="text-gray-400 mb-6">
						이런 분석을 내 견적서로도 받아보고 싶으신가요?
					</p>
				<GlowButton
					onClick={() => (window.location.href = '/plan-selection')}
					size="md"
					glowColor="#0DD4E4"
				>
					내 견적 분석 받아 보기
				</GlowButton>
				</motion.div>
			</div>
		</ScrollSection>
	)
}
