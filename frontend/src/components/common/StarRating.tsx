import React from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
	rating: number
	showScore?: boolean
	size?: number
}

const StarRating: React.FC<StarRatingProps> = ({ rating, showScore = false, size = 16 }) => {
	return (
		<div className='flex items-center gap-2'>
			<div className='flex items-center gap-1'>
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						size={size}
						className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
					/>
				))}
			</div>
			{showScore && <span className='text-sm font-semibold text-cyan-400'>{rating}.0</span>}
		</div>
	)
}

export default StarRating
