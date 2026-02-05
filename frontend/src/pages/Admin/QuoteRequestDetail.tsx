import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Play, User, Home, FileText, Calendar, Phone, Mail, MapPin, AlertTriangle, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import AnalysisResultView from '../../components/analysis/AnalysisResultView'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'
import { adminPath } from '../../lib/admin-path'

interface QuoteItem {
	category?: string
	itemName?: string
	item_name?: string
	quantity?: number
	unit?: string
	unitPrice?: number
	unit_price?: number
	totalPrice?: number
	total_price?: number
	quoted_price?: number
	notes?: string
	specification?: string
}

interface QuoteRequest {
	id: string
	customer_name: string
	customer_phone: string
	customer_email?: string
	property_type: string
	property_size: number
	region: string
	address?: string
	items: QuoteItem[]
	status: 'pending' | 'analyzing' | 'completed' | 'rejected'
	created_at: string
	updated_at: string
	analyzed_at?: string
	analyzed_by?: string
	analysis_result?: Record<string, unknown>
	validation_status?: string
	validation_notes?: string
}

const statusLabels: Record<string, string> = {
	pending: '대기중',
	analyzing: '분석중',
	completed: '완료',
	rejected: '거부'
}

const statusColors: Record<string, string> = {
	pending: 'bg-amber-50 text-amber-700 border-amber-200',
	analyzing: 'bg-blue-50 text-blue-700 border-blue-200',
	completed: 'bg-green-50 text-green-700 border-green-200',
	rejected: 'bg-red-50 text-red-700 border-red-200'
}

const getCategoryColor = (category: string): string => {
	const colors: Record<string, string> = {
		'설계': 'bg-purple-50 text-purple-700', '철거': 'bg-red-50 text-red-700',
		'목공': 'bg-amber-50 text-amber-700', '전기': 'bg-yellow-50 text-yellow-700',
		'배관': 'bg-blue-50 text-blue-700', '타일': 'bg-cyan-50 text-cyan-700',
		'도배': 'bg-green-50 text-green-700', '조명': 'bg-indigo-50 text-indigo-700',
		'가구': 'bg-pink-50 text-pink-700', '주방': 'bg-orange-50 text-orange-700',
		'욕실': 'bg-teal-50 text-teal-700', '바닥': 'bg-stone-50 text-stone-700',
		'창호': 'bg-sky-50 text-sky-700', '페인트': 'bg-rose-50 text-rose-700',
	}
	return colors[category] || 'bg-sand-100 text-sand-700'
}

