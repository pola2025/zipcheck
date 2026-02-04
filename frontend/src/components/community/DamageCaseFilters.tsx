import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SortDesc, PenLine } from 'lucide-react'

interface DamageCaseFiltersProps {
	searchQuery: string
	sortBy: string
	onFilterChange: (filterType: string, value: string) => void
}

const DamageCaseFilters: React.FC<DamageCaseFiltersProps> = ({
	searchQuery,
	sortBy,
	onFilterChange
}) => {
	const navigate = useNavigate()

	return (
		<div className='bg-white rounded-2xl p-5 mb-6 border border-sand-200'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* Search Input */}
				<div>
					<label className='block text-sm font-semibold text-sand-700 mb-2 flex items-center gap-1.5'>
						<Search size={14} className='text-red-400' />
						통합 검색
					</label>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => onFilterChange('search', e.target.value)}
						placeholder='업체명, 지역, 피해유형 등 검색'
						className='w-full px-4 py-2.5 bg-sand-50 border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all'
					/>
				</div>

				{/* Sort By */}
				<div>
					<label className='block text-sm font-semibold text-sand-700 mb-2 flex items-center gap-1.5'>
						<SortDesc size={14} className='text-red-400' />
						정렬
					</label>
					<select
						value={sortBy}
						onChange={(e) => onFilterChange('sort_by', e.target.value)}
						className='w-full px-4 py-2.5 bg-sand-50 border border-sand-200 rounded-lg text-sand-900 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all'
					>
						<option value='created_at'>최신순</option>
						<option value='severity'>심각도순</option>
					</select>
				</div>
			</div>

			{/* Write Button */}
			<div className='mt-5 flex justify-end'>
				<button
					onClick={() => navigate('/community/damage-cases/create')}
					className='px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm'
				>
					<PenLine size={16} />
					피해사례 등록하기
				</button>
			</div>
		</div>
	)
}

export default DamageCaseFilters
