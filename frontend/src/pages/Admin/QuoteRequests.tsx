import { useState, useEffect } from 'react'
import { FileText, Play, Eye, Filter, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'

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
	pending: 'bg-amber-500/20 text-amber-400',
	analyzing: 'bg-blue-500/20 text-blue-400',
	completed: 'bg-green-500/20 text-green-400',
	rejected: 'bg-red-500/20 text-red-400'
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
			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const result = await response.json()
			setRequests(result.data || [])
		} catch (error) {
			console.error('Failed to fetch quote requests:', error)
			alert('견적 신청 목록을 불러오는데 실패했습니다.')
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
		navigate(`/admin/quote-requests/${id}`)
	}

	const filteredRequests = requests.filter((req) => {
		const matchesSearch =
			req.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.customer_phone.includes(searchTerm) ||
			req.region.toLowerCase().includes(searchTerm.toLowerCase())
		return matchesSearch
	})

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
			<div className="max-w-7xl mx-auto">
				{/* 헤더 */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
						견적 신청 관리
					</h1>
					<p className="text-gray-400">사용자가 신청한 견적 분석 요청 관리</p>
				</div>

				{/* 검증 실패 알림 */}
				{requests.some(r => r.validation_status === 'rejected_insufficient_detail') && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-6 bg-red-500/10 border-l-4 border-red-500 rounded-lg p-4"
					>
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
							<div>
								<h3 className="text-lg font-bold text-red-300 mb-1">세부항목 부족으로 거부된 견적이 있습니다</h3>
								<p className="text-sm text-red-200/80 mb-2">
									{requests.filter(r => r.validation_status === 'rejected_insufficient_detail').length}건의 견적이
									세부 시공 항목이 부족하여 자동으로 거부되었습니다.
								</p>
								<p className="text-xs text-red-300/70">
									견적 분석을 위해서는 충분한 세부 항목 정보가 필요합니다. 고객에게 연락하여 상세한 견적서를 다시 제출하도록 안내하세요.
								</p>
							</div>
						</div>
					</motion.div>
				)}

				{/* 필터 & 검색 */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
					<div className="grid md:grid-cols-2 gap-4">
						{/* 상태 필터 */}
						<div>
							<label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
								<Filter className="w-4 h-4" />
								상태 필터
							</label>
							<div className="flex gap-2 flex-wrap">
								{(Object.keys(statusLabels) as StatusFilter[]).map((status) => (
									<button
										key={status}
										onClick={() => setStatusFilter(status)}
										className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
											statusFilter === status
												? 'bg-cyan-500 text-white'
												: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
										}`}
									>
										{statusLabels[status]}
									</button>
								))}
							</div>
						</div>

						{/* 검색 */}
						<div>
							<label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
								<Search className="w-4 h-4" />
								검색 (이름, 전화번호, 지역)
							</label>
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="검색어 입력..."
								className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
							/>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-between">
						<div className="text-sm text-gray-400">
							총 <span className="text-cyan-400 font-semibold">{filteredRequests.length}</span>
							건의 견적 신청
						</div>
						<button
							onClick={fetchRequests}
							className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
						>
							<RefreshCw className="w-4 h-4" />
							새로고침
						</button>
					</div>
				</div>

				{/* 견적 신청 목록 */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
					{loading ? (
						<div className="p-12 text-center text-gray-400">
							<RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
							로딩 중...
						</div>
					) : filteredRequests.length === 0 ? (
						<div className="p-12 text-center text-gray-500">
							<FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>해당하는 견적 신청이 없습니다</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-700 bg-gray-800/80">
										<th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">
											신청일시
										</th>
										<th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">
											고객 정보
										</th>
										<th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">
											매물 정보
										</th>
										<th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">
											항목 수
										</th>
										<th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">
											상태
										</th>
										<th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">
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
												className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
												onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
											>
												<td className="py-4 px-4 text-sm text-gray-300">
													{new Date(request.created_at).toLocaleString('ko-KR', {
														year: 'numeric',
														month: '2-digit',
														day: '2-digit',
														hour: '2-digit',
														minute: '2-digit'
													})}
												</td>
												<td className="py-4 px-4">
													<div className="text-sm">
														<div className="font-semibold">{request.customer_name}</div>
														<div className="text-gray-400 text-xs">
															{request.customer_phone}
														</div>
													</div>
												</td>
												<td className="py-4 px-4">
													<div className="text-sm">
														<div>
															{request.property_type} {request.property_size}㎡
															{request.property_size && (
																<span className="text-gray-400 text-xs ml-1">
																	(약 {(request.property_size / 3.3058).toFixed(1)}평)
																</span>
															)}
														</div>
														<div className="text-gray-400 text-xs">{request.region}</div>
													</div>
												</td>
												<td className="py-4 px-4">
													<div className="flex flex-col gap-1">
														<span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold inline-block w-fit">
															{request.items.length}개
														</span>
														{request.validation_status === 'rejected_insufficient_detail' && (
															<div className="flex items-center gap-1 text-xs text-red-400">
																<AlertTriangle className="w-3 h-3" />
																<span>세부항목 부족</span>
															</div>
														)}
														{request.validation_status === 'pending' && request.validation_notes && (
															<div className="flex items-center gap-1 text-xs text-amber-400">
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
															className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
															title="상세보기"
														>
															<Eye className="w-4 h-4" />
															상세
														</button>
														{request.status === 'pending' && (
															<button
																onClick={() => runAnalysis(request.id)}
																disabled={analyzingId === request.id}
																className={`px-3 py-1.5 border rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${
																	analyzingId === request.id
																		? 'bg-blue-500/20 border-blue-500/50 text-blue-300 cursor-not-allowed'
																		: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50'
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
												<tr className="bg-gray-800/80">
													<td colSpan={6} className="p-6">
														<motion.div
															initial={{ opacity: 0, height: 0 }}
															animate={{ opacity: 1, height: 'auto' }}
															exit={{ opacity: 0, height: 0 }}
															className="space-y-4"
														>
															<div className="grid grid-cols-2 gap-4">
																<div className="bg-gray-700/30 rounded-lg p-4">
																	<h4 className="text-sm font-semibold text-gray-400 mb-2">고객 정보</h4>
																	<div className="space-y-1 text-sm">
																		<div><span className="text-gray-400">이름:</span> <span className="text-white font-medium">{request.customer_name}</span></div>
																		<div><span className="text-gray-400">전화:</span> <span className="text-white">{request.customer_phone}</span></div>
																	</div>
																</div>
																<div className="bg-gray-700/30 rounded-lg p-4">
																	<h4 className="text-sm font-semibold text-gray-400 mb-2">매물 정보</h4>
																	<div className="space-y-1 text-sm">
																		<div><span className="text-gray-400">유형:</span> <span className="text-white">{request.property_type}</span></div>
																		<div>
																			<span className="text-gray-400">면적:</span> <span className="text-white">{request.property_size}㎡</span>
																			{request.property_size && (
																				<span className="text-gray-400 text-xs ml-1">
																					(약 {(request.property_size / 3.3058).toFixed(1)}평)
																				</span>
																			)}
																		</div>
																		<div><span className="text-gray-400">지역:</span> <span className="text-white">{request.region}</span></div>
																	</div>
																</div>
															</div>

															<div className="bg-gray-700/30 rounded-lg p-4">
																<h4 className="text-sm font-semibold text-gray-400 mb-3">견적 항목 ({request.items.length}개)</h4>
																<div className="space-y-2 max-h-96 overflow-y-auto">
																	{request.items.map((item, idx) => (
																		<div key={idx} className="bg-gray-800/50 rounded-lg p-3 text-sm">
																			<div className="flex justify-between items-start mb-2">
																				<span className="font-semibold text-cyan-400">{item.category || '카테고리 없음'}</span>
																				<span className="text-purple-400 font-bold">{item.quoted_price?.toLocaleString()}원</span>
																			</div>
																			{item.item_name && (
																				<div className="text-gray-300">{item.item_name}</div>
																			)}
																			{item.specification && (
																				<div className="text-gray-400 text-xs mt-1">{item.specification}</div>
																			)}
																			<div className="grid grid-cols-3 gap-2 mt-2 text-xs">
																				{item.quantity && <div className="text-gray-400">수량: <span className="text-white">{item.quantity} {item.unit || ''}</span></div>}
																				{item.unit_price && <div className="text-gray-400">단가: <span className="text-white">{item.unit_price.toLocaleString()}원</span></div>}
																				{item.material_cost && <div className="text-gray-400">자재비: <span className="text-white">{item.material_cost.toLocaleString()}원</span></div>}
																			</div>
																		</div>
																	))}
																</div>
															</div>

															{request.validation_notes && (
																<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
																	<h4 className="text-sm font-semibold text-amber-400 mb-2">검증 노트</h4>
																	<p className="text-sm text-amber-200/80">{request.validation_notes}</p>
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
						className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
					>
						<AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
						<div className="text-sm text-amber-200">
							<p className="font-semibold mb-1">대기중인 견적 신청</p>
							<p className="text-amber-300/80">
								각 견적에 대해 '분석' 버튼을 클릭하여 집첵 견적 분석을 실행하면, 사용자가 결과를
								확인할 수 있습니다.
							</p>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	)
}
