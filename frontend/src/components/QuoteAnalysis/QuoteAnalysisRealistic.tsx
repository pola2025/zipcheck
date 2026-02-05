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

// 분석 결과 타입
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
	propertySize: number
}

const CATEGORY_COLORS: Record<string, string> = {
	'철거': '#6B7280',
	'목공': '#F59E0B',
	'바닥': '#60A5FA',
	'도배': '#8B5CF6',
	'욕실': '#3B82F6',
	'주방': '#22C55E',
	'전기': '#F97316',
	'창호': '#06B6D4',
	'가구': '#EF4444',
	'페인트': '#10B981',
	'기타': '#9CA3AF'
}

export default function QuoteAnalysisRealistic({ analysis, propertySize }: Props) {
	const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

	const pyeong = (propertySize / 3.3058).toFixed(1)

	const getScoreColor = (score: number) => {
		if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', fill: '#10B981' }
		if (score >= 60) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', fill: '#3B82F6' }
		if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', fill: '#F59E0B' }
		return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', fill: '#EF4444' }
	}

	const scoreStyle = getScoreColor(analysis.overallScore)

	const getPriceBadge = () => {
		const badges = {
			'low': { text: '저렴', cls: 'bg-green-50 text-green-700 border-green-200', Icon: TrendingDown },
			'reasonable': { text: '적정', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CheckCircle2 },
			'high': { text: '높음', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: TrendingUp },
			'very_high': { text: '매우 높음', cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle }
		}
		const badge = badges[analysis.priceRating] || badges['reasonable']
		return (
			<span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${badge.cls}`}>
				<badge.Icon className="w-4 h-4" />
				{badge.text}
			</span>
		)
	}

	const getRatingBadge = (rating: string) => {
		const badges: Record<string, { text: string; cls: string }> = {
			'good': { text: '우수', cls: 'bg-green-50 text-green-700 border border-green-200' },
			'reasonable': { text: '적정', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
			'slightly_high': { text: '약간 높음', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
			'high': { text: '높음', cls: 'bg-red-50 text-red-700 border border-red-200' }
		}
		return badges[rating] || badges['reasonable']
	}

	const pieChartData = analysis.categoryAnalysis.map(cat => ({
		name: cat.category,
		value: cat.totalCost,
		percentage: cat.percentage
	}))

	const topCategories = [...analysis.categoryAnalysis]
		.sort((a, b) => b.totalCost - a.totalCost)
		.slice(0, 5)

	const barChartData = topCategories.map(cat => ({
		name: cat.category,
		견적가: cat.totalCost,
		시장평균: cat.marketAverage
	}))

	const priceDiff = analysis.totalAmount - analysis.averageMarketPrice
	const priceDiffPercent = ((priceDiff / analysis.averageMarketPrice) * 100).toFixed(1)

	return (
		<div className="space-y-5">
			{/* 안내 문구 */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-5"
			>
				<div className="flex items-start gap-3">
					<Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
					<div>
						<h3 className="text-sm font-bold text-blue-800 mb-1">견적 분석 서비스 안내</h3>
						<p className="text-sm text-blue-700">
							본 견적 분석은 시장 데이터를 기반으로 한 <strong>참고 자료</strong>입니다.
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
				className="bg-white rounded-2xl p-5 sm:p-8 border border-sand-300"
			>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="font-outfit text-2xl sm:text-3xl font-bold text-sand-900">
							종합 분석 결과
						</h2>
						<p className="text-sand-600 text-sm mt-1">
							{propertySize}㎡ ({pyeong}평) 아파트 올수리
						</p>
					</div>
					{getPriceBadge()}
				</div>

				<div className="grid md:grid-cols-3 gap-6">
					{/* 종합 점수 게이지 */}
					<div className="flex flex-col items-center justify-center">
						<div className="relative w-40 h-40 sm:w-44 sm:h-44">
							<svg className="w-full h-full" viewBox="0 0 120 120">
								<circle cx="60" cy="60" r="50" fill="none" stroke="#ECEAE3" strokeWidth="10" />
								<circle
									cx="60" cy="60" r="50" fill="none"
									stroke={scoreStyle.fill}
									strokeWidth="10"
									strokeDasharray="314"
									strokeDashoffset={314 - (analysis.overallScore / 100) * 314}
									strokeLinecap="round"
									transform="rotate(-90 60 60)"
								/>
								<text x="60" y="54" textAnchor="middle" style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 700, fill: '#2A2822' }}>
									{analysis.overallScore}
								</text>
								<text x="60" y="72" textAnchor="middle" style={{ fontSize: '11px', fill: '#96917F' }}>
									/ 100
								</text>
							</svg>
						</div>
						<p className={`mt-2 text-sm font-semibold ${scoreStyle.text}`}>종합 점수</p>
					</div>

					{/* 가격 정보 */}
					<div className="col-span-2 space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
								<div className="text-xs text-sand-500 mb-1">총 견적액</div>
								<div className="text-xl font-bold text-sand-900">
									{(analysis.totalAmount / 10000).toFixed(0)}만원
								</div>
							</div>
							<div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
								<div className="text-xs text-sand-500 mb-1">시장 평균가</div>
								<div className="text-xl font-bold text-sand-700">
									{(analysis.averageMarketPrice / 10000).toFixed(0)}만원
								</div>
							</div>
						</div>

						<div className={`rounded-xl p-5 border-2 ${
							priceDiff < 0 ? 'border-green-200 bg-green-50' : priceDiff === 0 ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'
						}`}>
							<div className="text-xs text-sand-600 mb-1 flex items-center gap-2">
								{priceDiff < 0 ? (
									<TrendingDown className="w-4 h-4 text-green-600" />
								) : (
									<TrendingUp className="w-4 h-4 text-amber-600" />
								)}
								시장 평균 대비
							</div>
							<div className={`text-3xl font-bold font-outfit ${
								priceDiff < 0 ? 'text-green-700' : priceDiff === 0 ? 'text-blue-700' : 'text-amber-700'
							}`}>
								{priceDiff > 0 ? '+' : ''}{priceDiffPercent}%
							</div>
							<div className="text-xs text-sand-600 mt-1">
								{priceDiff < 0 ? '절감' : '추가'}: {Math.abs(priceDiff).toLocaleString()}원
							</div>
						</div>

						<div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
							<div className="text-xs text-sand-500 mb-1">가격대 위치</div>
							<div className="text-sm font-semibold text-sand-800">
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
				className="bg-white rounded-2xl p-5 sm:p-8 border border-sand-300"
			>
				<h3 className="font-outfit text-xl font-semibold text-sand-900 mb-6">
					카테고리별 비용 분석
				</h3>

				<div className="grid md:grid-cols-2 gap-6 mb-6">
					{/* 파이 차트 */}
					<div>
						<h4 className="text-sm font-semibold text-sand-700 mb-3">비용 구성 비율</h4>
						<ResponsiveContainer width="100%" height={280}>
							<PieChart>
								<Pie
									data={pieChartData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={(props: any) => `${props.name} ${(props.percentage as number).toFixed(1)}%`}
									outerRadius={90}
									fill="#8884d8"
									dataKey="value"
								>
									{pieChartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#9CA3AF'} />
									))}
								</Pie>
								<Tooltip
									formatter={(value: number) => `${(value / 10000).toFixed(0)}만원`}
									contentStyle={{
										backgroundColor: '#fff',
										border: '1px solid #DBD8CE',
										borderRadius: '8px',
										fontSize: '13px'
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* 막대 차트 */}
					<div>
						<h4 className="text-sm font-semibold text-sand-700 mb-3">주요 카테고리 비교 (Top 5)</h4>
						<ResponsiveContainer width="100%" height={280}>
							<BarChart data={barChartData}>
								<CartesianGrid strokeDasharray="3 3" stroke="#ECEAE3" />
								<XAxis dataKey="name" stroke="#96917F" fontSize={12} />
								<YAxis stroke="#96917F" fontSize={12} />
								<Tooltip
									formatter={(value: number) => `${(value / 10000).toFixed(0)}만원`}
									contentStyle={{
										backgroundColor: '#fff',
										border: '1px solid #DBD8CE',
										borderRadius: '8px',
										fontSize: '13px'
									}}
								/>
								<Legend />
								<Bar dataKey="견적가" fill="#3D9A4C" />
								<Bar dataKey="시장평균" fill="#B8B4A6" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* 카테고리별 상세 */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-sand-700 mb-2">카테고리별 상세 평가</h4>
					{analysis.categoryAnalysis.map((cat, index) => {
						const isExpanded = expandedCategory === cat.category
						const badge = getRatingBadge(cat.rating)

						return (
							<div key={index} className={`rounded-xl border overflow-hidden ${
								cat.rating === 'high' ? 'border-red-200 bg-red-50/30' :
								cat.rating === 'slightly_high' ? 'border-amber-200 bg-amber-50/20' :
								'border-sand-200'
							}`}>
								<button
									onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
									className="w-full p-4 flex items-center justify-between hover:bg-sand-50 transition-colors"
								>
									<div className="flex items-center gap-3 flex-1 min-w-0">
										<div
											className="w-3 h-3 rounded-full shrink-0"
											style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#9CA3AF' }}
										/>
										<div className="text-left flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<h5 className="text-sm font-bold text-sand-900">{cat.category}</h5>
												<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
													{badge.text}
												</span>
												<span className="text-xs text-sand-500">{cat.items}개 항목</span>
											</div>
											<p className="text-xs text-sand-500 mt-0.5">전체 비용의 {cat.percentage.toFixed(1)}%</p>
										</div>
										<div className="text-right shrink-0 ml-2">
											<div className="text-base font-bold text-sand-900">
												{(cat.totalCost / 10000).toFixed(0)}만원
											</div>
											<div className="text-xs text-sand-500">
												시장평균: {(cat.marketAverage / 10000).toFixed(0)}만원
											</div>
										</div>
									</div>
									<div className="ml-3 shrink-0">
										{isExpanded ? (
											<ChevronUp className="w-5 h-5 text-sand-400" />
										) : (
											<ChevronDown className="w-5 h-5 text-sand-400" />
										)}
									</div>
								</button>

								<AnimatePresence>
									{isExpanded && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className="border-t border-sand-200 bg-sand-50 p-4"
										>
											<h6 className="text-xs font-semibold text-sand-600 mb-2">세부 평가</h6>
											<ul className="space-y-1.5">
												{cat.findings.map((finding, i) => (
													<li key={i} className="flex items-start gap-2 text-sm text-sand-700">
														<CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />
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
				className="grid md:grid-cols-3 gap-4"
			>
				{/* 긍정적 */}
				<div className="bg-white rounded-2xl p-5 border border-green-200">
					<div className="flex items-center gap-2 mb-3">
						<CheckCircle2 className="w-5 h-5 text-green-600" />
						<h4 className="text-sm font-bold text-green-800">긍정적 평가</h4>
					</div>
					<ul className="space-y-2">
						{analysis.summary.positive.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-sand-700">
								<span className="text-green-500 shrink-0 mt-0.5">+</span>
								<span className="break-keep">{item}</span>
							</li>
						))}
					</ul>
				</div>

				{/* 개선 권장 */}
				<div className="bg-white rounded-2xl p-5 border border-amber-200">
					<div className="flex items-center gap-2 mb-3">
						<AlertTriangle className="w-5 h-5 text-amber-600" />
						<h4 className="text-sm font-bold text-amber-800">개선 권장</h4>
					</div>
					<ul className="space-y-2">
						{analysis.summary.negative.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-sand-700">
								<span className="text-amber-500 shrink-0 mt-0.5">!</span>
								<span className="break-keep">{item}</span>
							</li>
						))}
					</ul>
				</div>

				{/* 주의사항 */}
				<div className="bg-white rounded-2xl p-5 border border-red-200">
					<div className="flex items-center gap-2 mb-3">
						<AlertTriangle className="w-5 h-5 text-red-600" />
						<h4 className="text-sm font-bold text-red-800">주의사항</h4>
					</div>
					<ul className="space-y-2">
						{analysis.summary.warnings.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-sand-700">
								<span className="text-red-500 shrink-0 mt-0.5">!</span>
								<span className="break-keep">{item}</span>
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
				className="bg-white rounded-2xl p-5 sm:p-8 border border-sand-300"
			>
				<h3 className="font-outfit text-xl font-semibold text-sand-900 mb-5">
					집첵 권장사항
				</h3>

				<div className="space-y-3">
					{analysis.recommendations.map((rec, index) => {
						const icons = {
							'cost_reduction': <DollarSign className="w-5 h-5 text-forest-600" />,
							'quality_improvement': <Award className="w-5 h-5 text-blue-600" />,
							'warning': <AlertTriangle className="w-5 h-5 text-amber-600" />
						}

						const colors = {
							'cost_reduction': 'border-forest-200 bg-forest-50',
							'quality_improvement': 'border-blue-200 bg-blue-50',
							'warning': 'border-amber-200 bg-amber-50'
						}

						return (
							<div key={index} className={`rounded-xl p-4 border ${colors[rec.type]}`}>
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0 mt-0.5">
										{icons[rec.type]}
									</div>
									<div className="flex-1 min-w-0">
										<h5 className="text-sm font-bold text-sand-900 mb-1">{rec.title}</h5>
										<p className="text-sm text-sand-700 break-keep">{rec.description}</p>
										{rec.potentialSaving && (
											<div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-forest-100 rounded-full">
												<TrendingDown className="w-3.5 h-3.5 text-forest-700" />
												<span className="text-forest-700 font-semibold text-xs">
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
				className="bg-white rounded-2xl p-5 sm:p-8 border border-sand-300"
			>
				<h3 className="font-outfit text-xl font-semibold text-sand-900 mb-5">
					시장 비교
				</h3>

				<div className="grid md:grid-cols-2 gap-4">
					{/* 가격대 범위 */}
					<div className="bg-sand-50 rounded-xl p-5 border border-sand-200">
						<h4 className="text-sm font-semibold text-sand-700 mb-4">시장 가격대</h4>
						<div className="space-y-3">
							<div>
								<div className="text-xs text-sand-500 mb-0.5">최저가</div>
								<div className="text-lg font-bold text-sand-700">
									{(analysis.marketComparison.averagePriceRange.min / 10000).toFixed(0)}만원
								</div>
							</div>
							<div>
								<div className="text-xs text-sand-500 mb-0.5">최고가</div>
								<div className="text-lg font-bold text-sand-700">
									{(analysis.marketComparison.averagePriceRange.max / 10000).toFixed(0)}만원
								</div>
							</div>
							<div className="pt-3 border-t border-sand-200">
								<div className="text-xs text-sand-500 mb-0.5">현재 견적</div>
								<div className="text-xl font-bold text-forest-600">
									{(analysis.marketComparison.currentQuote / 10000).toFixed(0)}만원
								</div>
							</div>
						</div>
					</div>

					{/* 유사 사례 */}
					<div className="bg-sand-50 rounded-xl p-5 border border-sand-200">
						<h4 className="text-sm font-semibold text-sand-700 mb-4">유사 시공 사례</h4>
						<div className="space-y-3">
							{analysis.marketComparison.similarCases.map((c, i) => (
								<div key={i} className="flex justify-between items-center py-2 border-b border-sand-200 last:border-0">
									<div>
										<div className="text-sm font-semibold text-sand-900">{c.location}</div>
										<div className="text-xs text-sand-500">{c.size}㎡ · {c.year}년</div>
									</div>
									<div className="text-right">
										<div className="text-sm font-bold text-sand-900">
											{(c.cost / 10000).toFixed(0)}만원
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
				className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4"
			>
				<p className="text-xs text-amber-800 text-center break-keep">
					본 분석은 참고 자료이며, 시공사 선정 및 시공 결과에 대한 책임은 고객과 해당 시공사에 있습니다.
				</p>
			</motion.div>
		</div>
	)
}
