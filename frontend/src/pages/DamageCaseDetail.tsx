import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import LikeButton from 'components/community/LikeButton'
import Comments from 'components/community/Comments'
import ReportModal from 'components/community/ReportModal'
import {
	AlertTriangle,
	MapPin,
	DollarSign,
	Calendar,
	FileText,
	Edit,
	Trash2,
	ArrowLeft,
	Eye,
	ThumbsUp,
	MessageCircle,
	CheckCircle,
	Clock,
	XCircle,
	Scale,
	Flag
} from 'lucide-react'

interface DamageCase {
	id: string
	user_id: string
	company_name: string
	region: string
	title: string
	content: string
	damage_type: string
	damage_amount: number
	resolution_status: string
	resolution_details: string
	legal_action: boolean
	legal_details: string
	images: string[]
	documents: string[]
	author_name: string
	view_count: number
	like_count: number
	comment_count: number
	created_at: string
	updated_at: string
}

const DamageCaseDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()

	const [damageCase, setDamageCase] = useState<DamageCase | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')
	const [showReportModal, setShowReportModal] = useState(false)

	const token = localStorage.getItem('auth_token')
	const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null

	useEffect(() => {
		loadDamageCase()
	}, [id])

	const loadDamageCase = async () => {
		try {
			setLoading(true)

			const response = await fetch(`http://localhost:3001/api/damage-cases/${id}`)

			if (!response.ok) {
				throw new Error('피해사례를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setDamageCase(data)
			setLoading(false)
		} catch (err) {
			console.error('Load damage case error:', err)
			setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!confirm('정말 삭제하시겠습니까?')) return

		try {
			const response = await fetch(`http://localhost:3001/api/damage-cases/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			})

			if (!response.ok) {
				throw new Error('피해사례 삭제에 실패했습니다.')
			}

			alert('피해사례가 삭제되었습니다.')
			navigate('/community/damage-cases')
		} catch (err) {
			console.error('Delete error:', err)
			alert('삭제 중 오류가 발생했습니다.')
		}
	}

	const getResolutionBadge = (status: string) => {
		const badges: Record<string, { icon: any; color: string; text: string }> = {
			unresolved: { icon: XCircle, color: 'bg-red-100 text-red-700', text: '미해결' },
			in_progress: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', text: '진행중' },
			resolved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: '해결됨' }
		}

		const badge = badges[status] || badges.unresolved
		const Icon = badge.icon

		return (
			<span
				className={`inline-flex items-center gap-1 px-4 py-2 ${badge.color} rounded-full text-sm font-medium`}
			>
				<Icon size={16} />
				{badge.text}
			</span>
		)
	}

	const getDamageTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			사기: 'bg-red-100 text-red-700',
			부실시공: 'bg-orange-100 text-orange-700',
			계약위반: 'bg-yellow-100 text-yellow-700',
			추가비용: 'bg-blue-100 text-blue-700',
			기타: 'bg-gray-100 text-gray-700'
		}
		return colors[type] || colors.기타
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-[#0A9DAA]'></div>
			</div>
		)
	}

	if (error || !damageCase) {
		return (
			<div className='min-h-screen bg-gray-50'>
				<ZipCheckHeader />
				<main className='container mx-auto px-4 py-12 mt-20'>
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
						{error || '피해사례를 찾을 수 없습니다.'}
					</div>
					<button
						onClick={() => navigate('/community/damage-cases')}
						className='mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
					>
						목록으로 돌아가기
					</button>
				</main>
				<ZipCheckFooter />
			</div>
		)
	}

	const isAuthor = currentUser && currentUser.id === damageCase.user_id

	return (
		<div className='min-h-screen bg-gray-50'>
			<ZipCheckHeader />

			<main className='container mx-auto px-4 py-12 mt-20'>
				{/* Back Button */}
				<button
					onClick={() => navigate('/community/damage-cases')}
					className='flex items-center gap-2 text-gray-600 hover:text-[#0A9DAA] mb-6 transition-colors'
				>
					<ArrowLeft size={20} />
					<span>목록으로 돌아가기</span>
				</button>

				{/* Alert Box */}
				<div className='bg-red-50 border-l-4 border-red-500 p-4 mb-6'>
					<div className='flex items-center gap-2'>
						<AlertTriangle className='text-red-600' size={24} />
						<p className='text-red-800 font-medium'>
							이 글은 사용자가 작성한 피해사례입니다. 내용의 진위 여부는 확인되지 않았습니다.
						</p>
					</div>
				</div>

				{/* Main Content */}
				<div className='bg-white rounded-lg shadow-sm p-8 mb-6 border-l-4 border-red-500'>
					{/* Header */}
					<div className='border-b border-gray-200 pb-6 mb-6'>
						<div className='flex items-start justify-between mb-4'>
							<div className='flex-1'>
								<div className='flex items-center gap-3 mb-3'>
									<h1 className='text-3xl font-bold text-gray-800'>{damageCase.title}</h1>
									{getResolutionBadge(damageCase.resolution_status)}
									{damageCase.legal_action && (
										<span className='inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full'>
											<Scale size={14} />
											법적 조치
										</span>
									)}
								</div>
								<div className='flex items-center gap-4 text-sm text-gray-600'>
									<span className='font-medium'>{damageCase.author_name}</span>
									<span className='text-gray-400'>|</span>
									<span>{new Date(damageCase.created_at).toLocaleString()}</span>
									{damageCase.updated_at !== damageCase.created_at && (
										<span className='text-xs text-gray-400'>(수정됨)</span>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className='flex items-center gap-2'>
								{isAuthor ? (
									<>
										<button
											onClick={() => navigate(`/community/damage-cases/${id}/edit`)}
											className='flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
										>
											<Edit size={16} />
											<span>수정</span>
										</button>
										<button
											onClick={handleDelete}
											className='flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
										>
											<Trash2 size={16} />
											<span>삭제</span>
										</button>
									</>
								) : (
									<button
										onClick={() => setShowReportModal(true)}
										className='flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
									>
										<Flag size={16} />
										<span>신고</span>
									</button>
								)}
							</div>
						</div>

						{/* Stats */}
						<div className='flex items-center gap-6 text-sm text-gray-500'>
							<div className='flex items-center gap-1'>
								<Eye size={16} />
								<span>{damageCase.view_count}</span>
							</div>
							<div className='flex items-center gap-1'>
								<ThumbsUp size={16} />
								<span>{damageCase.like_count}</span>
							</div>
							<div className='flex items-center gap-1'>
								<MessageCircle size={16} />
								<span>{damageCase.comment_count}</span>
							</div>
						</div>
					</div>

					{/* Damage Info */}
					<div className='bg-red-50 rounded-lg p-6 mb-6'>
						<h2 className='text-lg font-bold text-gray-800 mb-4'>피해 정보</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{damageCase.company_name && (
								<div>
									<div className='text-sm text-gray-600 mb-1'>업체명</div>
									<div className='text-red-600 font-semibold text-lg'>{damageCase.company_name}</div>
								</div>
							)}
							{damageCase.region && (
								<div>
									<div className='text-sm text-gray-600 mb-1'>지역</div>
									<div className='flex items-center gap-1 text-gray-800 font-medium'>
										<MapPin size={16} />
										<span>{damageCase.region}</span>
									</div>
								</div>
							)}
							<div>
								<div className='text-sm text-gray-600 mb-1'>피해 유형</div>
								<span className={`px-3 py-1 ${getDamageTypeColor(damageCase.damage_type)} rounded-full text-sm font-medium inline-block`}>
									{damageCase.damage_type}
								</span>
							</div>
							{damageCase.damage_amount > 0 && (
								<div>
									<div className='text-sm text-gray-600 mb-1'>피해 금액</div>
									<div className='flex items-center gap-1 text-red-600 font-bold text-lg'>
										<DollarSign size={18} />
										<span>{damageCase.damage_amount.toLocaleString()}만원</span>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Content */}
					<div className='mb-6'>
						<h2 className='text-lg font-bold text-gray-800 mb-4'>피해 내용</h2>
						<p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>{damageCase.content}</p>
					</div>

					{/* Images */}
					{damageCase.images && damageCase.images.length > 0 && (
						<div className='mb-6'>
							<h2 className='text-lg font-bold text-gray-800 mb-4'>증거 사진</h2>
							<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
								{damageCase.images.map((image, index) => (
									<img
										key={index}
										src={image}
										alt={`증거 사진 ${index + 1}`}
										className='w-full h-64 object-cover rounded-lg border border-gray-200'
									/>
								))}
							</div>
						</div>
					)}

					{/* Documents */}
					{damageCase.documents && damageCase.documents.length > 0 && (
						<div className='mb-6'>
							<h2 className='text-lg font-bold text-gray-800 mb-4'>관련 문서</h2>
							<div className='space-y-2'>
								{damageCase.documents.map((doc, index) => (
									<a
										key={index}
										href={doc}
										target='_blank'
										rel='noopener noreferrer'
										className='flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
									>
										<FileText size={20} className='text-gray-600' />
										<span className='text-gray-700'>문서 {index + 1}</span>
									</a>
								))}
							</div>
						</div>
					)}

					{/* Legal Action Details */}
					{damageCase.legal_action && damageCase.legal_details && (
						<div className='bg-purple-50 rounded-lg p-6 mb-6'>
							<h2 className='text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
								<Scale size={20} className='text-purple-600' />
								법적 조치 내용
							</h2>
							<p className='text-gray-700 whitespace-pre-wrap'>{damageCase.legal_details}</p>
						</div>
					)}

					{/* Resolution Details */}
					{damageCase.resolution_status !== 'unresolved' && damageCase.resolution_details && (
						<div
							className={`rounded-lg p-6 mb-6 ${
								damageCase.resolution_status === 'resolved'
									? 'bg-green-50'
									: 'bg-yellow-50'
							}`}
						>
							<h2 className='text-lg font-bold text-gray-800 mb-3'>해결 진행 상황</h2>
							<p className='text-gray-700 whitespace-pre-wrap'>{damageCase.resolution_details}</p>
						</div>
					)}

					{/* Like Button */}
					<div className='flex justify-center py-6 border-t border-gray-200'>
						<LikeButton
							targetType='damage_case'
							targetId={damageCase.id}
							initialLikeCount={damageCase.like_count}
							size='lg'
						/>
					</div>
				</div>

				{/* Comments Section */}
				<Comments targetType='damage_case' targetId={damageCase.id} />
			</main>

			<ZipCheckFooter />

			{/* Report Modal */}
			<ReportModal
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
				targetType='damage_case'
				targetId={damageCase.id}
			/>
		</div>
	)
}

export default DamageCaseDetail
