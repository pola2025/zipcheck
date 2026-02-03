import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, User, Home, FileText, Calendar, Phone, Mail, MapPin, MessageSquare, Save, AlertTriangle, ChevronDown, ChevronUp, Edit, X } from 'lucide-react'
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
	pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
	analyzing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
	completed: 'bg-green-500/20 text-green-400 border-green-500/30',
	rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
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

			alert('✅ 전문가 의견이 저장되었습니다!')
			await fetchRequest()
		} catch (error) {
			console.error('Failed to save expert notes:', error)
			alert('❌ 전문가 의견 저장 실패: ' + (error instanceof Error ? error.message : String(error)))
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

			alert('✅ 집첵 견적 분석이 완료되었습니다!')
			await fetchRequest()
		} catch (error) {
			console.error('Analysis failed:', error)
			alert('❌ 집첵 견적 분석 실패: ' + (error instanceof Error ? error.message : String(error)))
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

			alert('✅ 분석 결과가 수정되었습니다!')
			await fetchRequest()
			setIsEditingAnalysis(false)
			setEditedAnalysis(null)
		} catch (error) {
			console.error('Failed to update analysis:', error)
			alert('❌ 분석 결과 수정 실패: ' + (error instanceof Error ? error.message : String(error)))
		}
	}

	const totalAmount = request?.items.reduce((sum, item) => sum + item.totalPrice, 0) || 0

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-400">로딩 중...</p>
				</div>
			</div>
		)
	}

	if (!request) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
					<p className="text-gray-400">견적 신청을 찾을 수 없습니다.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
			<div className="max-w-7xl mx-auto">
				{/* 헤더 */}
				<div className="mb-8">
					<button
						onClick={() => navigate(adminPath('/quote-requests'))}
						className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						<span>목록으로 돌아가기</span>
					</button>

					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
								견적 신청 상세
							</h1>
							<p className="text-gray-400">요청 ID: {request.id}</p>
						</div>

						<div className="flex items-center gap-4">
							<span
								className={`px-6 py-3 rounded-full text-sm font-bold border-2 ${
									statusColors[request.status]
								}`}
							>
								{statusLabels[request.status]}
							</span>

							{request.status === 'pending' && (
								<button
									onClick={runAnalysis}
									disabled={analyzing}
									className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
										analyzing
											? 'bg-blue-500/20 border-2 border-blue-500/50 cursor-not-allowed'
											: 'bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50'
									}`}
								>
									<Play className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
									{analyzing ? '집첵 견적 분석 중...' : '집첵 견적 분석 실행'}
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
						className="mb-6 bg-red-500/10 border-l-4 border-red-500 rounded-lg p-6"
					>
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-7 h-7 text-red-400 flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<h3 className="text-xl font-bold text-red-300 mb-2">⚠️ 세부항목 부족으로 거부됨</h3>
								<p className="text-sm text-red-200/90 mb-3 whitespace-pre-line">
									{request.validation_notes}
								</p>
								<div className="bg-red-500/20 rounded-lg p-3 text-xs text-red-200">
									<p className="font-semibold mb-1">📞 고객 안내 필요</p>
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
						className="mb-6 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-6"
					>
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
							<div>
								<h3 className="text-lg font-bold text-amber-300 mb-1">관리자 검토 필요</h3>
								<p className="text-sm text-amber-200/80">
									{request.validation_notes}
								</p>
							</div>
						</div>
					</motion.div>
				)}

				{/* 고객 & 인테리어 시공 정보 */}
				<div className="grid md:grid-cols-2 gap-6 mb-8">
					{/* 고객 정보 */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
					>
						<div className="flex items-center gap-3 mb-6">
							<User className="w-6 h-6 text-cyan-400" />
							<h2 className="text-2xl font-bold">고객 정보</h2>
						</div>

						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-400 mb-1">이름</div>
								<div className="text-lg font-semibold">{request.customer_name}</div>
							</div>

							<div className="flex items-center gap-2">
								<Phone className="w-4 h-4 text-gray-400" />
								<div>
									<div className="text-sm text-gray-400">전화번호</div>
									<div className="font-mono">{request.customer_phone}</div>
								</div>
							</div>

							{request.customer_email && (
								<div className="flex items-center gap-2">
									<Mail className="w-4 h-4 text-gray-400" />
									<div>
										<div className="text-sm text-gray-400">이메일</div>
										<div>{request.customer_email}</div>
									</div>
								</div>
							)}

							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-400" />
								<div>
									<div className="text-sm text-gray-400">신청일시</div>
									<div>{new Date(request.created_at).toLocaleString('ko-KR')}</div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* 인테리어 시공 정보 */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
					>
						<div className="flex items-center gap-3 mb-6">
							<Home className="w-6 h-6 text-purple-400" />
							<h2 className="text-2xl font-bold">인테리어 시공 정보</h2>
						</div>

						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-400 mb-1">건물 유형</div>
								<div className="text-lg font-semibold">{request.property_type}</div>
							</div>

							<div>
								<div className="text-sm text-gray-400 mb-1">시공 면적</div>
								<div className="text-lg font-semibold">
									{request.property_size}㎡
									{request.property_size && (
										<span className="text-gray-400 text-sm ml-2">
											(약 {(request.property_size / 3.3058).toFixed(1)}평)
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<MapPin className="w-4 h-4 text-gray-400" />
								<div>
									<div className="text-sm text-gray-400">지역</div>
									<div>{request.region}</div>
								</div>
							</div>

							{request.address && (
								<div>
									<div className="text-sm text-gray-400 mb-1">상세 주소</div>
									<div className="text-sm">{request.address}</div>
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
					className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8"
				>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<FileText className="w-6 h-6 text-cyan-400" />
							<h2 className="text-2xl font-bold">견적 항목</h2>
						</div>
						<div className="text-right">
							<div className="text-sm text-gray-400">총 견적액</div>
							<div className="text-3xl font-bold text-purple-400">
								{totalAmount.toLocaleString()}원
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-700">
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										카테고리
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										항목명
									</th>
									<th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
										수량
									</th>
									<th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
										단가
									</th>
									<th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
										금액
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										비고
									</th>
								</tr>
							</thead>
							<tbody>
								{(request.items || []).map((item, index) => (
									<tr key={index} className="border-b border-gray-700/50">
										<td className="py-3 px-4">
											<span className={`px-3 py-1 ${getCategoryColor(item.category)} rounded-full text-xs font-semibold`}>
												{item.category}
											</span>
										</td>
										<td className="py-3 px-4 font-semibold">{item.itemName}</td>
										<td className="py-3 px-4 text-right text-sm text-gray-300">
											{item.quantity || 0} {item.unit || ''}
										</td>
										<td className="py-3 px-4 text-right text-sm text-gray-300">
											{(item.unitPrice || 0).toLocaleString()}원
										</td>
										<td className="py-3 px-4 text-right font-semibold text-purple-400">
											{(item.totalPrice || 0).toLocaleString()}원
										</td>
										<td className="py-3 px-4 text-sm text-gray-400">{item.notes || ''}</td>
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
						className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30 mb-8"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<MessageSquare className="w-6 h-6 text-amber-400" />
								<div>
									<h2 className="text-2xl font-bold text-amber-300">전문가 의견 작성</h2>
									<p className="text-sm text-amber-400/70 mt-1">
										특이사항이 있는 항목에 대해 전문가 의견을 작성하세요. (선택사항)
									</p>
								</div>
							</div>
							<button
								onClick={() => setIsExpertSectionExpanded(!isExpertSectionExpanded)}
								className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50"
							>
								{isExpertSectionExpanded ? (
									<>
										<ChevronUp className="w-5 h-5" />
										접기
									</>
								) : (
									<>
										<ChevronDown className="w-5 h-5" />
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
									<div className="space-y-4 mt-6">
										{(request.items || []).map((item, index) => {
											const itemKey = `${item.category}-${item.itemName}`
											return (
												<div
													key={index}
													className="bg-gray-800/50 rounded-xl p-4 border border-amber-500/20"
												>
													<div className="flex items-center justify-between mb-3">
														<div>
															<span className={`px-3 py-1 ${getCategoryColor(item.category)} rounded-full text-xs font-semibold mr-2`}>
																{item.category}
															</span>
															<span className="font-semibold text-white">{item.itemName}</span>
														</div>
														<div className="text-sm text-gray-400">
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
														className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
														rows={2}
													/>
												</div>
											)
										})}
										<div className="flex justify-end pt-4">
											<button
												onClick={saveExpertNotes}
												disabled={savingNotes}
												className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
													savingNotes
														? 'bg-amber-500/20 border-2 border-amber-500/50 cursor-not-allowed'
														: 'bg-amber-500/30 hover:bg-amber-500/40 border-2 border-amber-500/50'
												}`}
											>
												<Save className={`w-5 h-5 ${savingNotes ? 'animate-spin' : ''}`} />
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
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
									집첵 견적 분석 결과
								</h2>
								<p className="text-gray-400">
									분석 완료: {request.analyzed_at && new Date(request.analyzed_at).toLocaleString('ko-KR')}
									{request.analyzed_by && ` • 분석자: ${request.analyzed_by}`}
								</p>
							</div>
							{!isEditingAnalysis ? (
								<button
									onClick={startEditingAnalysis}
									className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50"
								>
									<Edit className="w-5 h-5" />
									분석 결과 수정
								</button>
							) : (
								<div className="flex gap-2">
									<button
										onClick={cancelEditingAnalysis}
										className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500/30 border-2 border-gray-500/50"
									>
										<X className="w-5 h-5" />
										취소
									</button>
									<button
										onClick={saveAnalysisChanges}
										className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50"
									>
										<Save className="w-5 h-5" />
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
							<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
								<div className="mb-4">
									<h3 className="text-lg font-bold text-amber-300 mb-2">📝 분석 결과 편집</h3>
									<p className="text-sm text-amber-400/70">
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
									className="w-full h-96 bg-gray-900/80 border border-amber-500/30 rounded-lg p-4 text-sm text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
									spellCheck={false}
								/>
								<div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
									<p className="text-xs text-amber-300">
										<strong>주의:</strong> JSON 형식이 올바르지 않으면 저장할 수 없습니다.
										수정 후 반드시 유효성을 확인하세요.
									</p>
								</div>
							</div>
						)}
					</motion.div>
				)}
			</div>
		</div>
	)
}
