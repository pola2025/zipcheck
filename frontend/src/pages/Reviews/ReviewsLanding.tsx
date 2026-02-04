import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Star, Search, SortDesc, PenLine, Loader2 } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import ReviewCard from 'components/community/ReviewCard'
import { Review } from 'types/review'
import { getApiUrl } from '../../lib/api-config'

const PAGE_SIZE = 12

export default function ReviewsLanding() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState('')

	const [currentPage, setCurrentPage] = useState(1)
	const [totalCount, setTotalCount] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')

	const observerRef = useRef<IntersectionObserver | null>(null)
	const sentinelRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading || loadingMore) return
			if (observerRef.current) observerRef.current.disconnect()
			observerRef.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					setCurrentPage((prev) => prev + 1)
				}
			}, { rootMargin: '200px' })
			if (node) observerRef.current.observe(node)
		},
		[loading, loadingMore, hasMore]
	)

	// Reset when filters change
	useEffect(() => {
		setReviews([])
		setCurrentPage(1)
		setHasMore(true)
		setLoading(true)
	}, [searchQuery, sortBy])

	useEffect(() => {
		loadReviews()
	}, [currentPage, searchQuery, sortBy])

	const loadReviews = async () => {
		try {
			if (currentPage === 1) {
				setLoading(true)
			} else {
				setLoadingMore(true)
			}

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: PAGE_SIZE.toString(),
				sort_by: sortBy,
				order: 'desc'
			})
			if (searchQuery) params.append('search', searchQuery)

			const response = await fetch(getApiUrl(`/api/company-reviews?${params.toString()}`))
			if (!response.ok) throw new Error('후기 목록을 불러올 수 없습니다.')

			const data = await response.json()
			const newReviews: Review[] = data.data

			setReviews((prev) => currentPage === 1 ? newReviews : [...prev, ...newReviews])
			setTotalCount(data.pagination.total)
			setHasMore(currentPage < data.pagination.total_pages)
		} catch (err) {
			setError(err instanceof Error ? err.message : '오류 발생')
		} finally {
			setLoading(false)
			setLoadingMore(false)
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
					<p className="text-sand-700 text-base md:text-lg max-w-lg mx-auto">
						실제 고객들의 솔직한 인테리어 시공 경험을 확인하세요
					</p>
					{totalCount > 0 && (
						<p className="text-sand-500 text-sm mt-3">총 {totalCount.toLocaleString()}개의 후기</p>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
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

				{/* Initial Loading */}
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

				{/* Empty State */}
				{!loading && reviews.length === 0 && !error && (
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
				)}

				{/* Reviews Grid */}
				{reviews.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{reviews.map((review) => (
							<ReviewCard
								key={review.id}
								review={review}
								onClick={() => navigate(review.slug ? `/reviews/${review.slug}` : `/community/reviews/${review.id}`)}
							/>
						))}
					</div>
				)}

				{/* Infinite scroll sentinel */}
				{hasMore && reviews.length > 0 && (
					<div ref={sentinelRef} className="flex justify-center py-10">
						{loadingMore && (
							<Loader2 size={24} className="text-forest-500 animate-spin" />
						)}
					</div>
				)}

				{/* End of list */}
				{!hasMore && reviews.length > 0 && (
					<p className="text-center text-sand-400 text-sm py-8">
						모든 후기를 불러왔습니다
					</p>
				)}
			</div>

			<NordicFooter />
		</div>
	)
}
