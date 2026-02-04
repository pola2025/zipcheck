import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, AlertTriangle, ShieldBan, Check, X, Trash2, Plus, Ban } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'

// ─── Types ─────────────────────────────────

interface CompanyReview {
	id: string
	company_name: string
	company_phone: string
	business_number: string
	rating: number
	review_text: string
	status: string
	verified: boolean
	ip_address?: string
	created_at: string
}

interface DamageCase {
	id: string
	title: string
	description: string
	category: string
	severity: string
	status: string
	company_name?: string
	verified: boolean
	ip_address?: string
	created_at: string
}

interface BlacklistEntry {
	id: string
	ip_address: string
	reason: string | null
	created_at: string
	expires_at: string | null
}

type TabType = 'reviews' | 'damages' | 'blacklist'

// ─── Main Component ────────────────────────

export default function CommunityManagement() {
	const { isAuthenticated, token } = useAuth()
	const [activeTab, setActiveTab] = useState<TabType>('reviews')
	const [reviews, setReviews] = useState<CompanyReview[]>([])
	const [damages, setDamages] = useState<DamageCase[]>([])
	const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([])
	const [loading, setLoading] = useState(false)

	const fetchReviews = useCallback(async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl('/api/company-reviews/admin/all'), {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			const data = await response.json()
			setReviews(data.data || [])
		} catch (error) {
			console.error('Failed to fetch reviews:', error)
		} finally {
			setLoading(false)
		}
	}, [token])

	const fetchDamages = useCallback(async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl('/api/damage-cases/admin/all'), {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			const data = await response.json()
			setDamages(data.data || [])
		} catch (error) {
			console.error('Failed to fetch damage cases:', error)
		} finally {
			setLoading(false)
		}
	}, [token])

	const fetchBlacklist = useCallback(async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl('/api/admin/blacklist/all'), {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			const data = await response.json()
			setBlacklist(data.data || [])
		} catch (error) {
			console.error('Failed to fetch blacklist:', error)
		} finally {
			setLoading(false)
		}
	}, [token])

	useEffect(() => {
		if (!isAuthenticated) return
		if (activeTab === 'reviews') fetchReviews()
		else if (activeTab === 'damages') fetchDamages()
		else fetchBlacklist()
	}, [activeTab, isAuthenticated, fetchReviews, fetchDamages, fetchBlacklist])

	const handleStatusChange = async (id: string, status: string, type: 'reviews' | 'damages') => {
		try {
			const endpoint = type === 'reviews'
				? `/api/company-reviews/admin/${id}/status`
				: `/api/damage-cases/admin/${id}/status`

			const response = await fetch(getApiUrl(endpoint), {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			})

			if (response.ok) {
				if (type === 'reviews') fetchReviews()
				else fetchDamages()
			}
		} catch (error) {
			console.error('Failed to update status:', error)
		}
	}

	const handleDelete = async (id: string, type: 'reviews' | 'damages') => {
		if (!confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

		try {
			const endpoint = type === 'reviews'
				? `/api/company-reviews/admin/${id}`
				: `/api/damage-cases/admin/${id}`

			const response = await fetch(getApiUrl(endpoint), {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			})

			if (response.ok) {
				if (type === 'reviews') fetchReviews()
				else fetchDamages()
			}
		} catch (error) {
			console.error('Failed to delete:', error)
		}
	}

	const handleBlockIp = async (ipAddress: string, reason?: string) => {
		if (!ipAddress || ipAddress === '-' || ipAddress === 'unknown') return

		try {
			const response = await fetch(getApiUrl('/api/admin/blacklist'), {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ip_address: ipAddress, reason: reason || '관리자 차단' })
			})

			const data = await response.json()
			if (response.ok) {
				fetchBlacklist()
				alert(`IP ${ipAddress} 차단 완료`)
			} else {
				alert(data.error || '차단 실패')
			}
		} catch (error) {
			console.error('Failed to block IP:', error)
		}
	}

	const handleUnblockIp = async (id: string) => {
		try {
			const response = await fetch(getApiUrl(`/api/admin/blacklist/${id}`), {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			})

			if (response.ok) {
				fetchBlacklist()
			}
		} catch (error) {
			console.error('Failed to unblock IP:', error)
		}
	}

	if (!isAuthenticated) return null

	const pendingReviewCount = reviews.filter(r => r.status === 'pending').length
	const pendingDamageCount = damages.filter(d => d.status === 'pending').length

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
				커뮤니티 관리
			</h2>

			{/* Tabs */}
			<div className="bg-sand-100 rounded-xl p-2 flex gap-2">
				<TabButton
					active={activeTab === 'reviews'}
					onClick={() => setActiveTab('reviews')}
					icon={<MessageSquare className="w-5 h-5" />}
					label="업체 후기"
					count={reviews.length}
					pendingCount={pendingReviewCount}
					activeClass="bg-forest-600 text-white"
				/>
				<TabButton
					active={activeTab === 'damages'}
					onClick={() => setActiveTab('damages')}
					icon={<AlertTriangle className="w-5 h-5" />}
					label="피해사례"
					count={damages.length}
					pendingCount={pendingDamageCount}
					activeClass="bg-red-500 text-white"
				/>
				<TabButton
					active={activeTab === 'blacklist'}
					onClick={() => setActiveTab('blacklist')}
					icon={<ShieldBan className="w-5 h-5" />}
					label="블랙리스트"
					count={blacklist.length}
					activeClass="bg-sand-800 text-white"
				/>
			</div>

			{/* Content */}
			<AnimatePresence mode="wait">
				{loading ? (
					<motion.div
						key="loading"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="bg-white rounded-2xl border border-sand-300 p-12 text-center"
					>
						<div className="w-8 h-8 border-2 border-sand-300 border-t-sand-500 rounded-full animate-spin mx-auto mb-4" />
						<p className="text-sand-700">로딩 중...</p>
					</motion.div>
				) : activeTab === 'reviews' ? (
					<motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
						<ReviewsTable
							reviews={reviews}
							onStatusChange={(id, status) => handleStatusChange(id, status, 'reviews')}
							onDelete={(id) => handleDelete(id, 'reviews')}
							onBlockIp={handleBlockIp}
						/>
					</motion.div>
				) : activeTab === 'damages' ? (
					<motion.div key="damages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
						<DamagesTable
							damages={damages}
							onStatusChange={(id, status) => handleStatusChange(id, status, 'damages')}
							onDelete={(id) => handleDelete(id, 'damages')}
							onBlockIp={handleBlockIp}
						/>
					</motion.div>
				) : (
					<motion.div key="blacklist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
						<BlacklistTable
							entries={blacklist}
							onUnblock={handleUnblockIp}
							onAdd={handleBlockIp}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

// ─── Tab Button ────────────────────────────

function TabButton({ active, onClick, icon, label, count, pendingCount, activeClass }: {
	active: boolean
	onClick: () => void
	icon: React.ReactNode
	label: string
	count: number
	pendingCount?: number
	activeClass: string
}) {
	return (
		<button
			onClick={onClick}
			className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
				active ? activeClass : 'text-sand-700 hover:bg-sand-200'
			}`}
		>
			{icon}
			<span>{label}</span>
			<span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
				active ? 'bg-white/20 text-white' : 'bg-sand-200 text-sand-700'
			}`}>
				{count}
			</span>
			{pendingCount !== undefined && pendingCount > 0 && (
				<span className="px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-xs font-bold animate-pulse">
					{pendingCount}
				</span>
			)}
		</button>
	)
}

