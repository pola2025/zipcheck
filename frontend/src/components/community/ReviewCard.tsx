import React from 'react'
import { ThumbsUp, MessageCircle, Eye, MapPin, Building2 } from 'lucide-react'
import StarRating from 'components/common/StarRating'
import { Review } from 'types/review'

interface ReviewCardProps {
	review: Review
	onClick: () => void
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick }) => {
	return (
		<div
			onClick={onClick}
			className='glass-neon rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all cursor-pointer'
		>
			{/* Header */}
			<div className='flex items-start justify-between mb-4'>
				<div className='flex-1'>
					<div className='flex items-center gap-3 mb-2'>
						<h3 className='text-xl font-bold text-white'>{review.title}</h3>
						{review.is_recommended && (
							<span className='px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-semibold rounded-full'>
								추천
							</span>
						)}
					</div>
					<div className='flex items-center gap-4 text-sm text-gray-400'>
						<div className='flex items-center gap-1'>
							<Building2 size={14} className='text-cyan-400' />
							<span className='text-gray-300'>{review.company_name}</span>
						</div>
						<div className='flex items-center gap-1'>
							<MapPin size={14} className='text-cyan-400' />
							<span>{review.region}</span>
						</div>
						<span className='text-gray-600'>|</span>
						<span>{review.author_name}</span>
						<span className='text-gray-600'>|</span>
						<span>{new Date(review.created_at).toLocaleDateString()}</span>
					</div>
				</div>
				<StarRating rating={review.rating} showScore />
			</div>

			{/* Content Preview */}
			<p className='text-gray-300 mb-4 line-clamp-2 leading-relaxed'>{review.content}</p>

			{/* Project Info */}
			{review.project_type && (
				<div className='flex items-center gap-4 text-sm text-gray-300 mb-4'>
					<span className='px-3 py-1 glass-dark border border-cyan-500/30 rounded-full'>
						{review.project_type}
					</span>
					{review.project_size && (
						<span>
							{review.project_size}㎡ (약 {(review.project_size / 3.3058).toFixed(1)}평)
						</span>
					)}
					{review.project_cost && <span>{review.project_cost.toLocaleString()}만원</span>}
				</div>
			)}

			{/* Stats */}
			<div className='flex items-center gap-6 text-sm text-gray-400 pt-4 border-t border-gray-700/50'>
				<div className='flex items-center gap-1'>
					<Eye size={16} className='text-cyan-400' />
					<span>{review.view_count}</span>
				</div>
				<div className='flex items-center gap-1'>
					<ThumbsUp size={16} className='text-cyan-400' />
					<span>{review.like_count}</span>
				</div>
				<div className='flex items-center gap-1'>
					<MessageCircle size={16} className='text-cyan-400' />
					<span>{review.comment_count}</span>
				</div>
			</div>
		</div>
	)
}

export default ReviewCard
