import { AlertTriangle, Info } from 'lucide-react'
import type { Analysis, AnalysisItem } from '../../../types/analysis'

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
	onUpdateAnalysis: (data: Partial<Analysis>) => void
	onUpdateItem: (itemId: string, data: Partial<AnalysisItem>) => Promise<AnalysisItem | null>
}

export default function VatTab({ analysis, items, onUpdateAnalysis, onUpdateItem }: Props) {
	const hasNull = items.some((i) => i.original_total_price == null)
	const vatMultiplier = analysis.is_vat_included ? 1.0 : 1.1

	const totalOriginal = items.reduce((s, i) => s + (i.original_total_price || 0), 0)
	const totalAdjusted = Math.round(totalOriginal * vatMultiplier)

	return (
		<div className="space-y-4">
			{/* VAT Toggle */}
			<div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-sm font-semibold text-sand-900">VAT 포함 여부</h3>
						<p className="text-xs text-sand-600 mt-0.5">
							이 견적서의 가격에 VAT(10%)가 포함되어 있습니까?
						</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={() => onUpdateAnalysis({ is_vat_included: true })}
							className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
								analysis.is_vat_included
									? 'bg-forest-600 text-white'
									: 'bg-white border border-sand-300 text-sand-700 hover:bg-sand-50'
							}`}
						>
							VAT 포함
						</button>
						<button
							onClick={() => onUpdateAnalysis({ is_vat_included: false })}
							className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
								!analysis.is_vat_included
									? 'bg-forest-600 text-white'
									: 'bg-white border border-sand-300 text-sand-700 hover:bg-sand-50'
							}`}
						>
							VAT 미포함
						</button>
					</div>
				</div>

				{!analysis.is_vat_included && (
					<div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
						<Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
						<span className="text-xs text-blue-700">
							VAT 미포함 → 모든 가격에 ×1.1 보정이 적용됩니다.
						</span>
					</div>
				)}
			</div>

			{/* Warning for null prices */}
			{hasNull && (
				<div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
					<AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
					<span className="text-sm text-red-700">
						가격이 없는 항목이 있습니다. 업체/고객 확인이 필요합니다.
					</span>
				</div>
			)}

			{/* Summary */}
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-white rounded-xl p-4 border border-sand-200 text-center">
					<p className="text-xs text-sand-600 mb-1">원가 합계</p>
					<p className="text-lg font-bold text-sand-900">{totalOriginal.toLocaleString()}원</p>
				</div>
				<div className="bg-white rounded-xl p-4 border border-sand-200 text-center">
					<p className="text-xs text-sand-600 mb-1">VAT 배율</p>
					<p className="text-lg font-bold text-forest-600">×{vatMultiplier.toFixed(1)}</p>
				</div>
				<div className="bg-white rounded-xl p-4 border border-sand-200 text-center">
					<p className="text-xs text-sand-600 mb-1">보정 합계</p>
					<p className="text-lg font-bold text-sand-900">{totalAdjusted.toLocaleString()}원</p>
				</div>
			</div>

			{/* Item-level VAT Preview */}
			<div className="bg-white rounded-xl border border-sand-200 overflow-hidden">
				<table className="w-full">
					<thead>
						<tr className="bg-sand-50 border-b border-sand-200">
							<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">항목</th>
							<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">원가</th>
							<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">오버라이드</th>
							<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">보정 가격</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item) => {
							const originalPrice = item.original_total_price || 0
							const itemVatMultiplier = item.is_vat_override ? 1.0 : vatMultiplier
							const adjustedPrice = Math.round(originalPrice * itemVatMultiplier)

							return (
								<tr key={item.id} className="border-b border-sand-100">
									<td className="py-3 px-4">
										<div className="text-sm font-medium text-sand-900">
											{item.std_item || item.original_item_name || '—'}
										</div>
										<div className="text-xs text-sand-600">
											{item.std_category || item.original_category || '—'}
										</div>
									</td>
									<td className="py-3 px-4 text-right text-sm text-sand-700">
										{originalPrice.toLocaleString()}원
									</td>
									<td className="py-3 px-4 text-center">
										<label className="inline-flex items-center gap-1.5 cursor-pointer">
											<input
												type="checkbox"
												checked={item.is_vat_override}
												onChange={async (e) => {
													await onUpdateItem(item.id, { is_vat_override: e.target.checked })
												}}
												className="w-3.5 h-3.5 rounded border-sand-300 text-forest-600 focus:ring-forest-300"
											/>
											<span className="text-xs text-sand-600">VAT 포함</span>
										</label>
									</td>
									<td className="py-3 px-4 text-right">
										<span className={`text-sm font-semibold ${
											adjustedPrice !== originalPrice ? 'text-forest-600' : 'text-sand-900'
										}`}>
											{adjustedPrice.toLocaleString()}원
										</span>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}
