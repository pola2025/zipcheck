import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Search, SortDesc, PenLine, Info, Loader2, Shield } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import SubdomainNavigation from 'components/SubdomainNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import DamageCaseCard from 'components/community/DamageCaseCard'
import { DamageCase } from 'types/damageCase'
import { getApiUrl } from '../../lib/api-config'
import { getSubdomain } from '../../lib/subdomain'

const PAGE_SIZE = 12

export default function DamageCasesLanding() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const subdomain = getSubdomain()

	const [cases, setCases] = useState<DamageCase[]>([])
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
		setCases([])
		setCurrentPage(1)
		setHasMore(true)
		setLoading(true)
	}, [searchQuery, sortBy])

	useEffect(() => {
		loadCases()
	}, [currentPage, searchQuery, sortBy])

	const loadCases = async () => {
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

			const response = await fetch(getApiUrl(`/api/damage-cases?${params.toString()}`))
			if (!response.ok) throw new Error('피해사례 목록을 불러올 수 없습니다.')

			const data = await response.json()
			const newCases: DamageCase[] = data.data

			setCases((prev) => currentPage === 1 ? newCases : [...prev, ...newCases])
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
				title="피해사례 | 인테리어 피해 사례 모음"
				description="인테리어 시공 중 발생한 피해 사례를 확인하세요. 동일한 피해를 예방하고 현명한 업체 선택에 도움이 됩니다."
				path="/damage-cases"
				jsonLd={[
					{
						'@context': 'https://schema.org',
						'@type': 'CollectionPage',
						name: '피해사례 | 인테리어 피해 사례 모음',
						description: '인테리어 시공 중 발생한 피해 사례를 확인하세요.',
						url: 'https://zcheck.co.kr/damage-cases',
						isPartOf: { '@type': 'WebSite', name: 'ZipCheck', url: 'https://zcheck.co.kr' }
					},
					{
						'@context': 'https://schema.org',
						'@type': 'BreadcrumbList',
						itemListElement: [
							{ '@type': 'ListItem', position: 1, name: '홈', item: 'https://zcheck.co.kr' },
							{ '@type': 'ListItem', position: 2, name: '피해사례' }
						]
					}
				]}
			/>
			{subdomain === 'report' ? <SubdomainNavigation subdomain="report" /> : <NordicNavigation />}

			{/* Hero - Warm Red Gradient Style */}
			<div className="pt-24 md:pt-28">
				<div className="bg-gradient-to-b from-rose-600 to-rose-700">
					<div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
						<h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight mb-1.5">
							인테리어 피해,
						</h1>
						<p className="text-rose-200 text-2xl md:text-3xl font-extrabold tracking-tight mb-6">
							함께 예방합니다
						</p>

						{/* Dual CTA */}
						<div className="flex gap-3 mb-6">
							<button
								onClick={() => navigate('/write/damage-case')}
								className="flex-1 md:flex-none px-8 py-3.5 bg-white text-rose-600 font-bold rounded-2xl text-sm hover:bg-sand-100 transition-colors flex items-center justify-center gap-2"
							>
								<AlertTriangle size={16} />
								사례 등록
							</button>
							<button
								onClick={() => navigate('/blacklist-check')}
								className="flex-1 md:flex-none px-8 py-3.5 bg-rose-800/50 text-white font-bold rounded-2xl text-sm hover:bg-rose-800/70 transition-colors flex items-center justify-center gap-2 border border-white/20"
							>
								<Shield size={16} />
								블랙리스트 조회
							</button>
						</div>
					</div>
				</div>

				{/* Stats Bar */}
				<div className="bg-rose-50 border-b border-rose-100">
					<div className="max-w-6xl mx-auto px-5 md:px-8 py-3 flex justify-center gap-10 md:gap-16">
						<div className="text-center">
							<p className="text-lg md:text-xl font-extrabold text-rose-600">{totalCount > 0 ? totalCount : '-'}</p>
							<p className="text-[11px] font-semibold text-sand-700">등록 사례</p>
						</div>
						<div className="text-center">
							<p className="text-lg md:text-xl font-extrabold text-rose-600">-</p>
							<p className="text-[11px] font-semibold text-sand-700">해결 완료</p>
						</div>
						<div className="text-center">
							<p className="text-lg md:text-xl font-extrabold text-rose-600">-</p>
							<p className="text-[11px] font-semibold text-sand-700">예방 도움</p>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-6xl mx-auto px-5 md:px-8 pt-6 pb-20">
				{/* Disclaimer */}
				<div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 mb-6">
					<p className="text-xs text-amber-800 leading-relaxed">
						<strong className="font-bold">&#9888; 주의사항</strong> &mdash; 본 게시판은 업체 비방 목적이 아닙니다. 실제 피해 사례를 공유하여 동일 피해를 예방합니다.
						게시글 내용에 대한 법적 책임은 작성자에게 있습니다.
					</p>
				</div>

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
							placeholder="업체명, 지역, 피해유형 검색"
							className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
						/>
					</div>
					<select
						value={sortBy}
						onChange={(e) => {
							setSortBy(e.target.value)
							updateParam('sort_by', e.target.value)
						}}
						className="px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
					>
						<option value="created_at">최신순</option>
						<option value="severity">심각도순</option>
					</select>
				</div>

				{/* Initial Loading */}
				{loading && cases.length === 0 && (
					<div className="flex justify-center py-16">
						<div className="w-10 h-10 border-2 border-sand-200 border-t-rose-400 rounded-full animate-spin" />
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl mb-6 text-sm">
						{error}
					</div>
				)}

				{/* Empty State */}
				{!loading && cases.length === 0 && !error && (
					<div className="bg-white rounded-2xl p-16 text-center border border-sand-200">
						<AlertTriangle className="mx-auto mb-4 text-sand-300" size={48} />
						<p className="text-sand-500 text-lg mb-6">아직 등록된 피해사례가 없습니다.</p>
						<button
							onClick={() => navigate('/write/damage-case')}
							className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors"
						>
							첫 피해사례 등록하기
						</button>
					</div>
				)}

				{/* Cases Grid */}
				{cases.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{cases.map((damageCase) => (
							<DamageCaseCard
								key={damageCase.id}
								damageCase={damageCase}
								onClick={() => navigate(damageCase.slug ? `/damage-cases/${damageCase.slug}` : `/community/damage-cases/${damageCase.id}`)}
							/>
						))}
					</div>
				)}

				{/* Infinite scroll sentinel */}
				{hasMore && cases.length > 0 && (
					<div ref={sentinelRef} className="flex justify-center py-10">
						{loadingMore && (
							<Loader2 size={24} className="text-rose-400 animate-spin" />
						)}
					</div>
				)}

				{/* End of list */}
				{!hasMore && cases.length > 0 && (
					<p className="text-center text-sand-400 text-sm py-8">
						모든 피해사례를 불러왔습니다
					</p>
				)}
			</div>

			<NordicFooter />
		</div>
	)
}
