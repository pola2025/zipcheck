import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SortDesc, PenLine } from 'lucide-react'

interface ReviewFiltersProps {
	searchQuery: string
	sortBy: string
	onFilterChange: (filterType: string, value: string) => void
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
	searchQuery,
	sortBy,
	onFilterChange
}) => {
	const navigate = useNavigate()

	return (
		<div className='bg-white rounded-2xl p-5 mb-6 border border-sand-200'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				{/* Search Query */}
				<div className="md:col-span-2">
					<label className='block text-sm font-semibold text-sand-700 mb-2 flex items-center gap-1.5'>
						<Search size={14} className='text-forest-500' />
						검색
					</label>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => onFilterChange('search', e.target.value)}
						placeholder='업체명, 지역, 시공유형 등 검색'
						className='w-full px-4 py-2.5 bg-sand-50 border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all'
					/>
				</div>

				{/* Sort */}
				<div>
					<label className='block text-sm font-semibold text-sand-700 mb-2 flex items-center gap-1.5'>
						<SortDesc size={14} className='text-forest-500' />
						정렬
					</label>
					<select
						value={sortBy}
						onChange={(e) => onFilterChange('sort_by', e.target.value)}
						className='w-full px-4 py-2.5 bg-sand-50 border border-sand-200 rounded-lg text-sand-900 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all'
					>
						<option value='created_at'>최신순</option>
						<option value='rating'>평점순</option>
						<option value='like_count'>좋아요순</option>
						<option value='view_count'>조회순</option>
					</select>
				</div>
			</div>

			{/* Write Button */}
			<div className='mt-5 flex justify-end'>
				<button
					onClick={() => navigate('/community/reviews/create')}
					className='px-6 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm'
				>
					<PenLine size={16} />
					후기 작성하기
				</button>
			</div>
		</div>
	)
}

export default ReviewFilters
