import type { AdjustmentFactors } from '../../types/analysis'

interface Props {
	factors: AdjustmentFactors
	onChange: (factors: AdjustmentFactors) => void
}

const FACTOR_LABELS: { key: keyof AdjustmentFactors; label: string; description: string }[] = [
	{ key: 'area', label: '면적', description: '10평 1.35 ~ 50평+ 0.88' },
	{ key: 'region', label: '지역', description: '서울 1.0 / 경기 0.9 / 지방 0.8' },
	{ key: 'year', label: '연도', description: '+4%/년 (발행일 기준)' },
	{ key: 'grade', label: '등급', description: '가성비 0.7 ~ 프리미엄 1.8' },
	{ key: 'season', label: '계절', description: '1-2월 0.95 ~ 3-5월 1.07' },
	{ key: 'exclusive', label: '전속', description: '전속업체 +10~15%' },
]

export default function AdjustmentFactorsForm({ factors, onChange }: Props) {
	const combinedFactor = Object.values(factors).reduce((prod, v) => prod * (v || 1), 1)

	const handleChange = (key: keyof AdjustmentFactors, value: string) => {
		const num = parseFloat(value)
		onChange({ ...factors, [key]: isNaN(num) ? undefined : num })
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h4 className="text-xs font-semibold text-sand-700">보정계수</h4>
				<span className="text-xs font-mono text-forest-600">
					종합: ×{combinedFactor.toFixed(3)}
				</span>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
				{FACTOR_LABELS.map(({ key, label, description }) => (
					<div key={key}>
						<label className="text-xs text-sand-500 block mb-0.5" title={description}>
							{label}
						</label>
						<input
							type="number"
							min="0"
							max="5"
							step="0.01"
							value={factors[key] ?? ''}
							onChange={(e) => handleChange(key, e.target.value)}
							className="w-full px-2 py-1.5 bg-sand-50 border border-sand-300 rounded-lg text-sm font-mono focus:outline-none focus:border-forest-300"
						/>
					</div>
				))}
			</div>
		</div>
	)
}
