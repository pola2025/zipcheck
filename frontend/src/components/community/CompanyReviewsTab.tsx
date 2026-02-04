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

	// Filters
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
				<div className='w-10 h-10 border-2 border-sand-200 border-t-forest-500 rounded-full animate-spin' />
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
				<div className='bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl mb-6 text-sm'>
					{error}
				</div>
			)}

			{/* Reviews List */}
			{reviews.length === 0 ? (
				<div className='bg-white rounded-2xl p-12 text-center border border-sand-200'>
					<p className='text-sand-500 text-lg mb-6'>아직 등록된 후기가 없습니다.</p>
					<button
						onClick={() => navigate('/community/reviews/create')}
						className='px-8 py-3 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors'
					>
						첫 후기 작성하기
					</button>
				</div>
			) : (
				<div className='space-y-4'>
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
				theme='forest'
			/>
		</>
	)
}

export default CompanyReviewsTab
