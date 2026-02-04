import React from 'react'
import { Eye, MapPin, Building2, ArrowRight } from 'lucide-react'
import StarRating from 'components/common/StarRating'
import { Review } from 'types/review'

interface ReviewCardProps {
	review: Review
	onClick: () => void
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick }) => {
	return (
		<article
			onClick={onClick}
			className='bg-white rounded-2xl p-6 border border-sand-200 hover:border-forest-300 hover:shadow-md transition-all cursor-pointer group'
		>
			{/* Header */}
			<div className='flex items-start justify-between mb-3'>
				<div className='flex-1 min-w-0'>
					<h3 className='text-lg font-bold text-sand-900 truncate group-hover:text-forest-700 transition-colors'>
						{review.company_name} - {review.project_type || '시공'}
					</h3>
					<div className='flex flex-wrap items-center gap-3 mt-1.5 text-sm text-sand-500'>
						<div className='flex items-center gap-1'>
							<Building2 size={14} className='text-forest-500' />
							<span>{review.company_name}</span>
						</div>
						{review.region && (
							<div className='flex items-center gap-1'>
								<MapPin size={14} className='text-forest-500' />
								<span>{review.region}</span>
							</div>
						)}
						<span className='text-sand-300'>|</span>
						<span>{new Date(review.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
					</div>
				</div>
				<div className='ml-4 flex-shrink-0'>
					<StarRating rating={review.rating} showScore />
				</div>
			</div>

			{/* Content Preview */}
			<p className='text-sand-600 mb-4 line-clamp-2 leading-relaxed text-sm'>{review.review_text}</p>

			{/* Project Info Tags */}
			{review.project_type && (
				<div className='flex flex-wrap items-center gap-2 mb-4'>
					<span className='px-3 py-1 bg-forest-50 text-forest-700 border border-forest-200 rounded-full text-xs font-medium'>
						{review.project_type}
					</span>
					{review.project_size && (
						<span className='text-xs text-sand-500'>
							{review.project_size}m2 (약 {(review.project_size / 3.3058).toFixed(1)}평)
						</span>
					)}
					{review.project_cost && (
						<span className='text-xs text-sand-500'>{review.project_cost.toLocaleString()}만원</span>
					)}
				</div>
			)}

			{/* Footer */}
			<div className='flex items-center justify-between pt-3 border-t border-sand-100'>
				<div className='flex items-center gap-4 text-xs text-sand-400'>
					<div className='flex items-center gap-1'>
						<Eye size={14} />
						<span>{review.view_count || 0}</span>
					</div>
				</div>
				<span className='text-xs text-forest-500 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
					자세히 보기 <ArrowRight size={14} />
				</span>
			</div>
		</article>
	)
}

export default ReviewCard
