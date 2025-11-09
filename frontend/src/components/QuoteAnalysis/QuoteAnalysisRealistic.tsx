import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	PieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend
} from 'recharts'
import {
	CheckCircle2,
	AlertTriangle,
	Info,
	ChevronDown,
	ChevronUp,
	TrendingUp,
	TrendingDown,
	DollarSign,
	Award,
	Target
} from 'lucide-react'

// 새로운 분석 결과 타입 (시드 데이터 구조에 맞춤)
interface CategoryAnalysis {
	category: string
	totalCost: number
	marketAverage: number
	rating: 'good' | 'reasonable' | 'slightly_high' | 'high'
	percentage: number
	items: number
	findings: string[]
}

interface Recommendation {
	type: 'cost_reduction' | 'quality_improvement' | 'warning'
	title: string
	description: string
	potentialSaving?: number
}

interface AnalysisResult {
	overallScore: number
	totalAmount: number
	averageMarketPrice: number
	priceRating: 'low' | 'reasonable' | 'high' | 'very_high'

	summary: {
		positive: string[]
		negative: string[]
		warnings: string[]
	}

	categoryAnalysis: CategoryAnalysis[]
	recommendations: Recommendation[]

	marketComparison: {
		averagePriceRange: {
			min: number
			max: number
		}
		currentQuote: number
		percentile: number
		similarCases: Array<{
			location: string
			size: number
			cost: number
			year: number
		}>
	}

	expertNotes: Record<string, string>
}

interface Props {
	analysis: AnalysisResult
	propertySize: number // ㎡
}

// 카테고리별 색상
const CATEGORY_COLORS: Record<string, string> = {
	'철거': '#ef4444',
	'목공': '#f59e0b',
	'바닥': '#8b5cf6',
	'도배': '#10b981',
	'욕실': '#06b6d4',
	'주방': '#f97316',
	'전기': '#eab308',
	'창호': '#3b82f6',
	'가구': '#ec4899',
	'페인트': '#14b8a6',
	'기타': '#6b7280'
}