export default function QuoteRequestDetail() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { token } = useAuth()
	const [request, setRequest] = useState<QuoteRequest | null>(null)
	const [loading, setLoading] = useState(true)
	const [analyzing, setAnalyzing] = useState(false)
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (id) fetchRequest()
	}, [id])

	const fetchRequest = async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl(`/api/quote-requests/admin/${id}`), {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			if (!response.ok) throw new Error('Failed to fetch')
			const data = await response.json()
			setRequest(data)
		} catch (error) {
			console.error('Failed to fetch quote request:', error)
			alert('견적 신청 정보를 불러오는데 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const runAutoAnalysis = async () => {
		if (!confirm('이 견적에 대해 자동 분석을 실행하시겠습니까?')) return

		setAnalyzing(true)
		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/admin/${id}/auto-analyze`),
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
				}
			)

			if (!response.ok) {
				const err = await response.json().catch(() => ({ error: '분석 실행 실패' }))
				throw new Error(err.error || '분석 실행 실패')
			}

			const result = await response.json()
			alert(`분석 완료: ${result.data.grade.label}등급 (${result.data.totalScore}점)`)
			await fetchRequest()
		} catch (error) {
			console.error('Auto-analysis failed:', error)
			alert('분석 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setAnalyzing(false)
		}
	}

	const deleteRequest = async () => {
		if (!confirm('이 견적 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

		setDeleting(true)
		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/admin/${id}`),
				{
					method: 'DELETE',
					headers: { 'Authorization': `Bearer ${token}` }
				}
			)
			if (!response.ok) throw new Error('삭제 실패')
			navigate(adminPath('/quote-requests'))
		} catch (error) {
			console.error('Delete failed:', error)
			alert('삭제 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setDeleting(false)
		}
	}

	const totalAmount = request?.items?.reduce((sum, item) => {
		return sum + ((item.totalPrice || item.total_price || item.quoted_price || 0) as number)
	}, 0) || 0

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-forest-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-sand-700 text-sm">로딩 중...</p>
				</div>
			</div>
		)
	}

	if (!request) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<FileText className="w-12 h-12 mx-auto mb-4 text-sand-600" />
					<p className="text-sand-700">견적 신청을 찾을 수 없습니다.</p>
				</div>
			</div>
		)
	}

	// Extract analysis result data for AnalysisResultView
	const analysisResult = request.analysis_result
	const hasAnalysis = request.status === 'completed' && analysisResult

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Link
					to={adminPath('/quote-requests')}
					className="inline-flex items-center gap-1.5 text-sm text-sand-700 hover:text-forest-600 transition-colors mb-3"
				>
					<span>&larr;</span>
					<span>견적 목록</span>
				</Link>

				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
							견적 상세
						</h2>
						<p className="text-sand-700 text-sm mt-1">ID: {request.id}</p>
					</div>

					<div className="flex items-center gap-3">
						<span className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${statusColors[request.status]}`}>
							{statusLabels[request.status]}
						</span>

						{request.status === 'pending' && (
							<button
								onClick={runAutoAnalysis}
								disabled={analyzing}
								className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
									analyzing
										? 'bg-sand-100 text-sand-600 border border-sand-300 cursor-not-allowed'
										: 'bg-forest-600 hover:bg-forest-700 text-white'
								}`}
							>
								{analyzing ? (
									<>
										<RefreshCw className="w-4 h-4 animate-spin" />
										분석 중...
									</>
								) : (
									<>
										<Play className="w-4 h-4" />
										자동 분석 실행
									</>
								)}
							</button>
						)}

						{hasAnalysis && analysisResult?.analysisId && (
							<Link
								to={adminPath(`/analyses/${String(analysisResult.analysisId)}`)}
								className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
							>
								<ExternalLink className="w-4 h-4" />
								고급 워크스페이스
							</Link>
						)}

						<button
							onClick={deleteRequest}
							disabled={deleting}
							className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
								deleting
									? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
									: 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600'
							}`}
						>
							<Trash2 className="w-4 h-4" />
							삭제
						</button>
					</div>
				</div>
			</div>

			{/* Validation warnings */}
			{request.validation_status === 'rejected_insufficient_detail' && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5"
				>
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<h3 className="text-base font-bold text-red-800 mb-1">세부항목 부족으로 거부됨</h3>
							<p className="text-sm text-red-700">{request.validation_notes}</p>
						</div>
					</div>
				</motion.div>
			)}

			{request.validation_status === 'pending' && request.validation_notes && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-5"
				>
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
						<div>
							<h3 className="text-base font-bold text-amber-800 mb-1">관리자 검토 필요</h3>
							<p className="text-sm text-amber-700">{request.validation_notes}</p>
						</div>
					</div>
				</motion.div>
			)}

			{/* Customer & Property info */}
			<div className="grid md:grid-cols-2 gap-4">
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="bg-white rounded-2xl p-5 border border-sand-300"
				>
					<div className="flex items-center gap-3 mb-5">
						<div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center">
							<User className="w-5 h-5 text-forest-600" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">고객 정보</h3>
					</div>
					<div className="space-y-4">
						<div>
							<div className="text-xs text-sand-700 mb-0.5">이름</div>
							<div className="text-base font-semibold text-sand-900">{request.customer_name}</div>
						</div>
						<div className="flex items-center gap-2">
							<Phone className="w-4 h-4 text-sand-600" />
							<div>
								<div className="text-xs text-sand-700">전화번호</div>
								<div className="font-mono text-sand-700">{request.customer_phone}</div>
							</div>
						</div>
						{request.customer_email && (
							<div className="flex items-center gap-2">
								<Mail className="w-4 h-4 text-sand-600" />
								<div>
									<div className="text-xs text-sand-700">이메일</div>
									<div className="text-sand-700">{request.customer_email}</div>
								</div>
							</div>
						)}
						<div className="flex items-center gap-2">
							<Calendar className="w-4 h-4 text-sand-600" />
							<div>
								<div className="text-xs text-sand-700">신청일시</div>
								<div className="text-sand-700">{new Date(request.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</div>
							</div>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					className="bg-white rounded-2xl p-5 border border-sand-300"
				>
					<div className="flex items-center gap-3 mb-5">
						<div className="w-9 h-9 rounded-xl bg-wood-100 flex items-center justify-center">
							<Home className="w-5 h-5 text-wood-500" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">인테리어 시공 정보</h3>
					</div>
					<div className="space-y-4">
						<div>
							<div className="text-xs text-sand-700 mb-0.5">건물 유형</div>
							<div className="text-base font-semibold text-sand-900">{request.property_type}</div>
						</div>
						<div>
							<div className="text-xs text-sand-700 mb-0.5">시공 면적</div>
							<div className="text-base font-semibold text-sand-900">
								{request.property_size}㎡
								{request.property_size && (
									<span className="text-sand-700 text-sm ml-2">
										(약 {(request.property_size / 3.3058).toFixed(1)}평)
									</span>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="w-4 h-4 text-sand-600" />
							<div>
								<div className="text-xs text-sand-700">지역</div>
								<div className="text-sand-700">{request.region}</div>
							</div>
						</div>
						{request.address && (
							<div>
								<div className="text-xs text-sand-700 mb-0.5">상세 주소</div>
								<div className="text-sm text-sand-700">{request.address}</div>
							</div>
						)}
					</div>
				</motion.div>
			</div>

			{/* Quote items */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="bg-white rounded-2xl p-5 border border-sand-300"
			>
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center">
							<FileText className="w-5 h-5 text-forest-600" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">견적 항목</h3>
					</div>
					<div className="text-right">
						<div className="text-xs text-sand-700">총 견적액</div>
						<div className="text-2xl font-bold text-sand-900">{totalAmount.toLocaleString()}원</div>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-sand-300">
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">카테고리</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">항목명</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">수량</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">단가</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">금액</th>
							</tr>
						</thead>
						<tbody>
							{(request.items || []).map((item, index) => {
								const category = item.category || ''
								const name = item.itemName || item.item_name || ''
								const price = item.totalPrice || item.total_price || item.quoted_price || 0
								const unitPrice = item.unitPrice || item.unit_price || 0
								return (
									<tr key={index} className="border-b border-sand-100">
										<td className="py-3 px-4">
											<span className={`px-3 py-1 ${getCategoryColor(category)} rounded-full text-xs font-semibold`}>
												{category || '—'}
											</span>
										</td>
										<td className="py-3 px-4 font-semibold text-sand-900">{name || '—'}</td>
										<td className="py-3 px-4 text-right text-sm text-sand-700">
											{item.quantity || '—'} {item.unit || ''}
										</td>
										<td className="py-3 px-4 text-right text-sm text-sand-700">
											{unitPrice ? unitPrice.toLocaleString() + '원' : '—'}
										</td>
										<td className="py-3 px-4 text-right font-semibold text-sand-900">
											{(price as number).toLocaleString()}원
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</motion.div>

			{/* Analysis Result (설계서 기준) */}
			{hasAnalysis && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<div className="mb-5">
						<h3 className="text-xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
							집첵 분석 결과
						</h3>
						<p className="text-sand-700 text-sm mt-1">
							분석 완료: {request.analyzed_at && new Date(request.analyzed_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
							{request.analyzed_by && ` · ${request.analyzed_by}`}
						</p>
					</div>

					<AnalysisResultView
						scoreBreakdown={{
							categories: (analysisResult.categories as Array<{ category: string; weight: number; avg_deviation: number; item_count: number; score: number }>) || [],
							bonuses: (analysisResult.bonuses as Array<{ type: string; label: string; points: number; reason?: string }>) || [],
							penalties: (analysisResult.penalties as Array<{ type: string; label: string; points: number; reason?: string }>) || [],
							weighted_sum: (analysisResult.weighted_sum as number) || 0,
							final_score: (analysisResult.final_score as number) || 0,
						}}
						adjustmentFactors={analysisResult.adjustmentFactors as Record<string, number> | undefined}
						items={analysisResult.items as Array<{
							original_category: string | null; original_item_name: string | null;
							original_unit_price: number | null; original_total_price: number | null;
							original_quantity: number | null; original_unit: string | null;
							std_category: string | null; std_item: string | null;
							benchmark_unit_price: number | null; adjusted_benchmark_price: number | null;
							deviation_percent: number | null; deviation_bracket: string | null;
							is_bundled: boolean; confidence: number;
						}> | undefined}
						customerName={request.customer_name}
						propertyInfo={`${request.property_type} ${request.property_size}㎡ · ${request.region}`}
						region={request.region}
						propertySizePyeong={request.property_size ? request.property_size / 3.3058 : undefined}
						benchmarkCount={(analysisResult.benchmarkCount as number) || undefined}
						propertyType={request.property_type}
						isVatIncluded={analysisResult.is_vat_included as boolean | null | undefined}
						completeness={analysisResult.completeness as 'full' | 'partial' | 'minimal' | undefined}
					/>
				</motion.div>
			)}
		</div>
	)
}
