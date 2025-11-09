import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell
} from 'recharts'
import { AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp, Lock, Download, CircleAlert, TriangleAlert } from 'lucide-react'

// 견적 분석 결과 타입
interface QuoteAnalysisResult {
	overallScore: number // 0-100
	priceLevel: 'low' | 'fair' | 'high' | 'very-high'
	totalEstimate: number
	marketAverage: number
	recommendedPrice: number
	savings: number
	savingsPercent?: number // 절감률 (퍼센트)

	// 마진 분석
	marginAnalysis?: {
		estimatedMargin: number // 추정 마진 (퍼센트)
		evaluation: string // 평가 (적정, 높음 등)
		isNormal: boolean // 정상 범위 여부 (10-20%)
		comment: string // 코멘트
	}

	// 각 항목별 분석
	itemAnalysis: Array<{
		category: string
		item: string
		estimatePrice: number
		marketAverage: number
		difference: number
		differencePercent: number
		evaluation: 'good' | 'fair' | 'expensive'
		marginEstimate?: number // 항목별 추정 마진
		comment?: string // AI 생성 코멘트
		expertNote?: string // 전문가 작성 특이사항
	}>

	// 레이더 차트 데이터 (각 기준별 점수)
	criteriaScores: Array<{
		criteria: string // 품질, 가격경쟁력, 시공성, 내구성, 디자인
		score: number // 0-100
		market: number // 시장 평균
		comment?: string
	}>

	// AI 분석 결과
	aiInsights: {
		summary: string
		warnings: string[]
		recommendations: string[]
	}
}

interface Props {
	analysis: QuoteAnalysisResult
}

// 카테고리별 색상 매핑
const getCategoryColor = (category: string): string => {
	const colors: Record<string, string> = {
		'설계': 'bg-purple-500/20 text-purple-300',
		'철거': 'bg-red-500/20 text-red-300',
		'목공': 'bg-amber-500/20 text-amber-300',
		'전기': 'bg-yellow-500/20 text-yellow-300',
		'배관': 'bg-blue-500/20 text-blue-300',
		'타일': 'bg-cyan-500/20 text-cyan-300',
		'도배': 'bg-green-500/20 text-green-300',
		'조명': 'bg-indigo-500/20 text-indigo-300',
		'가구': 'bg-pink-500/20 text-pink-300',
		'주방': 'bg-orange-500/20 text-orange-300',
		'욕실': 'bg-teal-500/20 text-teal-300',
		'바닥': 'bg-stone-500/20 text-stone-300',
		'창호': 'bg-sky-500/20 text-sky-300',
		'페인트': 'bg-rose-500/20 text-rose-300'
	}
	return colors[category] || 'bg-gray-500/20 text-gray-300'
}

