import React from 'react'
import { Eye, CheckCircle, Clock, XCircle, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react'
import { DamageCase } from 'types/damageCase'
import { getApiUrl } from '../../lib/api-config'

interface DamageCaseCardProps {
	damageCase: DamageCase
	onClick: () => void
}

function parseImageField(field: string | string[] | null): string[] {
	if (!field) return []
	if (Array.isArray(field)) return field
	try {
		const parsed = JSON.parse(field)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

function resolveImageUrl(src: string): string {
	if (src.startsWith('http://') || src.startsWith('https://')) return src
	return getApiUrl('/images/') + src
}

const statusConfig: Record<string, { icon: any; label: string; bg: string }> = {
	open: { icon: XCircle, label: '미해결', bg: 'bg-red-500' },
	in_progress: { icon: Clock, label: '진행중', bg: 'bg-amber-500' },
	resolved: { icon: CheckCircle, label: '해결됨', bg: 'bg-green-500' },
	closed: { icon: CheckCircle, label: '종결', bg: 'bg-gray-500' },
}

const severityConfig: Record<string, { label: string; color: string }> = {
	critical: { label: '심각', color: 'bg-red-600' },
	high: { label: '높음', color: 'bg-orange-500' },
	medium: { label: '보통', color: 'bg-amber-500' },
	low: { label: '낮음', color: 'bg-gray-400' },
}

const DamageCaseCard: React.FC<DamageCaseCardProps> = ({ damageCase, onClick }) => {
	const images = parseImageField(damageCase.images)
	const statusInfo = statusConfig[damageCase.status] || statusConfig.open
	const StatusIcon = statusInfo.icon
	const severityInfo = damageCase.severity ? severityConfig[damageCase.severity] : null

	return (
		<article
			onClick={onClick}
			className='bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-red-400 transition-all cursor-pointer group'
		>
			{/* Thumbnail */}
			<div className='relative aspect-[4/3] bg-red-50 overflow-hidden'>
				{images.length > 0 ? (
					<img
						src={resolveImageUrl(images[0])}
						alt={damageCase.title}
						className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
					/>
				) : (
					<div className='w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-300 gap-1.5'>
						<AlertTriangle size={28} strokeWidth={1.5} />
						<span className='text-[11px] font-medium'>증거사진 없음</span>
					</div>
				)}

				{/* Status badge */}
				<div className={`absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 ${statusInfo.bg} rounded-lg shadow-md`}>
					<StatusIcon size={11} className='text-white' />
					<span className='text-white text-[10px] font-bold'>{statusInfo.label}</span>
				</div>

				{/* Category badge */}
				{damageCase.category && (
					<div className='absolute bottom-2 left-2 px-2.5 py-1 bg-gray-900/80 rounded-lg shadow-md'>
						<span className='text-white text-xs font-bold'>{damageCase.category}</span>
					</div>
				)}

				{/* Severity badge */}
				{severityInfo && (
					<div className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 ${severityInfo.color} rounded-lg shadow-md`}>
						<ShieldAlert size={11} className='text-white' />
						<span className='text-white text-[10px] font-bold'>{severityInfo.label}</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className='p-4'>
				{/* Title */}
				<h3 className='text-base font-extrabold text-gray-900 truncate mb-2.5 group-hover:text-red-600 transition-colors'>
					{damageCase.title}
				</h3>

				{/* Content preview */}
				<p className='text-sm text-gray-700 line-clamp-2 leading-relaxed mb-3'>
					{damageCase.description}
				</p>

				{/* Footer */}
				<div className='flex items-center justify-between pt-3 border-t border-gray-100'>
					<div className='flex items-center gap-3 text-xs text-gray-500'>
						<span className='inline-flex items-center gap-1'>
							<Eye size={12} />
							{damageCase.view_count || 0}
						</span>
						<span>
							{new Date(damageCase.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
						</span>
					</div>
					<span className='text-xs text-red-500 font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
						자세히 <ArrowRight size={12} />
					</span>
				</div>
			</div>
		</article>
	)
}

export default DamageCaseCard
