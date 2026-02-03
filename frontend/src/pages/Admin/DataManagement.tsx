import { useState, useEffect } from 'react'
import { Upload, FileSpreadsheet, Database, CheckCircle2, AlertCircle, Search, TrendingUp, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'

interface UploadStats {
	totalRows: number
	successRows: number
	errorRows: number
	errors: Array<{ row: number; message: string }>
}

interface DatasetInfo {
	id: string
	name: string
	type: 'construction' | 'distributor' | 'market'
	uploadedAt: Date
	uploadedBy: string
	rowCount: number
	status: 'active' | 'archived'
}

interface DataStats {
	overview: {
		categories_count: number
		items_count: number
		records_count: number
		total_amount: string
	}
	byCategory: Array<{
		category: string
		record_count: number
		total_cost: string
	}>
	byRegion: Array<{
		region: string
		count: number
		total_cost: string
	}>
}

interface ItemStat {
	id: string
	item_name: string
	category_name: string
	record_count: number
	avg_total_cost: number
	avg_material_cost: number
	avg_labor_cost: number
	avg_overhead_cost: number
	min_cost: number
	max_cost: number
	median_cost: number
}

export default function DataManagement() {
	const { token } = useAuth()
	const [uploadType, setUploadType] = useState<'construction' | 'distributor'>('construction')
	const [uploading, setUploading] = useState(false)
	const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
	const [datasets, setDatasets] = useState<DatasetInfo[]>([])
	const [dataStats, setDataStats] = useState<DataStats | null>(null)

	// 항목별 통계
	const [itemStats, setItemStats] = useState<ItemStat[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('')
	const [loadingItems, setLoadingItems] = useState(false)

	// 페이지 로드 시 업로드 이력 및 통계 가져오기
	useEffect(() => {
		fetchDatasets()
		fetchDataStats()
		fetchItemStats()
	}, [])

	// 검색/필터 변경 시 항목 통계 재조회
	useEffect(() => {
		const timer = setTimeout(() => {
			fetchItemStats()
		}, 500)
		return () => clearTimeout(timer)
	}, [searchTerm, selectedCategory])

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setUploading(true)
		setUploadStats(null)

		try {
			const formData = new FormData()
			formData.append('file', file)

			// uploadType에 따라 다른 엔드포인트 호출
			const endpoint =
				uploadType === 'construction'
					? getApiUrl('/api/admin/upload-construction')
					: getApiUrl('/api/admin/upload-distributor')

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
				},
				body: formData
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || '업로드 실패')
			}

			const stats: UploadStats = await response.json()
			setUploadStats(stats)

			// 데이터셋 목록 새로고침
			await fetchDatasets()
		} catch (error) {
			console.error('Upload failed:', error)
			alert('업로드 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setUploading(false)
		}
	}

	const fetchDatasets = async () => {
		try {
			const response = await fetch(getApiUrl('/api/admin/upload-history'), {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const data = await response.json()
			// 업로드 이력을 데이터셋 형식으로 변환
			const formatted = data.map((item: any) => ({
				id: item.id,
				name: item.file_name,
				type: item.dataset_type,
				uploadedAt: new Date(item.uploaded_at),
				uploadedBy: 'Admin',
				rowCount: item.success_rows || 0,
				status: item.status === 'completed' ? 'active' : 'archived'
			}))
			setDatasets(formatted)
		} catch (error) {
			console.error('Failed to fetch datasets:', error)
		}
	}

	const fetchDataStats = async () => {
		try {
			const response = await fetch(getApiUrl('/api/admin/data-stats'), {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const data = await response.json()
			setDataStats(data)
		} catch (error) {
			console.error('Failed to fetch data stats:', error)
		}
	}

	const fetchItemStats = async () => {
		try {
			setLoadingItems(true)
			const params = new URLSearchParams({
				limit: '100',
				offset: '0'
			})

			if (selectedCategory) {
				params.append('category', selectedCategory)
			}
			if (searchTerm) {
				params.append('search', searchTerm)
			}

			const response = await fetch(getApiUrl(`/api/admin/item-stats?${params}`), {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const data = await response.json()
			setItemStats(data.items || [])
		} catch (error) {
			console.error('Failed to fetch item stats:', error)
		} finally {
			setLoadingItems(false)
		}
	}


	return (
		<div className="space-y-6">
			{/* Page Title */}
			<div>
				<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
					데이터 관리
				</h2>
				<p className="text-sand-700 text-sm mt-1">견적 분석을 위한 원본 데이터 관리</p>
			</div>

			{/* 업로드 섹션 */}
			<div className="grid md:grid-cols-2 gap-6">
				{/* 시공 데이터 업로드 */}
				<motion.div
					className="bg-white rounded-2xl p-5 border border-sand-300 hover:border-forest-200 hover:shadow-md transition-all"
					whileHover={{ scale: 1.02 }}
				>
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
							<Database className="w-5 h-5 text-forest-700" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">시공 데이터</h3>
					</div>
					<p className="text-sand-700 text-sm mb-4">
						2024-2025년 실제 시공 데이터 (자재비, 인건비, 간접비)
					</p>

					<label className="block">
						<input
							type="file"
							accept=".xlsx,.xls,.csv"
							className="hidden"
							onChange={(e) => {
								setUploadType('construction')
								handleFileUpload(e)
							}}
							disabled={uploading}
						/>
						<div className="cursor-pointer bg-forest-50 hover:bg-forest-100 border-2 border-dashed border-forest-200 hover:border-forest-300 rounded-xl p-8 text-center transition-all">
							{uploading && uploadType === 'construction' ? (
								<div className="flex flex-col items-center gap-2">
									<RefreshCw className="w-8 h-8 text-forest-600 animate-spin" />
									<span className="text-sm text-sand-700">업로드 중...</span>
								</div>
							) : (
								<div className="flex flex-col items-center gap-2">
									<Upload className="w-8 h-8 text-forest-500" />
									<span className="text-sm text-sand-700">
										Excel 파일을 드래그하거나 클릭하세요
									</span>
								</div>
							)}
						</div>
					</label>

					<div className="mt-4 text-xs text-sand-600 space-y-0.5">
						<p>지원 형식: .xlsx, .xls, .csv</p>
						<p>필수 컬럼: 카테고리, 항목명, 년도, 분기, 지역, 자재비, 인건비, 간접비</p>
					</div>
				</motion.div>

				{/* 유통사 가격 데이터 업로드 */}
				<motion.div
					className="bg-white rounded-2xl p-5 border border-sand-300 hover:border-wood-200 hover:shadow-md transition-all"
					whileHover={{ scale: 1.02 }}
				>
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 rounded-xl bg-wood-100 flex items-center justify-center">
							<FileSpreadsheet className="w-5 h-5 text-wood-500" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">유통사 가격 데이터</h3>
					</div>
					<p className="text-sand-700 text-sm mb-4">
						각 유통사의 도매가, 소매가, 브랜드별 가격 정보
					</p>

					<label className="block">
						<input
							type="file"
							accept=".xlsx,.xls,.csv"
							className="hidden"
							onChange={(e) => {
								setUploadType('distributor')
								handleFileUpload(e)
							}}
							disabled={uploading}
						/>
						<div className="cursor-pointer bg-wood-50 hover:bg-wood-100 border-2 border-dashed border-wood-200 hover:border-wood-300 rounded-xl p-8 text-center transition-all">
							{uploading && uploadType === 'distributor' ? (
								<div className="flex flex-col items-center gap-2">
									<RefreshCw className="w-8 h-8 text-wood-500 animate-spin" />
									<span className="text-sm text-sand-700">업로드 중...</span>
								</div>
							) : (
								<div className="flex flex-col items-center gap-2">
									<Upload className="w-8 h-8 text-wood-400" />
									<span className="text-sm text-sand-700">
										Excel 파일을 드래그하거나 클릭하세요
									</span>
								</div>
							)}
						</div>
					</label>

					<div className="mt-4 text-xs text-sand-600 space-y-0.5">
						<p>지원 형식: .xlsx, .xls, .csv</p>
						<p>필수 컬럼: 항목명, 유통사, 브랜드, 모델명, 도매가, 소매가, 년월</p>
					</div>
				</motion.div>
			</div>

			{/* 데이터 통계 */}
			{dataStats && (
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white rounded-2xl p-5 border border-sand-300"
				>
					<h3 className="text-lg font-semibold text-sand-900 mb-5">업로드된 데이터 통계</h3>

					{/* 개요 */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						<div className="bg-forest-50 rounded-xl p-4 border border-forest-100">
							<div className="text-xs font-medium text-sand-700 mb-1">카테고리</div>
							<div className="text-2xl font-bold text-forest-700">{dataStats.overview.categories_count}</div>
						</div>
						<div className="bg-wood-50 rounded-xl p-4 border border-wood-100">
							<div className="text-xs font-medium text-sand-700 mb-1">항목</div>
							<div className="text-2xl font-bold text-wood-500">{dataStats.overview.items_count}</div>
						</div>
						<div className="bg-green-50 rounded-xl p-4 border border-green-100">
							<div className="text-xs font-medium text-sand-700 mb-1">시공 기록</div>
							<div className="text-2xl font-bold text-green-600">{dataStats.overview.records_count}</div>
						</div>
						<div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
							<div className="text-xs font-medium text-sand-700 mb-1">총 금액</div>
							<div className="text-xl font-bold text-amber-600">{parseInt(dataStats.overview.total_amount || '0').toLocaleString()}</div>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						{/* 카테고리별 통계 */}
						<div>
							<h4 className="text-sm font-semibold text-sand-700 mb-3">카테고리별 통계 (Top 10)</h4>
							<div className="space-y-2 max-h-64 overflow-y-auto">
								{dataStats.byCategory.slice(0, 10).map((item, idx) => (
									<div key={idx} className="bg-sand-50 rounded-lg p-3 flex items-center justify-between">
										<div>
											<div className="text-sm font-medium text-sand-800">{item.category}</div>
											<div className="text-xs text-sand-600">{item.record_count}개 기록</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-bold text-forest-600">{parseInt(item.total_cost).toLocaleString()}</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* 지역별 통계 */}
						<div>
							<h4 className="text-sm font-semibold text-sand-700 mb-3">지역별 통계 (Top 10)</h4>
							<div className="space-y-2 max-h-64 overflow-y-auto">
								{dataStats.byRegion.map((item, idx) => (
									<div key={idx} className="bg-sand-50 rounded-lg p-3 flex items-center justify-between">
										<div>
											<div className="text-sm font-medium text-sand-800">{item.region}</div>
											<div className="text-xs text-sand-600">{item.count}개 기록</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-bold text-wood-500">{parseInt(item.total_cost).toLocaleString()}</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</motion.div>
			)}

			{/* 업로드 결과 */}
			{uploadStats && (
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white rounded-2xl p-5 border border-sand-300"
				>
					<h3 className="text-lg font-semibold text-sand-900 mb-4">업로드 결과</h3>

					<div className="grid grid-cols-3 gap-4 mb-6">
						<div className="bg-sand-50 rounded-xl p-4">
							<div className="text-xs font-medium text-sand-700 mb-1">총 행 수</div>
							<div className="text-2xl font-bold text-sand-900">{uploadStats.totalRows}</div>
						</div>
						<div className="bg-green-50 rounded-xl p-4 border border-green-100">
							<div className="text-xs font-medium text-sand-700 mb-1 flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-green-600" />
								성공
							</div>
							<div className="text-2xl font-bold text-green-600">
								{uploadStats.successRows}
							</div>
						</div>
						<div className="bg-red-50 rounded-xl p-4 border border-red-100">
							<div className="text-xs font-medium text-sand-700 mb-1 flex items-center gap-2">
								<AlertCircle className="w-4 h-4 text-red-600" />
								오류
							</div>
							<div className="text-2xl font-bold text-red-600">
								{uploadStats.errorRows}
							</div>
						</div>
					</div>

					{uploadStats.errors.length > 0 && (
						<div>
							<h4 className="text-sm font-semibold text-red-600 mb-2">
								오류 상세 ({uploadStats.errors.length}건)
							</h4>
							<div className="max-h-60 overflow-y-auto space-y-2">
								{uploadStats.errors.map((error, idx) => (
									<div
										key={idx}
										className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
									>
										<span className="font-semibold">행 {error.row}:</span>{' '}
										{error.message}
									</div>
								))}
							</div>
						</div>
					)}
				</motion.div>
			)}

			{/* 데이터셋 목록 */}
			<div className="bg-white rounded-2xl p-5 border border-sand-300">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-lg font-semibold text-sand-900">업로드된 데이터셋</h3>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-sand-300">
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">
									이름
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">
									유형
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">
									업로드 일시
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">
									업로더
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">
									행 수
								</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">
									상태
								</th>
							</tr>
						</thead>
						<tbody>
							{datasets.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-8 text-sand-600">
										업로드된 데이터셋이 없습니다
									</td>
								</tr>
							) : (
								datasets.map((dataset) => (
									<tr key={dataset.id} className="border-b border-sand-100 hover:bg-sand-50 transition-colors">
										<td className="py-3 px-4 text-sm text-sand-800">{dataset.name}</td>
										<td className="py-3 px-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${
													dataset.type === 'construction'
														? 'bg-forest-100 text-forest-600'
														: 'bg-wood-100 text-wood-500'
												}`}
											>
												{dataset.type === 'construction'
													? '시공 데이터'
													: '유통사 가격'}
											</span>
										</td>
										<td className="py-3 px-4 text-sm text-sand-700">
											{new Date(dataset.uploadedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
										</td>
										<td className="py-3 px-4 text-sm text-sand-700">
											{dataset.uploadedBy}
										</td>
										<td className="py-3 px-4 text-sm text-sand-700">
											{dataset.rowCount.toLocaleString()}
										</td>
										<td className="py-3 px-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${
													dataset.status === 'active'
														? 'bg-green-50 text-green-600'
														: 'bg-sand-100 text-sand-600'
												}`}
											>
												{dataset.status === 'active' ? '활성' : '보관'}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* 항목별 가격 통계 */}
			<div className="bg-white rounded-2xl p-5 border border-sand-300">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
							<TrendingUp className="w-5 h-5 text-green-600" />
						</div>
						<h3 className="text-lg font-semibold text-sand-900">항목별 가격 통계</h3>
					</div>
				</div>

				{/* 검색 및 필터 */}
				<div className="grid md:grid-cols-2 gap-4 mb-6">
					<div className="relative">
						<Search className="w-5 h-5 text-sand-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
						<input
							type="text"
							placeholder="항목명 검색..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 bg-white border border-sand-300 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-300 focus:ring-1 focus:ring-forest-200 transition-colors"
						/>
					</div>
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="px-4 py-2 bg-white border border-sand-300 rounded-lg text-sand-900 focus:outline-none focus:border-forest-300 focus:ring-1 focus:ring-forest-200 transition-colors"
					>
						<option value="">전체 카테고리</option>
						{dataStats?.byCategory.map((cat) => (
							<option key={cat.category} value={cat.category}>
								{cat.category}
							</option>
						))}
					</select>
				</div>

				{/* 항목 테이블 */}
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-sand-300">
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">항목명</th>
								<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">카테고리</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">평균 가격</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">자재비</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">인건비</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">간접비</th>
								<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">최저~최고</th>
								<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">기록수</th>
							</tr>
						</thead>
						<tbody>
							{loadingItems ? (
								<tr>
									<td colSpan={8} className="text-center py-8 text-sand-600">
										로딩 중...
									</td>
								</tr>
							) : itemStats.length === 0 ? (
								<tr>
									<td colSpan={8} className="text-center py-8 text-sand-600">
										검색 결과가 없습니다
									</td>
								</tr>
							) : (
								itemStats.map((item) => (
									<tr key={item.id} className="border-b border-sand-100 hover:bg-sand-50 transition-colors">
										<td className="py-3 px-4 text-sm font-medium text-sand-800">{item.item_name}</td>
										<td className="py-3 px-4">
											<span className="px-2 py-1 rounded-full text-xs bg-forest-100 text-forest-600">
												{item.category_name}
											</span>
										</td>
										<td className="py-3 px-4 text-right text-sm font-bold text-green-600">
											{item.avg_total_cost?.toLocaleString() || '-'}
										</td>
										<td className="py-3 px-4 text-right text-sm text-sand-700">
											{item.avg_material_cost?.toLocaleString() || '-'}
										</td>
										<td className="py-3 px-4 text-right text-sm text-amber-600 font-semibold">
											{item.avg_labor_cost?.toLocaleString() || '-'}
										</td>
										<td className="py-3 px-4 text-right text-sm text-sand-700">
											{item.avg_overhead_cost?.toLocaleString() || '-'}
										</td>
										<td className="py-3 px-4 text-right text-xs text-sand-600">
											{item.min_cost?.toLocaleString()} ~<br />
											{item.max_cost?.toLocaleString()}
										</td>
										<td className="py-3 px-4 text-center text-sm">
											<span className="px-2 py-1 rounded bg-wood-100 text-wood-500">
												{item.record_count}건
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{itemStats.length > 0 && (
					<div className="mt-4 text-sm text-sand-600 text-center">
						총 {itemStats.length}개 항목 표시 중
					</div>
				)}
			</div>
		</div>
	)
}
