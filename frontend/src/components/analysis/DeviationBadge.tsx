import type { DeviationBracket } from '../../types/analysis'

const config: Record<DeviationBracket, { label: string; bg: string }> = {
	dump_risk: { label: '가성비↓', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
	under_warning: { label: '시장가 이하', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
	good: { label: '양호', bg: 'bg-green-50 text-green-700 border-green-200' },
	fair: { label: '적정', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
	slightly_high: { label: '약간높음', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
	high: { label: '높음', bg: 'bg-red-50 text-red-700 border-red-200' },
}

interface Props {
	bracket: DeviationBracket | null | undefined
	deviationPercent?: number | null
}

export default function DeviationBadge({ bracket, deviationPercent }: Props) {
	if (!bracket) return null

	const { label, bg } = config[bracket] || { label: bracket, bg: 'bg-sand-100 text-sand-700 border-sand-200' }

	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
			{label}
			{deviationPercent != null && (
				<span className="font-mono">
					{deviationPercent > 0 ? '+' : ''}{deviationPercent.toFixed(1)}%
				</span>
			)}
		</span>
	)
}
