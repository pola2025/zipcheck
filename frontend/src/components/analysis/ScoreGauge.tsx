import { getScoreGrade } from '../../lib/scoring'

interface Props {
	score: number
}

const GRADE_BG: Record<string, string> = {
	A: 'bg-green-50 text-green-700 border-green-200',
	B: 'bg-blue-50 text-blue-700 border-blue-200',
	C: 'bg-amber-50 text-amber-700 border-amber-200',
	D: 'bg-orange-50 text-orange-700 border-orange-200',
	F: 'bg-red-50 text-red-700 border-red-200',
}

const STROKE_COLOR: Record<string, string> = {
	A: '#10B981',
	B: '#3B82F6',
	C: '#F59E0B',
	D: '#F97316',
	F: '#EF4444',
}

export default function ScoreGauge({ score }: Props) {
	const grade = getScoreGrade(score)
	const circumference = Math.PI * 100 // 2πr, r=50, full circle = 314
	const offset = circumference * (1 - score / 100)

	return (
		<div className="flex flex-col md:flex-row items-center gap-8">
			{/* Circular gauge */}
			<div className="flex-shrink-0">
				<svg width="180" height="180" viewBox="0 0 120 120">
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
			</div>

			{/* Score description */}
			<div className="flex-1 text-center md:text-left">
				<div className="flex items-center gap-3 justify-center md:justify-start mb-2">
					<span className="text-4xl font-bold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
						{score}
					</span>
					<span className={`px-3 py-1 rounded-full text-sm font-bold border ${GRADE_BG[grade.label] || ''}`}>
						{grade.label}등급
					</span>
				</div>
				<p className="text-sand-600 text-base">{grade.description}</p>
			</div>
		</div>
	)
}
