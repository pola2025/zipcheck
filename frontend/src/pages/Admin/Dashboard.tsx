import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, FileText, Database, TrendingUp, LogOut, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'

interface QuoteRequest {
	id: string
	status: string
	created_at: string
}

interface DashboardStats {
	totalQuoteRequests: number
	pendingQuoteRequests: number
	totalUsers: number
	recentQuoteRequests: number
}

const Dashboard: React.FC = () => {
	const { user, logout } = useAuth()
	const [stats, setStats] = useState<DashboardStats>({
		totalQuoteRequests: 0,
		pendingQuoteRequests: 0,
		totalUsers: 0,
		recentQuoteRequests: 0
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchDashboardStats()
	}, [])

	const fetchDashboardStats = async () => {
		try {
			const token = localStorage.getItem('admin_token')
			if (!token) return

			// Fetch quote requests count
			const quoteResponse = await fetch(getApiUrl('/api/admin/quote-requests'), {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})

			if (quoteResponse.ok) {
				const quoteData: QuoteRequest[] = await quoteResponse.json()
				const total = quoteData.length || 0
				const pending = quoteData.filter((q) => q.status === 'pending').length || 0
				const recent = quoteData.filter((q) => {
					const createdAt = new Date(q.created_at)
					const weekAgo = new Date()
					weekAgo.setDate(weekAgo.getDate() - 7)
					return createdAt > weekAgo
				}).length || 0

				setStats({
					totalQuoteRequests: total,
					pendingQuoteRequests: pending,
					totalUsers: 0,
					recentQuoteRequests: recent
				})
			}
		} catch (error) {
			console.error('Failed to fetch dashboard stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleLogout = () => {
		logout()
		window.location.href = '/admin/login'
	}

	const statCards = [
		{
			title: '전체 견적 요청',
			value: stats.totalQuoteRequests,
			icon: FileText,
			color: 'from-blue-500 to-blue-600',
			link: '/admin/quote-requests'
		},
		{
			title: '처리 대기 중',
			value: stats.pendingQuoteRequests,
			icon: TrendingUp,
			color: 'from-orange-500 to-orange-600',
			link: '/admin/quote-requests'
		},
		{
			title: '최근 7일 요청',
			value: stats.recentQuoteRequests,
			icon: LayoutDashboard,
			color: 'from-green-500 to-green-600',
			link: '/admin/quote-requests'
		}
	]

	const menuItems = [
		{
			title: '견적 요청 관리',
			description: '사용자들의 견적 요청을 확인하고 관리합니다',
			icon: FileText,
			link: '/admin/quote-requests',
			color: 'from-blue-500 to-blue-600'
		},
		{
			title: '데이터 관리',
			description: '업체 정보, 자재 데이터 등을 관리합니다',
			icon: Database,
			link: '/admin/data',
			color: 'from-purple-500 to-purple-600'
		}
	]

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			{/* Header */}
			<header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
								<LayoutDashboard className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-white">ZipCheck 관리자</h1>
								<p className="text-gray-400 text-sm">환영합니다, {user?.username || 'Admin'}님</p>
							</div>
						</div>
						<button
							onClick={handleLogout}
							className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-all"
						>
							<LogOut className="w-4 h-4" />
							<span>로그아웃</span>
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					{statCards.map((card, index) => (
						<motion.div
							key={card.title}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<Link
								to={card.link}
								className="block bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
							>
								<div className="flex items-center justify-between mb-4">
									<div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
										<card.icon className="w-6 h-6 text-white" />
									</div>
									<ArrowRight className="w-5 h-5 text-gray-500" />
								</div>
								<h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
								<p className="text-3xl font-bold text-white">
									{loading ? '...' : card.value.toLocaleString()}
								</p>
							</Link>
						</motion.div>
					))}
				</div>

				{/* Menu Items */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{menuItems.map((item, index) => (
						<motion.div
							key={item.title}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 + index * 0.1 }}
						>
							<Link
								to={item.link}
								className="block bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all group"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start space-x-4">
										<div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
											<item.icon className="w-6 h-6 text-white" />
										</div>
										<div>
											<h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
											<p className="text-gray-400">{item.description}</p>
										</div>
									</div>
									<ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
								</div>
							</Link>
						</motion.div>
					))}
				</div>

				{/* Quick Stats Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="mt-8 bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700"
				>
					<h2 className="text-xl font-semibold text-white mb-4">시스템 상태</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex items-center space-x-3">
							<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
							<span className="text-gray-300">시스템 정상 운영 중</span>
						</div>
						<div className="flex items-center space-x-3">
							<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
							<span className="text-gray-300">데이터베이스 연결됨</span>
						</div>
					</div>
				</motion.div>
			</main>
		</div>
	)
}

export default Dashboard
