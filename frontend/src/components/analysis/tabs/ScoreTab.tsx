import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Analysis, AnalysisItem, ScoreBreakdown } from '../../../types/analysis'
import { calculateScore, getScoreGrade } from '../../../lib/scoring'
import ScoreGauge from '../ScoreGauge'

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
	onComplete: (totalScore: number, breakdown: ScoreBreakdown) => Promise<Analysis | null>
	completing: boolean
}

export default function ScoreTab({ analysis, items, onComplete, completing }: Props) {
	const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null)

	useEffect(() => {
		const result = calculateScore(analysis, items)
		setBreakdown(result)
	}, [analysis, items])

	if (!breakdown) return null

	const grade = getScoreGrade(breakdown.final_score)

	const handleComplete = async () => {
		if (!confirm('분석을 완료하시겠습니까? 완료 후 점수가 저장됩니다.')) return
		await onComplete(breakdown.final_score, breakdown)
	}

	return (
		<div className="space-y-6">
			{/* Score Gauge */}
			<div className="flex justify-center">
				<ScoreGauge score={breakdown.final_score} />
			</div>

			{/* Score Summary */}
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-sand-50 rounded-xl p-4 border border-sand-200 text-center">
					<p className="text-xs text-sand-600 mb-1">카테고리 가중 평균</p>
					<p className="text-2xl font-bold text-sand-900">{breakdown.weighted_sum.toFixed(1)}</p>
				</div>
				<div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
					<p className="text-xs text-green-600 mb-1">보너스</p>
					<p className="text-2xl font-bold text-green-700">
						+{breakdown.bonuses.reduce((s, b) => s + b.points, 0)}
					</p>
				</div>
				<div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
					<p className="text-xs text-red-600 mb-1">패널티</p>
					<p className="text-2xl font-bold text-red-700">
						{breakdown.penalties.reduce((s, p) => s + p.points, 0)}
					</p>
				</div>
			</div>

			{/* Category Breakdown */}
			<div className="bg-white rounded-xl border border-sand-200 p-4">
				<h3 className="text-sm font-semibold text-sand-800 mb-3">카테고리별 점수</h3>
				<div className="space-y-3">
					{breakdown.categories
						.sort((a, b) => b.weight - a.weight)
						.map((cat) => (
						<div key={cat.category} className="flex items-center gap-3">
							<div className="w-16 text-xs text-sand-700 font-semibold text-right">{cat.category}</div>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<div className="flex-1 bg-sand-100 rounded-full h-3">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${cat.score}%` }}
											transition={{ duration: 0.5 }}
											className={`h-3 rounded-full ${
												cat.score >= 80 ? 'bg-green-500' :
												cat.score >= 60 ? 'bg-amber-500' :
												'bg-red-500'
											}`}
										/>
									</div>
									<span className="text-xs font-mono text-sand-700 w-8">{cat.score}</span>
								</div>
							</div>
							<div className="w-16 text-right">
								<span className="text-xs text-sand-500">×{cat.weight.toFixed(2)}</span>
							</div>
							<div className="w-10 text-right">
								<span className="text-xs text-sand-500">{cat.item_count}건</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Bonuses & Penalties */}
			<div className="grid md:grid-cols-2 gap-4">
				{/* Bonuses */}
				<div className="bg-green-50 rounded-xl border border-green-200 p-4">
					<h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
						<TrendingUp className="w-4 h-4" />
						보너스
					</h3>
					{breakdown.bonuses.length === 0 ? (
						<p className="text-sm text-green-600">보너스 없음</p>
					) : (
						<div className="space-y-2">
							{breakdown.bonuses.map((b, i) => (
								<div key={i} className="flex items-center justify-between">
									<div>
										<p className="text-sm font-semibold text-green-800">{b.label}</p>
										{b.reason && <p className="text-xs text-green-600">{b.reason}</p>}
									</div>
									<span className="text-sm font-bold text-green-700">+{b.points}</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Penalties */}
				<div className="bg-red-50 rounded-xl border border-red-200 p-4">
					<h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
						<TrendingDown className="w-4 h-4" />
						패널티
					</h3>
					{breakdown.penalties.length === 0 ? (
						<p className="text-sm text-red-600">패널티 없음</p>
					) : (
						<div className="space-y-2">
							{breakdown.penalties.map((p, i) => (
								<div key={i} className="flex items-center justify-between">
									<div>
										<p className="text-sm font-semibold text-red-800">{p.label}</p>
										{p.reason && <p className="text-xs text-red-600">{p.reason}</p>}
									</div>
									<span className="text-sm font-bold text-red-700">{p.points}</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Complete Button */}
			{analysis.status !== 'completed' && (
				<div className="flex justify-center pt-4">
					<button
						onClick={handleComplete}
						disabled={completing}
						className={`px-8 py-3 rounded-xl text-base font-semibold transition-all flex items-center gap-2 ${
							completing
								? 'bg-sand-100 text-sand-600 cursor-not-allowed'
								: 'bg-forest-600 hover:bg-forest-700 text-white shadow-md hover:shadow-lg'
						}`}
					>
						<CheckCircle className="w-5 h-5" />
						{completing ? '처리 중...' : '분석 완료'}
					</button>
				</div>
			)}

			{analysis.status === 'completed' && (
				<div className="flex items-center justify-center gap-2 py-4 text-green-600">
					<CheckCircle className="w-5 h-5" />
					<span className="text-sm font-semibold">분석이 완료되었습니다</span>
				</div>
			)}
		</div>
	)
}
