import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import DamageCaseCard from './DamageCaseCard'
import DamageCaseFilters from './DamageCaseFilters'
import Pagination from 'components/common/Pagination'
import { DamageCase } from 'types/damageCase'

const DamageCasesTab: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const [cases, setCases] = useState<DamageCase[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	// Pagination
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	// Filters
	const [regionFilter, setRegionFilter] = useState(searchParams.get('region') || '')
	const [damageTypeFilter, setDamageTypeFilter] = useState(searchParams.get('damage_type') || '')
	const [resolutionFilter, setResolutionFilter] = useState(searchParams.get('resolution_status') || '')
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')

	useEffect(() => {
		loadCases()
	}, [currentPage, regionFilter, damageTypeFilter, resolutionFilter, sortBy])

	const loadCases = async () => {
		try {
			setLoading(true)

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '20',
				sort_by: sortBy,
				order: 'desc'
			})

			if (regionFilter) params.append('region', regionFilter)
			if (damageTypeFilter) params.append('damage_type', damageTypeFilter)
			if (resolutionFilter) params.append('resolution_status', resolutionFilter)

			const response = await fetch(`http://localhost:3001/api/damage-cases?${params.toString()}`)

			if (!response.ok) {
				throw new Error('피해사례 목록을 불러올 수 없습니다.')
			}

			const data = await response.json()
			setCases(data.data)
			setTotalPages(data.pagination.total_pages)
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
			case 'region':
				setRegionFilter(value)
				break
			case 'damage_type':
				setDamageTypeFilter(value)
				break
			case 'resolution_status':
				setResolutionFilter(value)
				break
			case 'sort_by':
				setSortBy(value)
				break
		}
	}

	if (loading && cases.length === 0) {
		return (
			<div className='flex justify-center py-12'>
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]'></div>
			</div>
		)
	}

	return (
		<>
			{/* Filters */}
			<DamageCaseFilters
				regionFilter={regionFilter}
				damageTypeFilter={damageTypeFilter}
				resolutionFilter={resolutionFilter}
				sortBy={sortBy}
				onFilterChange={handleFilterChange}
			/>

			{/* Error Message */}
			{error && (
				<div className='glass-strong border-2 border-red-500/50 bg-red-900/20 text-red-300 px-6 py-4 rounded-xl mb-6'>
					{error}
				</div>
			)}

			{/* Cases List */}
			{cases.length === 0 ? (
				<div className='glass-neon rounded-2xl p-12 text-center border border-red-500/30'>
					<AlertTriangle className='mx-auto mb-4 text-red-400' size={48} />
					<p className='text-gray-300 text-xl mb-6'>아직 등록된 피해사례가 없습니다.</p>
					<button
						onClick={() => navigate('/community/damage-cases/create')}
						className='px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-400/40 transition-all'
					>
						첫 피해사례 등록하기
					</button>
				</div>
			) : (
				<div className='space-y-6'>
					{cases.map((damageCase) => (
						<DamageCaseCard
							key={damageCase.id}
							damageCase={damageCase}
							onClick={() => navigate(`/community/damage-cases/${damageCase.id}`)}
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
