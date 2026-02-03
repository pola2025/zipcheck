import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Play, User, Home, FileText, Calendar, Phone, Mail, MapPin, MessageSquare, Save, AlertTriangle, ChevronDown, ChevronUp, Edit, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QuoteAnalysisVisual from 'components/QuoteAnalysis/QuoteAnalysisVisual'
import QuoteAnalysisRealistic from 'components/QuoteAnalysis/QuoteAnalysisRealistic'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'
import { adminPath } from '../../lib/admin-path'

interface QuoteItem {
	category: string
	itemName: string
	quantity: number
	unit: string
	unitPrice: number
	totalPrice: number
	notes?: string
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
	analysis_result?: any
	admin_notes?: string
	expert_item_notes?: Record<string, string> // { "category-item": "expert note" }
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

// 카테고리별 색상 매핑
const getCategoryColor = (category: string): string => {
	const colors: Record<string, string> = {
		'설계': 'bg-purple-50 text-purple-700',
		'철거': 'bg-red-50 text-red-700',
		'목공': 'bg-amber-50 text-amber-700',
		'전기': 'bg-yellow-50 text-yellow-700',
		'배관': 'bg-blue-50 text-blue-700',
		'타일': 'bg-cyan-50 text-cyan-700',
		'도배': 'bg-green-50 text-green-700',
		'조명': 'bg-indigo-50 text-indigo-700',
		'가구': 'bg-pink-50 text-pink-700',
		'주방': 'bg-orange-50 text-orange-700',
		'욕실': 'bg-teal-50 text-teal-700',
		'바닥': 'bg-stone-50 text-stone-700',
		'창호': 'bg-sky-50 text-sky-700',
		'페인트': 'bg-rose-50 text-rose-700'
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
	const [expertNotes, setExpertNotes] = useState<Record<string, string>>({})
	const [savingNotes, setSavingNotes] = useState(false)
	const [isExpertSectionExpanded, setIsExpertSectionExpanded] = useState(false)
	const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
	const [editedAnalysis, setEditedAnalysis] = useState<any>(null)

	useEffect(() => {
		if (id) {
			fetchRequest()
		}
	}, [id])

	const fetchRequest = async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl(`/api/quote-requests/admin/${id}`), {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (!response.ok) throw new Error('Failed to fetch request')
			const data = await response.json()
			setRequest(data)
			// Load existing expert notes
			setExpertNotes(data.expert_item_notes || {})
		} catch (error) {
			console.error('Failed to fetch quote request:', error)
			alert('견적 신청 정보를 불러오는데 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const saveExpertNotes = async () => {
		if (!id) return

		setSavingNotes(true)
		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/admin/${id}/expert-notes`),
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ expert_item_notes: expertNotes })
				}
			)

			if (!response.ok) throw new Error('전문가 의견 저장 실패')

			alert('전문가 의견이 저장되었습니다!')
			await fetchRequest()
		} catch (error) {
			console.error('Failed to save expert notes:', error)
			alert('전문가 의견 저장 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setSavingNotes(false)
		}
	}

	const runAnalysis = async () => {
		if (!confirm('이 견적에 대해 집첵 견적 분석을 실행하시겠습니까?')) return

		setAnalyzing(true)
		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/admin/${id}/analyze`),
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ analyzed_by: 'admin' })
				}
			)

			if (!response.ok) throw new Error('분석 실행 실패')

			alert('집첵 견적 분석이 완료되었습니다!')
			await fetchRequest()
		} catch (error) {
			console.error('Analysis failed:', error)
			alert('집첵 견적 분석 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setAnalyzing(false)
		}
	}

	const startEditingAnalysis = () => {
		if (request?.analysis_result) {
			setEditedAnalysis(JSON.parse(JSON.stringify(request.analysis_result)))
			setIsEditingAnalysis(true)
		}
	}

	const cancelEditingAnalysis = () => {
		setIsEditingAnalysis(false)
		setEditedAnalysis(null)
	}

	const saveAnalysisChanges = async () => {
		if (!id || !editedAnalysis) return

		if (!confirm('분석 결과를 수정하시겠습니까?')) return

		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/admin/${id}/analysis-result`),
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ analysis_result: editedAnalysis })
				}
			)

			if (!response.ok) throw new Error('분석 결과 수정 실패')

			alert('분석 결과가 수정되었습니다!')
			await fetchRequest()
			setIsEditingAnalysis(false)
			setEditedAnalysis(null)
		} catch (error) {
			console.error('Failed to update analysis:', error)
			alert('분석 결과 수정 실패: ' + (error instanceof Error ? error.message : String(error)))
		}
	}

	const totalAmount = request?.items.reduce((sum, item) => sum + item.totalPrice, 0) || 0

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-forest-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-sand-500 text-sm">로딩 중...</p>
				</div>
			</div>
		)
	}

	if (!request) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<FileText className="w-12 h-12 mx-auto mb-4 text-sand-400" />
					<p className="text-sand-500">견적 신청을 찾을 수 없습니다.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* 헤더 */}
			<div>
				<Link
					to={adminPath('/quote-requests')}
					className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-600 transition-colors mb-3"
				>
					<span>&larr;</span>
					<span>견적 요청 목록</span>
				</Link>

				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
							견적 신청 상세
						</h2>
						<p className="text-sand-500 text-sm mt-1">요청 ID: {request.id}</p>
					</div>

					<div className="flex items-center gap-3">
						<span
							className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${
								statusColors[request.status]
							}`}
						>
							{statusLabels[request.status]}
						</span>

						{request.status === 'pending' && (
							<button
								onClick={runAnalysis}
								disabled={analyzing}
								className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
									analyzing
										? 'bg-sand-100 text-sand-400 border border-sand-200 cursor-not-allowed'
										: 'bg-forest-600 hover:bg-forest-700 text-white'
								}`}
							>
								<Play className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
								{analyzing ? '분석 중...' : '집첵 견적 분석 실행'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* 검증 상태 경고 */}
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
							<p className="text-sm text-red-700 mb-3 whitespace-pre-line">
								{request.validation_notes}
							</p>
							<div className="bg-red-100 rounded-lg p-3 text-xs text-red-700">
								<p className="font-semibold mb-1">고객 안내 필요</p>
								<p>고객에게 연락하여 세부 시공 항목이 포함된 견적서를 다시 제출하도록 안내해주세요.</p>
							</div>
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
							<p className="text-sm text-amber-700">
								{request.validation_notes}
							</p>
						</div>
					</div>
				</motion.div>
			)}

			{/* 고객 & 인테리어 시공 정보 */}
			<div className="grid md:grid-cols-2 gap-4">
				{/* 고객 정보 */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="bg-white rounded-2xl p-5 border border-sand-200"
				>
					<div className="flex items-center gap-3 mb-5">
						<div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center">
							<User className="w-5 h-5 text-forest-600" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">고객 정보</h3>
					</div>

					<div className="space-y-4">
						<div>
							<div className="text-xs text-sand-500 mb-0.5">이름</div>
							<div className="text-base font-semibold text-sand-900">{request.customer_name}</div>
						</div>

						<div className="flex items-center gap-2">
							<Phone className="w-4 h-4 text-sand-400" />
							<div>
								<div className="text-xs text-sand-500">전화번호</div>
								<div className="font-mono text-sand-700">{request.customer_phone}</div>
							</div>
						</div>

						{request.customer_email && (
							<div className="flex items-center gap-2">
								<Mail className="w-4 h-4 text-sand-400" />
								<div>
									<div className="text-xs text-sand-500">이메일</div>
									<div className="text-sand-700">{request.customer_email}</div>
								</div>
							</div>
						)}

						<div className="flex items-center gap-2">
							<Calendar className="w-4 h-4 text-sand-400" />
							<div>
								<div className="text-xs text-sand-500">신청일시</div>
								<div className="text-sand-700">{new Date(request.created_at).toLocaleString('ko-KR')}</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* 인테리어 시공 정보 */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					className="bg-white rounded-2xl p-5 border border-sand-200"
				>
					<div className="flex items-center gap-3 mb-5">
						<div className="w-9 h-9 rounded-xl bg-wood-100 flex items-center justify-center">
							<Home className="w-5 h-5 text-wood-500" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">인테리어 시공 정보</h3>
					</div>

					<div className="space-y-4">
						<div>
							<div className="text-xs text-sand-500 mb-0.5">건물 유형</div>
							<div className="text-base font-semibold text-sand-900">{request.property_type}</div>
						</div>

						<div>
							<div className="text-xs text-sand-500 mb-0.5">시공 면적</div>
							<div className="text-base font-semibold text-sand-900">
								{request.property_size}㎡
								{request.property_size && (
									<span className="text-sand-500 text-sm ml-2">
										(약 {(request.property_size / 3.3058).toFixed(1)}평)
									</span>
								)}
							</div>
						</div>

						<div className="flex items-center gap-2">
							<MapPin className="w-4 h-4 text-sand-400" />
							<div>
								<div className="text-xs text-sand-500">지역</div>
								<div className="text-sand-700">{request.region}</div>
							</div>
						</div>

						{request.address && (
							<div>
								<div className="text-xs text-sand-500 mb-0.5">상세 주소</div>
								<div className="text-sm text-sand-700">{request.address}</div>
							</div>
						)}
					</div>
				</motion.div>
			</div>

			{/* 견적 항목 */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="bg-white rounded-2xl p-5 border border-sand-200"
			>
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center">
							<FileText className="w-5 h-5 text-forest-600" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">견적 항목</h3>
					</div>
					<div className="text-right">
						<div className="text-xs text-sand-500">총 견적액</div>
						<div className="text-2xl font-bold text-sand-900">
							{totalAmount.toLocaleString()}원
						</div>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-sand-200">
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-500">
									카테고리
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-500">
									항목명
								</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-500">
									수량
								</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-500">
									단가
								</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-500">
									금액
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-500">
									비고
								</th>
							</tr>
						</thead>
						<tbody>
							{(request.items || []).map((item, index) => (
								<tr key={index} className="border-b border-sand-100">
									<td className="py-3 px-4">
										<span className={`px-3 py-1 ${getCategoryColor(item.category)} rounded-full text-xs font-semibold`}>
											{item.category}
										</span>
									</td>
									<td className="py-3 px-4 font-semibold text-sand-900">{item.itemName}</td>
									<td className="py-3 px-4 text-right text-sm text-sand-700">
										{item.quantity || 0} {item.unit || ''}
									</td>
									<td className="py-3 px-4 text-right text-sm text-sand-700">
										{(item.unitPrice || 0).toLocaleString()}원
									</td>
									<td className="py-3 px-4 text-right font-semibold text-sand-900">
										{(item.totalPrice || 0).toLocaleString()}원
									</td>
									<td className="py-3 px-4 text-sm text-sand-500">{item.notes || ''}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</motion.div>

			{/* 전문가 의견 작성 */}
			{request.status !== 'rejected' && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
					className="bg-amber-50 rounded-2xl p-5 border border-amber-200"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
								<MessageSquare className="w-5 h-5 text-amber-600" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-amber-900">전문가 의견 작성</h3>
								<p className="text-xs text-amber-600 mt-0.5">
									특이사항이 있는 항목에 대해 전문가 의견을 작성하세요. (선택사항)
								</p>
							</div>
						</div>
						<button
							onClick={() => setIsExpertSectionExpanded(!isExpertSectionExpanded)}
							className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
						>
							{isExpertSectionExpanded ? (
								<>
									<ChevronUp className="w-4 h-4" />
									접기
								</>
							) : (
								<>
									<ChevronDown className="w-4 h-4" />
									전문가 의견 작성하기
								</>
							)}
						</button>
					</div>

					<AnimatePresence>
						{isExpertSectionExpanded && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.3 }}
								className="overflow-hidden"
							>
								<div className="space-y-4 mt-5">
									{(request.items || []).map((item, index) => {
										const itemKey = `${item.category}-${item.itemName}`
										return (
											<div
												key={index}
												className="bg-white rounded-xl p-4 border border-amber-200"
											>
												<div className="flex items-center justify-between mb-3">
													<div>
														<span className={`px-3 py-1 ${getCategoryColor(item.category)} rounded-full text-xs font-semibold mr-2`}>
															{item.category}
														</span>
														<span className="font-semibold text-sand-900">{item.itemName}</span>
													</div>
													<div className="text-sm text-sand-500">
														{(item.totalPrice || 0).toLocaleString()}원
													</div>
												</div>
												<textarea
													value={expertNotes[itemKey] || ''}
													onChange={(e) => setExpertNotes({
														...expertNotes,
														[itemKey]: e.target.value
													})}
													placeholder="특이사항이 있다면 전문가 의견을 입력하세요... (예: 시공 자재가 적절하게 선정되었습니다, 해당 항목은 추가 면적이 필요할 수 있습니다 등)"
													className="w-full bg-sand-50 border border-sand-200 rounded-lg p-3 text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-300 resize-none"
													rows={2}
												/>
											</div>
										)
									})}
									<div className="flex justify-end pt-3">
										<button
											onClick={saveExpertNotes}
											disabled={savingNotes}
											className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
												savingNotes
													? 'bg-sand-100 text-sand-400 border border-sand-200 cursor-not-allowed'
													: 'bg-amber-600 hover:bg-amber-700 text-white'
											}`}
										>
											<Save className={`w-4 h-4 ${savingNotes ? 'animate-spin' : ''}`} />
											{savingNotes ? '저장 중...' : '전문가 의견 저장'}
										</button>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			)}

			{/* 집첵 견적 분석 결과 */}
			{request.status === 'completed' && request.analysis_result && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<div className="mb-5 flex items-center justify-between">
						<div>
							<h3 className="text-xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
								집첵 견적 분석 결과
							</h3>
							<p className="text-sand-500 text-sm mt-1">
								분석 완료: {request.analyzed_at && new Date(request.analyzed_at).toLocaleString('ko-KR')}
								{request.analyzed_by && ` \u00b7 분석자: ${request.analyzed_by}`}
							</p>
						</div>
						{!isEditingAnalysis ? (
							<button
								onClick={startEditingAnalysis}
								className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
							>
								<Edit className="w-4 h-4" />
								분석 결과 수정
							</button>
						) : (
							<div className="flex gap-2">
								<button
									onClick={cancelEditingAnalysis}
									className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-sand-100 hover:bg-sand-200 text-sand-700 border border-sand-200"
								>
									<X className="w-4 h-4" />
									취소
								</button>
								<button
									onClick={saveAnalysisChanges}
									className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white"
								>
									<Save className="w-4 h-4" />
									저장
								</button>
							</div>
						)}
					</div>

					{!isEditingAnalysis ? (
						<QuoteAnalysisRealistic
							analysis={request.analysis_result}
							propertySize={request.property_size}
						/>
					) : (
						<div className="bg-white rounded-2xl p-5 border border-amber-200">
							<div className="mb-4">
								<h3 className="text-base font-bold text-amber-900 mb-1">분석 결과 편집</h3>
								<p className="text-xs text-amber-600">
									JSON 형식으로 분석 결과를 직접 수정할 수 있습니다. 올바른 형식을 유지해주세요.
								</p>
							</div>
							<textarea
								value={JSON.stringify(editedAnalysis, null, 2)}
								onChange={(e) => {
									try {
										const parsed = JSON.parse(e.target.value)
										setEditedAnalysis(parsed)
									} catch (err) {
										// Invalid JSON, just update the text
									}
								}}
								className="w-full h-96 bg-sand-50 border border-sand-200 rounded-lg p-4 text-sm text-sand-800 font-mono focus:outline-none focus:ring-2 focus:ring-forest-300 resize-none"
								spellCheck={false}
							/>
							<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
								<p className="text-xs text-amber-700">
									<strong>주의:</strong> JSON 형식이 올바르지 않으면 저장할 수 없습니다.
									수정 후 반드시 유효성을 확인하세요.
								</p>
							</div>
						</div>
					)}
				</motion.div>
			)}
		</div>
	)
}
