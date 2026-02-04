import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Calendar, Eye, ShieldAlert, Image as ImageIcon, X } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import { getApiUrl } from '../../lib/api-config'

interface DamageCase {
	id: string
	title: string
	description: string
	images: string | string[] | null
	category?: string
	severity?: string
	status: string
	view_count?: number
	created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
	open: { label: '미해결', className: 'text-red-600 bg-red-50 border-red-200' },
	pending: { label: '심사중', className: 'text-amber-600 bg-amber-50 border-amber-200' },
	in_progress: { label: '진행중', className: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
	resolved: { label: '해결됨', className: 'text-green-600 bg-green-50 border-green-200' },
	closed: { label: '종결', className: 'text-gray-600 bg-gray-50 border-gray-200' },
}

const CATEGORY_COLORS: Record<string, string> = {
	'시공불량': 'text-red-600 bg-red-50 border-red-200',
	'시공 불량': 'text-red-600 bg-red-50 border-red-200',
	'계약위반': 'text-orange-600 bg-orange-50 border-orange-200',
	'계약 위반': 'text-orange-600 bg-orange-50 border-orange-200',
	'금전사기': 'text-pink-600 bg-pink-50 border-pink-200',
	'금전 사기': 'text-pink-600 bg-pink-50 border-pink-200',
	'자재불량': 'text-amber-600 bg-amber-50 border-amber-200',
	'자재 불량': 'text-amber-600 bg-amber-50 border-amber-200',
	'공사지연': 'text-blue-600 bg-blue-50 border-blue-200',
	'공사 지연': 'text-blue-600 bg-blue-50 border-blue-200',
	'사후서비스불이행': 'text-purple-600 bg-purple-50 border-purple-200',
	'사후 서비스 불이행': 'text-purple-600 bg-purple-50 border-purple-200',
	'기타': 'text-sand-600 bg-sand-100 border-sand-200'
}

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
	low: { label: '경미', className: 'text-green-600 bg-green-50 border-green-200' },
	medium: { label: '보통', className: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
	high: { label: '심각', className: 'text-orange-600 bg-orange-50 border-orange-200' },
	critical: { label: '매우 심각', className: 'text-red-600 bg-red-50 border-red-200' },
}

function parseImageField(field: string | string[] | null): string[] {
	if (!field) return []
	if (Array.isArray(field)) return field
	try {
		const parsed = JSON.parse(field)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		if (typeof field === 'string' && field.trim()) return [field]
		return []
	}
}

function resolveImageUrl(src: string): string {
	if (src.startsWith('http://') || src.startsWith('https://')) return src
	return getApiUrl('/images/') + src
}

export default function DamageCaseDetail() {
	const navigate = useNavigate()
	const { id } = useParams<{ id: string }>()
	const [damageCase, setDamageCase] = useState<DamageCase | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selectedImage, setSelectedImage] = useState<string | null>(null)

	useEffect(() => {
		loadDamageCase()
	}, [id])

