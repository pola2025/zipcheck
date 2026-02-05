import type { AnalysisItem, StdCategory } from '../../types/analysis'

const categoryColors: Record<string, string> = {
	'욕실': 'bg-teal-50 text-teal-700',
	'바닥': 'bg-stone-50 text-stone-700',
	'가구': 'bg-pink-50 text-pink-700',
	'목공': 'bg-amber-50 text-amber-700',
	'전기': 'bg-yellow-50 text-yellow-700',
	'도배': 'bg-green-50 text-green-700',
	'철거': 'bg-red-50 text-red-700',
	'주방': 'bg-orange-50 text-orange-700',
	'창호': 'bg-sky-50 text-sky-700',
	'페인트': 'bg-rose-50 text-rose-700',
	'기타': 'bg-sand-100 text-sand-700',
}

function getCategoryColor(category: string | null | undefined): string {
	if (!category) return 'bg-sand-100 text-sand-600'
	return categoryColors[category] || 'bg-sand-100 text-sand-700'
}

interface Props {
	item: AnalysisItem
	isSelected?: boolean
	onClick?: () => void
	showLabels?: boolean
}

export default function ItemCard({ item, isSelected, onClick, showLabels = false }: Props) {
	const displayCategory = item.std_category || item.original_category || '미분류'
	const displayName = item.std_item || item.original_item_name || '항목명 없음'
	const price = item.original_total_price || 0

	return (
		<div
			onClick={onClick}
			className={`rounded-xl p-3 border transition-all cursor-pointer ${
				isSelected
					? 'border-forest-400 bg-forest-50 ring-1 ring-forest-300'
					: 'border-sand-200 bg-white hover:border-sand-300 hover:shadow-sm'
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(displayCategory)}`}>
							{displayCategory}
						</span>
						{item.is_bundled && (
							<span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600">
								일식
							</span>
						)}
					</div>
					<p className="text-sm font-semibold text-sand-900 truncate">{displayName}</p>
					{item.original_quantity != null && (
						<p className="text-xs text-sand-600 mt-0.5">
							{item.original_quantity} {item.original_unit || ''} × {(item.original_unit_price || 0).toLocaleString()}원
						</p>
					)}
				</div>
				<div className="text-right flex-shrink-0">
					<p className="text-sm font-bold text-sand-900">{price.toLocaleString()}원</p>
					{showLabels && item.confidence != null && (
						<p className={`text-xs mt-0.5 ${
							item.confidence >= 0.8 ? 'text-green-600' :
							item.confidence >= 0.5 ? 'text-amber-600' : 'text-red-600'
						}`}>
							신뢰도 {(item.confidence * 100).toFixed(0)}%
						</p>
					)}
				</div>
			</div>

			{showLabels && item.deviation_bracket && (
				<div className="mt-2 flex items-center gap-2">
					<DeviationBadge bracket={item.deviation_bracket} />
					{item.deviation_percent != null && (
						<span className="text-xs text-sand-600">
							{item.deviation_percent > 0 ? '+' : ''}{item.deviation_percent.toFixed(1)}%
						</span>
					)}
				</div>
			)}
		</div>
	)
}

function DeviationBadge({ bracket }: { bracket: string }) {
	const config: Record<string, { label: string; color: string }> = {
		good: { label: '양호', color: 'bg-green-50 text-green-700' },
		fair: { label: '적정', color: 'bg-blue-50 text-blue-700' },
		slightly_high: { label: '약간높음', color: 'bg-amber-50 text-amber-700' },
		high: { label: '높음', color: 'bg-red-50 text-red-700' },
	}
	const { label, color } = config[bracket] || { label: bracket, color: 'bg-sand-100 text-sand-700' }

	return (
		<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
			{label}
		</span>
	)
}
