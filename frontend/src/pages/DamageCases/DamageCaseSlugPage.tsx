import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { AlertTriangle, Building, Phone, Calendar, Eye, ThumbsUp, ArrowLeft, Share2, Banknote, Scale, MapPin, ShieldAlert, Flag, Info } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import BeforeAfterGallery from 'components/community/BeforeAfterGallery'
import Comments from 'components/community/Comments'
import LikeButton from 'components/community/LikeButton'
import ReportModal from 'components/community/ReportModal'
import { getApiUrl } from '../../lib/api-config'

const BASE_URL = 'https://zcheck.co.kr'
const IMAGE_BASE_URL = getApiUrl('/images/')

interface DamageCaseData {
	id: string
	slug: string
	user_id: string
	author_name: string
	company_name: string
	company_phone: string | null
	business_number: string | null
	damage_type: string
	region: string | null
	damage_amount: string | null
	severity: string | null
	title: string
	case_description: string
	images: string | null
	evidence_images: string[] | null
	resolution_status: string
	legal_action: boolean
	status: string
	view_count: number
	like_count: number
	comment_count: number
	created_at: string
	updated_at: string
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
	low: { label: '경미', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
	medium: { label: '보통', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
	high: { label: '심각', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
	critical: { label: '매우 심각', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

const DAMAGE_TYPE_COLORS: Record<string, string> = {
	'시공불량': 'bg-orange-50 text-orange-700',
	'시공 불량': 'bg-orange-50 text-orange-700',
	'계약위반': 'bg-red-50 text-red-700',
	'계약 위반': 'bg-red-50 text-red-700',
	'금전사기': 'bg-purple-50 text-purple-700',
	'금전 사기': 'bg-purple-50 text-purple-700',
	'자재불량': 'bg-yellow-50 text-yellow-700',
	'자재 불량': 'bg-yellow-50 text-yellow-700',
	'공사지연': 'bg-blue-50 text-blue-700',
	'공사 지연': 'bg-blue-50 text-blue-700',
	'사후서비스불이행': 'bg-pink-50 text-pink-700',
	'사후 서비스 불이행': 'bg-pink-50 text-pink-700',
}

export default function DamageCaseSlugPage() {
	const { slug } = useParams<{ slug: string }>()
	const navigate = useNavigate()
	const [damageCase, setDamageCase] = useState<DamageCaseData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [reportOpen, setReportOpen] = useState(false)

	useEffect(() => {
		if (slug) fetchDamageCase(slug)
	}, [slug])

	const fetchDamageCase = async (caseSlug: string) => {
		try {
			setLoading(true)
			const response = await fetch(getApiUrl(`/api/damage-cases/slug/${caseSlug}`))

			if (!response.ok) {
				if (response.status === 404) {
					setError('존재하지 않는 피해사례입니다.')
				} else {
					throw new Error('피해사례를 불러올 수 없습니다.')
				}
				return
			}

			const data = await response.json()
			setDamageCase(data)
		} catch (err) {
			console.error('Failed to fetch damage case:', err)
			setError('피해사례를 불러오는 중 오류가 발생했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const handleShare = async () => {
		const url = `${BASE_URL}/damage-cases/${slug}`
		if (navigator.share) {
			try {
				await navigator.share({ title: damageCase?.title || `${damageCase?.company_name} 피해사례`, url })
			} catch { /* user cancelled */ }
		} else {
			await navigator.clipboard.writeText(url)
			alert('링크가 복사되었습니다.')
		}
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'resolved': return { label: '해결됨', className: 'bg-green-50 text-green-700 border-green-200' }
			case 'in_progress': return { label: '진행중', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
			default: return { label: '미해결', className: 'bg-red-50 text-red-700 border-red-200' }
		}
	}

	const getDamageTypeBadge = (type: string) => {
		return DAMAGE_TYPE_COLORS[type] || 'bg-sand-100 text-sand-700'
	}

	const getSeverityBadge = (sev: string | null) => {
		if (!sev) return null
		return SEVERITY_CONFIG[sev] || null
	}

	// Parse images from JSON string or use evidence_images array
	const parseImages = (): string[] => {
		if (!damageCase) return []

		// Try evidence_images array first
		if (damageCase.evidence_images && Array.isArray(damageCase.evidence_images) && damageCase.evidence_images.length > 0) {
			return damageCase.evidence_images
		}

		// Fall back to parsing images JSON string
		if (damageCase.images) {
			try {
				const parsed = JSON.parse(damageCase.images)
				if (Array.isArray(parsed)) return parsed
			} catch {
				// If not valid JSON, treat as single image filename
				if (damageCase.images.trim()) return [damageCase.images]
			}
		}

		return []
	}

	// JSON-LD structured data
	const jsonLd = damageCase ? {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: damageCase.title || `${damageCase.company_name} 피해사례`,
		description: damageCase.case_description.substring(0, 200),
		author: {
			'@type': 'Person',
			name: damageCase.author_name || '익명'
		},
		datePublished: damageCase.created_at,
		dateModified: damageCase.updated_at,
		publisher: {
			'@type': 'Organization',
			name: '집첵',
			url: BASE_URL
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': `${BASE_URL}/damage-cases/${slug}`
		},
		...(parseImages().length > 0 && {
			image: parseImages().map(img =>
				img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`
			)
		})
	} : null

	const pageTitle = damageCase
		? `${damageCase.title || damageCase.company_name} | 피해사례 | 집첵`
		: '피해사례 | 집첵'

	const pageDescription = damageCase
		? damageCase.case_description.substring(0, 160)
		: '인테리어 피해사례를 확인하세요.'

	const ogImageUrl = (() => {
		const images = parseImages()
		if (images.length > 0) {
			const first = images[0]
			return first.startsWith('http') ? first : `${IMAGE_BASE_URL}${first}`
		}
		return `${BASE_URL}/logo.png`
	})()

	// Loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-sand-50">
				<NordicNavigation />
				<div className="flex justify-center items-center min-h-[60vh]">
					<div className="w-8 h-8 border-2 border-sand-300 border-t-forest-500 rounded-full animate-spin" />
				</div>
				<NordicFooter />
			</div>
		)
	}

	// Error / 404 state
	if (error || !damageCase) {
		return (
			<div className="min-h-screen bg-sand-50">
				<Helmet>
					<title>피해사례를 찾을 수 없습니다 | 집첵</title>
					<meta name="robots" content="noindex" />
				</Helmet>
				<NordicNavigation />
				<div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
					<div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
						<AlertTriangle className="w-8 h-8 text-red-500" />
					</div>
					<h1 className="font-outfit text-2xl font-bold text-sand-900 mb-3">
						{error || '피해사례를 찾을 수 없습니다'}
					</h1>
					<p className="text-sand-600 mb-6">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
					<Link to="/community?tab=damage-cases" className="text-forest-600 hover:text-forest-700 font-medium transition-colors">
						커뮤니티로 돌아가기
					</Link>
				</div>
				<NordicFooter />
			</div>
		)
	}

	const statusBadge = getStatusBadge(damageCase.resolution_status)
	const severityBadge = getSeverityBadge(damageCase.severity)
	const evidenceImages = parseImages()

	return (
		<div className="min-h-screen bg-sand-50">
			{/* SEO */}
			<Helmet>
				<title>{pageTitle}</title>
				<meta name="description" content={pageDescription} />
				<link rel="canonical" href={`${BASE_URL}/damage-cases/${slug}`} />
				<meta property="og:type" content="article" />
				<meta property="og:title" content={pageTitle} />
				<meta property="og:description" content={pageDescription} />
				<meta property="og:url" content={`${BASE_URL}/damage-cases/${slug}`} />
				<meta property="og:image" content={ogImageUrl} />
				<meta property="og:site_name" content="집첵" />
				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:title" content={pageTitle} />
				<meta property="twitter:description" content={pageDescription} />
				<meta property="twitter:image" content={ogImageUrl} />
				{jsonLd && (
					<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
				)}
			</Helmet>

			<NordicNavigation />

			{/* Warning Banner */}
			<div className="bg-amber-50 border-b border-amber-200">
				<div className="max-w-3xl mx-auto px-5 md:px-8 py-3 flex items-start gap-2.5">
					<Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
					<p className="text-xs text-amber-700 leading-relaxed">
						본 게시물은 작성자의 주장이며, 집첵은 사실 여부를 보증하지 않습니다.
					</p>
				</div>
			</div>

			{/* Hero Header */}
			<div className="pt-20 pb-8 md:pt-28 md:pb-12 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-3xl mx-auto px-5 md:px-8">
					<button
						onClick={() => navigate('/community?tab=damage-cases')}
						className="flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						전체 피해사례 목록
					</button>

					<div className="flex items-center justify-center gap-3 mb-5">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">Damage Case</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>

					{/* Badges */}
					<div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
						<span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDamageTypeBadge(damageCase.damage_type)}`}>
							{damageCase.damage_type}
						</span>
						{severityBadge && (
							<span className={`px-3 py-1 text-xs font-semibold rounded-full border ${severityBadge.bg} ${severityBadge.color} ${severityBadge.border}`}>
								{severityBadge.label}
							</span>
						)}
						<span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusBadge.className}`}>
							{statusBadge.label}
						</span>
						{damageCase.legal_action && (
							<span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
								<Scale className="w-3 h-3" />
								법적 조치
							</span>
						)}
					</div>

					{/* Title */}
					<h1 className="font-outfit text-2xl md:text-4xl font-bold text-sand-900 tracking-tight text-center mb-3">
						{damageCase.title || damageCase.company_name}
					</h1>

					{/* Meta info */}
					<div className="flex items-center justify-center gap-4 text-sm text-sand-500 flex-wrap">
						<span className="flex items-center gap-1">
							<Calendar className="w-3.5 h-3.5" />
							{new Date(damageCase.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
						</span>
						<span className="flex items-center gap-1">
							<Eye className="w-3.5 h-3.5" />
							{damageCase.view_count}
						</span>
						<span className="flex items-center gap-1">
							<ThumbsUp className="w-3.5 h-3.5" />
							{damageCase.like_count}
						</span>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
				<article className="nordic-card rounded-2xl p-6 md:p-10 mb-8">
					{/* Company Info Card */}
					<div className="bg-sand-50 rounded-xl p-5 mb-8 border border-sand-100">
						<h3 className="text-xs font-bold text-sand-500 uppercase tracking-wider mb-3">업체 정보</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="flex items-center gap-2 text-sm text-sand-700">
								<Building className="w-4 h-4 text-forest-500 shrink-0" />
								<span className="font-semibold">{damageCase.company_name}</span>
							</div>
							{damageCase.company_phone && (
								<div className="flex items-center gap-2 text-sm text-sand-600">
									<Phone className="w-4 h-4 text-forest-500 shrink-0" />
									<span>{damageCase.company_phone}</span>
								</div>
							)}
							{damageCase.region && (
								<div className="flex items-center gap-2 text-sm text-sand-600">
									<MapPin className="w-4 h-4 text-forest-500 shrink-0" />
									<span>{damageCase.region}</span>
								</div>
							)}
							{damageCase.damage_amount && (
								<div className="flex items-center gap-2 text-sm text-sand-600">
									<Banknote className="w-4 h-4 text-forest-500 shrink-0" />
									<span>피해금액: {damageCase.damage_amount}{!isNaN(Number(damageCase.damage_amount)) ? '만원' : ''}</span>
								</div>
							)}
							<div className="flex items-center gap-2 text-sm text-sand-600">
								<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
								<span>{damageCase.damage_type}</span>
							</div>
							{severityBadge && (
								<div className="flex items-center gap-2 text-sm text-sand-600">
									<ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
									<span>심각도: {severityBadge.label}</span>
								</div>
							)}
						</div>
					</div>

					{/* Case Description */}
					<div className="prose prose-sand max-w-none mb-8">
						<p className="text-sand-800 leading-relaxed whitespace-pre-wrap text-base">
							{damageCase.case_description}
						</p>
					</div>

					{/* Evidence Images Gallery */}
					{evidenceImages.length > 0 && (
						<div className="mb-8">
							<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider mb-3">증거 사진</h3>
							<BeforeAfterGallery beforeImages={evidenceImages} imageBaseUrl={IMAGE_BASE_URL} />
						</div>
					)}

					{/* Resolution & Legal Info */}
					<div className="flex flex-wrap items-center gap-3 mb-6 pt-4 border-t border-sand-100">
						<div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusBadge.className}`}>
							{statusBadge.label}
						</div>
						{damageCase.legal_action && (
							<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
								<Scale className="w-3 h-3" />
								법적 조치 진행 중
							</div>
						)}
						{damageCase.damage_amount && (
							<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-100 text-sand-700 text-xs font-semibold">
								<Banknote className="w-3 h-3" />
								{damageCase.damage_amount}{!isNaN(Number(damageCase.damage_amount)) ? '만원' : ''}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center justify-between pt-6 border-t border-sand-100">
						<div className="flex items-center gap-3">
							<LikeButton
								targetType="damage_case"
								targetId={damageCase.id}
								initialLikeCount={damageCase.like_count}
								size="md"
							/>
							<button
								onClick={() => setReportOpen(true)}
								className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
								aria-label="게시물 신고"
							>
								<Flag className="w-4 h-4" />
								신고
							</button>
						</div>
						<button
							onClick={handleShare}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sand-100 text-sand-600 hover:bg-sand-200 transition-all text-sm"
						>
							<Share2 className="w-4 h-4" />
							공유
						</button>
					</div>
				</article>

				{/* Back to community */}
				<div className="mb-8 text-center">
					<Link
						to="/community?tab=damage-cases"
						className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 font-medium text-sm transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						커뮤니티로 돌아가기
					</Link>
				</div>

				{/* Comments */}
				<Comments targetType="damage_case" targetId={damageCase.id} />
			</div>

			<NordicFooter />

			{/* Report Modal */}
			<ReportModal
				isOpen={reportOpen}
				onClose={() => setReportOpen(false)}
				targetType="damage_case"
				targetId={damageCase.id}
			/>
		</div>
	)
}
