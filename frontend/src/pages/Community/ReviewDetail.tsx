import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star, Building, Phone, FileText, ArrowLeft, Calendar, User, ThumbsUp } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
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
			if (!response.ok) throw new Error('후기를 불러올 수 없습니다.')
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
			const response = await fetch(getApiUrl(`/api/company-reviews/${id}/helpful`), { method: 'POST' })
			if (response.ok) {
				setHelpful(true)
				loadReview()
			}
		} catch (err) {
			console.error('Failed to mark as helpful:', err)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-sand-50 flex items-center justify-center">
				<NordicNavigation />
				<div className="flex flex-col items-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-3 border-forest-500" />
					<p className="mt-4 text-sand-500">후기를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	if (error || !review) {
		return (
			<div className="min-h-screen bg-sand-50">
				<NordicNavigation />
				<div className="pt-32 pb-20 px-5 md:px-8">
					<div className="max-w-3xl mx-auto">
						<div className="nordic-card rounded-2xl p-10 text-center border border-red-200 bg-red-50/50">
							<p className="text-lg text-red-600 mb-6">{error || '후기를 찾을 수 없습니다.'}</p>
							<button
								onClick={() => navigate('/community?tab=reviews')}
								className="px-8 py-3 bg-forest-600 text-white hover:bg-forest-700 rounded-xl font-semibold transition-all shadow-lg shadow-forest-600/15"
							>
								커뮤니티로 돌아가기
							</button>
						</div>
					</div>
				</div>
				<NordicFooter />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<NordicNavigation />

			<div className="pt-28 pb-20 px-5 md:px-8">
				<div className="max-w-4xl mx-auto">
					{/* Back */}
					<button
						onClick={() => navigate('/community?tab=reviews')}
						className="flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-8 transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						커뮤니티로 돌아가기
					</button>

					{/* Review Content */}
					<div className="nordic-card rounded-2xl p-6 md:p-10 mb-6">
						{/* Company Info Header */}
						<div className="flex items-start justify-between mb-6 pb-6 border-b border-sand-200">
							<div className="flex items-start gap-4">
								<div className="p-3 bg-forest-50 rounded-xl">
									<Building className="w-7 h-7 text-forest-600" />
								</div>
								<div>
									<h1 className="text-2xl md:text-3xl font-bold text-sand-900 mb-1.5">
										{review.company_name}
									</h1>
									{review.company_phone && (
										<div className="flex items-center gap-2 text-sand-500 text-sm mb-0.5">
											<Phone className="w-4 h-4" />
											<span>{review.company_phone}</span>
										</div>
									)}
									{review.business_number && (
										<div className="flex items-center gap-2 text-sand-500 text-sm">
											<FileText className="w-4 h-4" />
											<span>{review.business_number}</span>
										</div>
									)}
								</div>
							</div>

							{/* Rating */}
							<div className="flex flex-col items-end">
								<div className="flex gap-0.5 mb-1">
									{[1, 2, 3, 4, 5].map((star) => (
										<Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`} />
									))}
								</div>
								<span className="text-xl font-bold text-sand-900 font-outfit">{review.rating}.0</span>
							</div>
						</div>

						{/* Review Content */}
						<div className="mb-6">
							<h2 className="text-lg font-bold text-sand-900 mb-3">후기 내용</h2>
							<p className="text-sand-600 leading-relaxed whitespace-pre-wrap text-base">
								{review.review_text}
							</p>
						</div>

						{/* Metadata */}
						<div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-sand-200">
							<div className="flex items-center gap-3 text-sand-600">
								<Calendar className="w-5 h-5 text-forest-500" />
								<div>
									<p className="text-xs text-sand-400">작성일</p>
									<p className="font-medium">{new Date(review.created_at).toLocaleDateString('ko-KR')}</p>
								</div>
							</div>
							<div className="flex items-center gap-3 text-sand-600">
								<User className="w-5 h-5 text-forest-500" />
								<div>
									<p className="text-xs text-sand-400">작성자</p>
									<p className="font-medium">사용자</p>
								</div>
							</div>
						</div>
					</div>

					{/* Helpful Button */}
					<div className="nordic-card rounded-2xl p-6 text-center">
						<p className="text-sand-500 mb-4">이 후기가 도움이 되었나요?</p>
						<button
							onClick={handleHelpful}
							disabled={helpful}
							className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 mx-auto ${
								helpful
									? 'bg-sand-200 text-sand-500 cursor-not-allowed'
									: 'bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15'
							}`}
						>
							<ThumbsUp className="w-5 h-5" />
							{helpful ? '도움이 되었습니다!' : '도움이 돼요'}
							{review.like_count > 0 && <span className="ml-1 text-sm">({review.like_count})</span>}
						</button>
					</div>
				</div>
			</div>

			<NordicFooter />
		</div>
	)
}