// ─── Status Badge ──────────────────────────

function StatusBadge({ status }: { status: string }) {
	const config: Record<string, { bg: string; text: string; label: string }> = {
		pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: '대기중' },
		published: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '게시됨' },
		open: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: '열림' },
		in_progress: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: '진행중' },
		resolved: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '해결됨' },
		deleted: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: '삭제됨' },
	}

	const c = config[status] || { bg: 'bg-sand-50 border-sand-200', text: 'text-sand-700', label: status }

	return (
		<span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${c.bg} ${c.text}`}>
			{c.label}
		</span>
	)
}

// ─── Approve/Reject Actions ────────────────

function ApproveRejectActions({ isPending, onApprove, onReject }: {
	isPending: boolean
	onApprove: () => void
	onReject: () => void
}) {
	if (!isPending) return null

	return (
		<div className="flex gap-1.5">
			<button
				onClick={onApprove}
				className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
				title="승인"
			>
				<Check className="w-3.5 h-3.5" />
				승인
			</button>
			<button
				onClick={onReject}
				className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
				title="반려"
			>
				<X className="w-3.5 h-3.5" />
				반려
			</button>
		</div>
	)
}

// ─── IP Cell with Block Button ─────────────

function IpCell({ ip, onBlock }: { ip?: string; onBlock: (ip: string) => void }) {
	if (!ip || ip === 'unknown') return <span className="text-sand-400">-</span>

	return (
		<div className="flex items-center gap-1.5">
			<span className="text-xs text-sand-500 font-mono">{ip}</span>
			<button
				onClick={() => {
					if (confirm(`IP ${ip}를 차단하시겠습니까?`)) {
						onBlock(ip)
					}
				}}
				className="p-1 text-sand-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
				title="이 IP 차단"
			>
				<Ban className="w-3.5 h-3.5" />
			</button>
		</div>
	)
}

// ─── Reviews Table ─────────────────────────

function ReviewsTable({ reviews, onStatusChange, onDelete, onBlockIp }: {
	reviews: CompanyReview[]
	onStatusChange: (id: string, status: string) => void
	onDelete: (id: string) => void
	onBlockIp: (ip: string, reason?: string) => void
}) {
	// Sort: pending first, then by date desc
	const sorted = [...reviews].sort((a, b) => {
		if (a.status === 'pending' && b.status !== 'pending') return -1
		if (a.status !== 'pending' && b.status === 'pending') return 1
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
	})

	return (
		<div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-sand-200">
					<thead className="bg-sand-50">
						<tr>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">업체명</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">연락처</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">별점</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">상태</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">IP 주소</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">등록일</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">작업</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-sand-200">
						{sorted.map((review) => {
							const isPending = review.status === 'pending'
							return (
								<motion.tr
									key={review.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className={`transition-colors ${isPending ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-sand-50'}`}
								>
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-sand-900">{review.company_name}</div>
										<div className="text-sm text-sand-500 truncate max-w-xs">
											{review.review_text?.substring(0, 50)}...
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-sand-700">
										{review.company_phone}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500">
										{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{isPending ? (
											<StatusBadge status="pending" />
										) : (
											<select
												value={review.status}
												onChange={(e) => onStatusChange(review.id, e.target.value)}
												className="text-sm bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-sand-900 focus:ring-2 focus:ring-forest-300"
											>
												<option value="published">게시됨</option>
												<option value="pending">대기중</option>
												<option value="deleted">삭제됨</option>
											</select>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<IpCell ip={review.ip_address} onBlock={(ip) => onBlockIp(ip, `후기 ${review.id} - ${review.company_name}`)} />
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-sand-700">
										{new Date(review.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center gap-2">
											<ApproveRejectActions
												isPending={isPending}
												onApprove={() => onStatusChange(review.id, 'published')}
												onReject={() => onStatusChange(review.id, 'deleted')}
											/>
											<button
												onClick={() => onDelete(review.id)}
												className="p-1.5 text-sand-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
												title="영구 삭제"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</motion.tr>
							)
						})}
						{reviews.length === 0 && (
							<tr>
								<td colSpan={7} className="px-6 py-12 text-center text-sand-600">
									등록된 후기가 없습니다
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}

// ─── Damages Table ─────────────────────────

function DamagesTable({ damages, onStatusChange, onDelete, onBlockIp }: {
	damages: DamageCase[]
	onStatusChange: (id: string, status: string) => void
	onDelete: (id: string) => void
	onBlockIp: (ip: string, reason?: string) => void
}) {
	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'bg-red-50 text-red-700 border-red-200'
			case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
			case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
			default: return 'bg-green-50 text-green-700 border-green-200'
		}
	}

	// Sort: pending first, then by date desc
	const sorted = [...damages].sort((a, b) => {
		if (a.status === 'pending' && b.status !== 'pending') return -1
		if (a.status !== 'pending' && b.status === 'pending') return 1
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
	})

	return (
		<div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-sand-200">
					<thead className="bg-sand-50">
						<tr>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">제목</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">카테고리</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">심각도</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">상태</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">IP 주소</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">등록일</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">작업</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-sand-200">
						{sorted.map((damage) => {
							const isPending = damage.status === 'pending'
							return (
								<motion.tr
									key={damage.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className={`transition-colors ${isPending ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-sand-50'}`}
								>
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-sand-900">{damage.title}</div>
										<div className="text-sm text-sand-500 truncate max-w-xs">
											{damage.description?.substring(0, 50)}...
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-sand-700">
										{damage.category}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(damage.severity)}`}>
											{damage.severity}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{isPending ? (
											<StatusBadge status="pending" />
										) : (
											<select
												value={damage.status}
												onChange={(e) => onStatusChange(damage.id, e.target.value)}
												className="text-sm bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-sand-900 focus:ring-2 focus:ring-forest-300"
											>
												<option value="open">열림</option>
												<option value="in_progress">진행중</option>
												<option value="resolved">해결됨</option>
												<option value="deleted">삭제됨</option>
											</select>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<IpCell ip={damage.ip_address} onBlock={(ip) => onBlockIp(ip, `피해사례 ${damage.id} - ${damage.title}`)} />
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-sand-700">
										{new Date(damage.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center gap-2">
											<ApproveRejectActions
												isPending={isPending}
												onApprove={() => onStatusChange(damage.id, 'open')}
												onReject={() => onStatusChange(damage.id, 'deleted')}
											/>
											<button
												onClick={() => onDelete(damage.id)}
												className="p-1.5 text-sand-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
												title="영구 삭제"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</motion.tr>
							)
						})}
						{damages.length === 0 && (
							<tr>
								<td colSpan={7} className="px-6 py-12 text-center text-sand-600">
									등록된 피해사례가 없습니다
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}

// ─── Blacklist Table ───────────────────────

function BlacklistTable({ entries, onUnblock, onAdd }: {
	entries: BlacklistEntry[]
	onUnblock: (id: string) => void
	onAdd: (ip: string, reason?: string) => void
}) {
	const [showAddForm, setShowAddForm] = useState(false)
	const [newIp, setNewIp] = useState('')
	const [newReason, setNewReason] = useState('')

	const handleAdd = () => {
		if (!newIp.trim()) return
		onAdd(newIp.trim(), newReason.trim() || undefined)
		setNewIp('')
		setNewReason('')
		setShowAddForm(false)
	}

	return (
		<div className="space-y-4">
			{/* Add Button */}
			<div className="flex justify-end">
				<button
					onClick={() => setShowAddForm(!showAddForm)}
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-sand-800 text-white rounded-xl text-sm font-medium hover:bg-sand-900 transition-colors"
				>
					<Plus className="w-4 h-4" />
					IP 차단 추가
				</button>
			</div>

			{/* Add Form */}
			<AnimatePresence>
				{showAddForm && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="bg-white rounded-2xl border border-sand-300 p-6">
							<h3 className="text-sm font-semibold text-sand-900 mb-4">IP 차단 추가</h3>
							<div className="flex gap-3">
								<input
									type="text"
									value={newIp}
									onChange={(e) => setNewIp(e.target.value)}
									placeholder="IP 주소 (예: 123.456.789.0)"
									className="flex-1 px-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 placeholder:text-sand-400 focus:ring-2 focus:ring-sand-400 focus:border-transparent"
								/>
								<input
									type="text"
									value={newReason}
									onChange={(e) => setNewReason(e.target.value)}
									placeholder="차단 사유 (선택)"
									className="flex-1 px-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 placeholder:text-sand-400 focus:ring-2 focus:ring-sand-400 focus:border-transparent"
								/>
								<button
									onClick={handleAdd}
									disabled={!newIp.trim()}
									className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									차단
								</button>
								<button
									onClick={() => setShowAddForm(false)}
									className="px-4 py-2.5 bg-sand-100 text-sand-700 rounded-xl text-sm font-medium hover:bg-sand-200 transition-colors"
								>
									취소
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Table */}
			<div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-sand-200">
						<thead className="bg-sand-50">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">IP 주소</th>
								<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">차단 사유</th>
								<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">차단일</th>
								<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">만료일</th>
								<th className="px-6 py-4 text-left text-xs font-medium text-sand-700 uppercase tracking-wider">작업</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-sand-200">
							{entries.map((entry) => (
								<motion.tr
									key={entry.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="hover:bg-sand-50 transition-colors"
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="text-sm font-mono font-medium text-sand-900">{entry.ip_address}</span>
									</td>
									<td className="px-6 py-4 text-sm text-sand-700">
										{entry.reason || <span className="text-sand-400">-</span>}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-sand-700">
										{new Date(entry.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-sand-700">
										{entry.expires_at
											? new Date(entry.expires_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
											: <span className="text-sand-400">영구</span>
										}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<button
											onClick={() => {
												if (confirm(`IP ${entry.ip_address} 차단을 해제하시겠습니까?`)) {
													onUnblock(entry.id)
												}
											}}
											className="inline-flex items-center gap-1 px-3 py-1.5 bg-sand-100 text-sand-700 border border-sand-300 rounded-lg text-xs font-medium hover:bg-sand-200 transition-colors"
										>
											차단 해제
										</button>
									</td>
								</motion.tr>
							))}
							{entries.length === 0 && (
								<tr>
									<td colSpan={5} className="px-6 py-12 text-center text-sand-600">
										차단된 IP가 없습니다
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