export default function QuoteAnalysisVisual({ analysis }: Props) {
	// 전문가 의견 펼침/접힘 상태
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
	const [isDownloading, setIsDownloading] = useState(false)
	const contentRef = useRef<HTMLDivElement>(null)

	const toggleRow = (index: number) => {
		const newExpanded = new Set(expandedRows)
		if (newExpanded.has(index)) {
			newExpanded.delete(index)
		} else {
			newExpanded.add(index)
		}
		setExpandedRows(newExpanded)
	}

	// PDF 다운로드 함수
	const downloadPDF = async () => {
		if (!contentRef.current) return

		setIsDownloading(true)
		try {
			// html2canvas와 jspdf 동적 import
			const html2canvas = (await import('html2canvas')).default
			const jsPDF = (await import('jspdf')).default

			// 화면 캡처
			const canvas = await html2canvas(contentRef.current, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: '#111827' // gray-900
			})

			// PDF 생성
			const imgData = canvas.toDataURL('image/png')
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			})

			const imgWidth = 210 // A4 width in mm
			const pageHeight = 297 // A4 height in mm
			const imgHeight = (canvas.height * imgWidth) / canvas.width
			let heightLeft = imgHeight
			let position = 0

			// 첫 페이지 추가
			pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
			heightLeft -= pageHeight

			// 여러 페이지가 필요한 경우 추가
			while (heightLeft > 0) {
				position = heightLeft - imgHeight
				pdf.addPage()
				pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
				heightLeft -= pageHeight
			}

			// PDF 다운로드
			pdf.save('견적분석결과.pdf')
		} catch (error) {
			console.error('PDF 생성 실패:', error)
			alert('PDF 생성에 실패했습니다. 다시 시도해주세요.')
		} finally {
			setIsDownloading(false)
		}
	}

	// 전체 점수에 따른 색상
	const getScoreColor = (score: number) => {
		if (score >= 80) return '#10b981' // green
		if (score >= 60) return '#3b82f6' // blue
		if (score >= 40) return '#f59e0b' // amber
		return '#ef4444' // red
	}

	// 가격 수준 배지
	const getPriceLevelBadge = () => {
		const levels = {
			'low': { text: '저렴', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
			'fair': { text: '적정', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle2 },
			'high': { text: '높음', color: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
			'very-high': { text: '매우 높음', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle }
		}

		const level = levels[analysis.priceLevel] || levels['fair']
		const Icon = level.icon

		return (
			<span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${level.color} font-semibold`}>
				<Icon className="w-5 h-5" />
				{level.text}
			</span>
		)
	}

	// 가격 비교 데이터
	const priceComparisonData = [
		{
			name: '견적가',
			value: analysis.totalEstimate,
			fill: '#8b5cf6'
		},
		{
			name: '시장평균',
			value: analysis.marketAverage,
			fill: '#3b82f6'
		},
		{
			name: '권장가',
			value: analysis.recommendedPrice,
			fill: '#10b981'
		}
	]

	return (
		<div className="space-y-8">
			{/* PDF 다운로드 버튼 */}
			<div className="flex justify-end">
				<button
					onClick={downloadPDF}
					disabled={isDownloading}
					className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
						isDownloading
							? 'bg-cyan-500/20 border-2 border-cyan-500/50 cursor-not-allowed'
							: 'bg-cyan-500/30 hover:bg-cyan-500/40 border-2 border-cyan-500/50'
					}`}
				>
					<Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
					{isDownloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
				</button>
			</div>

			<div ref={contentRef} className="space-y-8">
			{/* 서비스 안내 및 면책 조항 */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-6"
			>
				<div className="flex items-start gap-3">
					<Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
					<div className="flex-1">
						<h3 className="text-lg font-bold text-blue-300 mb-2">📋 견적 분석 서비스 안내</h3>
						<div className="text-sm text-gray-300 space-y-2">
							<p>
								본 견적 분석은 시장 데이터를 기반으로 한 <strong className="text-blue-300">참고 자료</strong>입니다.
								시공업체의 기술력, 디자인 품질, 서비스 수준을 평가하는 것이 아니며,
								절대적으로 정확한 데이터가 아닐 수 있습니다.
							</p>
							<p>
								시공사 선정 시 <strong className="text-blue-300">여러 요소를 종합적으로 고려</strong>하시어
								본 분석 결과는 참고 용도로만 활용하시기 바랍니다.
							</p>
							<p className="text-amber-300 font-semibold">
								⚠️ 업체 선정 후 시공 과정 및 결과에 대한 사항은 집첵의 견적 분석 서비스와 무관하며,
								시공사와의 분쟁 사항은 해당 시공사에 직접 문의하시기 바랍니다.
							</p>
						</div>
					</div>
				</div>
			</motion.div>

			{/* 종합 점수 헤더 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700"
			>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-3xl font-bold mb-2">종합 평가</h2>
						<p className="text-gray-400">AI 기반 견적 분석 결과</p>
					</div>
					{getPriceLevelBadge()}
				</div>

				<div className="grid md:grid-cols-2 gap-8">
					{/* 점수 게이지 */}
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
								/>
							</svg>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span className="text-5xl font-bold" style={{ color: getScoreColor(analysis.overallScore) }}>
									{analysis.overallScore}
								</span>
								<span className="text-gray-400 text-sm">/ 100</span>
							</div>
						</div>
						<p className="mt-4 text-lg font-semibold">종합 점수</p>
					</div>

					{/* 가격 정보 */}
					<div className="space-y-4">
						<div className="bg-gray-700/50 rounded-xl p-4">
							<div className="text-sm text-gray-400 mb-1">총 견적가</div>
							<div className="text-2xl font-bold text-purple-400">
								{analysis.totalEstimate.toLocaleString()}원
							</div>
						</div>
						<div className="bg-gray-700/50 rounded-xl p-4">
							<div className="text-sm text-gray-400 mb-1">시장 평균 대비</div>
							<div className="text-4xl font-bold text-blue-400">
								{analysis.savingsPercent ? `${analysis.savingsPercent > 0 ? '+' : ''}${analysis.savingsPercent.toFixed(1)}%` : 'N/A'}
							</div>
							<div className="text-xs text-gray-500 mt-1">
								{analysis.savings > 0 ? `+${Math.abs(analysis.savings).toLocaleString()}원` : `${Math.abs(analysis.savings).toLocaleString()}원`}
							</div>
						</div>
						{analysis.marginAnalysis && (
							<div className={`bg-gray-700/50 rounded-xl p-4 border-2 ${
								analysis.marginAnalysis.isNormal
									? 'border-green-500/30'
									: 'border-amber-500/30'
							}`}>
								<div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
									{analysis.marginAnalysis.isNormal ? (
										<CheckCircle2 className="w-4 h-4 text-green-400" />
									) : (
										<AlertTriangle className="w-4 h-4 text-amber-400" />
									)}
									<span>업체 마진 (정상: 10-20%)</span>
								</div>
								<div className={`text-3xl font-bold ${
									analysis.marginAnalysis.isNormal
										? 'text-green-400'
										: 'text-amber-400'
								}`}>
									{analysis.marginAnalysis.estimatedMargin.toFixed(1)}%
								</div>
								<div className="text-xs text-gray-400 mt-2">
									{analysis.marginAnalysis.evaluation}
								</div>
							</div>
						)}
					</div>
				</div>
			</motion.div>

			{/* 레이더 차트 - 각 기준별 평가 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700"
			>
				<h3 className="text-2xl font-bold mb-6">항목별 평가</h3>
				<ResponsiveContainer width="100%" height={400}>
					<RadarChart data={analysis.criteriaScores}>
						<PolarGrid stroke="#374151" />
						<PolarAngleAxis dataKey="criteria" stroke="#9ca3af" />
						<PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
						<Radar
							name="견적"
							dataKey="score"
							stroke="#8b5cf6"
							fill="#8b5cf6"
							fillOpacity={0.6}
						/>
						<Radar
							name="시장평균"
							dataKey="market"
							stroke="#3b82f6"
							fill="#3b82f6"
							fillOpacity={0.3}
						/>
						<Legend />
						<Tooltip
							contentStyle={{
								backgroundColor: '#1f2937',
								border: '1px solid #374151',
								borderRadius: '8px'
							}}
						/>
					</RadarChart>
				</ResponsiveContainer>
			</motion.div>

			{/* 가격 비교 막대 차트 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700"
			>
				<h3 className="text-2xl font-bold mb-6">가격 비교</h3>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={priceComparisonData}>
						<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
						<XAxis dataKey="name" stroke="#9ca3af" />
						<YAxis stroke="#9ca3af" />
						<Tooltip
							contentStyle={{
								backgroundColor: '#1f2937',
								border: '1px solid #374151',
								borderRadius: '8px',
								color: '#ffffff'
							}}
							labelStyle={{ color: '#ffffff' }}
							itemStyle={{ color: '#ffffff' }}
							formatter={(value: number) => [`${value.toLocaleString()}원`, '']}
						/>
						<Bar dataKey="value" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#ffffff', formatter: ((value: number) => value.toLocaleString() + '원') as any }}>
							{priceComparisonData.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.fill} />
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</motion.div>

			{/* 주요 항목별 상세 분석 - 카드 형태 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700"
			>
				<h3 className="text-2xl font-bold text-cyan-400 mb-6">📊 주요 항목별 상세 분석</h3>
				<div className="space-y-4">
					{analysis.itemAnalysis.map((item, index) => {
						const isExpanded = expandedRows.has(index)
						const statusIcon = item.evaluation === 'expensive' ? (
							<CircleAlert className="w-5 h-5" />
						) : item.evaluation === 'fair' ? (
							<TriangleAlert className="w-5 h-5" />
						) : (
							<CheckCircle2 className="w-5 h-5" />
						)
						const statusColor = item.evaluation === 'expensive' ? 'text-red-400' : item.evaluation === 'fair' ? 'text-yellow-400' : 'text-green-400'
						const evaluationText = item.evaluation === 'expensive' ? '검토 필요' : item.evaluation === 'fair' ? '보통' : '적정'
						const evaluationColor = item.evaluation === 'expensive' ? 'text-red-400' : item.evaluation === 'fair' ? 'text-yellow-400' : 'text-green-400'

						return (
							<div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-cyan-500/50 transition-all">
								<button
									onClick={() => toggleRow(index)}
									className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
								>
									<div className="flex items-center gap-4 flex-1">
										<div className={statusColor}>
											{statusIcon}
										</div>
										<div className="text-left flex-1">
											<div className="flex items-center gap-3 mb-1">
												<h4 className="text-lg font-bold text-white">{item.item}</h4>
												<span className={`px-3 py-1 rounded-full ${
													item.differencePercent > 15
														? 'bg-red-500/20 text-red-400'
														: item.differencePercent > 0
															? 'bg-cyan-500/20 text-cyan-400'
															: 'bg-green-500/20 text-green-400'
												} text-sm font-semibold`}>
													{item.differencePercent > 0
														? `시세 대비 +${item.differencePercent.toFixed(0)}%`
														: '적정가'
													}
												</span>
											</div>
											<p className="text-sm text-gray-400">{item.category}</p>
										</div>
										<div className="text-right">
											<div className="text-2xl font-bold text-cyan-400">
												₩{item.estimatePrice.toLocaleString()}
											</div>
											<div className={`text-sm ${evaluationColor}`}>
												{evaluationText}
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

								{isExpanded && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className="border-t border-gray-700 bg-gray-900/50 p-6"
									>
										<div className="grid md:grid-cols-2 gap-6">
											<div className="space-y-3">
												<div>
													<div className="text-sm text-gray-400 mb-1">시장 평균 가격</div>
													<div className="text-xl font-bold text-gray-300">
														₩{item.marketAverage.toLocaleString()}
													</div>
												</div>
												<div>
													<div className="text-sm text-gray-400 mb-1">가격 차이</div>
													<div className={`text-xl font-bold ${item.difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
														{item.difference > 0 ? '+' : ''}₩{item.difference.toLocaleString()}
													</div>
												</div>
											</div>
											<div className="space-y-3">
												<div>
													<div className="text-sm text-gray-400 mb-1">추정 마진율</div>
													<div className={`text-xl font-bold ${
														item.marginEstimate && item.marginEstimate >= 10 && item.marginEstimate <= 20
															? 'text-green-400'
															: 'text-amber-400'
													}`}>
														{item.marginEstimate ? `${item.marginEstimate.toFixed(1)}%` : '-'}
													</div>
												</div>
												<div>
													<div className="text-sm text-gray-400 mb-1">평가</div>
													<span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
														item.evaluation === 'good'
															? 'bg-green-500/20 text-green-400'
															: item.evaluation === 'fair'
																? 'bg-blue-500/20 text-blue-400'
																: 'bg-red-500/20 text-red-400'
													}`}>
														{item.evaluation === 'good' ? '적정가' : item.evaluation === 'fair' ? '보통' : '고가'}
													</span>
												</div>
											</div>
										</div>

										{item.comment && (
											<div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
												<div className="text-sm text-gray-300">
													💡 <span className="font-semibold text-blue-400">AI 분석:</span> {item.comment}
												</div>
											</div>
										)}

										{item.expertNote && (
											<div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
												<div className="text-sm text-gray-300">
													👨‍🔧 <span className="font-semibold text-amber-400">전문가 의견:</span> {item.expertNote}
												</div>
											</div>
										)}
									</motion.div>
								)}
							</div>
						)
					})}
				</div>
			</motion.div>

			{/* AI 인사이트 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-gradient-to-br from-purple-900/50 to-gray-900 rounded-3xl p-8 border border-purple-500/30"
			>
				<h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
					<span className="text-2xl">🤖</span>
					AI 분석 결과
				</h3>
				<div className="space-y-6">
					<div>
						<h4 className="font-semibold text-purple-300 mb-2">요약</h4>
						<p className="text-gray-300">{analysis.aiInsights.summary}</p>
					</div>

					{analysis.aiInsights.warnings.length > 0 && (
						<div>
							<h4 className="font-semibold text-amber-300 mb-2 flex items-center gap-2">
								<AlertTriangle className="w-5 h-5" />
								주의사항
							</h4>
							<ul className="space-y-2">
								{analysis.aiInsights.warnings.map((warning, index) => (
									<li key={index} className="flex items-start gap-2 text-gray-300">
										<span className="text-amber-400">•</span>
										<span>{warning}</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{analysis.aiInsights.recommendations.length > 0 && (
						<div>
							<h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
								<CheckCircle2 className="w-5 h-5" />
								권장사항
							</h4>
							<ul className="space-y-2">
								{analysis.aiInsights.recommendations.map((rec, index) => (
									<li key={index} className="flex items-start gap-2 text-gray-300">
										<span className="text-green-400">•</span>
										<span>{rec}</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* 하단 리마인더 */}
					<div className="mt-6 pt-6 border-t border-purple-500/30">
						<p className="text-xs text-gray-400 text-center">
							본 분석은 참고 자료이며, 시공사 선정 및 시공 결과에 대한 책임은 고객과 해당 시공사에 있습니다.
						</p>
					</div>
				</div>
			</motion.div>

			{/* 4단계 프로세스 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700"
			>
				<h3 className="text-2xl font-bold mb-6 text-center">서비스 프로세스</h3>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					{/* 1단계 - 완료 */}
					<div className="flex flex-col items-center text-center">
						<div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
							<CheckCircle2 className="w-8 h-8 text-green-400" />
						</div>
						<div className="text-lg font-semibold mb-1">1. 견적 분석</div>
						<div className="text-sm text-gray-400">AI 기반 견적 분석 완료</div>
						<div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
							완료
						</div>
					</div>

					{/* 2단계 - 완료 */}
					<div className="flex flex-col items-center text-center">
						<div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
							<CheckCircle2 className="w-8 h-8 text-green-400" />
						</div>
						<div className="text-lg font-semibold mb-1">2. 비교 결과</div>
						<div className="text-sm text-gray-400">시장 대비 가격 비교</div>
						<div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
							완료
						</div>
					</div>

					{/* 3단계 - 완료 */}
					<div className="flex flex-col items-center text-center">
						<div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
							<CheckCircle2 className="w-8 h-8 text-green-400" />
						</div>
						<div className="text-lg font-semibold mb-1">3. 전문가 의견</div>
						<div className="text-sm text-gray-400">항목별 전문가 검토</div>
						<div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
							완료
						</div>
					</div>

					{/* 4단계 - 추후 도입 예정 */}
					<div className="flex flex-col items-center text-center opacity-50">
						<div className="w-16 h-16 rounded-full bg-gray-600/20 border-2 border-gray-600 flex items-center justify-center mb-4">
							<Lock className="w-8 h-8 text-gray-500" />
						</div>
						<div className="text-lg font-semibold mb-1">4. 후속 서비스</div>
						<div className="text-sm text-gray-400">추가 견적 · 계약 · 현장 지원</div>
						<div className="mt-2 px-3 py-1 bg-gray-600/20 text-gray-500 text-xs font-semibold rounded-full">
							추후 도입 예정
						</div>
					</div>
				</div>

				<div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
					<p className="text-sm text-blue-300 text-center">
						<Info className="w-4 h-4 inline-block mr-1" />
						추가 견적, 계약 지원, 현장 지원이 필요하시면 ZipCheck 네트워크를 통해 연계해 드립니다. (서비스 준비 중)
					</p>
				</div>
			</motion.div>
			</div>
		</div>
	)
}
