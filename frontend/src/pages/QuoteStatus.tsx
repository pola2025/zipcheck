import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Clock, CheckCircle2, AlertCircle, FileText, ArrowRight, RefreshCw } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { getApiUrl } from '../lib/api-config'

interface QuoteRequest {
	id: string
	request_id: string
	created_at: string
	status: 'pending' | 'analyzing' | 'completed' | 'failed'
	plan_name: string
	quantity: number
	property_type: string
	property_size?: number
	region: string
	analysis_progress?: number
}

export default function QuoteStatus() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const phoneFromUrl = searchParams.get('phone') || ''

	const [phone, setPhone] = useState(phoneFromUrl)
	const [searchPhone, setSearchPhone] = useState(phoneFromUrl)
	const [quotes, setQuotes] = useState<QuoteRequest[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (phoneFromUrl) {
			fetchQuotes(phoneFromUrl)
		}
	}, [phoneFromUrl])

	const fetchQuotes = async (phoneNumber: string) => {
		if (!phoneNumber.trim()) {
			setError('전화번호를 입력해주세요.')
			return
		}

		setLoading(true)
		setError('')

		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/status?phone=${encodeURIComponent(phoneNumber)}`)
			)

			if (!response.ok) {
				throw new Error('견적 정보를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setQuotes(data.requests || [])

			if (data.requests.length === 0) {
				setError('해당 전화번호로 신청된 견적이 없습니다.')
			}
		} catch (err) {
			console.error('Failed to fetch quotes:', err)
			setError(err instanceof Error ? err.message : '견적 정보를 불러오는 중 오류가 발생했습니다.')
			setQuotes([])
		} finally {
			setLoading(false)
		}
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setSearchParams({ phone: searchPhone })
		setPhone(searchPhone)
		fetchQuotes(searchPhone)
	}

	const getStatusInfo = (status: string) => {
		switch (status) {
			case 'pending':
				return {
					label: '대기중',
					color: 'text-amber-400',
					bgColor: 'bg-amber-500/20',
					borderColor: 'border-amber-500/30',
					icon: Clock
				}
			case 'analyzing':
				return {
					label: '분석중',
					color: 'text-blue-400',
					bgColor: 'bg-blue-500/20',
					borderColor: 'border-blue-500/30',
					icon: RefreshCw
				}
			case 'completed':
				return {
					label: '완료',
					color: 'text-cyan-400',
					bgColor: 'bg-cyan-500/20',
					borderColor: 'border-cyan-400/30',
					icon: CheckCircle2
				}
			case 'failed':
				return {
					label: '실패',
					color: 'text-red-400',
					bgColor: 'bg-red-500/20',
					borderColor: 'border-red-500/30',
					icon: AlertCircle
				}
			default:
				return {
					label: '알 수 없음',
					color: 'text-gray-400',
					bgColor: 'bg-gray-500/20',
					borderColor: 'border-gray-500/30',
					icon: AlertCircle
				}
		}
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated neon background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-4xl">
					{/* Page Title */}
					<motion.div
						className="text-center mb-12"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1
							className="text-5xl md:text-6xl font-bold mb-4"
							style={{
								background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.6))'
							}}
						>
							견적 신청 현황
						</h1>
						<p className="text-lg text-gray-300">전화번호로 견적 분석 진행 상황을 확인하세요</p>
					</motion.div>

					{/* Search Form */}
					<motion.div
						className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30 mb-8"
						style={{
							boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.05)'
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<form onSubmit={handleSearch} className="flex gap-4">
							<div className="flex-1 relative">
								<input
									type="tel"
									value={searchPhone}
									onChange={(e) => setSearchPhone(e.target.value)}
									placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
									className="w-full px-6 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
									required
								/>
								<Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
							</div>
							<motion.button
								type="submit"
								disabled={loading}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
								style={{
									boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
								}}
							>
								{loading ? (
									<>
										<RefreshCw className="w-5 h-5 animate-spin" />
										조회 중...
									</>
								) : (
									<>
										<Search className="w-5 h-5" />
										조회
									</>
								)}
							</motion.button>
						</form>
					</motion.div>

					{/* Error Message */}
					{error && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-2xl p-6 border-2 border-red-500/50 bg-red-900/20 mb-8"
						>
							<div className="flex items-center gap-3">
								<AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
								<p className="text-red-300">{error}</p>
							</div>
						</motion.div>
					)}

					{/* Quotes List */}
					{!loading && quotes.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="space-y-6"
						>
							<h2 className="text-2xl font-bold mb-6" style={{
								background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
							}}>
								신청 내역 ({quotes.length}건)
							</h2>

							{quotes.map((quote, index) => {
								const statusInfo = getStatusInfo(quote.status)
								const StatusIcon = statusInfo.icon

								return (
									<motion.div
										key={quote.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.4 + index * 0.1 }}
										className={`glass-neon rounded-2xl p-6 border-2 ${statusInfo.borderColor} hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all`}
										style={{
											boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)'
										}}
									>
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-3">
												<div className={`p-3 ${statusInfo.bgColor} rounded-xl`}>
													<FileText className={`w-6 h-6 ${statusInfo.color}`} />
												</div>
												<div>
													<h3 className="text-xl font-bold text-white">
														{quote.plan_name} ({quote.quantity}건)
													</h3>
													<p className="text-sm text-gray-400 mt-1">
														신청 ID: {quote.request_id}
													</p>
												</div>
											</div>

											<div className={`flex items-center gap-2 px-4 py-2 ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-full`}>
												<StatusIcon className={`w-4 h-4 ${statusInfo.color} ${quote.status === 'analyzing' ? 'animate-spin' : ''}`} />
												<span className={`text-sm font-semibold ${statusInfo.color}`}>
													{statusInfo.label}
												</span>
											</div>
										</div>

										<div className="grid md:grid-cols-2 gap-4 mb-4">
											<div>
												<p className="text-sm text-gray-400 mb-1">건물 유형</p>
												<p className="text-white font-semibold">{quote.property_type}</p>
											</div>
											<div>
												<p className="text-sm text-gray-400 mb-1">지역</p>
												<p className="text-white font-semibold">{quote.region}</p>
											</div>
											{quote.property_size && (
												<div>
													<p className="text-sm text-gray-400 mb-1">평수</p>
													<p className="text-white font-semibold">{quote.property_size}평</p>
												</div>
											)}
											<div>
												<p className="text-sm text-gray-400 mb-1">신청일</p>
												<p className="text-white font-semibold">
													{new Date(quote.created_at).toLocaleString('ko-KR')}
												</p>
											</div>
										</div>

										{/* Progress Bar for Analyzing */}
										{quote.status === 'analyzing' && quote.analysis_progress !== undefined && (
											<div className="mb-4">
												<div className="flex justify-between text-sm mb-2">
													<span className="text-gray-400">분석 진행률</span>
													<span className="text-blue-400 font-semibold">{quote.analysis_progress}%</span>
												</div>
												<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
													<motion.div
														className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
														initial={{ width: 0 }}
														animate={{ width: `${quote.analysis_progress}%` }}
														transition={{ duration: 0.5 }}
													/>
												</div>
											</div>
										)}

										{/* Action Buttons */}
										<div className="flex gap-3">
											{quote.status === 'completed' && (
												<motion.button
													onClick={() => navigate(`/admin/quote-requests/${quote.id}`)}
													whileHover={{ scale: 1.02 }}
													whileTap={{ scale: 0.98 }}
													className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
													style={{
														boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)'
													}}
												>
													<FileText className="w-5 h-5" />
													분석 결과 보기
													<ArrowRight className="w-5 h-5" />
												</motion.button>
											)}
											{quote.status === 'pending' && (
												<div className="flex-1 text-center py-3 text-amber-400 text-sm">
													관리자가 검토 중입니다. 잠시만 기다려주세요.
												</div>
											)}
											{quote.status === 'analyzing' && (
												<div className="flex-1 text-center py-3 text-blue-400 text-sm flex items-center justify-center gap-2">
													<RefreshCw className="w-4 h-4 animate-spin" />
													AI가 견적을 분석하고 있습니다...
												</div>
											)}
										</div>
									</motion.div>
								)
							})}
						</motion.div>
					)}

					{/* Empty State */}
					{!loading && !error && quotes.length === 0 && phone && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-2xl p-12 text-center border border-gray-700"
						>
							<FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
							<p className="text-xl text-gray-400 mb-6">
								해당 전화번호로 신청된 견적이 없습니다.
							</p>
							<motion.button
								onClick={() => navigate('/plan-selection')}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold shadow-lg transition-all"
								style={{
									boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)'
								}}
							>
								견적 신청하기
							</motion.button>
						</motion.div>
					)}
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
