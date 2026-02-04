import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Search, PenLine, Shield } from 'lucide-react'
import DamageCaseCard from './DamageCaseCard'
import Pagination from 'components/common/Pagination'
import { DamageCase } from 'types/damageCase'
import { getApiUrl } from 'lib/api-config'

const DamageCasesTab: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const [cases, setCases] = useState<DamageCase[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	// Pagination
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalCount, setTotalCount] = useState(0)

	// Filters
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')

	useEffect(() => {
		loadCases()
	}, [currentPage, searchQuery, sortBy])

	const loadCases = async () => {
		try {
			setLoading(true)

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '20',
				sort_by: sortBy,
				order: 'desc'
			})

			if (searchQuery) params.append('search', searchQuery)

			const response = await fetch(getApiUrl(`/api/damage-cases?${params.toString()}`))

			if (!response.ok) {
				throw new Error('피해사례 목록을 불러올 수 없습니다.')
			}

			const data = await response.json()
			setCases(data.data)
			setTotalPages(data.pagination.total_pages)
			setTotalCount(data.pagination.total)
			setLoading(false)
		} catch (err) {
			console.error('Load cases error:', err)
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

	if (loading && cases.length === 0) {
		return (
			<div className='flex justify-center py-12'>
				<div className='w-10 h-10 border-2 border-sand-200 border-t-red-400 rounded-full animate-spin' />
			</div>
		)
	}

	return (
		<>
			{/* Stats Strip */}
			{totalCount > 0 && (
				<div className="flex items-center gap-4 mb-5 px-1">
					<span className="text-sm font-bold text-sand-800">
						총 <span className="text-red-600">{totalCount.toLocaleString()}</span>건
					</span>
					<span className="w-px h-4 bg-sand-200" />
					<span className="text-xs text-sand-400">등록된 피해사례</span>
				</div>
			)}

			{/* Inline Search & Sort */}
			<div className="flex flex-col sm:flex-row gap-3 mb-5">
				<div className="flex-1 relative">
					<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleFilterChange('search', e.target.value)}
						placeholder="업체명, 지역, 피해유형 검색"
						className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
					/>
				</div>
				<select
					value={sortBy}
					onChange={(e) => handleFilterChange('sort_by', e.target.value)}
					className="px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm text-sand-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
				>
					<option value="created_at">최신순</option>
					<option value="severity">심각도순</option>
				</select>
				<div className="flex gap-2">
					<button
						onClick={() => navigate('/write/damage-case')}
						className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
					>
						<PenLine size={15} />
						사례 등록
					</button>
					<button
						onClick={() => navigate('/blacklist-check')}
						className="flex-1 sm:flex-none px-5 py-2.5 bg-sand-800 hover:bg-sand-900 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
					>
						<Shield size={15} />
						블랙리스트
					</button>
				</div>
			</div>

			{/* Disclaimer */}
			<div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-3.5 mb-6">
				<p className="text-xs text-amber-800 leading-relaxed">
					<strong>&#9888;</strong> 업체 비방 목적이 아닙니다. 실제 피해 사례를 공유하여 동일 피해를 예방합니다.
				</p>
			</div>

			{/* Error Message */}
			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl mb-6 text-sm'>
					{error}
				</div>
			)}

			{/* Cases List */}
			{cases.length === 0 ? (
				<div className='bg-white rounded-2xl p-12 text-center border border-sand-200'>
					<AlertTriangle className='mx-auto mb-4 text-sand-300' size={48} />
					<p className='text-sand-500 text-lg mb-6'>아직 등록된 피해사례가 없습니다.</p>
					<button
						onClick={() => navigate('/write/damage-case')}
						className='px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors'
					>
						첫 피해사례 등록하기
					</button>
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
					{cases.map((damageCase) => (
						<DamageCaseCard
							key={damageCase.id}
							damageCase={damageCase}
							onClick={() => navigate(damageCase.slug ? `/damage-cases/${damageCase.slug}` : `/community/damage-cases/${damageCase.id}`)}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
				theme='red'
			/>
		</>
	)
}

export default DamageCasesTab
