import { useState, useEffect } from 'react'
import { FileText, Play, Eye, Filter, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'
import { adminPath } from '../../lib/admin-path'

interface QuoteRequest {
	id: string
	customer_name: string
	customer_phone: string
	property_type: string
	property_size: number
	region: string
	status: 'pending' | 'analyzing' | 'completed' | 'rejected'
	validation_status?: string
	validation_notes?: string
	created_at: string
	analyzed_at?: string
	items: any[]
}

type StatusFilter = 'all' | 'pending' | 'analyzing' | 'completed' | 'rejected'

const statusLabels: Record<StatusFilter, string> = {
	all: '전체',
	pending: '대기중',
	analyzing: '분석중',
	completed: '완료',
	rejected: '거부'
}

const statusColors: Record<string, string> = {
	pending: 'bg-amber-50 text-amber-600 border border-amber-200',
	analyzing: 'bg-blue-50 text-blue-600 border border-blue-200',
	completed: 'bg-green-50 text-green-600 border border-green-200',
	rejected: 'bg-red-50 text-red-600 border border-red-200'
}

export default function QuoteRequests() {
	const [requests, setRequests] = useState<QuoteRequest[]>([])
	const [loading, setLoading] = useState(true)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [analyzingId, setAnalyzingId] = useState<string | null>(null)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const navigate = useNavigate()
	const { token } = useAuth()

	useEffect(() => {
		fetchRequests()
	}, [statusFilter])

	const fetchRequests = async () => {
		setLoading(true)
		try {
			const url = getApiUrl(`/api/quote-requests/admin/all?status=${statusFilter}`)
			console.log('📡 Fetching quote requests:', url)
			console.log('🔑 Token status:', token ? `Present (length: ${token.length})` : 'Missing')

			// 403 에러 디버깅을 위한 추가 정보
			if (token) {
				console.log('🔑 Token prefix:', token.substring(0, 20) + '...')
				console.log('📦 Token from localStorage:', localStorage.getItem('admin_token') ? 'exists' : 'missing')
			}

			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})

			console.log('📊 Response status:', response.status, response.statusText)

			// 403 에러 시 응답 본문 확인
			if (response.status === 403) {
				const errorText = await response.text()
				console.error('🚫 403 Forbidden details:', errorText)

				// 사용자에게 명확한 디버그 정보 표시
				const debugInfo = [
					'403 Forbidden 오류',
					'',
					`토큰 상태: ${token ? `있음 (${token.length}자)` : '없음'}`,
					`localStorage: ${localStorage.getItem('admin_token') ? '있음' : '없음'}`,
					'',
					'해결 방법:',
					'1. 로그아웃 후 다시 로그인',
					'2. 브라우저 새로고침 (Ctrl+Shift+R)',
					'',
					`서버 응답: ${errorText}`
				].join('\n')

				alert(debugInfo)
				throw new Error(`403 Forbidden`)
			}

			if (!response.ok) {
				throw new Error(`API 오류: ${response.status} ${response.statusText}`)
			}

			const result = await response.json()
			console.log('✅ Fetched requests:', result)

			// result.data가 배열인지 확인
			if (Array.isArray(result.data)) {
				setRequests(result.data)
				console.log(`📋 ${result.data.length}개의 견적 신청을 로드했습니다.`)
			} else if (Array.isArray(result)) {
				// 백엔드가 직접 배열을 반환하는 경우
				setRequests(result)
				console.log(`📋 ${result.length}개의 견적 신청을 로드했습니다.`)
			} else {
				console.warn('⚠️ 예상치 못한 응답 형식:', result)
				setRequests([])
			}
		} catch (error) {
			console.error('❌ Failed to fetch quote requests:', error)
			alert('견적 신청 목록을 불러오는데 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)))
			setRequests([])
		} finally {
			setLoading(false)
		}
	}

	const runAnalysis = async (id: string) => {
		if (!confirm('이 견적에 대해 집첵 견적 분석을 실행하시겠습니까?')) return

		setAnalyzingId(id)
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
			await fetchRequests()
		} catch (error) {
			console.error('Analysis failed:', error)
			alert('❌ 집첵 견적 분석 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setAnalyzingId(null)
		}
	}

	const viewDetail = (id: string) => {
		navigate(adminPath(`/quote-requests/${id}`))
	}

	const filteredRequests = requests.filter((req) => {
		const matchesSearch =
			req.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.customer_phone.includes(searchTerm) ||
			req.region.toLowerCase().includes(searchTerm.toLowerCase())
		return matchesSearch
	})

	return (
		<div className="space-y-6">
			{/* 검증 실패 알림 */}
			{requests.some(r => r.validation_status === 'rejected_insufficient_detail') && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-red-50 border-l-4 border-red-400 rounded-2xl p-4"
				>
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
						<div>
							<h3 className="text-lg font-bold text-red-700 mb-1">세부항목 부족으로 거부된 견적이 있습니다</h3>
							<p className="text-sm text-red-600 mb-2">
								{requests.filter(r => r.validation_status === 'rejected_insufficient_detail').length}건의 견적이
								세부 시공 항목이 부족하여 자동으로 거부되었습니다.
							</p>
							<p className="text-xs text-red-500">
								견적 분석을 위해서는 충분한 세부 항목 정보가 필요합니다. 고객에게 연락하여 상세한 견적서를 다시 제출하도록 안내하세요.
							</p>
						</div>
					</div>
				</motion.div>
			)}

			{/* 필터 & 검색 */}
			<div className="bg-white rounded-2xl p-5 border border-sand-300">
				<div className="grid md:grid-cols-2 gap-4">
					{/* 상태 필터 */}
					<div>
						<label className="text-sm text-sand-700 mb-2 flex items-center gap-2">
							<Filter className="w-4 h-4" />
							상태 필터
						</label>
						<div className="flex gap-2 flex-wrap">
							{(Object.keys(statusLabels) as StatusFilter[]).map((status) => (
								<button
									key={status}
									onClick={() => setStatusFilter(status)}
									className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
										statusFilter === status
											? 'bg-forest-600 text-white'
											: 'bg-sand-50 text-sand-700 hover:bg-sand-100 border border-sand-300'
									}`}
								>
									{statusLabels[status]}
								</button>
							))}
						</div>
					</div>

					{/* 검색 */}
					<div>
						<label className="text-sm text-sand-700 mb-2 flex items-center gap-2">
							<Search className="w-4 h-4" />
							검색 (이름, 전화번호, 지역)
						</label>
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="검색어 입력..."
							className="w-full px-4 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-300 focus:ring-1 focus:ring-forest-300 transition-colors"
						/>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-between">
					<div className="text-sm text-sand-700">
						총 <span className="text-forest-600 font-semibold">{filteredRequests.length}</span>
						건의 견적 신청
					</div>
					<button
						onClick={fetchRequests}
						className="px-4 py-2 bg-sand-50 hover:bg-sand-100 border border-sand-300 rounded-xl text-sm font-semibold text-sand-700 transition-all flex items-center gap-2"
					>
						<RefreshCw className="w-4 h-4" />
						새로고침
					</button>
				</div>
			</div>

			{/* 견적 신청 목록 */}
			<div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
				{loading ? (
					<div className="p-12 text-center text-sand-600">
						<RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
						로딩 중...
					</div>
				) : filteredRequests.length === 0 ? (
					<div className="p-12 text-center text-sand-600">
						<FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>해당하는 견적 신청이 없습니다</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-sand-300 bg-sand-50">
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">
										신청일시
									</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">
										고객 정보
									</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">
										매물 정보
									</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">
										항목 수
									</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">
										상태
									</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">
										작업
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredRequests.map((request, index) => (
									<>
										<motion.tr
											key={request.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className="border-b border-sand-100 hover:bg-sand-50 transition-colors cursor-pointer"
											onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
										>
											<td className="py-4 px-4 text-sm text-sand-700">
												{new Date(request.created_at).toLocaleString('ko-KR', {
													timeZone: 'Asia/Seoul',
													year: 'numeric',
													month: '2-digit',
													day: '2-digit',
													hour: '2-digit',
													minute: '2-digit'
												})}
											</td>
											<td className="py-4 px-4">
												<div className="text-sm">
													<div className="font-semibold text-sand-900">{request.customer_name}</div>
													<div className="text-sand-600 text-xs">
														{request.customer_phone}
													</div>
												</div>
											</td>
											<td className="py-4 px-4">
												<div className="text-sm">
													<div className="text-sand-900">
														{request.property_type} {request.property_size}㎡
														{request.property_size && (
															<span className="text-sand-600 text-xs ml-1">
																(약 {(request.property_size / 3.3058).toFixed(1)}평)
															</span>
														)}
													</div>
													<div className="text-sand-600 text-xs">{request.region}</div>
												</div>
											</td>
											<td className="py-4 px-4">
												<div className="flex flex-col gap-1">
													<span className="px-3 py-1 bg-wood-100 text-wood-500 rounded-full text-sm font-semibold inline-block w-fit">
														{request.items.length}개
													</span>
													{request.validation_status === 'rejected_insufficient_detail' && (
														<div className="flex items-center gap-1 text-xs text-red-500">
															<AlertTriangle className="w-3 h-3" />
															<span>세부항목 부족</span>
														</div>
													)}
													{request.validation_status === 'pending' && request.validation_notes && (
														<div className="flex items-center gap-1 text-xs text-amber-600">
															<AlertTriangle className="w-3 h-3" />
															<span>검토필요</span>
														</div>
													)}
												</div>
											</td>
											<td className="py-4 px-4">
												<span
													className={`px-3 py-1 rounded-full text-xs font-semibold ${
														statusColors[request.status]
													}`}
												>
													{statusLabels[request.status]}
												</span>
											</td>
											<td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
												<div className="flex gap-2">
													<button
														onClick={() => viewDetail(request.id)}
														className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-xl text-sm font-semibold text-forest-600 transition-all flex items-center gap-1"
														title="상세보기"
													>
														<Eye className="w-4 h-4" />
														상세
													</button>
													{request.status === 'pending' && (
														<button
															onClick={() => runAnalysis(request.id)}
															disabled={analyzingId === request.id}
															className={`px-3 py-1.5 border rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${
																analyzingId === request.id
																	? 'bg-blue-50 border-blue-200 text-blue-500 cursor-not-allowed'
																	: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-600'
															}`}
															title="집첵 견적 분석 실행"
														>
															{analyzingId === request.id ? (
																<>
																	<RefreshCw className="w-4 h-4 animate-spin" />
																	분석중
																</>
															) : (
																<>
																	<Play className="w-4 h-4" />
																	분석
																</>
															)}
														</button>
													)}
												</div>
											</td>
										</motion.tr>
										{expandedId === request.id && (
											<tr className="bg-sand-50">
												<td colSpan={6} className="p-6">
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: 'auto' }}
														exit={{ opacity: 0, height: 0 }}
														className="space-y-4"
													>
														<div className="grid grid-cols-2 gap-4">
															<div className="bg-white rounded-xl p-4 border border-sand-300">
																<h4 className="text-sm font-semibold text-sand-700 mb-2">고객 정보</h4>
																<div className="space-y-1 text-sm">
																	<div><span className="text-sand-700">이름:</span> <span className="text-sand-900 font-medium">{request.customer_name}</span></div>
																	<div><span className="text-sand-700">전화:</span> <span className="text-sand-900">{request.customer_phone}</span></div>
																</div>
															</div>
															<div className="bg-white rounded-xl p-4 border border-sand-300">
																<h4 className="text-sm font-semibold text-sand-700 mb-2">매물 정보</h4>
																<div className="space-y-1 text-sm">
																	<div><span className="text-sand-700">유형:</span> <span className="text-sand-900">{request.property_type}</span></div>
																	<div>
																		<span className="text-sand-700">면적:</span> <span className="text-sand-900">{request.property_size}㎡</span>
																		{request.property_size && (
																			<span className="text-sand-600 text-xs ml-1">
																				(약 {(request.property_size / 3.3058).toFixed(1)}평)
																			</span>
																		)}
																	</div>
																	<div><span className="text-sand-700">지역:</span> <span className="text-sand-900">{request.region}</span></div>
																</div>
															</div>
														</div>

														<div className="bg-white rounded-xl p-4 border border-sand-300">
															<h4 className="text-sm font-semibold text-sand-700 mb-3">견적 항목 ({request.items.length}개)</h4>
															<div className="space-y-2 max-h-96 overflow-y-auto">
																{request.items.map((item, idx) => (
																	<div key={idx} className="bg-sand-50 rounded-xl p-3 text-sm border border-sand-100">
																		<div className="flex justify-between items-start mb-2">
																			<span className="font-semibold text-forest-600">{item.category || '카테고리 없음'}</span>
																			<span className="text-wood-500 font-bold">{item.quoted_price?.toLocaleString()}원</span>
																		</div>
																		{item.item_name && (
																			<div className="text-sand-700">{item.item_name}</div>
																		)}
																		{item.specification && (
																			<div className="text-sand-600 text-xs mt-1">{item.specification}</div>
																		)}
																		<div className="grid grid-cols-3 gap-2 mt-2 text-xs">
																			{item.quantity && <div className="text-sand-700">수량: <span className="text-sand-900">{item.quantity} {item.unit || ''}</span></div>}
																			{item.unit_price && <div className="text-sand-700">단가: <span className="text-sand-900">{item.unit_price.toLocaleString()}원</span></div>}
																			{item.material_cost && <div className="text-sand-700">자재비: <span className="text-sand-900">{item.material_cost.toLocaleString()}원</span></div>}
																		</div>
																	</div>
																))}
															</div>
														</div>

														{request.validation_notes && (
															<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
																<h4 className="text-sm font-semibold text-amber-600 mb-2">검증 노트</h4>
																<p className="text-sm text-amber-700">{request.validation_notes}</p>
															</div>
														)}
													</motion.div>
												</td>
											</tr>
										)}
									</>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* 안내 메시지 */}
			{statusFilter === 'pending' && filteredRequests.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
				>
					<AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
					<div className="text-sm text-amber-700">
						<p className="font-semibold mb-1">대기중인 견적 신청</p>
						<p className="text-amber-600">
							각 견적에 대해 '분석' 버튼을 클릭하여 집첵 견적 분석을 실행하면, 사용자가 결과를
							확인할 수 있습니다.
						</p>
					</div>
				</motion.div>
			)}
		</div>
	)
}
