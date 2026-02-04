import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Star, Search, SortDesc, PenLine, Loader2 } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import SubdomainNavigation from 'components/SubdomainNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import ReviewCard from 'components/community/ReviewCard'
import { Review } from 'types/review'
import { getApiUrl } from '../../lib/api-config'
import { getSubdomain } from '../../lib/subdomain'

const PAGE_SIZE = 12

const FILTER_CHIPS = ['전체', '아파트', '주방', '욕실', '거실', '베란다', '원룸/오피스텔'] as const

export default function ReviewsLanding() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const subdomain = getSubdomain()

	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState('')

	const [currentPage, setCurrentPage] = useState(1)
	const [totalCount, setTotalCount] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')
	const [activeChip, setActiveChip] = useState<string>('전체')

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
	}, [searchQuery, sortBy, activeChip])

	useEffect(() => {
		loadReviews()
	}, [currentPage, searchQuery, sortBy, activeChip])

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
			if (activeChip !== '전체') params.append('project_type', activeChip)

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

	const handleChipClick = (chip: string) => {
		setActiveChip(chip)
		if (chip === '전체') {
			updateParam('project_type', '')
		} else {
			updateParam('project_type', chip)
		}
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="업체 후기 | 인테리어 시공 후기 모음"
				description="실제 고객들의 인테리어 시공 후기를 확인하세요. 업체별 평점, 시공 사진, 상세 리뷰를 한눈에 비교할 수 있습니다."
				path="/reviews"
				jsonLd={[
					{
						'@context': 'https://schema.org',
						'@type': 'CollectionPage',
						name: '업체 후기 | 인테리어 시공 후기 모음',
						description: '실제 고객들의 인테리어 시공 후기를 확인하세요.',
						url: 'https://zcheck.co.kr/reviews',
						isPartOf: { '@type': 'WebSite', name: 'ZipCheck', url: 'https://zcheck.co.kr' }
					},
					{
						'@context': 'https://schema.org',
						'@type': 'BreadcrumbList',
						itemListElement: [
							{ '@type': 'ListItem', position: 1, name: '홈', item: 'https://zcheck.co.kr' },
							{ '@type': 'ListItem', position: 2, name: '업체 후기' }
						]
					}
				]}
			/>
			{subdomain === 'review' ? <SubdomainNavigation subdomain="review" /> : <NordicNavigation />}

			{/* Hero - Card Magazine Style */}
			<div className="pt-24 md:pt-28">
				<div className="bg-forest-700">
					<div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
						<h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight mb-1.5">
							나의 인테리어 경험,
						</h1>
						<p className="text-forest-300 text-2xl md:text-3xl font-extrabold tracking-tight mb-6">
							솔직하게 공유하기
						</p>

						{/* Stats */}
						<div className="flex gap-3 mb-6">
							<div className="flex-1 bg-forest-600/40 rounded-xl py-3 text-center">
								<p className="text-xl md:text-2xl font-extrabold text-white">{totalCount > 0 ? totalCount.toLocaleString() : '-'}</p>
								<p className="text-[11px] text-forest-300">누적 후기</p>
							</div>
							<div className="flex-1 bg-forest-600/40 rounded-xl py-3 text-center">
								<p className="text-xl md:text-2xl font-extrabold text-white">4.3</p>
								<p className="text-[11px] text-forest-300">평균 평점</p>
							</div>
							<div className="flex-1 bg-forest-600/40 rounded-xl py-3 text-center">
								<p className="text-xl md:text-2xl font-extrabold text-white">-</p>
								<p className="text-[11px] text-forest-300">이번 달</p>
							</div>
						</div>

						{/* CTA */}
						<button
							onClick={() => navigate('/write/review')}
							className="w-full md:w-auto px-10 py-3.5 bg-white text-forest-700 font-bold rounded-2xl text-sm hover:bg-sand-100 transition-colors flex items-center justify-center gap-2"
						>
							<Star size={16} className="fill-forest-500 text-forest-500" />
							후기 작성하기
						</button>
					</div>
				</div>
			</div>

			{/* Filter Chips */}
			<div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
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

			{/* Content */}
			<div className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
				{/* Search & Sort Row */}
				<div className="flex flex-col sm:flex-row gap-3 mb-6">
					<div className="flex-1 relative">
						<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value)
								updateParam('search', e.target.value)
							}}
							placeholder="업체명, 지역, 시공유형 검색"
							className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all"
						/>
					</div>
					<select
						value={sortBy}
						onChange={(e) => {
							setSortBy(e.target.value)
							updateParam('sort_by', e.target.value)
						}}
						className="px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-700 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400 transition-all"
					>
						<option value="created_at">최신순</option>
						<option value="rating">평점순</option>
						<option value="view_count">조회순</option>
					</select>
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
							onClick={() => navigate('/write/review')}
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