export default function QuoteAnalysisRealistic({ analysis, propertySize }: Props) {
	const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

	// 평수 환산
	const pyeong = (propertySize / 3.3058).toFixed(1)

	// 점수에 따른 색상
	const getScoreColor = (score: number) => {
		if (score >= 80) return '#10b981' // green
		if (score >= 60) return '#06b6d4' // cyan
		if (score >= 40) return '#f59e0b' // amber
		return '#ef4444' // red
	}

	// 가격 평가 배지
	const getPriceBadge = () => {
		const badges = {
			'low': { text: '저렴', color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: TrendingDown },
			'reasonable': { text: '적정', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50', icon: CheckCircle2 },
			'high': { text: '높음', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', icon: TrendingUp },
			'very_high': { text: '매우 높음', color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: AlertTriangle }
		}

		const badge = badges[analysis.priceRating] || badges['reasonable']
		const Icon = badge.icon

		return (
			<div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 ${badge.color} font-bold`}>
				<Icon className="w-5 h-5" />
				{badge.text}
			</div>
		)
	}

	// 카테고리 평가 배지
	const getRatingBadge = (rating: string) => {
		const badges = {
			'good': { text: '우수', color: 'bg-green-500/20 text-green-400' },
			'reasonable': { text: '적정', color: 'bg-cyan-500/20 text-cyan-400' },
			'slightly_high': { text: '약간 높음', color: 'bg-amber-500/20 text-amber-400' },
			'high': { text: '높음', color: 'bg-red-500/20 text-red-400' }
		}
		return (badges as any)[rating] || badges['reasonable']
	}

	// 파이 차트 데이터
	const pieChartData = analysis.categoryAnalysis.map(cat => ({
		name: cat.category,
		value: cat.totalCost,
		percentage: cat.percentage
	}))

	// 막대 차트 데이터 (상위 5개 카테고리)
	const topCategories = [...analysis.categoryAnalysis]
		.sort((a, b) => b.totalCost - a.totalCost)
		.slice(0, 5)

	const barChartData = topCategories.map(cat => ({
		name: cat.category,
		견적가: cat.totalCost,
		시장평균: cat.marketAverage
	}))

	// 시장 대비 절감/추가 금액
	const priceDiff = analysis.totalAmount - analysis.averageMarketPrice
	const priceDiffPercent = ((priceDiff / analysis.averageMarketPrice) * 100).toFixed(1)

	return (
		<div className="space-y-8">
			{/* 안내 문구 */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-6"
			>
				<div className="flex items-start gap-3">
					<Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
					<div>
						<h3 className="text-lg font-bold text-blue-300 mb-2">📋 견적 분석 서비스 안내</h3>
						<p className="text-sm text-gray-300">
							본 견적 분석은 시장 데이터를 기반으로 한 <strong className="text-blue-300">참고 자료</strong>입니다.
							시공업체의 기술력, 디자인 품질, 서비스 수준을 평가하는 것이 아니며,
							절대적으로 정확한 데이터가 아닐 수 있습니다.
						</p>
					</div>
				</div>
			</motion.div>

			{/* 종합 평가 헤더 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30"
				style={{
					boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.05)'
				}}
			>
				<div className="flex items-center justify-between mb-8">
					<div>
						<h2 className="text-4xl font-bold mb-2" style={{
							background: 'linear-gradient(135deg, #11998e, #38ef7d)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent'
						}}>
							종합 분석 결과
						</h2>
						<p className="text-gray-400">
							{propertySize}㎡ ({pyeong}평) 아파트 올수리
						</p>
					</div>
					{getPriceBadge()}
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{/* 종합 점수 */}
					<div className="flex flex-col items-center justify-center">
						<div className="relative w-48 h-48">
							<svg className="w-full h-full transform -rotate-90">
								<circle
									cx="96"
									cy="96"
									r="80"
									stroke="#374151"
									strokeWidth="12"
									fill="none"
								/>
								<circle
									cx="96"
									cy="96"
									r="80"
									stroke={getScoreColor(analysis.overallScore)}
									strokeWidth="12"
									fill="none"
									strokeDasharray={`${(analysis.overallScore / 100) * 502.4} 502.4`}
									strokeLinecap="round"
									className="transition-all duration-1000"
									style={{
										filter: `drop-shadow(0 0 8px ${getScoreColor(analysis.overallScore)})`
									}}
								/>
							</svg>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span className="text-5xl font-bold" style={{ color: getScoreColor(analysis.overallScore) }}>
									{analysis.overallScore}
								</span>
								<span className="text-gray-400 text-sm">/ 100점</span>
							</div>
						</div>
						<p className="mt-4 text-lg font-semibold text-cyan-400">종합 점수</p>
					</div>

					{/* 가격 정보 */}
					<div className="col-span-2 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
								<div className="text-sm text-gray-400 mb-1">총 견적액</div>
								<div className="text-2xl font-bold text-white">
									₩{analysis.totalAmount.toLocaleString()}
								</div>
							</div>
							<div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
								<div className="text-sm text-gray-400 mb-1">시장 평균가</div>
								<div className="text-2xl font-bold text-gray-300">
									₩{analysis.averageMarketPrice.toLocaleString()}
								</div>
							</div>
						</div>

						<div className={`bg-black/40 rounded-xl p-6 border-2 ${
							priceDiff < 0 ? 'border-green-500/30' : priceDiff === 0 ? 'border-cyan-500/30' : 'border-amber-500/30'
						}`}>
							<div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
								{priceDiff < 0 ? (
									<TrendingDown className="w-5 h-5 text-green-400" />
								) : (
									<TrendingUp className="w-5 h-5 text-amber-400" />
								)}
								시장 평균 대비
							</div>
							<div className={`text-4xl font-bold ${
								priceDiff < 0 ? 'text-green-400' : priceDiff === 0 ? 'text-cyan-400' : 'text-amber-400'
							}`}>
								{priceDiff > 0 ? '+' : ''}{priceDiffPercent}%
							</div>
							<div className="text-sm text-gray-400 mt-2">
								{priceDiff < 0 ? '절감' : '추가'}: {Math.abs(priceDiff).toLocaleString()}원
							</div>
						</div>

						<div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
							<div className="text-sm text-gray-400 mb-1">가격대 위치</div>
							<div className="text-lg font-semibold text-cyan-400">
								하위 {analysis.marketComparison.percentile}% (상위 {100 - analysis.marketComparison.percentile}%보다 저렴)
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* 카테고리별 비용 분석 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30"
			>
				<h3 className="text-3xl font-bold mb-6" style={{
					background: 'linear-gradient(135deg, #11998e, #38ef7d)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent'
				}}>
					카테고리별 비용 분석
				</h3>

				<div className="grid md:grid-cols-2 gap-8 mb-8">
					{/* 파이 차트 */}
					<div>
						<h4 className="text-xl font-semibold text-cyan-400 mb-4">비용 구성 비율</h4>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={pieChartData}
									cx="50%"
									cy="50%"
									labelLine={false}
						label={(props: any) => `${props.name} ${(props.percentage as number).toFixed(1)}%`}
									outerRadius={100}
									fill="#8884d8"
									dataKey="value"
								>
									{pieChartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
									))}
								</Pie>
								<Tooltip
									formatter={(value: number) => `₩${value.toLocaleString()}`}
									contentStyle={{
										backgroundColor: '#1f2937',
										border: '1px solid #374151',
										borderRadius: '8px'
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* 막대 차트 */}
					<div>
						<h4 className="text-xl font-semibold text-cyan-400 mb-4">주요 카테고리 비교 (Top 5)</h4>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={barChartData}>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis dataKey="name" stroke="#9ca3af" />
								<YAxis stroke="#9ca3af" />
								<Tooltip
									formatter={(value: number) => `₩${value.toLocaleString()}`}
									contentStyle={{
										backgroundColor: '#1f2937',
										border: '1px solid #374151',
										borderRadius: '8px'
									}}
								/>
								<Legend />
								<Bar dataKey="견적가" fill="#06b6d4" />
								<Bar dataKey="시장평균" fill="#6b7280" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* 카테고리별 상세 */}
				<div className="space-y-4">
					<h4 className="text-xl font-semibold text-cyan-400 mb-4">카테고리별 상세 평가</h4>
					{analysis.categoryAnalysis.map((cat, index) => {
						const isExpanded = expandedCategory === cat.category
						const badge = getRatingBadge(cat.rating)

						return (
							<div key={index} className="bg-black/40 rounded-xl border border-cyan-500/20 overflow-hidden">
								<button
									onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
									className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
								>
									<div className="flex items-center gap-4 flex-1">
										<div
											className="w-4 h-4 rounded-full"
											style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280' }}
										/>
										<div className="text-left flex-1">
											<div className="flex items-center gap-3 mb-1">
												<h5 className="text-lg font-bold text-white">{cat.category}</h5>
												<span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
													{badge.text}
												</span>
												<span className="text-sm text-gray-400">
													{cat.items}개 항목
												</span>
											</div>
											<p className="text-sm text-gray-400">
												전체 비용의 {cat.percentage.toFixed(1)}%
											</p>
										</div>
										<div className="text-right">
											<div className="text-2xl font-bold text-cyan-400">
												₩{cat.totalCost.toLocaleString()}
											</div>
											<div className="text-sm text-gray-400">
												시장평균: ₩{cat.marketAverage.toLocaleString()}
											</div>
										</div>
									</div>
									<div className="ml-4">
										{isExpanded ? (
											<ChevronUp className="w-6 h-6 text-gray-400" />
										) : (
											<ChevronDown className="w-6 h-6 text-gray-400" />
										)}
									</div>
								</button>

								<AnimatePresence>
									{isExpanded && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className="border-t border-cyan-500/20 bg-black/60 p-6"
										>
											<h6 className="text-sm font-semibold text-cyan-400 mb-3">세부 평가</h6>
											<ul className="space-y-2">
												{cat.findings.map((finding, i) => (
													<li key={i} className="flex items-start gap-2 text-sm text-gray-300">
														<CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
														<span>{finding}</span>
													</li>
												))}
											</ul>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)
					})}
				</div>
			</motion.div>

			{/* 주요 발견사항 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="grid md:grid-cols-3 gap-6"
			>
				{/* 긍정적 평가 */}
				<div className="glass-neon rounded-2xl p-6 border-2 border-green-500/30">
					<div className="flex items-center gap-3 mb-4">
						<CheckCircle2 className="w-8 h-8 text-green-400" />
						<h4 className="text-xl font-bold text-green-400">긍정적 평가</h4>
					</div>
					<ul className="space-y-3">
						{analysis.summary.positive.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-gray-300">
								<span className="text-green-400 mt-1">✓</span>
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>

				{/* 부정적 평가 */}
				<div className="glass-neon rounded-2xl p-6 border-2 border-amber-500/30">
					<div className="flex items-center gap-3 mb-4">
						<AlertTriangle className="w-8 h-8 text-amber-400" />
						<h4 className="text-xl font-bold text-amber-400">개선 권장</h4>
					</div>
					<ul className="space-y-3">
						{analysis.summary.negative.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-gray-300">
								<span className="text-amber-400 mt-1">!</span>
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>

				{/* 주의사항 */}
				<div className="glass-neon rounded-2xl p-6 border-2 border-red-500/30">
					<div className="flex items-center gap-3 mb-4">
						<AlertTriangle className="w-8 h-8 text-red-400" />
						<h4 className="text-xl font-bold text-red-400">주의사항</h4>
					</div>
					<ul className="space-y-3">
						{analysis.summary.warnings.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-gray-300">
								<span className="text-red-400 mt-1">⚠</span>
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>
			</motion.div>

			{/* 권장사항 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30"
			>
				<h3 className="text-3xl font-bold mb-6" style={{
					background: 'linear-gradient(135deg, #11998e, #38ef7d)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent'
				}}>
					집첵 권장사항
				</h3>

				<div className="space-y-4">
					{analysis.recommendations.map((rec, index) => {
						const icons = {
							'cost_reduction': <DollarSign className="w-6 h-6 text-green-400" />,
							'quality_improvement': <Award className="w-6 h-6 text-blue-400" />,
							'warning': <AlertTriangle className="w-6 h-6 text-amber-400" />
						}

						const colors = {
							'cost_reduction': 'border-green-500/30 bg-green-500/5',
							'quality_improvement': 'border-blue-500/30 bg-blue-500/5',
							'warning': 'border-amber-500/30 bg-amber-500/5'
						}

						return (
							<div key={index} className={`rounded-xl p-6 border-2 ${colors[rec.type]}`}>
								<div className="flex items-start gap-4">
									<div className="flex-shrink-0">
										{icons[rec.type]}
									</div>
									<div className="flex-1">
										<h5 className="text-lg font-bold text-white mb-2">{rec.title}</h5>
										<p className="text-gray-300 text-sm mb-3">{rec.description}</p>
										{rec.potentialSaving && (
											<div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
												<TrendingDown className="w-4 h-4 text-green-400" />
												<span className="text-green-400 font-semibold text-sm">
													약 {rec.potentialSaving.toLocaleString()}원 절감 가능
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</motion.div>

			{/* 시장 비교 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30"
			>
				<h3 className="text-3xl font-bold mb-6" style={{
					background: 'linear-gradient(135deg, #11998e, #38ef7d)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent'
				}}>
					시장 비교
				</h3>

				<div className="grid md:grid-cols-2 gap-6">
					{/* 가격대 범위 */}
					<div className="bg-black/40 rounded-xl p-6 border border-cyan-500/20">
						<h4 className="text-lg font-semibold text-cyan-400 mb-4">시장 가격대</h4>
						<div className="space-y-3">
							<div>
								<div className="text-sm text-gray-400 mb-1">최저가</div>
								<div className="text-xl font-bold text-gray-300">
									₩{analysis.marketComparison.averagePriceRange.min.toLocaleString()}
								</div>
							</div>
							<div>
								<div className="text-sm text-gray-400 mb-1">최고가</div>
								<div className="text-xl font-bold text-gray-300">
									₩{analysis.marketComparison.averagePriceRange.max.toLocaleString()}
								</div>
							</div>
							<div className="pt-3 border-t border-cyan-500/20">
								<div className="text-sm text-gray-400 mb-1">현재 견적</div>
								<div className="text-2xl font-bold text-cyan-400">
									₩{analysis.marketComparison.currentQuote.toLocaleString()}
								</div>
							</div>
						</div>
					</div>

					{/* 유사 사례 */}
					<div className="bg-black/40 rounded-xl p-6 border border-cyan-500/20">
						<h4 className="text-lg font-semibold text-cyan-400 mb-4">유사 시공 사례</h4>
						<div className="space-y-3">
							{analysis.marketComparison.similarCases.map((c, i) => (
								<div key={i} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
									<div>
										<div className="text-sm font-semibold text-white">{c.location}</div>
										<div className="text-xs text-gray-400">{c.size}㎡ · {c.year}년</div>
									</div>
									<div className="text-right">
										<div className="text-sm font-bold text-cyan-400">
											₩{(c.cost / 10000).toFixed(0)}만원
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</motion.div>

			{/* 하단 리마인더 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className="bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-6"
			>
				<p className="text-sm text-gray-300 text-center">
					⚠️ 본 분석은 참고 자료이며, 시공사 선정 및 시공 결과에 대한 책임은 고객과 해당 시공사에 있습니다.
				</p>
			</motion.div>
		</div>
	)
}
