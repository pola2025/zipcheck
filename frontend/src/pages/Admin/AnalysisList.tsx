import { useState, useEffect } from 'react'
import { ClipboardCheck, Plus, Eye, Filter, RefreshCw, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'
import { adminPath } from '../../lib/admin-path'
import type { Analysis, AnalysisStatus } from '../../types/analysis'

type StatusFilter = 'all' | AnalysisStatus

const statusLabels: Record<StatusFilter, string> = {
	all: '전체',
	draft: '초안',
	in_progress: '진행중',
	review: '검토중',
	completed: '완료',
}

const statusColors: Record<string, string> = {
	draft: 'bg-sand-100 text-sand-700 border border-sand-300',
	in_progress: 'bg-blue-50 text-blue-600 border border-blue-200',
	review: 'bg-amber-50 text-amber-600 border border-amber-200',
	completed: 'bg-green-50 text-green-600 border border-green-200',
}

interface AnalysisRow extends Analysis {
	item_count?: number
}

export default function AnalysisList() {
	const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
	const [loading, setLoading] = useState(true)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [creating, setCreating] = useState(false)
	const navigate = useNavigate()
	const { token } = useAuth()

	useEffect(() => {
		fetchAnalyses()
	}, [statusFilter])

	const fetchAnalyses = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (statusFilter !== 'all') params.set('status', statusFilter)
			params.set('limit', '50')

			const response = await fetch(getApiUrl(`/api/admin/analyses?${params}`), {
				headers: { Authorization: `Bearer ${token}` }
			})

			if (!response.ok) throw new Error(`API 오류: ${response.status}`)

			const result = await response.json()
			setAnalyses(result.data || [])
		} catch (error) {
			console.error('Failed to fetch analyses:', error)
			setAnalyses([])
		} finally {
			setLoading(false)
		}
	}

	const createAnalysis = async (quoteRequestId?: string) => {
		setCreating(true)
		try {
			const response = await fetch(getApiUrl('/api/admin/analyses'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ quoteRequestId }),
			})

			if (!response.ok) throw new Error('분석 생성 실패')

			const result = await response.json()
			setShowCreateModal(false)
			navigate(adminPath(`/analyses/${result.data.id}`))
		} catch (error) {
			console.error('Failed to create analysis:', error)
			alert('분석 생성에 실패했습니다.')
		} finally {
			setCreating(false)
		}
	}

	const filteredAnalyses = analyses.filter((a) => {
		if (!searchTerm) return true
		const term = searchTerm.toLowerCase()
		return (
			(a.customer_name || '').toLowerCase().includes(term) ||
			(a.contractor_name || '').toLowerCase().includes(term) ||
			(a.region || '').toLowerCase().includes(term) ||
			a.id.toLowerCase().includes(term)
		)
	})

	return (
		<div className="space-y-6">
			{/* Action Bar */}
			<div className="flex justify-end">
				<button
					onClick={() => createAnalysis()}
					className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					새 분석 시작
				</button>
			</div>

			{/* Filter & Search */}
			<div className="bg-white rounded-2xl p-5 border border-sand-300">
				<div className="grid md:grid-cols-2 gap-4">
					{/* Status Filter */}
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

					{/* Search */}
					<div>
						<label className="text-sm text-sand-700 mb-2 flex items-center gap-2">
							<Search className="w-4 h-4" />
							검색
						</label>
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="고객명, 업체명, 지역, ID..."
							className="w-full px-4 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-300 focus:ring-1 focus:ring-forest-300 transition-colors"
						/>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-between">
					<div className="text-sm text-sand-700">
						총 <span className="text-forest-600 font-semibold">{filteredAnalyses.length}</span>건
					</div>
					<button
						onClick={fetchAnalyses}
						className="px-4 py-2 bg-sand-50 hover:bg-sand-100 border border-sand-300 rounded-xl text-sm font-semibold text-sand-700 transition-all flex items-center gap-2"
					>
						<RefreshCw className="w-4 h-4" />
						새로고침
					</button>
				</div>
			</div>

			{/* Analysis List */}
			<div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
				{loading ? (
					<div className="p-12 text-center text-sand-600">
						<RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
						로딩 중...
					</div>
				) : filteredAnalyses.length === 0 ? (
					<div className="p-12 text-center text-sand-600">
						<ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p className="mb-2">분석 데이터가 없습니다</p>
						<p className="text-sm text-sand-500">"새 분석 시작" 버튼으로 첫 분석을 시작하세요</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-sand-300 bg-sand-50">
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">생성일</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">고객</th>
									<th className="text-left py-4 px-4 text-sm font-semibold text-sand-700">건물 정보</th>
									<th className="text-center py-4 px-4 text-sm font-semibold text-sand-700">항목 수</th>
									<th className="text-center py-4 px-4 text-sm font-semibold text-sand-700">단계</th>
									<th className="text-center py-4 px-4 text-sm font-semibold text-sand-700">점수</th>
									<th className="text-center py-4 px-4 text-sm font-semibold text-sand-700">상태</th>
									<th className="text-center py-4 px-4 text-sm font-semibold text-sand-700">작업</th>
								</tr>
							</thead>
							<tbody>
								{filteredAnalyses.map((analysis, index) => (
									<motion.tr
										key={analysis.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.03 }}
										className="border-b border-sand-100 hover:bg-sand-50 transition-colors"
									>
										<td className="py-4 px-4 text-sm text-sand-700">
											{new Date(analysis.created_at).toLocaleString('ko-KR', {
												timeZone: 'Asia/Seoul',
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</td>
										<td className="py-4 px-4">
											<div className="text-sm">
												<div className="font-semibold text-sand-900">
													{analysis.customer_name || '미입력'}
												</div>
												{analysis.contractor_name && (
													<div className="text-sand-600 text-xs">
														업체: {analysis.contractor_name}
													</div>
												)}
											</div>
										</td>
										<td className="py-4 px-4">
											<div className="text-sm">
												<div className="text-sand-900">
													{analysis.property_type || '—'}
													{analysis.property_size_sqm && (
														<span className="text-sand-600 text-xs ml-1">
															{analysis.property_size_sqm}㎡
														</span>
													)}
												</div>
												<div className="text-sand-600 text-xs">{analysis.region || '—'}</div>
											</div>
										</td>
										<td className="py-4 px-4 text-center">
											<span className="px-3 py-1 bg-wood-100 text-wood-500 rounded-full text-sm font-semibold">
												{analysis.item_count ?? 0}
											</span>
										</td>
										<td className="py-4 px-4 text-center">
											<span className="text-sm font-mono text-sand-700">
												{analysis.current_step}/7
											</span>
										</td>
										<td className="py-4 px-4 text-center">
											{analysis.total_score != null ? (
												<span className={`text-lg font-bold ${
													analysis.total_score >= 80 ? 'text-green-600' :
													analysis.total_score >= 60 ? 'text-amber-600' :
													'text-red-600'
												}`}>
													{analysis.total_score}
												</span>
											) : (
												<span className="text-sand-400 text-sm">—</span>
											)}
										</td>
										<td className="py-4 px-4 text-center">
											<span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[analysis.status]}`}>
												{statusLabels[analysis.status] || analysis.status}
											</span>
										</td>
										<td className="py-4 px-4 text-center">
											<button
												onClick={() => navigate(adminPath(`/analyses/${analysis.id}`))}
												className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-xl text-sm font-semibold text-forest-600 transition-all flex items-center gap-1 mx-auto"
											>
												<Eye className="w-4 h-4" />
												열기
											</button>
										</td>
									</motion.tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
