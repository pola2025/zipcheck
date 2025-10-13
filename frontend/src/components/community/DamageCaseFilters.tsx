import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SortDesc } from 'lucide-react'

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

	const inputClassName = 'w-full px-4 py-3 bg-black/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
	const selectClassName = 'w-full px-4 py-3 bg-black/60 border border-red-500/30 rounded-lg text-white focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
	const selectStyle = { colorScheme: 'dark' as const }

	return (
		<div className='glass-neon rounded-2xl p-6 mb-6 border border-red-500/30'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* Search Input */}
				<div>
					<label className='block text-sm font-semibold text-red-300 mb-2 flex items-center gap-2'>
						<Search className='w-4 h-4' />
						통합 검색
					</label>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => onFilterChange('search', e.target.value)}
						placeholder='업체명, 지역, 피해유형 등 검색'
						className={inputClassName}
					/>
				</div>

				{/* Sort By */}
				<div>
					<label className='block text-sm font-semibold text-red-300 mb-2 flex items-center gap-2'>
						<SortDesc className='w-4 h-4' />
						정렬
					</label>
					<select
						value={sortBy}
						onChange={(e) => onFilterChange('sort_by', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='created_at'>최신순</option>
						<option value='damage_amount'>피해 금액순</option>
						<option value='like_count'>좋아요순</option>
						<option value='view_count'>조회순</option>
					</select>
				</div>
			</div>

			{/* Write Button */}
			<div className='mt-6 flex justify-end'>
				<button
					onClick={() => navigate('/community/damage-cases/create')}
					className='px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-400/40 transition-all'
				>
					피해사례 등록하기
				</button>
			</div>
		</div>
	)
}

export default DamageCaseFilters
