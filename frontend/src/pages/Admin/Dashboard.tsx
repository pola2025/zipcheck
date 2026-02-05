import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, TrendingUp, LayoutDashboard, ArrowRight, MessageSquare, BarChart3, ClipboardCheck } from 'lucide-react'
import { getApiUrl } from '../../lib/api-config'
import { adminPath } from '../../lib/admin-path'

interface QuoteRequest {
	id: string
	status: string
	created_at: string
}

interface DashboardStats {
	totalQuoteRequests: number
	pendingQuoteRequests: number
	recentQuoteRequests: number
	totalReviews: number
	totalDamageCases: number
	totalAnalyses: number
	inProgressAnalyses: number
	completedAnalyses: number
}

const Dashboard: React.FC = () => {
	const [stats, setStats] = useState<DashboardStats>({
		totalQuoteRequests: 0,
		pendingQuoteRequests: 0,
		recentQuoteRequests: 0,
		totalReviews: 0,
		totalDamageCases: 0,
		totalAnalyses: 0,
		inProgressAnalyses: 0,
		completedAnalyses: 0,
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchDashboardStats()
	}, [])

	const fetchDashboardStats = async () => {
		try {
			const token = localStorage.getItem('admin_token')
			if (!token) return

			const [quoteResponse, reviewsResponse, damagesResponse, analysesResponse] = await Promise.all([
				fetch(getApiUrl('/api/admin/quote-requests'), {
					headers: { Authorization: `Bearer ${token}` }
				}),
				fetch(getApiUrl('/api/company-reviews/admin/all'), {
					headers: { Authorization: `Bearer ${token}` }
				}),
				fetch(getApiUrl('/api/damage-cases/admin/all'), {
					headers: { Authorization: `Bearer ${token}` }
				}),
				fetch(getApiUrl('/api/admin/analyses?limit=100'), {
					headers: { Authorization: `Bearer ${token}` }
				})
			])

			let totalQuoteRequests = 0
			let pendingQuoteRequests = 0
			let recentQuoteRequests = 0
			let totalReviews = 0
			let totalDamageCases = 0
			let totalAnalyses = 0
			let inProgressAnalyses = 0
			let completedAnalyses = 0

			if (quoteResponse.ok) {
				const quoteData: QuoteRequest[] = await quoteResponse.json()
				totalQuoteRequests = quoteData.length || 0
				pendingQuoteRequests = quoteData.filter((q) => q.status === 'pending').length || 0
				recentQuoteRequests = quoteData.filter((q) => {
					const createdAt = new Date(q.created_at)
					const weekAgo = new Date()
					weekAgo.setDate(weekAgo.getDate() - 7)
					return createdAt > weekAgo
				}).length || 0
			}

			if (reviewsResponse.ok) {
				const reviewsData = await reviewsResponse.json()
				totalReviews = reviewsData.data?.length || 0
			}

			if (damagesResponse.ok) {
				const damagesData = await damagesResponse.json()
				totalDamageCases = damagesData.data?.length || 0
			}

			if (analysesResponse.ok) {
				const analysesData = await analysesResponse.json()
				const analyses = analysesData.data || []
				totalAnalyses = analyses.length
				inProgressAnalyses = analyses.filter((a: any) => a.status === 'in_progress' || a.status === 'draft').length
				completedAnalyses = analyses.filter((a: any) => a.status === 'completed').length
			}

			setStats({
				totalQuoteRequests,
				pendingQuoteRequests,
				recentQuoteRequests,
				totalReviews,
				totalDamageCases,
				totalAnalyses,
				inProgressAnalyses,
				completedAnalyses,
			})
		} catch (error) {
			console.error('Failed to fetch dashboard stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const statCards = [
		{
			title: '전체 견적 요청',
			value: stats.totalQuoteRequests,
			icon: FileText,
			accent: 'bg-forest-100 text-forest-700',
			link: adminPath('/quote-requests')
		},
		{
			title: '처리 대기 중',
			value: stats.pendingQuoteRequests,
			icon: TrendingUp,
			accent: 'bg-amber-50 text-amber-600',
			link: adminPath('/quote-requests')
		},
		{
			title: '최근 7일 요청',
			value: stats.recentQuoteRequests,
			icon: LayoutDashboard,
			accent: 'bg-forest-50 text-forest-600',
			link: adminPath('/quote-requests')
		},
		{
			title: '커뮤니티 글',
			value: stats.totalReviews + stats.totalDamageCases,
			icon: MessageSquare,
			accent: 'bg-wood-100 text-wood-500',
			link: adminPath('/community')
		},
		{
			title: '전체 분석',
			value: stats.totalAnalyses,
			icon: ClipboardCheck,
			accent: 'bg-blue-50 text-blue-600',
			link: adminPath('/quote-requests?tab=analyses')
		},
		{
			title: '진행중 분석',
			value: stats.inProgressAnalyses,
			icon: TrendingUp,
			accent: 'bg-amber-50 text-amber-600',
			link: adminPath('/quote-requests?tab=analyses')
		}
	]

	return (
		<div className="space-y-6">
			{/* Page Title */}
			<div>
				<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
					대시보드
				</h2>
				<p className="text-sand-700 text-sm mt-1">서비스 운영 현황을 한눈에 확인하세요</p>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
				{statCards.map((card, index) => (
					<motion.div
						key={card.title}
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.07 }}
					>
						<Link
							to={card.link}
							className="block bg-white rounded-2xl p-5 border border-sand-300 hover:border-sand-300 hover:shadow-md transition-all group"
						>
							<div className="flex items-center justify-between mb-3">
								<div className={`w-10 h-10 rounded-xl ${card.accent} flex items-center justify-center`}>
									<card.icon className="w-5 h-5" />
								</div>
								<ArrowRight className="w-4 h-4 text-sand-600 group-hover:text-sand-700 transition-colors" />
							</div>
							<p className="text-sand-700 text-xs font-medium mb-0.5">{card.title}</p>
							<p className="text-2xl font-bold text-sand-900">
								{loading ? '—' : card.value.toLocaleString()}
							</p>
						</Link>
					</motion.div>
				))}
			</div>

			{/* Quick Links */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<Link
						to={adminPath('/analytics')}
						className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-sand-300 hover:border-forest-200 hover:shadow-md transition-all group"
					>
						<div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center flex-shrink-0">
							<BarChart3 className="w-6 h-6 text-forest-700" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-base font-semibold text-sand-900">유입 분석</h3>
							<p className="text-sm text-sand-700">트래픽, 검색어, 퍼널 분석</p>
						</div>
						<ArrowRight className="w-5 h-5 text-sand-600 group-hover:text-forest-500 transition-colors flex-shrink-0" />
					</Link>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.35 }}
				>
					<Link
						to={adminPath('/data')}
						className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-sand-300 hover:border-wood-200 hover:shadow-md transition-all group"
					>
						<div className="w-12 h-12 rounded-xl bg-wood-100 flex items-center justify-center flex-shrink-0">
							<FileText className="w-6 h-6 text-wood-500" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-base font-semibold text-sand-900">데이터 관리</h3>
							<p className="text-sm text-sand-700">시공 데이터, 유통사 가격 정보</p>
						</div>
						<ArrowRight className="w-5 h-5 text-sand-600 group-hover:text-wood-500 transition-colors flex-shrink-0" />
					</Link>
				</motion.div>
			</div>

			{/* System Status */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-white rounded-2xl p-5 border border-sand-300"
			>
				<h3 className="text-sm font-semibold text-sand-700 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
					System Status
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex items-center gap-2.5">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						<span className="text-sm text-sand-700">시스템 정상 운영 중</span>
					</div>
					<div className="flex items-center gap-2.5">
						<div className="w-2 h-2 bg-forest-500 rounded-full" />
						<span className="text-sm text-sand-700">데이터베이스 연결됨</span>
					</div>
				</div>
			</motion.div>
		</div>
	)
}

export default Dashboard
