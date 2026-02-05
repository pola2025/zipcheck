import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminPath } from '../../lib/admin-path'
import type { Analysis } from '../../types/analysis'

const statusLabels: Record<string, string> = {
	draft: '초안',
	in_progress: '진행중',
	review: '검토중',
	completed: '완료',
}

const statusColors: Record<string, string> = {
	draft: 'bg-sand-100 text-sand-700',
	in_progress: 'bg-blue-50 text-blue-600',
	review: 'bg-amber-50 text-amber-600',
	completed: 'bg-green-50 text-green-600',
}

interface Props {
	analysis: Analysis
	itemCount: number
}

export default function AnalysisHeader({ analysis, itemCount }: Props) {
	return (
		<div>
			<Link
				to={adminPath('/analyses')}
				className="inline-flex items-center gap-1.5 text-sm text-sand-700 hover:text-forest-600 transition-colors mb-3"
			>
				<ArrowLeft className="w-4 h-4" />
				분석 목록
			</Link>

			<div className="flex items-center justify-between">
				<div>
					<h2
						className="text-2xl font-semibold text-sand-900"
						style={{ fontFamily: 'Outfit, sans-serif' }}
					>
						견적 분석 워크스페이스
					</h2>
					<p className="text-sand-700 text-sm mt-1">
						{analysis.customer_name || '미입력'} · {analysis.property_type || '—'} · {analysis.region || '—'}
						{analysis.property_size_sqm ? ` · ${analysis.property_size_sqm}㎡` : ''}
						{' · '}{itemCount}개 항목
					</p>
				</div>
				<div className="flex items-center gap-3">
					{analysis.total_score != null && (
						<div className="text-right">
							<div className="text-xs text-sand-600">종합점수</div>
							<div
								className={`text-2xl font-bold ${
									analysis.total_score >= 80 ? 'text-green-600' :
									analysis.total_score >= 60 ? 'text-amber-600' :
									'text-red-600'
								}`}
							>
								{analysis.total_score}
							</div>
						</div>
					)}
					<span
						className={`px-4 py-1.5 rounded-full text-xs font-semibold ${statusColors[analysis.status]}`}
					>
						{statusLabels[analysis.status]}
					</span>
				</div>
			</div>
		</div>
	)
}
