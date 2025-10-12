import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import LikeButton from 'components/community/LikeButton'
import Comments from 'components/community/Comments'
import ReportModal from 'components/community/ReportModal'
import {
	Star,
	MapPin,
	Building2,
	Calendar,
	DollarSign,
	Home,
	Edit,
	Trash2,
	ArrowLeft,
	Eye,
	ThumbsUp,
	MessageCircle,
	Flag
} from 'lucide-react'

interface CompanyReview {
	id: string
	user_id: string
	company_name: string
	region: string
	company_type: string
	title: string
	content: string
	rating: number
	quality_rating: number
	price_rating: number
	communication_rating: number
	schedule_rating: number
	project_type: string
	project_size: number
	project_cost: number
	project_period: number
	images: string[]
	is_recommended: boolean
	author_name: string
	view_count: number
	like_count: number
	comment_count: number
	created_at: string
	updated_at: string
}

const CompanyReviewDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()

	const [review, setReview] = useState<CompanyReview | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')
	const [showReportModal, setShowReportModal] = useState(false)

	const token = localStorage.getItem('auth_token')
	const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null

	useEffect(() => {
		loadReview()
	}, [id])

	const loadReview = async () => {
		try {
			setLoading(true)

			const response = await fetch(`http://localhost:3001/api/company-reviews/${id}`)

			if (!response.ok) {
				throw new Error('후기를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setReview(data)
			setLoading(false)
		} catch (err) {
			console.error('Load review error:', err)
			setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!confirm('정말 삭제하시겠습니까?')) return

		try {
			const response = await fetch(`http://localhost:3001/api/company-reviews/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			})

			if (!response.ok) {
				throw new Error('후기 삭제에 실패했습니다.')
			}

			alert('후기가 삭제되었습니다.')
			navigate('/community/reviews')
		} catch (err) {
			console.error('Delete error:', err)
			alert('삭제 중 오류가 발생했습니다.')
		}
	}

	const renderStars = (rating: number, size: number = 20) => {
		return (
			<div className='flex items-center gap-1'>
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						size={size}
						className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
					/>
				))}
			</div>
		)
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-[#0A9DAA]'></div>
			</div>
		)
	}

	if (error || !review) {
		return (
			<div className='min-h-screen bg-gray-50'>
				<ZipCheckHeader />
				<main className='container mx-auto px-4 py-12 mt-20'>
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
						{error || '후기를 찾을 수 없습니다.'}
					</div>
					<button
						onClick={() => navigate('/community/reviews')}
						className='mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
					>
						목록으로 돌아가기
					</button>
				</main>
				<ZipCheckFooter />
			</div>
		)
	}

	const isAuthor = currentUser && currentUser.id === review.user_id

	return (
		<div className='min-h-screen bg-gray-50'>
			<ZipCheckHeader />

			<main className='container mx-auto px-4 py-12 mt-20'>
				{/* Back Button */}
				<button
					onClick={() => navigate('/community/reviews')}
					className='flex items-center gap-2 text-gray-600 hover:text-[#0A9DAA] mb-6 transition-colors'
				>
					<ArrowLeft size={20} />
					<span>목록으로 돌아가기</span>
				</button>

				{/* Main Content */}
				<div className='bg-white rounded-lg shadow-sm p-8 mb-6'>
					{/* Header */}
					<div className='border-b border-gray-200 pb-6 mb-6'>
						<div className='flex items-start justify-between mb-4'>
							<div className='flex-1'>
								<h1 className='text-3xl font-bold text-gray-800 mb-3'>{review.title}</h1>
								<div className='flex items-center gap-4 text-sm text-gray-600'>
									<span className='font-medium'>{review.author_name}</span>
									<span className='text-gray-400'>|</span>
									<span>{new Date(review.created_at).toLocaleString()}</span>
									{review.updated_at !== review.created_at && (
										<span className='text-xs text-gray-400'>(수정됨)</span>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className='flex items-center gap-2'>
								{isAuthor ? (
									<>
										<button
											onClick={() => navigate(`/community/reviews/${id}/edit`)}
											className='flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
										>
											<Edit size={16} />
											<span>수정</span>
										</button>
										<button
											onClick={handleDelete}
											className='flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
										>
											<Trash2 size={16} />
											<span>삭제</span>
										</button>
									</>
								) : (
									<button
										onClick={() => setShowReportModal(true)}
										className='flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
									>
										<Flag size={16} />
										<span>신고</span>
									</button>
								)}
							</div>
						</div>

						{/* Rating and Stats */}
						<div className='flex items-center gap-6'>
							<div className='flex items-center gap-2'>
								{renderStars(review.rating, 24)}
								<span className='text-2xl font-bold text-gray-800'>{review.rating.toFixed(1)}</span>
							</div>
							{review.is_recommended && (
								<span className='px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full'>
									추천
								</span>
							)}
							<div className='flex items-center gap-4 text-sm text-gray-500 ml-auto'>
								<div className='flex items-center gap-1'>
									<Eye size={16} />
									<span>{review.view_count}</span>
								</div>
								<div className='flex items-center gap-1'>
									<ThumbsUp size={16} />
									<span>{review.like_count}</span>
								</div>
								<div className='flex items-center gap-1'>
									<MessageCircle size={16} />
									<span>{review.comment_count}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Company Info */}
					<div className='bg-gray-50 rounded-lg p-6 mb-6'>
						<h2 className='text-lg font-bold text-gray-800 mb-4'>업체 정보</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='flex items-center gap-2 text-gray-700'>
								<Building2 size={18} className='text-[#0A9DAA]' />
								<span className='font-medium'>{review.company_name}</span>
							</div>
							<div className='flex items-center gap-2 text-gray-700'>
								<MapPin size={18} className='text-[#0A9DAA]' />
								<span>{review.region}</span>
							</div>
							<div className='flex items-center gap-2 text-gray-700'>
								<Home size={18} className='text-[#0A9DAA]' />
								<span>{review.company_type}</span>
							</div>
						</div>
					</div>

					{/* Detailed Ratings */}
					<div className='bg-gray-50 rounded-lg p-6 mb-6'>
						<h2 className='text-lg font-bold text-gray-800 mb-4'>세부 평가</h2>
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-gray-700'>시공 품질</span>
								<div className='flex items-center gap-2'>
									{renderStars(review.quality_rating)}
									<span className='text-sm font-medium text-gray-600 w-8'>
										{review.quality_rating}
									</span>
								</div>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-gray-700'>가격 만족도</span>
								<div className='flex items-center gap-2'>
									{renderStars(review.price_rating)}
									<span className='text-sm font-medium text-gray-600 w-8'>{review.price_rating}</span>
								</div>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-gray-700'>소통</span>
								<div className='flex items-center gap-2'>
									{renderStars(review.communication_rating)}
									<span className='text-sm font-medium text-gray-600 w-8'>
										{review.communication_rating}
									</span>
								</div>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-gray-700'>일정 준수</span>
								<div className='flex items-center gap-2'>
									{renderStars(review.schedule_rating)}
									<span className='text-sm font-medium text-gray-600 w-8'>
										{review.schedule_rating}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Project Info */}
					<div className='bg-gray-50 rounded-lg p-6 mb-6'>
						<h2 className='text-lg font-bold text-gray-800 mb-4'>시공 정보</h2>
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							<div>
								<div className='text-sm text-gray-500 mb-1'>시공 유형</div>
								<div className='text-gray-800 font-medium'>{review.project_type}</div>
							</div>
							<div>
								<div className='text-sm text-gray-500 mb-1'>평수</div>
								<div className='text-gray-800 font-medium'>{review.project_size}평</div>
							</div>
							<div>
								<div className='text-sm text-gray-500 mb-1'>비용</div>
								<div className='text-gray-800 font-medium'>{review.project_cost.toLocaleString()}만원</div>
							</div>
							<div>
								<div className='text-sm text-gray-500 mb-1'>기간</div>
								<div className='text-gray-800 font-medium'>{review.project_period}일</div>
							</div>
						</div>
					</div>

					{/* Images */}
					{review.images && review.images.length > 0 && (
						<div className='mb-6'>
							<h2 className='text-lg font-bold text-gray-800 mb-4'>시공 사진</h2>
							<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
								{review.images.map((image, index) => (
									<img
										key={index}
										src={image}
										alt={`시공 사진 ${index + 1}`}
										className='w-full h-64 object-cover rounded-lg'
									/>
								))}
							</div>
						</div>
					)}

					{/* Content */}
					<div className='mb-6'>
						<h2 className='text-lg font-bold text-gray-800 mb-4'>후기 내용</h2>
						<p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>{review.content}</p>
					</div>

					{/* Like Button */}
					<div className='flex justify-center py-6 border-t border-gray-200'>
						<LikeButton
							targetType='review'
							targetId={review.id}
							initialLikeCount={review.like_count}
							size='lg'
						/>
					</div>
				</div>

				{/* Comments Section */}
				<Comments targetType='review' targetId={review.id} />
			</main>

			<ZipCheckFooter />

			{/* Report Modal */}
			<ReportModal
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
				targetType='review'
				targetId={review.id}
			/>
		</div>
	)
}

export default CompanyReviewDetail
