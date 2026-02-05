import { useState, useEffect, useCallback } from 'react'
import { Search, AlertTriangle, RefreshCw } from 'lucide-react'
import type { Analysis, AnalysisItem, BenchmarkPrice, AdjustmentFactors } from '../../../types/analysis'
import { calculateAdjustmentFactors, applyAdjustments, calculateDeviation, getDeviationBracket } from '../../../lib/adjustments'
import AdjustmentFactorsForm from '../AdjustmentFactorsForm'
import DeviationBadge from '../DeviationBadge'
import ItemCard from '../ItemCard'
import { getApiUrl } from '../../../lib/api-config'

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
	onUpdateItem: (itemId: string, data: Partial<AnalysisItem>) => Promise<AnalysisItem | null>
	saving: boolean
}

export default function BenchmarkTab({ analysis, items, onUpdateItem, saving }: Props) {
	const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null)
	const selectedItem = items.find((i) => i.id === selectedItemId)

	// Search state
	const [searchResults, setSearchResults] = useState<BenchmarkPrice[]>([])
	const [searching, setSearching] = useState(false)

	// Global adjustment factors (auto-calculated from analysis metadata)
	const [factors, setFactors] = useState<AdjustmentFactors>(() =>
		calculateAdjustmentFactors({
			propertySizeSqm: analysis.property_size_sqm,
			region: analysis.region,
			quoteDate: analysis.quote_date,
			constructionStartMonth: analysis.construction_start_month,
		})
	)

	const searchBenchmarks = useCallback(async () => {
		if (!selectedItem) return
		setSearching(true)
		try {
			const token = localStorage.getItem('admin_token')
			const res = await fetch(getApiUrl('/api/admin/benchmarks/search'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					std_category: selectedItem.std_category,
					std_item: selectedItem.std_item,
					grade: selectedItem.attributes?.grade,
					brand: selectedItem.attributes?.brand,
					material: selectedItem.attributes?.material,
				}),
			})
			if (res.ok) {
				const result = await res.json()
				setSearchResults(result.data || [])
			}
		} finally {
			setSearching(false)
		}
	}, [selectedItem])

	useEffect(() => {
		if (selectedItem?.std_category) searchBenchmarks()
	}, [selectedItemId])

	const handleSelectBenchmark = async (bp: BenchmarkPrice) => {
		if (!selectedItem) return

		const itemFactors = {
			...factors,
			grade: selectedItem.attributes?.grade
				? undefined // Use auto-calculated from grade
				: factors.grade,
		}

		const adjustedBenchmark = applyAdjustments(bp.unit_price, itemFactors)
		const actualPrice = selectedItem.original_unit_price || 0
		const deviation = calculateDeviation(actualPrice, adjustedBenchmark)
		const bracket = getDeviationBracket(deviation)

		// Unit mismatch check (Hard Gate)
		const unitMismatch = selectedItem.original_unit && bp.unit && selectedItem.original_unit !== bp.unit

		await onUpdateItem(selectedItem.id, {
			benchmark_price_id: bp.id,
			benchmark_unit_price: bp.unit_price,
			adjusted_benchmark_price: unitMismatch ? null : adjustedBenchmark,
			adjustment_factors: itemFactors,
			deviation_percent: unitMismatch ? null : Math.round(deviation * 100) / 100,
			deviation_bracket: unitMismatch ? null : bracket,
		})
	}

	return (
		<div className="grid lg:grid-cols-[320px_1fr] gap-4">
			{/* Left: Item List */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-sand-800 mb-2">
					항목 목록 ({items.length})
				</h3>
				<div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
					{items.map((item) => (
						<ItemCard
							key={item.id}
							item={item}
							isSelected={selectedItemId === item.id}
							onClick={() => setSelectedItemId(item.id)}
							showLabels
						/>
					))}
				</div>
			</div>

			{/* Right: Benchmark Comparison */}
			<div className="space-y-4">
				{/* Global Adjustment Factors */}
				<div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
					<AdjustmentFactorsForm factors={factors} onChange={setFactors} />
				</div>

				{selectedItem ? (
					<>
						{/* Selected Item Summary */}
						<div className="bg-white rounded-xl p-4 border border-sand-200">
							<div className="flex items-center justify-between mb-3">
								<div>
									<p className="text-sm font-semibold text-sand-900">
										{selectedItem.std_item || selectedItem.original_item_name}
									</p>
									<p className="text-xs text-sand-600">
										{selectedItem.std_category || selectedItem.original_category} · {selectedItem.original_unit || '단위 없음'}
									</p>
								</div>
								<div className="text-right">
									<p className="text-xs text-sand-600">원 단가</p>
									<p className="text-lg font-bold text-sand-900">
										{(selectedItem.original_unit_price || 0).toLocaleString()}원
									</p>
								</div>
							</div>

							{/* Current benchmark result */}
							{selectedItem.benchmark_unit_price != null && (
								<div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-sand-200">
									<div className="text-center">
										<p className="text-xs text-sand-500">벤치마크</p>
										<p className="text-sm font-semibold text-sand-900">
											{selectedItem.benchmark_unit_price.toLocaleString()}원
										</p>
									</div>
									<div className="text-center">
										<p className="text-xs text-sand-500">보정 벤치마크</p>
										<p className="text-sm font-semibold text-forest-600">
											{selectedItem.adjusted_benchmark_price != null
												? selectedItem.adjusted_benchmark_price.toLocaleString() + '원'
												: '—'}
										</p>
									</div>
									<div className="text-center">
										<p className="text-xs text-sand-500">편차</p>
										<DeviationBadge
											bracket={selectedItem.deviation_bracket}
											deviationPercent={selectedItem.deviation_percent}
										/>
									</div>
								</div>
							)}

							{/* Unit mismatch warning */}
							{selectedItem.benchmark_unit_price != null && selectedItem.adjusted_benchmark_price == null && (
								<div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
									<AlertTriangle className="w-4 h-4 text-red-500" />
									<span className="text-xs text-red-700">
										단위 불일치: 비교가 차단되었습니다 (HIGH_UNCERTAINTY)
									</span>
								</div>
							)}
						</div>

						{/* Benchmark Search */}
						<div className="bg-white rounded-xl p-4 border border-sand-200">
							<div className="flex items-center justify-between mb-3">
								<h4 className="text-sm font-semibold text-sand-800">벤치마크 검색</h4>
								<button
									onClick={searchBenchmarks}
									disabled={searching}
									className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-lg text-xs font-semibold text-forest-600 transition-all flex items-center gap-1"
								>
									{searching ? (
										<RefreshCw className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Search className="w-3.5 h-3.5" />
									)}
									검색
								</button>
							</div>

							{searchResults.length === 0 ? (
								<p className="text-sm text-sand-500 text-center py-4">
									{searching ? '검색 중...' : '검색 결과가 없습니다'}
								</p>
							) : (
								<div className="space-y-2 max-h-[300px] overflow-y-auto">
									{searchResults.map((bp) => (
										<button
											key={bp.id}
											onClick={() => handleSelectBenchmark(bp)}
											disabled={saving}
											className={`w-full text-left p-3 rounded-lg border transition-all ${
												selectedItem.benchmark_price_id === bp.id
													? 'border-forest-400 bg-forest-50'
													: 'border-sand-200 hover:border-sand-300 hover:bg-sand-50'
											}`}
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-semibold text-sand-900">
														{bp.std_item}
													</p>
													<p className="text-xs text-sand-600">
														{bp.std_category} · {bp.grade} · {bp.unit}
														{bp.brand && ` · ${bp.brand}`}
													</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-bold text-sand-900">
														{bp.unit_price.toLocaleString()}원
													</p>
													<p className="text-xs text-sand-500">{bp.source || '—'}</p>
												</div>
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</>
				) : (
					<div className="bg-sand-50 rounded-xl border border-sand-200 p-8 text-center text-sand-500 text-sm">
						왼쪽에서 항목을 선택하세요
					</div>
				)}
			</div>
		</div>
	)
}
