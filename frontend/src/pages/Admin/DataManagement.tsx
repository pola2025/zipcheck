import { useState, useEffect } from 'react'
import { Upload, FileSpreadsheet, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
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

export default function DataManagement() {
	const { token } = useAuth()
	const [uploadType, setUploadType] = useState<'construction' | 'distributor'>('construction')
	const [uploading, setUploading] = useState(false)
	const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
	const [datasets, setDatasets] = useState<DatasetInfo[]>([])
	const [dataStats, setDataStats] = useState<DataStats | null>(null)

	// 페이지 로드 시 업로드 이력 및 통계 가져오기
	useEffect(() => {
		fetchDatasets()
		fetchDataStats()
	}, [])

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

	const recalculateMarketAverages = async () => {
		if (!confirm('시장 평균을 재계산하시겠습니까?')) return

		try {
			const response = await fetch(getApiUrl('/api/admin/recalculate-averages'), {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (!response.ok) throw new Error('Failed to recalculate')
			alert('✅ 시장 평균이 재계산되었습니다!')
		} catch (error) {
			alert('❌ 재계산 실패: ' + (error instanceof Error ? error.message : String(error)))
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
			<div className="max-w-7xl mx-auto">
				{/* 헤더 */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
						데이터 관리 시스템
					</h1>
					<p className="text-gray-400">견적 분석을 위한 원본 데이터 관리</p>
				</div>

				{/* 업로드 섹션 */}
				<div className="grid md:grid-cols-2 gap-6 mb-8">
					{/* 시공 데이터 업로드 */}
					<motion.div
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30"
						whileHover={{ scale: 1.02 }}
					>
						<div className="flex items-center gap-3 mb-4">
							<Database className="w-6 h-6 text-cyan-400" />
							<h2 className="text-xl font-bold">시공 데이터</h2>
						</div>
						<p className="text-gray-400 text-sm mb-4">
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
							<div className="cursor-pointer bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-dashed border-cyan-500/50 rounded-xl p-8 text-center transition-all">
								{uploading && uploadType === 'construction' ? (
									<div className="flex flex-col items-center gap-2">
										<RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
										<span className="text-sm text-gray-300">업로드 중...</span>
									</div>
								) : (
									<div className="flex flex-col items-center gap-2">
										<Upload className="w-8 h-8 text-cyan-400" />
										<span className="text-sm text-gray-300">
											Excel 파일을 드래그하거나 클릭하세요
										</span>
									</div>
								)}
							</div>
						</label>

						<div className="mt-4 text-xs text-gray-500">
							<p>📄 지원 형식: .xlsx, .xls, .csv</p>
							<p>📋 필수 컬럼: 카테고리, 항목명, 년도, 분기, 지역, 자재비, 인건비, 간접비</p>
						</div>
					</motion.div>

					{/* 유통사 가격 데이터 업로드 */}
					<motion.div
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
						whileHover={{ scale: 1.02 }}
					>
						<div className="flex items-center gap-3 mb-4">
							<FileSpreadsheet className="w-6 h-6 text-purple-400" />
							<h2 className="text-xl font-bold">유통사 가격 데이터</h2>
						</div>
						<p className="text-gray-400 text-sm mb-4">
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
							<div className="cursor-pointer bg-purple-500/20 hover:bg-purple-500/30 border-2 border-dashed border-purple-500/50 rounded-xl p-8 text-center transition-all">
								{uploading && uploadType === 'distributor' ? (
									<div className="flex flex-col items-center gap-2">
										<RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
										<span className="text-sm text-gray-300">업로드 중...</span>
									</div>
								) : (
									<div className="flex flex-col items-center gap-2">
										<Upload className="w-8 h-8 text-purple-400" />
										<span className="text-sm text-gray-300">
											Excel 파일을 드래그하거나 클릭하세요
										</span>
									</div>
								)}
							</div>
						</label>

						<div className="mt-4 text-xs text-gray-500">
							<p>📄 지원 형식: .xlsx, .xls, .csv</p>
							<p>📋 필수 컬럼: 항목명, 유통사, 브랜드, 모델명, 도매가, 소매가, 년월</p>
						</div>
					</motion.div>
				</div>

				{/* 데이터 통계 */}
				{dataStats && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8"
					>
						<h3 className="text-xl font-bold mb-6">업로드된 데이터 통계</h3>

						{/* 개요 */}
						<div className="grid grid-cols-4 gap-4 mb-6">
							<div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl p-4 border border-cyan-500/30">
								<div className="text-sm text-gray-300 mb-1">카테고리</div>
								<div className="text-3xl font-bold text-cyan-400">{dataStats.overview.categories_count}</div>
							</div>
							<div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
								<div className="text-sm text-gray-300 mb-1">항목</div>
								<div className="text-3xl font-bold text-purple-400">{dataStats.overview.items_count}</div>
							</div>
							<div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
								<div className="text-sm text-gray-300 mb-1">시공 기록</div>
								<div className="text-3xl font-bold text-green-400">{dataStats.overview.records_count}</div>
							</div>
							<div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl p-4 border border-amber-500/30">
								<div className="text-sm text-gray-300 mb-1">총 금액</div>
								<div className="text-2xl font-bold text-amber-400">₩{parseInt(dataStats.overview.total_amount || '0').toLocaleString()}</div>
							</div>
						</div>

						<div className="grid md:grid-cols-2 gap-6">
							{/* 카테고리별 통계 */}
							<div>
								<h4 className="text-lg font-semibold mb-3 text-gray-200">카테고리별 통계 (Top 10)</h4>
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{dataStats.byCategory.slice(0, 10).map((item, idx) => (
										<div key={idx} className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
											<div>
												<div className="font-semibold text-gray-200">{item.category}</div>
												<div className="text-xs text-gray-400">{item.record_count}개 기록</div>
											</div>
											<div className="text-right">
												<div className="font-bold text-cyan-400">₩{parseInt(item.total_cost).toLocaleString()}</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* 지역별 통계 */}
							<div>
								<h4 className="text-lg font-semibold mb-3 text-gray-200">지역별 통계 (Top 10)</h4>
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{dataStats.byRegion.map((item, idx) => (
										<div key={idx} className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
											<div>
												<div className="font-semibold text-gray-200">{item.region}</div>
												<div className="text-xs text-gray-400">{item.count}개 기록</div>
											</div>
											<div className="text-right">
												<div className="font-bold text-purple-400">₩{parseInt(item.total_cost).toLocaleString()}</div>
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
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8"
					>
						<h3 className="text-xl font-bold mb-4">업로드 결과</h3>

						<div className="grid grid-cols-3 gap-4 mb-6">
							<div className="bg-gray-700/50 rounded-xl p-4">
								<div className="text-sm text-gray-400 mb-1">총 행 수</div>
								<div className="text-3xl font-bold">{uploadStats.totalRows}</div>
							</div>
							<div className="bg-green-500/20 rounded-xl p-4">
								<div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									성공
								</div>
								<div className="text-3xl font-bold text-green-400">
									{uploadStats.successRows}
								</div>
							</div>
							<div className="bg-red-500/20 rounded-xl p-4">
								<div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
									<AlertCircle className="w-4 h-4 text-red-400" />
									오류
								</div>
								<div className="text-3xl font-bold text-red-400">
									{uploadStats.errorRows}
								</div>
							</div>
						</div>

						{uploadStats.errors.length > 0 && (
							<div>
								<h4 className="text-sm font-semibold text-red-400 mb-2">
									오류 상세 ({uploadStats.errors.length}건)
								</h4>
								<div className="max-h-60 overflow-y-auto space-y-2">
									{uploadStats.errors.map((error, idx) => (
										<div
											key={idx}
											className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm"
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
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-xl font-bold">업로드된 데이터셋</h3>
						<button
							onClick={recalculateMarketAverages}
							className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
						>
							<RefreshCw className="w-4 h-4" />
							시장 평균 재계산
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-700">
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										이름
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										유형
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										업로드 일시
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										업로더
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										행 수
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
										상태
									</th>
								</tr>
							</thead>
							<tbody>
								{datasets.length === 0 ? (
									<tr>
										<td colSpan={6} className="text-center py-8 text-gray-500">
											업로드된 데이터셋이 없습니다
										</td>
									</tr>
								) : (
									datasets.map((dataset) => (
										<tr key={dataset.id} className="border-b border-gray-700/50">
											<td className="py-3 px-4">{dataset.name}</td>
											<td className="py-3 px-4">
												<span
													className={`px-3 py-1 rounded-full text-xs font-semibold ${
														dataset.type === 'construction'
															? 'bg-cyan-500/20 text-cyan-400'
															: 'bg-purple-500/20 text-purple-400'
													}`}
												>
													{dataset.type === 'construction'
														? '시공 데이터'
														: '유통사 가격'}
												</span>
											</td>
											<td className="py-3 px-4 text-sm text-gray-400">
												{new Date(dataset.uploadedAt).toLocaleString('ko-KR')}
											</td>
											<td className="py-3 px-4 text-sm text-gray-400">
												{dataset.uploadedBy}
											</td>
											<td className="py-3 px-4 text-sm text-gray-400">
												{dataset.rowCount.toLocaleString()}
											</td>
											<td className="py-3 px-4">
												<span
													className={`px-3 py-1 rounded-full text-xs font-semibold ${
														dataset.status === 'active'
															? 'bg-green-500/20 text-green-400'
															: 'bg-gray-500/20 text-gray-400'
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
			</div>
		</div>
	)
}
