import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { QuoteLineItem, QuoteAnalysis } from 'types/quote'

interface QuoteAnalysisItemProps {
	item: QuoteLineItem
	analysis: QuoteAnalysis
}

const getRiskColor = (level: string) => {
	switch (level) {
		case 'low':
			return 'text-green-400'
		case 'medium':
			return 'text-yellow-400'
		case 'high':
			return 'text-red-400'
		default:
			return 'text-gray-400'
	}
}

const getRiskIcon = (level: string) => {
	switch (level) {
		case 'low':
			return <CheckCircle2 className="w-5 h-5" />
		case 'medium':
			return <AlertTriangle className="w-5 h-5" />
		case 'high':
			return <AlertCircle className="w-5 h-5" />
		default:
			return <AlertCircle className="w-5 h-5" />
	}
}

const getRiskLabel = (level: string) => {
	switch (level) {
		case 'low':
			return '적정'
		case 'medium':
			return '보통'
		case 'high':
			return '검토 필요'
		default:
			return '보통'
	}
}

const getPriceEvalBadge = (evaluation: string, diff: number) => {
	if (evaluation === 'high') {
		return (
			<span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold">
				시세 대비 +{diff}%
			</span>
		)
	} else if (evaluation === 'low') {
		return (
			<span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
				시세 대비 {diff}%
			</span>
		)
	} else {
		return (
			<span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold">
				적정가
			</span>
		)
	}
}

export default function QuoteAnalysisItem({
	item,
	analysis
}: QuoteAnalysisItemProps) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<motion.div
			className="glass-dark rounded-2xl overflow-hidden neon-border"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
		>
			{/* Header - 클릭 가능 */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
			>
				<div className="flex items-center gap-4 flex-1">
					{/* 리스크 아이콘 */}
					<div className={`${getRiskColor(analysis.riskLevel)}`}>
						{getRiskIcon(analysis.riskLevel)}
					</div>

					{/* 항목 정보 */}
					<div className="text-left flex-1">
						<div className="flex items-center gap-3 mb-1">
							<h4 className="text-lg font-bold text-white">{item.name}</h4>
							{getPriceEvalBadge(analysis.priceEvaluation, analysis.marketPriceDiff)}
						</div>
						<p className="text-sm text-gray-400">{item.description}</p>
					</div>

					{/* 금액 */}
					<div className="text-right">
						<div className="text-2xl font-bold text-cyan-400">
							₩{item.amount.toLocaleString()}
						</div>
						<div className={`text-sm ${getRiskColor(analysis.riskLevel)}`}>
							{getRiskLabel(analysis.riskLevel)}
						</div>
					</div>
				</div>

				{/* 화살표 */}
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.3 }}
					className="ml-4"
				>
					<ChevronDown className="w-6 h-6 text-gray-400" />
				</motion.div>
			</button>

			{/* 상세 분석 내용 */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="overflow-hidden"
					>
						<div className="p-6 pt-0 space-y-6 border-t border-white/10">
							{/* 가격 분석 */}
							<div className="grid md:grid-cols-2 gap-4">
								<div className="glass-neon rounded-xl p-4">
									<div className="text-sm text-gray-400 mb-1">견적 금액</div>
									<div className="text-2xl font-bold text-white">
										₩{item.amount.toLocaleString()}
									</div>
								</div>
								<div className="glass-neon rounded-xl p-4">
									<div className="text-sm text-gray-400 mb-1">적정 금액</div>
									<div className="text-2xl font-bold text-cyan-400">
										₩{analysis.appropriatePrice.toLocaleString()}
									</div>
								</div>
							</div>

							{/* 브랜드 프리미엄 */}
							{analysis.hasBrandPremium && analysis.premiumFactors && (
								<div>
									<h5 className="text-sm font-semibold text-purple-400 mb-2">
										🏷️ 브랜드 프리미엄 항목
									</h5>
									<div className="flex flex-wrap gap-2">
										{analysis.premiumFactors.map((factor, idx) => (
											<span
												key={idx}
												className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm"
											>
												{factor}
											</span>
										))}
									</div>
								</div>
							)}

							{/* 전문가 코멘트 */}
							<div>
								<h5 className="text-sm font-semibold text-cyan-400 mb-2">
									👨‍💼 전문가 코멘트
								</h5>
								<p className="text-gray-300 leading-relaxed">
									{analysis.expertComment}
								</p>
							</div>

							{/* 체크포인트 */}
							<div>
								<h5 className="text-sm font-semibold text-yellow-400 mb-3">
									⚠️ 체크포인트
								</h5>
								<ul className="space-y-2">
									{analysis.checkpoints.map((point, idx) => (
										<li
											key={idx}
											className="flex items-start gap-2 text-gray-300 text-sm"
										>
											<span className="text-yellow-400 mt-0.5">•</span>
											<span>{point}</span>
										</li>
									))}
								</ul>
							</div>

							{/* 대안 제안 */}
							{analysis.alternatives && analysis.alternatives.length > 0 && (
								<div>
									<h5 className="text-sm font-semibold text-green-400 mb-3">
										💡 절감 대안
									</h5>
									<ul className="space-y-2">
										{analysis.alternatives.map((alt, idx) => (
											<li
												key={idx}
												className="flex items-start gap-2 text-gray-300 text-sm"
											>
												<span className="text-green-400 mt-0.5">→</span>
												<span>{alt}</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}
