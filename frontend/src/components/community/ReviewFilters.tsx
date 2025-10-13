import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMousePosition } from '../../hooks/useMousePosition'

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
	const containerRef = useRef<HTMLDivElement>(null)
	const mousePosition = useMousePosition(containerRef)

	const inputClassName = 'w-full px-3 py-3 bg-black/60 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
	const selectClassName = 'w-full px-3 py-3 bg-black/60 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all [&>option]:!bg-gray-900 [&>option]:!text-white'
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

			<div className='grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10'>
				{/* Search Query */}
				<div className="md:col-span-2">
					<label className='block text-sm font-semibold text-cyan-300 mb-2'>검색</label>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => onFilterChange('search', e.target.value)}
						placeholder='업체명, 지역, 시공유형 등 검색'
						className={inputClassName}
					/>
				</div>

				{/* Sort */}
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
