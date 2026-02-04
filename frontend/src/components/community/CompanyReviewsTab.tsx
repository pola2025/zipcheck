import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Star, PenLine } from 'lucide-react'
import ReviewCard from './ReviewCard'
import Pagination from 'components/common/Pagination'
import { Review } from 'types/review'
import { getApiUrl } from '../../lib/api-config'

const FILTER_CHIPS = ['전체', '아파트', '주방', '욕실', '거실', '베란다', '원룸/오피스텔'] as const

const CompanyReviewsTab: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	// Pagination
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalCount, setTotalCount] = useState(0)

	// Filters
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')
	const [activeChip, setActiveChip] = useState<string>('전체')

	useEffect(() => {
		loadReviews()
	}, [currentPage, searchQuery, sortBy, activeChip])

	const loadReviews = async () => {
		try {
			setLoading(true)

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '20',
				sort_by: sortBy,
				order: 'desc'
			})

			if (searchQuery) params.append('search', searchQuery)
			if (activeChip !== '전체') params.append('project_type', activeChip)

			const response = await fetch(getApiUrl(`/api/company-reviews?${params.toString()}`))

			if (!response.ok) {
				throw new Error('후기 목록을 불러올 수 없습니다.')
			}

			const data = await response.json()
			setReviews(data.data)
			setTotalPages(data.pagination.total_pages)
			setTotalCount(data.pagination.total)
			setLoading(false)
		} catch (err) {
			console.error('Load reviews error:', err)
			setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const handleFilterChange = (filterType: string, value: string) => {
		setCurrentPage(1)

		const newParams = new URLSearchParams(searchParams)
		if (value) {
			newParams.set(filterType, value)
		} else {
			newParams.delete(filterType)
		}
		setSearchParams(newParams)

		switch (filterType) {
			case 'search':
				setSearchQuery(value)
				break
			case 'sort_by':
				setSortBy(value)
				break
		}
	}

	if (loading && reviews.length === 0) {
		return (
			<div className='flex justify-center py-12'>
				<div className='w-10 h-10 border-2 border-sand-200 border-t-forest-500 rounded-full animate-spin' />
			</div>
		)
	}

	const handleChipClick = (chip: string) => {
		setActiveChip(chip)
		setCurrentPage(1)
	}

	return (
		<>
			{/* Filter Chips */}
			<div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1">
				{FILTER_CHIPS.map((chip) => (
					<button
						key={chip}
						onClick={() => handleChipClick(chip)}
						className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
							activeChip === chip
								? 'bg-forest-600 text-white'
								: 'bg-sand-100 text-sand-600 hover:bg-sand-200'
						}`}
					>
						{chip}
					</button>
				))}
			</div>

			{/* Stats Strip */}
			{totalCount > 0 && (
				<div className="flex items-center gap-4 mb-5 px-1">
					<span className="text-sm font-bold text-sand-800">
						총 <span className="text-forest-600">{totalCount.toLocaleString()}</span>건
					</span>
					<span className="w-px h-4 bg-sand-200" />
					<span className="text-xs text-sand-400">실제 고객 시공 후기</span>
				</div>
			)}

			{/* Inline Search & Sort */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<div className="flex-1 relative">
					<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleFilterChange('search', e.target.value)}
						placeholder="업체명, 지역, 시공유형 검색"
						className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all"
					/>
				</div>
				<select
					value={sortBy}
					onChange={(e) => handleFilterChange('sort_by', e.target.value)}
					className="px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-700 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all"
				>
					<option value="created_at">최신순</option>
					<option value="rating">평점순</option>
					<option value="like_count">좋아요순</option>
					<option value="view_count">조회순</option>
				</select>
				<button
					onClick={() => navigate('/write/review')}
					className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
				>
					<PenLine size={15} />
					후기 작성
				</button>
			</div>

			{/* Error Message */}
			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl mb-6 text-sm'>
					{error}
				</div>
			)}

			{/* Reviews List */}
			{reviews.length === 0 ? (
				<div className='bg-white rounded-2xl p-12 text-center border border-sand-200'>
					<Star className="mx-auto mb-4 text-sand-300" size={48} />
					<p className='text-sand-500 text-lg mb-6'>아직 등록된 후기가 없습니다.</p>
					<button
						onClick={() => navigate('/write/review')}
						className='px-8 py-3 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors'
					>
						첫 후기 작성하기
					</button>
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
					{reviews.map((review) => (
						<ReviewCard
							key={review.id}
							review={review}
							onClick={() => navigate(review.slug ? `/reviews/${review.slug}` : `/community/reviews/${review.id}`)}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
				theme='forest'
			/>
		</>
	)
}

export default CompanyReviewsTab
