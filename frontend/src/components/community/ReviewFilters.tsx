import React from 'react'
import { useNavigate } from 'react-router-dom'

interface ReviewFiltersProps {
	regionFilter: string
	companyTypeFilter: string
	ratingFilter: string
	sortBy: string
	onFilterChange: (filterType: string, value: string) => void
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
	regionFilter,
	companyTypeFilter,
	ratingFilter,
	sortBy,
	onFilterChange
}) => {
	const navigate = useNavigate()

	return (
		<div className='glass-neon rounded-2xl p-6 mb-6 border border-cyan-500/30'>
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				{/* Region Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>지역</label>
					<select
						value={regionFilter}
						onChange={(e) => onFilterChange('region', e.target.value)}
						className='w-full px-3 py-3 glass-dark border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
					>
						<option value=''>전체</option>
						<option value='서울'>서울</option>
						<option value='경기'>경기</option>
						<option value='인천'>인천</option>
						<option value='부산'>부산</option>
						<option value='대구'>대구</option>
						<option value='대전'>대전</option>
						<option value='광주'>광주</option>
						<option value='울산'>울산</option>
					</select>
				</div>

				{/* Company Type Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>업체 유형</label>
					<select
						value={companyTypeFilter}
						onChange={(e) => onFilterChange('company_type', e.target.value)}
						className='w-full px-3 py-3 glass-dark border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
					>
						<option value=''>전체</option>
						<option value='종합 인테리어'>종합 인테리어</option>
						<option value='주방/욕실'>주방/욕실</option>
						<option value='도배/장판'>도배/장판</option>
						<option value='전기/조명'>전기/조명</option>
						<option value='가구/목공'>가구/목공</option>
						<option value='기타'>기타</option>
					</select>
				</div>

				{/* Rating Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>평점</label>
					<select
						value={ratingFilter}
						onChange={(e) => onFilterChange('rating', e.target.value)}
						className='w-full px-3 py-3 glass-dark border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
					>
						<option value=''>전체</option>
						<option value='5'>⭐ 5점</option>
						<option value='4'>⭐ 4점 이상</option>
						<option value='3'>⭐ 3점 이상</option>
					</select>
				</div>

				{/* Sort By */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>정렬</label>
					<select
						value={sortBy}
						onChange={(e) => onFilterChange('sort_by', e.target.value)}
						className='w-full px-3 py-3 glass-dark border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
					>
						<option value='created_at'>최신순</option>
						<option value='rating'>평점순</option>
						<option value='like_count'>좋아요순</option>
						<option value='view_count'>조회순</option>
					</select>
				</div>
			</div>

			{/* Write Button */}
			<div className='mt-6 flex justify-end'>
				<button
					onClick={() => navigate('/community/reviews/create')}
					className='px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all glow-cyan'
				>
					후기 작성하기
				</button>
			</div>
		</div>
	)
}

export default ReviewFilters
