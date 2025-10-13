import React from 'react'
import { useNavigate } from 'react-router-dom'

interface DamageCaseFiltersProps {
	regionFilter: string
	damageTypeFilter: string
	resolutionFilter: string
	sortBy: string
	onFilterChange: (filterType: string, value: string) => void
}

const DamageCaseFilters: React.FC<DamageCaseFiltersProps> = ({
	regionFilter,
	damageTypeFilter,
	resolutionFilter,
	sortBy,
	onFilterChange
}) => {
	const navigate = useNavigate()

	const selectClassName = 'w-full px-3 py-3 bg-black/60 border border-red-500/30 rounded-lg text-white focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all [&>option]:!bg-gray-900 [&>option]:!text-white'
	const selectStyle = { colorScheme: 'dark' as const, backgroundColor: '#000000', color: '#ffffff' }
	const optionStyle = { backgroundColor: '#111827', color: '#ffffff' }

	return (
		<div className='glass-neon rounded-2xl p-6 mb-6 border border-red-500/30'>
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				{/* Region Filter */}
				<div>
					<label className='block text-sm font-semibold text-red-300 mb-2'>지역</label>
					<select
						value={regionFilter}
						onChange={(e) => onFilterChange('region', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='' style={optionStyle}>전체</option>
						<option value='서울' style={optionStyle}>서울</option>
						<option value='경기' style={optionStyle}>경기</option>
						<option value='인천' style={optionStyle}>인천</option>
						<option value='부산' style={optionStyle}>부산</option>
						<option value='대구' style={optionStyle}>대구</option>
						<option value='대전' style={optionStyle}>대전</option>
						<option value='광주' style={optionStyle}>광주</option>
						<option value='울산' style={optionStyle}>울산</option>
					</select>
				</div>

				{/* Damage Type Filter */}
				<div>
					<label className='block text-sm font-semibold text-red-300 mb-2'>피해 유형</label>
					<select
						value={damageTypeFilter}
						onChange={(e) => onFilterChange('damage_type', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='' style={optionStyle}>전체</option>
						<option value='사기' style={optionStyle}>사기</option>
						<option value='부실시공' style={optionStyle}>부실시공</option>
						<option value='계약위반' style={optionStyle}>계약위반</option>
						<option value='추가비용' style={optionStyle}>추가비용</option>
						<option value='기타' style={optionStyle}>기타</option>
					</select>
				</div>

				{/* Resolution Status Filter */}
				<div>
					<label className='block text-sm font-semibold text-red-300 mb-2'>해결 상태</label>
					<select
						value={resolutionFilter}
						onChange={(e) => onFilterChange('resolution_status', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='' style={optionStyle}>전체</option>
						<option value='unresolved' style={optionStyle}>미해결</option>
						<option value='in_progress' style={optionStyle}>진행중</option>
						<option value='resolved' style={optionStyle}>해결됨</option>
					</select>
				</div>

				{/* Sort By */}
				<div>
					<label className='block text-sm font-semibold text-red-300 mb-2'>정렬</label>
					<select
						value={sortBy}
						onChange={(e) => onFilterChange('sort_by', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='created_at' style={optionStyle}>최신순</option>
						<option value='damage_amount' style={optionStyle}>피해 금액순</option>
						<option value='like_count' style={optionStyle}>좋아요순</option>
						<option value='view_count' style={optionStyle}>조회순</option>
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
