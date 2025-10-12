import React from 'react'
import { ThumbsUp, MessageCircle, Eye, MapPin, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import { DamageCase } from 'types/damageCase'

interface DamageCaseCardProps {
	damageCase: DamageCase
	onClick: () => void
}

const DamageCaseCard: React.FC<DamageCaseCardProps> = ({ damageCase, onClick }) => {
	const getResolutionBadge = (status: string) => {
		const badges: Record<string, { icon: any; color: string; text: string }> = {
			unresolved: { icon: XCircle, color: 'bg-red-100 text-red-700', text: '미해결' },
			in_progress: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', text: '진행중' },
			resolved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: '해결됨' }
		}

		const badge = badges[status] || badges.unresolved
		const Icon = badge.icon

		return (
			<span className={`px-3 py-1 ${badge.color} rounded-full text-xs font-medium flex items-center gap-1`}>
				<Icon size={14} />
				{badge.text}
			</span>
		)
	}

	const getDamageTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			사기: 'bg-red-500/20 text-red-400 border-red-500/40',
			부실시공: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
			계약위반: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
			추가비용: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
			기타: 'bg-gray-500/20 text-gray-400 border-gray-500/40'
		}
		return colors[type] || colors.기타
	}

	return (
		<div
			onClick={onClick}
			className='glass-neon rounded-2xl p-6 border-l-4 border-red-500 hover:border-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all cursor-pointer'
		>
			{/* Header */}
			<div className='flex items-start justify-between mb-4'>
				<div className='flex-1'>
					<div className='flex items-center gap-3 mb-2'>
						<h3 className='text-xl font-bold text-white'>{damageCase.title}</h3>
						{getResolutionBadge(damageCase.resolution_status)}
						{damageCase.legal_action && (
							<span className='px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-semibold rounded-full'>
								법적 조치
							</span>
						)}
					</div>
					<div className='flex items-center gap-4 text-sm text-gray-400'>
						{damageCase.company_name && (
							<>
								<span className='font-semibold text-red-400'>{damageCase.company_name}</span>
								<span className='text-gray-600'>|</span>
							</>
						)}
						{damageCase.region && (
							<div className='flex items-center gap-1'>
								<MapPin size={14} className='text-red-400' />
								<span className='text-gray-300'>{damageCase.region}</span>
							</div>
						)}
						<span className='text-gray-600'>|</span>
						<span>{damageCase.author_name}</span>
						<span className='text-gray-600'>|</span>
						<span>{new Date(damageCase.created_at).toLocaleDateString()}</span>
					</div>
				</div>
			</div>

			{/* Damage Info */}
			<div className='flex items-center gap-3 mb-4'>
				<span className={`px-3 py-1 ${getDamageTypeColor(damageCase.damage_type)} border rounded-full text-sm font-semibold`}>
					{damageCase.damage_type}
				</span>
				{damageCase.damage_amount && (
					<div className='flex items-center gap-1 text-red-400 font-bold'>
						<DollarSign size={16} />
						<span>피해금액: {damageCase.damage_amount.toLocaleString()}만원</span>
					</div>
				)}
			</div>

			{/* Content Preview */}
			<p className='text-gray-300 mb-4 line-clamp-2 leading-relaxed'>{damageCase.content}</p>

			{/* Stats */}
			<div className='flex items-center gap-6 text-sm text-gray-400 pt-4 border-t border-gray-700/50'>
				<div className='flex items-center gap-1'>
					<Eye size={16} className='text-red-400' />
					<span>{damageCase.view_count}</span>
				</div>
				<div className='flex items-center gap-1'>
					<ThumbsUp size={16} className='text-red-400' />
					<span>{damageCase.like_count}</span>
				</div>
				<div className='flex items-center gap-1'>
					<MessageCircle size={16} className='text-red-400' />
					<span>{damageCase.comment_count}</span>
				</div>
			</div>
		</div>
	)
}

export default DamageCaseCard
