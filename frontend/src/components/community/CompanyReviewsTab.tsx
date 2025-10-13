import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReviewCard from './ReviewCard'
import ReviewFilters from './ReviewFilters'
import Pagination from 'components/common/Pagination'
import { Review } from 'types/review'
import { getApiUrl } from '../../lib/api-config'

const CompanyReviewsTab: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	// Pagination
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	// Filters - 검색과 정렬만
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')

	useEffect(() => {
		loadReviews()
	}, [currentPage, searchQuery, sortBy])

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

			const response = await fetch(getApiUrl(`/api/company-reviews?${params.toString()}`))

			if (!response.ok) {
				throw new Error('후기 목록을 불러올 수 없습니다.')
			}

			const data = await response.json()
			setReviews(data.data)
			setTotalPages(data.pagination.total_pages)
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
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 glow-cyan'></div>
			</div>
		)
	}

	return (
		<>
			{/* Filters */}
			<ReviewFilters
				searchQuery={searchQuery}
				sortBy={sortBy}
				onFilterChange={handleFilterChange}
			/>

			{/* Error Message */}
			{error && (
				<div className='glass-strong border-2 border-red-500/50 bg-red-900/20 text-red-300 px-6 py-4 rounded-xl mb-6'>
					{error}
				</div>
			)}

			{/* Reviews List */}
			{reviews.length === 0 ? (
				<div className='glass-neon rounded-2xl p-12 text-center border border-cyan-500/30'>
					<p className='text-gray-300 text-xl mb-6'>아직 등록된 후기가 없습니다.</p>
					<button
						onClick={() => navigate('/community/reviews/create')}
						className='px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all glow-cyan'
					>
						첫 후기 작성하기
					</button>
				</div>
			) : (
				<div className='space-y-6'>
					{reviews.map((review) => (
						<ReviewCard
							key={review.id}
							review={review}
							onClick={() => navigate(`/community/reviews/${review.id}`)}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
				theme='cyan'
			/>
		</>
	)
}

export default CompanyReviewsTab
