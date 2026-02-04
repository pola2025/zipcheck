import React from 'react'
import { Eye, MapPin, DollarSign, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'
import { DamageCase } from 'types/damageCase'

interface DamageCaseCardProps {
	damageCase: DamageCase
	onClick: () => void
}

const DamageCaseCard: React.FC<DamageCaseCardProps> = ({ damageCase, onClick }) => {
	const getResolutionBadge = (status: string) => {
		const badges: Record<string, { icon: any; color: string; text: string }> = {
			unresolved: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200', text: '미해결' },
			in_progress: { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', text: '진행중' },
			resolved: { icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200', text: '해결됨' }
		}

		const badge = badges[status] || badges.unresolved
		const Icon = badge.icon

		return (
			<span className={`px-2.5 py-0.5 ${badge.color} border rounded-full text-xs font-medium flex items-center gap-1`}>
				<Icon size={12} />
				{badge.text}
			</span>
		)
	}

	const getDamageTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			사기: 'bg-red-50 text-red-700 border-red-200',
			부실시공: 'bg-orange-50 text-orange-700 border-orange-200',
			계약위반: 'bg-amber-50 text-amber-700 border-amber-200',
			추가비용: 'bg-blue-50 text-blue-700 border-blue-200',
			기타: 'bg-sand-100 text-sand-700 border-sand-200'
		}
		return colors[type] || colors['기타']
	}

	return (
		<article
			onClick={onClick}
			className='bg-white rounded-2xl p-6 border-l-4 border-l-red-400 border border-sand-200 hover:border-red-200 hover:shadow-md transition-all cursor-pointer group'
		>
			{/* Header */}
			<div className='flex items-start justify-between mb-3'>
				<div className='flex-1 min-w-0'>
					<div className='flex flex-wrap items-center gap-2 mb-1.5'>
						<h3 className='text-lg font-bold text-sand-900 truncate group-hover:text-red-600 transition-colors'>
							{damageCase.title}
						</h3>
						{getResolutionBadge(damageCase.resolution_status)}
						{damageCase.legal_action && (
							<span className='px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium rounded-full'>
								법적 조치
							</span>
						)}
					</div>
					<div className='flex flex-wrap items-center gap-3 text-sm text-sand-500'>
						{damageCase.company_name && (
							<span className='font-semibold text-red-500'>{damageCase.company_name}</span>
						)}
						{damageCase.region && (
							<div className='flex items-center gap-1'>
								<MapPin size={14} className='text-sand-400' />
								<span>{damageCase.region}</span>
							</div>
						)}
						<span className='text-sand-300'>|</span>
						<span>{new Date(damageCase.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
					</div>
				</div>
			</div>

			{/* Damage Info */}
			<div className='flex flex-wrap items-center gap-3 mb-3'>
				<span className={`px-3 py-1 ${getDamageTypeColor(damageCase.damage_type)} border rounded-full text-xs font-semibold`}>
					{damageCase.damage_type}
				</span>
				{damageCase.damage_amount && (
					<div className='flex items-center gap-1 text-red-500 text-sm font-bold'>
						<DollarSign size={14} />
						<span>피해금액: {damageCase.damage_amount.toLocaleString()}만원</span>
					</div>
				)}
			</div>

			{/* Content Preview */}
			<p className='text-sand-600 mb-4 line-clamp-2 leading-relaxed text-sm'>{damageCase.content}</p>

			{/* Footer */}
			<div className='flex items-center justify-between pt-3 border-t border-sand-100'>
				<div className='flex items-center gap-4 text-xs text-sand-400'>
					<div className='flex items-center gap-1'>
						<Eye size={14} />
						<span>{damageCase.view_count || 0}</span>
					</div>
				</div>
				<span className='text-xs text-red-500 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
					자세히 보기 <ArrowRight size={14} />
				</span>
			</div>
		</article>
	)
}

export default DamageCaseCard
