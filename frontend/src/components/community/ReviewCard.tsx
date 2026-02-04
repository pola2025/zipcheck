import React from 'react'
import { Star, MapPin, Camera, Eye, ArrowRight, Banknote, Wrench } from 'lucide-react'
import { Review } from 'types/review'
import { getApiUrl } from '../../lib/api-config'

interface ReviewCardProps {
	review: Review
	onClick: () => void
}

function parseImageField(field: string | string[] | null): string[] {
	if (!field) return []
	if (Array.isArray(field)) return field
	try {
		const parsed = JSON.parse(field)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

function resolveImageUrl(src: string): string {
	if (src.startsWith('http://') || src.startsWith('https://')) return src
	return getApiUrl('/images/') + src
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick }) => {
	const beforeImages = parseImageField(review.before_images)
	const afterImages = parseImageField(review.after_images)
	const generalImages = parseImageField(review.images)
	const hasBeforeAfter = beforeImages.length > 0 && afterImages.length > 0

	return (
		<article
			onClick={onClick}
			className='bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-forest-400 transition-all cursor-pointer group'
		>
			{/* Thumbnail */}
			<div className='relative aspect-[4/3] bg-gray-100 overflow-hidden'>
				{hasBeforeAfter ? (
					<div className='w-full h-full flex'>
						<div className='w-1/2 h-full relative'>
							<img
								src={resolveImageUrl(beforeImages[0])}
								alt='Before'
								className='w-full h-full object-cover grayscale opacity-80 group-hover:opacity-90 transition-opacity'
							/>
							<span className='absolute top-2 left-2 px-2 py-0.5 bg-gray-900/70 text-white text-[10px] font-bold rounded'>
								BEFORE
							</span>
						</div>
						<div className='w-px bg-white/80 z-10' />
						<div className='w-1/2 h-full relative'>
							<img
								src={resolveImageUrl(afterImages[0])}
								alt='After'
								className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
							/>
							<span className='absolute top-2 right-2 px-2 py-0.5 bg-forest-600/90 text-white text-[10px] font-bold rounded'>
								AFTER
							</span>
						</div>
					</div>
				) : generalImages.length > 0 ? (
					<img
						src={resolveImageUrl(generalImages[0])}
						alt={review.company_name}
						className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
					/>
				) : (
					<div className='w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 gap-1.5'>
						<Camera size={28} strokeWidth={1.5} />
						<span className='text-[11px] font-medium'>사진 없음</span>
					</div>
				)}

				{/* Rating badge */}
				<div className='absolute bottom-2 left-2 flex items-center gap-1 px-2.5 py-1 bg-amber-500 rounded-lg shadow-md'>
					<Star size={12} className='fill-white text-white' />
					<span className='text-white text-xs font-extrabold'>{review.rating}</span>
				</div>

				{/* Before/After badge */}
				{hasBeforeAfter && (
					<div className='absolute bottom-2 right-2 px-2.5 py-1 bg-forest-600 rounded-lg shadow-md'>
						<span className='text-white text-[10px] font-bold tracking-wide'>전/후 비교</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className='p-4'>
				{/* Company name */}
				<h3 className='text-base font-extrabold text-gray-900 truncate mb-2.5 group-hover:text-forest-700 transition-colors'>
					{review.company_name}
				</h3>

				{/* Info badges */}
				<div className='flex flex-wrap gap-1.5 mb-3'>
					{review.region && (
						<span className='inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold'>
							<MapPin size={11} className='text-gray-500' />
							{review.region}
						</span>
					)}
					{review.project_type && (
						<span className='inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-semibold border border-emerald-200'>
							<Wrench size={11} className='text-emerald-600' />
							{review.project_type}
						</span>
					)}
					{review.project_cost && review.project_cost > 0 && (
						<span className='inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-semibold border border-blue-200'>
							<Banknote size={11} className='text-blue-600' />
							{review.project_cost.toLocaleString()}만원
						</span>
					)}
				</div>

				{/* Review text */}
				<p className='text-sm text-gray-700 line-clamp-2 leading-relaxed mb-3'>
					{review.review_text}
				</p>

				{/* Footer */}
				<div className='flex items-center justify-between pt-3 border-t border-gray-100'>
					<div className='flex items-center gap-3 text-xs text-gray-500'>
						<span className='inline-flex items-center gap-1'>
							<Eye size={12} />
							{review.view_count || 0}
						</span>
						<span>
							{new Date(review.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
						</span>
					</div>
					<span className='text-xs text-forest-600 font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
						자세히 <ArrowRight size={12} />
					</span>
				</div>
			</div>
		</article>
	)
}

export default ReviewCard
