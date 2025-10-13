import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Building, Phone, FileText, ArrowLeft, Calendar, User, ThumbsUp } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { getApiUrl } from '../../lib/api-config'
import { Review } from '../../types/review'

export default function ReviewDetail() {
	const navigate = useNavigate()
	const { id } = useParams<{ id: string }>()
	const [review, setReview] = useState<Review | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [helpful, setHelpful] = useState(false)

	useEffect(() => {
		loadReview()
	}, [id])

	const loadReview = async () => {
		try {
			setLoading(true)
			const response = await fetch(getApiUrl(`/api/company-reviews/${id}`))

			if (!response.ok) {
				throw new Error('후기를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setReview(data)
			setLoading(false)
		} catch (err) {
			console.error('Failed to load review:', err)
			setError(err instanceof Error ? err.message : '후기를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const handleHelpful = async () => {
		if (!review) return

		try {
			const response = await fetch(getApiUrl(`/api/company-reviews/${id}/helpful`), {
				method: 'POST'
			})

			if (response.ok) {
				setHelpful(true)
				// Reload review to get updated helpful count
				loadReview()
			}
		} catch (err) {
			console.error('Failed to mark as helpful:', err)
		}
	}

	if (loading) {
		return (
			<div className="relative min-h-screen bg-black text-white flex items-center justify-center">
				<ZipCheckHeader />
				<AnimatedBackground />
				<div className="relative z-10 flex flex-col items-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400" style={{
						boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)'
					}}></div>
					<p className="mt-6 text-lg text-cyan-400">후기를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	if (error || !review) {
		return (
			<div className="relative min-h-screen bg-black text-white">
				<ZipCheckHeader />
				<AnimatedBackground />
				<div className="relative z-10 pt-32 pb-20 px-6">
					<div className="container mx-auto max-w-3xl">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-2xl p-12 text-center border-2 border-red-500/50 bg-red-900/20"
						>
							<p className="text-xl text-red-300 mb-6">{error || '후기를 찾을 수 없습니다.'}</p>
							<motion.button
								onClick={() => navigate('/community?tab=reviews')}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold shadow-lg transition-all"
								style={{
									boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)'
								}}
							>
								커뮤니티로 돌아가기
							</motion.button>
						</motion.div>
					</div>
				</div>
				<ZipCheckFooter />
			</div>
		)
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-4xl">
					{/* Back Button */}
					<motion.button
						onClick={() => navigate('/community?tab=reviews')}
						className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<ArrowLeft className="w-5 h-5" />
						<span>커뮤니티로 돌아가기</span>
					</motion.button>

					{/* Review Content */}
					<motion.div
						className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30 mb-6"
						style={{
							boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.05)'
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{/* Company Info Header */}
						<div className="flex items-start justify-between mb-6 pb-6 border-b border-cyan-500/20">
							<div className="flex items-start gap-4">
								<div className="p-3 bg-cyan-500/20 rounded-xl">
									<Building className="w-8 h-8 text-cyan-400" />
								</div>
								<div>
									<h1 className="text-3xl font-bold mb-2" style={{
										background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
										WebkitBackgroundClip: 'text',
										WebkitTextFillColor: 'transparent',
										filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
									}}>
										{review.company_name}
									</h1>
									{review.company_phone && (
										<div className="flex items-center gap-2 text-gray-300 mb-1">
											<Phone className="w-4 h-4" />
											<span>{review.company_phone}</span>
										</div>
									)}
									{review.business_number && (
										<div className="flex items-center gap-2 text-gray-300">
											<FileText className="w-4 h-4" />
											<span>{review.business_number}</span>
										</div>
									)}
								</div>
							</div>

							{/* Rating Display */}
							<div className="flex flex-col items-end">
								<div className="flex gap-1 mb-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<Star
											key={star}
											className={`w-6 h-6 ${
												star <= review.rating
													? 'fill-cyan-400 text-cyan-400'
													: 'text-gray-600'
											}`}
											style={
												star <= review.rating
													? {
														filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))'
													}
													: {}
											}
										/>
									))}
								</div>
								<span className="text-2xl font-bold text-cyan-400">{review.rating}.0</span>
							</div>
						</div>

						{/* Review Content */}
						<div className="mb-6">
							<h2 className="text-xl font-bold text-cyan-400 mb-4">후기 내용</h2>
							<p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
								{review.review_text}
							</p>
						</div>

						{/* Metadata */}
						<div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-cyan-500/20">
							<div className="flex items-center gap-3 text-gray-300">
								<Calendar className="w-5 h-5 text-cyan-400" />
								<div>
									<p className="text-sm text-gray-400">작성일</p>
									<p className="font-semibold">
										{new Date(review.created_at).toLocaleDateString('ko-KR')}
									</p>
								</div>
							</div>
							{review.author_name && (
								<div className="flex items-center gap-3 text-gray-300">
									<User className="w-5 h-5 text-cyan-400" />
									<div>
										<p className="text-sm text-gray-400">작성자</p>
										<p className="font-semibold">{review.author_name}</p>
									</div>
								</div>
							)}
						</div>
					</motion.div>

					{/* Helpful Button */}
					<motion.div
						className="glass-neon rounded-2xl p-6 border border-cyan-500/20 text-center"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<p className="text-gray-300 mb-4">이 후기가 도움이 되었나요?</p>
						<motion.button
							onClick={handleHelpful}
							disabled={helpful}
							whileHover={{ scale: helpful ? 1 : 1.05 }}
							whileTap={{ scale: helpful ? 1 : 0.95 }}
							className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 mx-auto ${
								helpful
									? 'bg-gray-700 cursor-not-allowed'
									: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
							}`}
							style={
								!helpful
									? {
										boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)'
									}
									: {}
							}
						>
							<ThumbsUp className="w-5 h-5" />
							{helpful ? '도움이 되었습니다!' : '도움이 돼요'}
							{review.helpful_count > 0 && (
								<span className="ml-2 text-sm">({review.helpful_count})</span>
							)}
						</motion.button>
					</motion.div>
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
