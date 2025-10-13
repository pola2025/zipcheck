import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Building, Phone, FileText, Send, ArrowLeft } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { getApiUrl } from '../../lib/api-config'

export default function ReviewCreate() {
	const navigate = useNavigate()
	const [submitting, setSubmitting] = useState(false)

	// Form fields
	const [companyName, setCompanyName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [rating, setRating] = useState(0)
	const [reviewText, setReviewText] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Check authentication
		const token = localStorage.getItem('auth_token')
		if (!token) {
			alert('로그인이 필요합니다. 로그인 후 이용해주세요.')
			navigate('/login')
			return
		}

		if (rating === 0) {
			alert('별점을 선택해주세요.')
			return
		}

		if (reviewText.trim().length < 10) {
			alert('후기는 최소 10자 이상 작성해주세요.')
			return
		}

		setSubmitting(true)

		try {
			const response = await fetch(getApiUrl('/api/company-reviews'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					company_name: companyName,
					company_phone: companyPhone || undefined,
					business_number: businessNumber || undefined,
					rating,
					review_text: reviewText
				})
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || '후기 등록에 실패했습니다.')
			}

			const data = await response.json()
			alert('✅ 후기가 등록되었습니다! 관리자 승인 후 게시됩니다.')
			navigate(`/community?tab=reviews`)
		} catch (error) {
			console.error('Failed to submit review:', error)
			alert('❌ ' + (error instanceof Error ? error.message : '후기 등록에 실패했습니다.'))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-3xl">
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
							업체 후기 작성
						</h1>
						<p className="text-lg text-gray-300">만족스러운 시공 경험을 공유해주세요</p>
					</motion.div>

					{/* Form */}
					<motion.form
						onSubmit={handleSubmit}
						className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30"
						style={{
							boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.05)'
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{/* Company Name */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
								<Building className="w-4 h-4" />
								업체명 <span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder="예: OO인테리어"
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
								required
							/>
						</div>

						{/* Company Phone (Optional) */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
								<Phone className="w-4 h-4" />
								업체 전화번호 (선택)
							</label>
							<input
								type="tel"
								value={companyPhone}
								onChange={(e) => setCompanyPhone(e.target.value)}
								placeholder="02-1234-5678"
								className="w-full px-5 py-4 bg-black/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
							/>
						</div>

						{/* Business Number (Optional) */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
								<FileText className="w-4 h-4" />
								사업자번호 (선택)
							</label>
							<input
								type="text"
								value={businessNumber}
								onChange={(e) => setBusinessNumber(e.target.value)}
								placeholder="123-45-67890"
								className="w-full px-5 py-4 bg-black/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
							/>
						</div>

						{/* Rating */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
								<Star className="w-4 h-4" />
								별점 <span className="text-red-400">*</span>
							</label>
							<div className="flex gap-2">
								{[1, 2, 3, 4, 5].map((star) => (
									<motion.button
										key={star}
										type="button"
										onClick={() => setRating(star)}
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										className="focus:outline-none"
									>
										<Star
											className={`w-10 h-10 transition-all ${
												star <= rating
													? 'fill-cyan-400 text-cyan-400'
													: 'text-gray-600 hover:text-cyan-500'
											}`}
											style={
												star <= rating
													? {
															filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))'
														}
													: {}
											}
										/>
									</motion.button>
								))}
							</div>
							{rating > 0 && (
								<p className="text-sm text-cyan-400 mt-2">
									{rating}점 선택됨
								</p>
							)}
						</div>

						{/* Review Text */}
						<div className="mb-8">
							<label className="block text-sm font-semibold mb-3 text-cyan-400">
								후기 내용 <span className="text-red-400">*</span>
							</label>
							<textarea
								value={reviewText}
								onChange={(e) => setReviewText(e.target.value)}
								placeholder="시공 경험, 업체의 장점, 추천 이유 등을 자유롭게 작성해주세요. (최소 10자)"
								rows={8}
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all resize-none"
								required
							/>
							<div className="flex justify-between items-center mt-2">
								<p className="text-xs text-gray-400">최소 10자 이상 작성해주세요</p>
								<p className="text-xs text-gray-400">{reviewText.length}자</p>
							</div>
						</div>

						{/* Notice */}
						<div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
							<p className="text-sm text-blue-300">
								💡 <strong>안내사항</strong>
							</p>
							<ul className="text-xs text-gray-300 mt-2 space-y-1 ml-4">
								<li>• 작성하신 후기는 관리자 승인 후 게시됩니다</li>
								<li>• 허위 사실이나 비방 내용은 게시가 거부될 수 있습니다</li>
								<li>• 연락처/사업자번호 입력 시 커뮤니티 데이터와 자동 연계됩니다</li>
							</ul>
						</div>

						{/* Submit Button */}
						<motion.button
							type="submit"
							disabled={submitting || !companyName || rating === 0 || reviewText.length < 10}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
							style={{
								boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
							}}
						>
							{submitting ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									제출 중...
								</>
							) : (
								<>
									<Send className="w-5 h-5" />
									후기 등록하기
								</>
							)}
						</motion.button>
					</motion.form>
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