	const loadDamageCase = async () => {
		try {
			setLoading(true)
			const response = await fetch(getApiUrl(`/api/damage-cases/${id}`))
			if (!response.ok) throw new Error('피해사례를 불러올 수 없습니다.')
			const data = await response.json()
			setDamageCase(data)
			setLoading(false)
		} catch (err) {
			console.error('Failed to load damage case:', err)
			setError(err instanceof Error ? err.message : '피해사례를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-sand-50 flex items-center justify-center">
				<NordicNavigation />
				<div className="flex flex-col items-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-3 border-forest-500" />
					<p className="mt-4 text-sand-500">피해사례를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	if (error || !damageCase) {
		return (
			<div className="min-h-screen bg-sand-50">
				<NordicNavigation />
				<div className="pt-32 pb-20 px-5 md:px-8">
					<div className="max-w-3xl mx-auto">
						<div className="nordic-card rounded-2xl p-10 text-center border border-red-200 bg-red-50/50">
							<p className="text-lg text-red-600 mb-6">{error || '피해사례를 찾을 수 없습니다.'}</p>
							<button
								onClick={() => navigate('/community?tab=damage-cases')}
								className="px-8 py-3 bg-forest-600 text-white hover:bg-forest-700 rounded-xl font-semibold transition-all shadow-lg shadow-forest-600/15"
							>
								커뮤니티로 돌아가기
							</button>
						</div>
					</div>
				</div>
				<NordicFooter />
			</div>
		)
	}

	const images = parseImageField(damageCase.images)
	const statusInfo = STATUS_CONFIG[damageCase.status] || STATUS_CONFIG.open
	const categoryInfo = damageCase.category ? (CATEGORY_COLORS[damageCase.category] || CATEGORY_COLORS['기타']) : null
	const severityInfo = damageCase.severity ? SEVERITY_CONFIG[damageCase.severity] : null

	return (
		<div className="min-h-screen bg-sand-50">
			<NordicNavigation />

			<div className="pt-28 pb-20 px-5 md:px-8">
				<div className="max-w-4xl mx-auto">
					{/* Back */}
					<button
						onClick={() => navigate('/community?tab=damage-cases')}
						className="flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-8 transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						커뮤니티로 돌아가기
					</button>

					{/* Damage Case Content */}
					<div className="nordic-card rounded-2xl p-6 md:p-10 mb-6">
						{/* Header */}
						<div className="flex items-start justify-between mb-6 pb-6 border-b border-sand-200">
							<div className="flex items-start gap-4">
								<div className="p-3 bg-red-50 rounded-xl">
									<AlertTriangle className="w-7 h-7 text-red-500" />
								</div>
								<div>
									<div className="flex items-center gap-2 mb-2 flex-wrap">
										{categoryInfo && damageCase.category && (
											<span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryInfo}`}>
												{damageCase.category}
											</span>
										)}
										{severityInfo && (
											<span className={`px-3 py-1 rounded-full text-xs font-bold border ${severityInfo.className}`}>
												<ShieldAlert className="w-3 h-3 inline mr-1" />
												{severityInfo.label}
											</span>
										)}
										<span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.className}`}>
											{statusInfo.label}
										</span>
									</div>
									<h1 className="text-2xl md:text-3xl font-bold text-sand-900">
										{damageCase.title}
									</h1>
								</div>
							</div>
						</div>

						{/* Case Description */}
						<div className="mb-6">
							<h2 className="text-lg font-bold text-sand-900 mb-3 flex items-center gap-2">
								<AlertTriangle className="w-5 h-5 text-red-500" />
								피해 내용
							</h2>
							<div className="bg-sand-50 rounded-xl p-5 border border-sand-200">
								<p className="text-sand-700 leading-relaxed whitespace-pre-wrap">
									{damageCase.description}
								</p>
							</div>
						</div>

						{/* Evidence Images */}
						{images.length > 0 && (
							<div className="mb-6">
								<h2 className="text-lg font-bold text-sand-900 mb-3 flex items-center gap-2">
									<ImageIcon className="w-5 h-5 text-forest-500" />
									증거 사진
								</h2>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{images.map((url, index) => (
										<div
											key={index}
											className="cursor-pointer hover:opacity-90 transition-opacity"
											onClick={() => setSelectedImage(resolveImageUrl(url))}
										>
											<img
												src={resolveImageUrl(url)}
												alt={`증거 ${index + 1}`}
												className="w-full h-44 object-cover rounded-xl border border-sand-200 hover:border-forest-500 transition-colors"
											/>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Metadata */}
						<div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-sand-200">
							<div className="flex items-center gap-3 text-sand-600">
								<Calendar className="w-5 h-5 text-forest-500" />
								<div>
									<p className="text-xs text-sand-400">등록일</p>
									<p className="font-medium">{new Date(damageCase.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
								</div>
							</div>
							<div className="flex items-center gap-3 text-sand-600">
								<Eye className="w-5 h-5 text-forest-500" />
								<div>
									<p className="text-xs text-sand-400">조회수</p>
									<p className="font-medium">{damageCase.view_count || 0}회</p>
								</div>
							</div>
						</div>
					</div>

					{/* Warning Notice */}
					<div className="nordic-card rounded-2xl p-5 border border-amber-200 bg-amber-50/50">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-amber-700 font-semibold text-sm mb-1.5">주의사항</p>
								<p className="text-xs text-sand-600 leading-relaxed">
									본 피해사례는 제보자의 주관적 경험을 바탕으로 작성되었습니다.
									해당 업체에 대한 계약이나 거래 시 신중한 판단이 필요하며,
									추가 확인 및 검증을 권장합니다. 법적 분쟁이 있는 경우 전문가의 도움을 받으시기 바랍니다.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Image Modal */}
			{selectedImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
					onClick={() => setSelectedImage(null)}
				>
					<img
						src={selectedImage}
						alt="증거 사진 상세"
						className="max-w-full max-h-full object-contain rounded-xl"
					/>
					<button
						onClick={() => setSelectedImage(null)}
						className="absolute top-6 right-6 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
						aria-label="닫기"
					>
						<X className="w-6 h-6" />
					</button>
				</div>
			)}

			<NordicFooter />
		</div>
	)
}
