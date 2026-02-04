import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Star, Search, SortDesc, PenLine, ChevronLeft, ChevronRight } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import ReviewCard from 'components/community/ReviewCard'
import { Review } from 'types/review'
import { getApiUrl } from '../../lib/api-config'

export default function ReviewsLanding() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
	const [totalPages, setTotalPages] = useState(1)
	const [totalCount, setTotalCount] = useState(0)
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
				limit: '12',
				sort_by: sortBy,
				order: 'desc'
			})
			if (searchQuery) params.append('search', searchQuery)

			const response = await fetch(getApiUrl(`/api/company-reviews?${params.toString()}`))
			if (!response.ok) throw new Error('후기 목록을 불러올 수 없습니다.')

			const data = await response.json()
			setReviews(data.data)
			setTotalPages(data.pagination.total_pages)
			setTotalCount(data.pagination.total)
		} catch (err) {
			setError(err instanceof Error ? err.message : '오류 발생')
		} finally {
			setLoading(false)
		}
	}

	const updateParam = (key: string, value: string) => {
		const newParams = new URLSearchParams(searchParams)
		if (value) {
			newParams.set(key, value)
		} else {
			newParams.delete(key)
		}
		newParams.delete('page')
		setSearchParams(newParams)
		setCurrentPage(1)
	}

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		const newParams = new URLSearchParams(searchParams)
		newParams.set('page', page.toString())
		setSearchParams(newParams)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="업체 후기 | 인테리어 시공 후기 모음"
				description="실제 고객들의 인테리어 시공 후기를 확인하세요. 업체별 평점, 시공 사진, 상세 리뷰를 한눈에 비교할 수 있습니다."
				path="/reviews"
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">Reviews</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						업체 후기
					</h1>
					<p className="text-sand-600 text-base md:text-lg max-w-lg mx-auto">
						실제 고객들의 솔직한 인테리어 시공 경험을 확인하세요
					</p>
					{totalCount > 0 && (
						<p className="text-sand-400 text-sm mt-3">총 {totalCount.toLocaleString()}개의 후기</p>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-5 md:px-8 pb-20">
				{/* Filters */}
				<div className="bg-white rounded-2xl p-5 mb-8 border border-sand-200">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="md:col-span-2">
							<label className="block text-sm font-semibold text-sand-700 mb-2 flex items-center gap-1.5">
								<Search size={14} className="text-forest-500" />
								검색
							</label>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value)
									updateParam('search', e.target.value)
								}}
								placeholder="업체명, 지역, 시공유형 검색"
								className="w-full px-4 py-2.5 bg-sand-50 border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-sand-700 mb-2 flex items-center gap-1.5">
								<SortDesc size={14} className="text-forest-500" />
								정렬
							</label>
							<select
								value={sortBy}
								onChange={(e) => {
									setSortBy(e.target.value)
									updateParam('sort_by', e.target.value)
								}}
								className="w-full px-4 py-2.5 bg-sand-50 border border-sand-200 rounded-lg text-sand-900 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all"
							>
								<option value="created_at">최신순</option>
								<option value="rating">평점순</option>
								<option value="view_count">조회순</option>
							</select>
						</div>
						<div className="flex items-end">
							<button
								onClick={() => navigate('/community/reviews/create')}
								className="w-full px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
							>
								<PenLine size={16} />
								후기 작성
							</button>
						</div>
					</div>
				</div>

				{/* Loading */}
				{loading && reviews.length === 0 && (
					<div className="flex justify-center py-16">
						<div className="w-10 h-10 border-2 border-sand-200 border-t-forest-500 rounded-full animate-spin" />
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl mb-6 text-sm">
						{error}
					</div>
				)}

				{/* Reviews List */}
				{!loading && reviews.length === 0 ? (
					<div className="bg-white rounded-2xl p-16 text-center border border-sand-200">
						<Star className="mx-auto mb-4 text-sand-300" size={48} />
						<p className="text-sand-500 text-lg mb-6">아직 등록된 후기가 없습니다.</p>
						<button
							onClick={() => navigate('/community/reviews/create')}
							className="px-8 py-3 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors"
						>
							첫 후기 작성하기
						</button>
					</div>
				) : (
					<div className="space-y-4">
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
				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-2 mt-10">
						<button
							onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="p-2.5 rounded-lg transition-all bg-white text-sand-700 border border-sand-200 hover:bg-forest-50 hover:border-forest-300 disabled:bg-sand-50 disabled:text-sand-300 disabled:cursor-not-allowed"
						>
							<ChevronLeft size={18} />
						</button>
						{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
							let page: number
							if (totalPages <= 5) {
								page = i + 1
							} else if (currentPage <= 3) {
								page = i + 1
							} else if (currentPage >= totalPages - 2) {
								page = totalPages - 4 + i
							} else {
								page = currentPage - 2 + i
							}
							return (
								<button
									key={page}
									onClick={() => handlePageChange(page)}
									className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all ${
										currentPage === page
											? 'bg-forest-600 text-white shadow-sm'
											: 'bg-white text-sand-700 border border-sand-200 hover:bg-forest-50 hover:border-forest-300'
									}`}
								>
									{page}
								</button>
							)
						})}
						<button
							onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							className="p-2.5 rounded-lg transition-all bg-white text-sand-700 border border-sand-200 hover:bg-forest-50 hover:border-forest-300 disabled:bg-sand-50 disabled:text-sand-300 disabled:cursor-not-allowed"
						>
							<ChevronRight size={18} />
						</button>
					</div>
				)}
			</div>

			<NordicFooter />
		</div>
	)
}
