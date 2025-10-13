import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMousePosition } from '../../hooks/useMousePosition'

interface ReviewFiltersProps {
	regionFilter: string
	budgetFilter: string
	companyNameFilter: string
	phoneFilter: string
	constructionTypeFilter: string
	areaFilter: string
	ratingFilter: string
	sortBy: string
	onFilterChange: (filterType: string, value: string) => void
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
	regionFilter,
	budgetFilter,
	companyNameFilter,
	phoneFilter,
	constructionTypeFilter,
	areaFilter,
	ratingFilter,
	sortBy,
	onFilterChange
}) => {
	const navigate = useNavigate()
	const containerRef = useRef<HTMLDivElement>(null)
	const mousePosition = useMousePosition(containerRef)

	// ㎡를 평으로 변환
	const convertToSquareMeters = (area: string): string => {
		const value = parseFloat(area)
		if (isNaN(value)) return ''
		return (value / 3.3058).toFixed(2)
	}

	const handleAreaChange = (value: string) => {
		onFilterChange('area', value)
	}

	const selectClassName = 'w-full px-3 py-3 bg-black/60 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all [&>option]:!bg-gray-900 [&>option]:!text-white'
	const inputClassName = 'w-full px-3 py-3 bg-black/60 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
	const selectStyle = { colorScheme: 'dark' as const, backgroundColor: '#000000', color: '#ffffff' }
	const optionStyle = { backgroundColor: '#111827', color: '#ffffff' }

	return (
		<div
			ref={containerRef}
			className='glass-neon rounded-2xl p-6 mb-6 border border-cyan-500/30 relative overflow-hidden'
		>
			{/* Glassmorphism 마우스 추적 효과 */}
			<div
				className='absolute pointer-events-none transition-opacity duration-300'
				style={{
					left: mousePosition.elementX - 150,
					top: mousePosition.elementY - 150,
					width: '300px',
					height: '300px',
					background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
					filter: 'blur(40px)',
					opacity: containerRef.current ? 1 : 0
				}}
			/>

			<div className='grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10'>
				{/* 지역 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>지역</label>
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

				{/* 예산 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>예산</label>
					<input
						type='text'
						value={budgetFilter}
						onChange={(e) => onFilterChange('budget', e.target.value)}
						placeholder='예: 3000만원'
						className={inputClassName}
					/>
				</div>

				{/* 업체명 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>업체명</label>
					<input
						type='text'
						value={companyNameFilter}
						onChange={(e) => onFilterChange('company_name', e.target.value)}
						placeholder='업체명 검색'
						className={inputClassName}
					/>
				</div>

				{/* 연락처 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>연락처</label>
					<input
						type='text'
						value={phoneFilter}
						onChange={(e) => onFilterChange('phone', e.target.value)}
						placeholder='010-1234-5678'
						className={inputClassName}
					/>
				</div>

				{/* 시공유형 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>시공유형</label>
					<select
						value={constructionTypeFilter}
						onChange={(e) => onFilterChange('construction_type', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='' style={optionStyle}>전체</option>
						<option value='주거공간' style={optionStyle}>주거공간</option>
						<option value='상업공간' style={optionStyle}>상업공간</option>
					</select>
				</div>

				{/* 면적 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>
						면적 {areaFilter && `(${convertToSquareMeters(areaFilter)}평)`}
					</label>
					<input
						type='number'
						value={areaFilter}
						onChange={(e) => handleAreaChange(e.target.value)}
						placeholder='㎡ 입력'
						className={inputClassName}
					/>
				</div>

				{/* 평점 Filter */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>평점</label>
					<select
						value={ratingFilter}
						onChange={(e) => onFilterChange('rating', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='' style={optionStyle}>전체</option>
						<option value='5' style={optionStyle}>⭐ 5점</option>
						<option value='4' style={optionStyle}>⭐ 4점 이상</option>
						<option value='3' style={optionStyle}>⭐ 3점 이상</option>
					</select>
				</div>

				{/* 정렬 */}
				<div>
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>정렬</label>
					<select
						value={sortBy}
						onChange={(e) => onFilterChange('sort_by', e.target.value)}
						className={selectClassName}
						style={selectStyle}
					>
						<option value='created_at' style={optionStyle}>최신순</option>
						<option value='rating' style={optionStyle}>평점순</option>
						<option value='like_count' style={optionStyle}>좋아요순</option>
						<option value='view_count' style={optionStyle}>조회순</option>
					</select>
				</div>
			</div>

			{/* Write Button */}
			<div className='mt-6 flex justify-end relative z-10'>
				<button
					onClick={() => navigate('/community/reviews/create')}
					className='px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all'
					style={{
						backdropFilter: 'blur(10px)',
						boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.37)'
					}}
				>
					후기 작성하기
				</button>
			</div>
		</div>
	)
}

export default ReviewFilters
