import { getScoreGrade } from '../../lib/scoring'

interface Props {
	score: number
}

export default function ScoreGauge({ score }: Props) {
	const grade = getScoreGrade(score)
	const angle = (score / 100) * 180 - 90 // -90 to 90 degrees
	const circumference = Math.PI * 80 // r=80, half circle
	const offset = circumference * (1 - score / 100)

	return (
		<div className="flex flex-col items-center">
			<svg width="200" height="120" viewBox="0 0 200 120">
				{/* Background arc */}
				<path
					d="M 20 100 A 80 80 0 0 1 180 100"
					fill="none"
					stroke="#E5E7EB"
					strokeWidth="12"
					strokeLinecap="round"
				/>
				{/* Score arc */}
				<path
					d="M 20 100 A 80 80 0 0 1 180 100"
					fill="none"
					stroke={
						score >= 85 ? '#10B981' :
						score >= 75 ? '#3B82F6' :
						score >= 60 ? '#F59E0B' :
						score >= 45 ? '#F97316' :
						'#EF4444'
					}
					strokeWidth="12"
					strokeLinecap="round"
					strokeDasharray={`${circumference}`}
					strokeDashoffset={offset}
				/>
				{/* Score text */}
				<text x="100" y="85" textAnchor="middle" className="text-3xl font-bold" fill="#1F2937" fontSize="36">
					{score}
				</text>
				<text x="100" y="105" textAnchor="middle" fill="#6B7280" fontSize="12">
					/ 100
				</text>
			</svg>
			<div className="text-center mt-2">
				<span className={`text-2xl font-bold ${grade.color}`}>{grade.label}</span>
				<p className="text-sm text-sand-600 mt-1">{grade.description}</p>
			</div>
		</div>
	)
}
