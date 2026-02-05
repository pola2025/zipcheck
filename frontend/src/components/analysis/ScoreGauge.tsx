import { getScoreGrade } from '../../lib/scoring'

interface Props {
	score: number
}

export const GRADE_BG: Record<string, string> = {
	'매우 좋음': 'bg-green-50 text-green-700 border-green-200',
	'합리적': 'bg-blue-50 text-blue-700 border-blue-200',
	'평균 수준': 'bg-yellow-50 text-yellow-700 border-yellow-200',
	'다소 비쌈': 'bg-orange-50 text-orange-700 border-orange-200',
	'매우 비쌈': 'bg-red-50 text-red-700 border-red-200',
}

export const STROKE_COLOR: Record<string, string> = {
	'매우 좋음': '#10B981',
	'합리적': '#3B82F6',
	'평균 수준': '#EAB308',
	'다소 비쌈': '#F97316',
	'매우 비쌈': '#EF4444',
}

export default function ScoreGauge({ score }: Props) {
	const grade = getScoreGrade(score)
	const circumference = Math.PI * 100
	const offset = circumference * (1 - score / 100)

	return (
		<svg width="160" height="160" viewBox="0 0 120 120" className="sm:w-[180px] sm:h-[180px]">
			<circle cx="60" cy="60" r="50" fill="none" stroke="#ECEAE3" strokeWidth="10" />
			<circle
				cx="60" cy="60" r="50" fill="none"
				stroke={STROKE_COLOR[grade.label] || '#3D9A4C'}
				strokeWidth="10"
				strokeDasharray={`${circumference}`}
				strokeDashoffset={offset}
				strokeLinecap="round"
				transform="rotate(-90 60 60)"
				style={{ transition: 'stroke-dashoffset 1s ease-out' }}
			/>
			<text x="60" y="54" textAnchor="middle" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 700, fill: '#2A2822' }}>
				{score}
			</text>
			<text x="60" y="72" textAnchor="middle" style={{ fontSize: 11, fill: '#96917F' }}>
				/ 100
			</text>
		</svg>
	)
}
