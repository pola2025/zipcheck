import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageSquare, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'

interface CompanyReview {
	id: string
	company_name: string
	company_phone: string
	business_number: string
	rating: number
	review_text: string
	status: string
	verified: boolean
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
	created_at: string
}

type TabType = 'reviews' | 'damages'

export default function CommunityManagement() {
	const { isAuthenticated, token } = useAuth()
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState<TabType>('reviews')
	const [reviews, setReviews] = useState<CompanyReview[]>([])
	const [damages, setDamages] = useState<DamageCase[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/admin/login')
		}
	}, [isAuthenticated, navigate])

	useEffect(() => {
		if (isAuthenticated) {
			if (activeTab === 'reviews') {
				fetchReviews()
			} else {
				fetchDamages()
			}
		}
	}, [activeTab, isAuthenticated])

	const fetchReviews = async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl('/api/company-reviews/admin/all'), {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const data = await response.json()
			setReviews(data.data || [])
		} catch (error) {
			console.error('Failed to fetch reviews:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchDamages = async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl('/api/damage-cases/admin/all'), {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const data = await response.json()
			setDamages(data.data || [])
		} catch (error) {
			console.error('Failed to fetch damage cases:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleStatusChange = async (id: string, status: string, type: TabType) => {
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
				if (type === 'reviews') {
					fetchReviews()
				} else {
					fetchDamages()
				}
			}
		} catch (error) {
			console.error('Failed to update status:', error)
		}
	}

	const handleDelete = async (id: string, type: TabType) => {
		if (!confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return
		}

		try {
			const endpoint = type === 'reviews'
				? `/api/company-reviews/admin/${id}`
				: `/api/damage-cases/admin/${id}`

			const response = await fetch(getApiUrl(endpoint), {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})

			if (response.ok) {
				if (type === 'reviews') {
					fetchReviews()
				} else {
					fetchDamages()
				}
			}
		} catch (error) {
			console.error('Failed to delete:', error)
		}
	}

	if (!isAuthenticated) {
		return null
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			{/* Header */}
			<header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center space-x-4">
						<Link
							to="/admin"
							className="w-10 h-10 bg-gray-700/50 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
						>
							<ArrowLeft className="w-5 h-5 text-gray-300" />
						</Link>
						<div>
							<h1 className="text-2xl font-bold text-white">커뮤니티 관리</h1>
							<p className="text-gray-400 text-sm">업체 후기 및 피해사례 관리</p>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Tabs */}
				<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 p-2 mb-6 flex gap-2">
					<button
						onClick={() => setActiveTab('reviews')}
						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
							activeTab === 'reviews'
								? 'bg-green-500 text-white'
								: 'text-gray-400 hover:text-gray-300'
						}`}
					>
						<MessageSquare className="w-5 h-5" />
						<span>업체 후기</span>
						<span className="ml-2 px-2 py-0.5 bg-gray-900/50 rounded-full text-xs">
							{reviews.length}
						</span>
					</button>
					<button
						onClick={() => setActiveTab('damages')}
						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
							activeTab === 'damages'
								? 'bg-red-500 text-white'
								: 'text-gray-400 hover:text-gray-300'
						}`}
					>
						<AlertTriangle className="w-5 h-5" />
						<span>피해사례</span>
						<span className="ml-2 px-2 py-0.5 bg-gray-900/50 rounded-full text-xs">
							{damages.length}
						</span>
					</button>
				</div>

				{/* Content */}
				{loading ? (
					<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 p-12 text-center">
						<div className="w-8 h-8 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-400">로딩 중...</p>
					</div>
				) : activeTab === 'reviews' ? (
					<ReviewsTable
						reviews={reviews}
						onStatusChange={(id, status) => handleStatusChange(id, status, 'reviews')}
						onDelete={(id) => handleDelete(id, 'reviews')}
					/>
				) : (
					<DamagesTable
						damages={damages}
						onStatusChange={(id, status) => handleStatusChange(id, status, 'damages')}
						onDelete={(id) => handleDelete(id, 'damages')}
					/>
				)}
			</main>
		</div>
	)
}

function ReviewsTable({
	reviews,
	onStatusChange,
	onDelete
}: {
	reviews: CompanyReview[]
	onStatusChange: (id: string, status: string) => void
	onDelete: (id: string) => void
}) {
	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-700">
					<thead className="bg-gray-900/50">
						<tr>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								업체명
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								연락처
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								별점
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								상태
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								등록일
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								작업
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-700">
						{reviews.map((review) => (
							<motion.tr
								key={review.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="hover:bg-gray-700/30 transition-colors"
							>
								<td className="px-6 py-4">
									<div className="text-sm font-medium text-white">{review.company_name}</div>
									<div className="text-sm text-gray-400 truncate max-w-xs">
										{review.review_text?.substring(0, 50)}...
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
									{review.company_phone}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400">
									⭐ {review.rating}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<select
										value={review.status}
										onChange={(e) => onStatusChange(review.id, e.target.value)}
										className="text-sm bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-white focus:ring-2 focus:ring-green-500"
									>
										<option value="published">게시됨</option>
										<option value="pending">대기중</option>
										<option value="deleted">삭제됨</option>
									</select>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
									{new Date(review.created_at).toLocaleDateString('ko-KR')}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<button
										onClick={() => onDelete(review.id)}
										className="text-red-400 hover:text-red-300 transition-colors"
									>
										삭제
									</button>
								</td>
							</motion.tr>
						))}
						{reviews.length === 0 && (
							<tr>
								<td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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

function DamagesTable({
	damages,
	onStatusChange,
	onDelete
}: {
	damages: DamageCase[]
	onStatusChange: (id: string, status: string) => void
	onDelete: (id: string) => void
}) {
	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
			case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
			case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
			default: return 'bg-green-500/20 text-green-300 border-green-500/30'
		}
	}

	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-700">
					<thead className="bg-gray-900/50">
						<tr>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								제목
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								카테고리
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								심각도
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								상태
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								등록일
							</th>
							<th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
								작업
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-700">
						{damages.map((damage) => (
							<motion.tr
								key={damage.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="hover:bg-gray-700/30 transition-colors"
							>
								<td className="px-6 py-4">
									<div className="text-sm font-medium text-white">{damage.title}</div>
									<div className="text-sm text-gray-400 truncate max-w-xs">
										{damage.description?.substring(0, 50)}...
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
									{damage.category}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(damage.severity)}`}>
										{damage.severity}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<select
										value={damage.status}
										onChange={(e) => onStatusChange(damage.id, e.target.value)}
										className="text-sm bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-white focus:ring-2 focus:ring-red-500"
									>
										<option value="open">열림</option>
										<option value="in_progress">진행중</option>
										<option value="resolved">해결됨</option>
										<option value="deleted">삭제됨</option>
									</select>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
									{new Date(damage.created_at).toLocaleDateString('ko-KR')}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<button
										onClick={() => onDelete(damage.id)}
										className="text-red-400 hover:text-red-300 transition-colors"
									>
										삭제
									</button>
								</td>
							</motion.tr>
						))}
						{damages.length === 0 && (
							<tr>
								<td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
