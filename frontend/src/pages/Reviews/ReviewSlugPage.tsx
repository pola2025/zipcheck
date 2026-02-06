import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
	Star,
	Building,
	Phone,
	MapPin,
	Ruler,
	Banknote,
	Calendar,
	Eye,
	ThumbsUp,
	ArrowLeft,
	Share2,
	ShieldCheck,
	Flag,
	CheckCircle2,
	Sparkles,
	MessageSquare,
	Wrench,
	Clock,
	BadgeCheck,
	ImageIcon
} from 'lucide-react'
import AutoNavigation from 'components/AutoNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import BeforeAfterGallery from 'components/community/BeforeAfterGallery'
import Comments from 'components/community/Comments'
import LikeButton from 'components/community/LikeButton'
import ReportModal from 'components/community/ReportModal'
import { getApiUrl } from '../../lib/api-config'
import { formatKoreanMoney } from '../../lib/pricing'
import { getSubdomain } from '../../lib/subdomain'

const BASE_URL = 'https://zcheck.co.kr'
const IMAGE_BASE_URL = getApiUrl('/images/')

interface ReviewData {
	id: string
	slug: string
	user_id: string
	author_name: string
	company_name: string
	company_phone: string | null
	business_number: string | null
	region: string | null
	project_type: string | null
	project_size: number | null
	project_cost: number | null
	rating: number
	quality_rating: number | null
	price_rating: number | null
	communication_rating: number | null
	schedule_rating: number | null
	review_text: string
	images: string | string[] | null
	before_images: string | string[] | null
	after_images: string | string[] | null
	verified: boolean
	is_recommended: boolean | null
	status: string
	view_count: number
	like_count: number
	created_at: string
	updated_at: string
}

interface RelatedReview {
	id: string
	slug: string
	company_name: string
	region: string | null
	project_type: string | null
	rating: number
	review_text: string
	created_at: string
}

/**
 * Safely parse an image field that may be a JSON string, an array, or null.
 */
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

/**
 * Mask a business number for privacy, showing only first 3 and last 2 digits.
 */
function maskBusinessNumber(bn: string): string {
	const cleaned = bn.replace(/-/g, '')
	if (cleaned.length >= 10) {
		return cleaned.slice(0, 3) + '-**-***' + cleaned.slice(-2)
	}
	if (cleaned.length >= 5) {
		return cleaned.slice(0, 3) + '****' + cleaned.slice(-2)
	}
	return '***-**-*****'
}

/**
 * Reusable star rating display component.
 */
function StarRatingDisplay({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
	const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
	const iconClass = sizeMap[size]

	return (
		<div className="flex items-center gap-0.5" aria-label={`별점 ${Number(rating).toFixed(1)}점`}>
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={`${iconClass} ${
						star <= Math.round(rating)
							? 'fill-amber-400 text-amber-400'
							: 'text-sand-300'
					}`}
				/>
			))}
		</div>
	)
}

export default function ReviewSlugPage() {
	const { slug } = useParams<{ slug: string }>()
	const navigate = useNavigate()
	const subdomain = getSubdomain()
	const reviewListPath = subdomain === 'review' ? '/reviews' : '/community?tab=reviews'
	const [review, setReview] = useState<ReviewData | null>(null)
	const [relatedReviews, setRelatedReviews] = useState<RelatedReview[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [reportModalOpen, setReportModalOpen] = useState(false)
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const [lightboxIndex, setLightboxIndex] = useState(0)

	useEffect(() => {
		if (slug) fetchReview(slug)
	}, [slug])

	// Parse image fields (need to declare before the effect that references them)
	const beforeImages = review ? parseImageField(review.before_images) : []
	const afterImages = review ? parseImageField(review.after_images) : []
	const generalImages = review ? parseImageField(review.images) : []
	const uniqueGeneralImages = generalImages.filter(
		(img) => !beforeImages.includes(img) && !afterImages.includes(img)
	)

	// Close lightbox on Escape / arrow keys
	useEffect(() => {
		if (!lightboxOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setLightboxOpen(false)
			if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex((i) => i - 1)
			if (e.key === 'ArrowRight' && lightboxIndex < uniqueGeneralImages.length - 1) setLightboxIndex((i) => i + 1)
		}

		document.addEventListener('keydown', handleKeyDown)
		document.body.style.overflow = 'hidden'

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [lightboxOpen, lightboxIndex, uniqueGeneralImages.length])

	const fetchReview = async (reviewSlug: string) => {
		try {
			setLoading(true)
			const response = await fetch(getApiUrl(`/api/company-reviews/slug/${reviewSlug}`))

			if (!response.ok) {
				if (response.status === 404) {
					setError('존재하지 않는 후기입니다.')
				} else {
					throw new Error('후기를 불러올 수 없습니다.')
				}
				return
			}

			const data = await response.json()

			// Only show published (approved) reviews
			if (data.status !== 'published') {
				setError('존재하지 않는 후기입니다.')
				return
			}

			setReview(data)
			fetchRelatedReviews(data.company_name, data.region, data.id)
		} catch (err) {
			console.error('Failed to fetch review:', err)
			setError('후기를 불러오는 중 오류가 발생했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const fetchRelatedReviews = async (companyName: string, region: string | null, currentId: string) => {
		try {
			const response = await fetch(
				getApiUrl('/api/company-reviews?limit=6&sort_by=created_at&order=desc')
			)
			if (!response.ok) return

			const result = await response.json()
			const reviews: RelatedReview[] = (result.data || [])
				.filter((r: RelatedReview) => r.id !== currentId)
				.sort((a: RelatedReview, b: RelatedReview) => {
					// Prioritize same company, then same region
					const aScore = (a.company_name === companyName ? 2 : 0) + (a.region === region ? 1 : 0)
					const bScore = (b.company_name === companyName ? 2 : 0) + (b.region === region ? 1 : 0)
					return bScore - aScore
				})
				.slice(0, 3)
			setRelatedReviews(reviews)
		} catch {
			// Non-critical fetch, silently fail
		}
	}

	const handleShare = async () => {
		const url = `${BASE_URL}/reviews/${slug}`
		if (navigator.share) {
			try {
				await navigator.share({ title: `${review?.company_name} 후기`, url })
			} catch { /* user cancelled */ }
		} else {
			await navigator.clipboard.writeText(url)
			alert('링크가 복사되었습니다.')
		}
	}

	const hasBeforeAfter = beforeImages.length > 0 || afterImages.length > 0

	// Dynamic OG image via serverless function
	const ogImageUrl = `${BASE_URL}/api/og/reviews/${slug}`

	// SEO meta
	const metaDescription = review
		? review.review_text.substring(0, 160).replace(/\n/g, ' ')
		: ''
	const seoTitle = review
		? `${review.company_name} ${review.project_type || '시공'} 후기 | 집첵`
		: '후기 | 집첵'

	// JSON-LD structured data
	const jsonLd = review ? [
		{
			'@context': 'https://schema.org',
			'@type': 'Review',
			itemReviewed: {
				'@type': 'LocalBusiness',
				name: review.company_name,
				...(review.region && {
					address: {
						'@type': 'PostalAddress',
						addressLocality: review.region
					}
				})
			},
			reviewRating: {
				'@type': 'Rating',
				ratingValue: String(review.rating),
				bestRating: '5'
			},
			author: {
				'@type': 'Person',
				name: review.author_name || '익명'
			},
			reviewBody: review.review_text,
			datePublished: review.created_at,
			...(review.updated_at && { dateModified: review.updated_at })
		},
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: '홈', item: BASE_URL },
				{ '@type': 'ListItem', position: 2, name: '업체 후기', item: `${BASE_URL}/reviews` },
				{ '@type': 'ListItem', position: 3, name: review.company_name }
			]
		}
	] : null

	// Sub-ratings (only render if data exists)
	const subRatings = review ? [
		{ label: '시공 품질', value: review.quality_rating, icon: Wrench },
		{ label: '가격 만족도', value: review.price_rating, icon: Banknote },
		{ label: '소통', value: review.communication_rating, icon: MessageSquare },
		{ label: '일정 준수', value: review.schedule_rating, icon: Clock }
	].filter((r) => r.value !== null && r.value !== undefined) : []

	// Resolve an image src to full URL
	const resolveImageUrl = (src: string) => {
		if (src.startsWith('http://') || src.startsWith('https://')) return src
		return `${IMAGE_BASE_URL}${src}`
	}

	// --- LOADING STATE ---
	if (loading) {
		return (
			<div className="min-h-screen bg-sand-50">
				<AutoNavigation />
				<div className="flex justify-center items-center min-h-[60vh]">
					<div className="w-8 h-8 border-2 border-sand-300 border-t-forest-500 rounded-full animate-spin" />
				</div>
				<NordicFooter />
			</div>
		)
	}

	// --- ERROR / NOT FOUND ---
	if (error || !review) {
		return (
			<div className="min-h-screen bg-sand-50">
				<AutoNavigation />
				<Helmet>
					<title>후기를 찾을 수 없습니다 | 집첵</title>
					<meta name="robots" content="noindex" />
				</Helmet>
				<div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
					<div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mb-4">
						<Building className="w-8 h-8 text-sand-400" />
					</div>
					<h1 className="font-outfit text-2xl font-bold text-sand-900 mb-3">
						{error || '후기를 찾을 수 없습니다'}
					</h1>
					<p className="text-sand-600 mb-6">
						요청하신 페이지가 존재하지 않거나 삭제되었습니다.
					</p>
					<Link
						to={reviewListPath}
						className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-500 text-white rounded-lg hover:bg-forest-600 transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						커뮤니티로 돌아가기
					</Link>
				</div>
				<NordicFooter />
			</div>
		)
	}

	// --- MAIN RENDER ---
	return (
		<div className="min-h-screen bg-sand-50">
			{/* ==================== SEO HEAD ==================== */}
			<Helmet>
				<title>{seoTitle}</title>
				<meta name="description" content={metaDescription} />
				<link rel="canonical" href={`${BASE_URL}/reviews/${slug}`} />

				{/* Open Graph */}
				<meta property="og:type" content="article" />
				<meta property="og:title" content={seoTitle} />
				<meta property="og:description" content={metaDescription} />
				<meta property="og:url" content={`${BASE_URL}/reviews/${slug}`} />
				<meta property="og:image" content={ogImageUrl} />
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />
				<meta property="og:site_name" content="집첵" />
				<meta property="og:locale" content="ko_KR" />

				{/* Twitter Card */}
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={seoTitle} />
				<meta name="twitter:description" content={metaDescription} />
				<meta name="twitter:image" content={ogImageUrl} />

				{/* JSON-LD Structured Data */}
				{jsonLd?.map((schema, i) => (
					<script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
				))}
			</Helmet>

			<AutoNavigation />

			{/* ==================== HERO SECTION ==================== */}
			<div className="pt-28 pb-8 md:pt-36 md:pb-12 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-3xl mx-auto px-5 md:px-8">
					{/* Back navigation */}
					<button
						onClick={() => navigate(reviewListPath)}
						className="flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition-colors text-sm font-medium"
						aria-label="전체 후기 목록으로 돌아가기"
					>
						<ArrowLeft className="w-4 h-4" />
						전체 후기 목록
					</button>

					{/* Section label */}
					<div className="flex items-center justify-center gap-3 mb-5">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">
							Review
						</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>

					{/* Recommendation badge */}
					{review.is_recommended && (
						<div className="flex justify-center mb-4">
							<span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0A9DAA]/10 text-[#0A9DAA] text-sm font-semibold rounded-full border border-[#0A9DAA]/20">
								<CheckCircle2 className="w-4 h-4" />
								추천 업체
							</span>
						</div>
					)}

					{/* Overall rating */}
					<div className="flex items-center justify-center gap-2 mb-4">
						<StarRatingDisplay rating={review.rating} size="lg" />
						<span className="text-lg font-bold text-sand-800">
							{Number(review.rating).toFixed(1)}
						</span>
					</div>

					{/* Company name heading */}
					<h1 className="font-outfit text-2xl md:text-4xl font-bold text-sand-900 tracking-tight text-center mb-3">
						{review.company_name}
					</h1>

					{/* Badges: region, project type, verified */}
					<div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
						{review.region && (
							<span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-sand-100 text-sand-700 border border-sand-200">
								<MapPin className="w-3 h-3" />
								{review.region}
							</span>
						)}
						{review.project_type && (
							<span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-forest-50 text-forest-700 border border-forest-200">
								<Building className="w-3 h-3" />
								{review.project_type}
							</span>
						)}
						{review.verified && (
							<span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
								<BadgeCheck className="w-3 h-3" />
								인증됨
							</span>
						)}
					</div>

					{/* Meta: date, views, likes */}
					<div className="flex items-center justify-center gap-4 text-sm text-sand-500 flex-wrap">
						<span className="flex items-center gap-1">
							<Calendar className="w-3.5 h-3.5" />
							{new Date(review.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
						</span>
						<span className="flex items-center gap-1">
							<Eye className="w-3.5 h-3.5" />
							{review.view_count.toLocaleString()}
						</span>
						<span className="flex items-center gap-1">
							<ThumbsUp className="w-3.5 h-3.5" />
							{review.like_count.toLocaleString()}
						</span>
					</div>
				</div>
			</div>

			{/* ==================== MAIN CONTENT ==================== */}
			<div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">

				{/* --- Sub-ratings card --- */}
				{subRatings.length > 0 && (
					<div className="bg-white border border-sand-200 rounded-2xl p-5 md:p-8 mb-6">
						<h2 className="text-sm font-bold text-sand-800 uppercase tracking-wider mb-4 flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-[#0A9DAA]" />
							세부 평점
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{subRatings.map((sr) => (
								<div key={sr.label} className="flex items-center justify-between gap-3 py-2">
									<div className="flex items-center gap-2 text-sm text-sand-700">
										<sr.icon className="w-4 h-4 text-[#0A9DAA]" />
										<span className="font-medium">{sr.label}</span>
									</div>
									<div className="flex items-center gap-2">
										<StarRatingDisplay rating={sr.value!} size="sm" />
										<span className="text-sm font-semibold text-sand-800 min-w-[2rem] text-right">
											{Number(sr.value).toFixed(1)}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* --- Main article card --- */}
				<article className="bg-white border border-sand-200 rounded-2xl p-6 md:p-10 mb-6">
					{/* Company detail info grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 pb-6 border-b border-sand-100">
						{review.company_phone && (
							<div className="flex items-center gap-2 text-sm text-sand-600">
								<Phone className="w-4 h-4 text-forest-500 shrink-0" />
								<span>{review.company_phone}</span>
							</div>
						)}
						{review.region && (
							<div className="flex items-center gap-2 text-sm text-sand-600">
								<MapPin className="w-4 h-4 text-forest-500 shrink-0" />
								<span>{review.region}</span>
							</div>
						)}
						{review.project_type && (
							<div className="flex items-center gap-2 text-sm text-sand-600">
								<Building className="w-4 h-4 text-forest-500 shrink-0" />
								<span>{review.project_type}</span>
							</div>
						)}
						{review.project_size && (
							<div className="flex items-center gap-2 text-sm text-sand-600">
								<Ruler className="w-4 h-4 text-forest-500 shrink-0" />
								<span>
									{review.project_size}m² (약{' '}
									{(review.project_size / 3.3058).toFixed(1)}평)
								</span>
							</div>
						)}
						{review.project_cost && (
							<div className="flex items-center gap-2 text-sm text-sand-600">
								<Banknote className="w-4 h-4 text-forest-500 shrink-0" />
								<span>{formatKoreanMoney(Number(review.project_cost))}</span>
							</div>
						)}
					</div>

					{/* Review body text with good reading typography */}
					<div className="mb-8">
						<p className="text-sand-800 leading-relaxed whitespace-pre-wrap text-lg">
							{review.review_text}
						</p>
					</div>

					{/* Before / After image gallery */}
					{hasBeforeAfter && (
						<div className="mb-8">
							<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider mb-3 flex items-center gap-2">
								<ImageIcon className="w-4 h-4 text-[#0A9DAA]" />
								시공 전/후 사진
							</h3>
							<BeforeAfterGallery
								beforeImages={beforeImages}
								afterImages={afterImages}
								imageBaseUrl={IMAGE_BASE_URL}
							/>
						</div>
					)}

					{/* General images gallery */}
					{uniqueGeneralImages.length > 0 && (
						<div className="mb-8">
							<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider mb-3 flex items-center gap-2">
								<ImageIcon className="w-4 h-4 text-[#0A9DAA]" />
								{hasBeforeAfter ? '추가 사진' : '시공 사진'}
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{uniqueGeneralImages.map((img, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => {
											setLightboxIndex(idx)
											setLightboxOpen(true)
										}}
										className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-sand-200 hover:border-[#0A9DAA]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A9DAA]/50 focus:ring-offset-2"
										aria-label={`사진 ${idx + 1}번 크게 보기`}
									>
										<img
											src={resolveImageUrl(img)}
											alt={`시공 사진 ${idx + 1}`}
											className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
											loading="lazy"
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
											<Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Actions row: like, report, share */}
					<div className="flex items-center justify-between pt-6 border-t border-sand-100">
						<div className="flex items-center gap-3">
							<LikeButton
								targetType="review"
								targetId={review.id}
								initialLikeCount={review.like_count}
								size="md"
							/>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setReportModalOpen(true)}
								className="flex items-center gap-2 px-3 py-2 rounded-lg text-sand-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
								aria-label="이 후기 신고하기"
							>
								<Flag className="w-4 h-4" />
								<span className="hidden sm:inline">신고</span>
							</button>
							<button
								onClick={handleShare}
								className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sand-100 text-sand-600 hover:bg-sand-200 transition-all text-sm"
								aria-label="이 후기 공유하기"
							>
								<Share2 className="w-4 h-4" />
								공유
							</button>
						</div>
					</div>
				</article>

				{/* --- Company info card --- */}
				<div className="bg-white border border-sand-200 rounded-2xl p-5 md:p-8 mb-6">
					<h2 className="text-sm font-bold text-sand-800 uppercase tracking-wider mb-4 flex items-center gap-2">
						<ShieldCheck className="w-4 h-4 text-[#0A9DAA]" />
						업체 정보
					</h2>
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<Building className="w-4 h-4 text-sand-400 mt-0.5 shrink-0" />
							<div>
								<p className="text-xs text-sand-500 mb-0.5">업체명</p>
								<p className="text-sm text-sand-800 font-medium">{review.company_name}</p>
							</div>
						</div>
						{review.company_phone && (
							<div className="flex items-start gap-3">
								<Phone className="w-4 h-4 text-sand-400 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs text-sand-500 mb-0.5">연락처</p>
									<p className="text-sm text-sand-800 font-medium">{review.company_phone}</p>
								</div>
							</div>
						)}
						{review.business_number && (
							<div className="flex items-start gap-3">
								<ShieldCheck className="w-4 h-4 text-sand-400 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs text-sand-500 mb-0.5">사업자번호</p>
									<p className="text-sm text-sand-800 font-medium">
										{maskBusinessNumber(review.business_number)}
									</p>
								</div>
							</div>
						)}
						{review.region && (
							<div className="flex items-start gap-3">
								<MapPin className="w-4 h-4 text-sand-400 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs text-sand-500 mb-0.5">지역</p>
									<p className="text-sm text-sand-800 font-medium">{review.region}</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* --- Comments section --- */}
				<div className="mb-8">
					<Comments targetType="review" targetId={review.id} />
				</div>

				{/* --- Related reviews --- */}
				{relatedReviews.length > 0 && (
					<div className="bg-white border border-sand-200 rounded-2xl p-5 md:p-8">
						<h2 className="text-sm font-bold text-sand-800 uppercase tracking-wider mb-5 flex items-center gap-2">
							<Star className="w-4 h-4 text-[#0A9DAA]" />
							관련 후기
						</h2>
						<div className="space-y-4">
							{relatedReviews.map((related) => (
								<Link
									key={related.id}
									to={`/reviews/${related.slug || related.id}`}
									className="block p-4 rounded-xl bg-sand-50 hover:bg-sand-100 border border-sand-100 hover:border-sand-200 transition-all group"
								>
									<div className="flex items-start justify-between gap-3 mb-2">
										<h3 className="font-semibold text-sand-800 group-hover:text-[#0A9DAA] transition-colors text-sm">
											{related.company_name}
										</h3>
										<StarRatingDisplay rating={related.rating} size="sm" />
									</div>
									<p className="text-sand-600 text-sm line-clamp-2 leading-relaxed mb-2">
										{related.review_text}
									</p>
									<div className="flex items-center gap-3 text-xs text-sand-500">
										{related.region && (
											<span className="flex items-center gap-1">
												<MapPin className="w-3 h-3" />
												{related.region}
											</span>
										)}
										{related.project_type && (
											<span className="flex items-center gap-1">
												<Building className="w-3 h-3" />
												{related.project_type}
											</span>
										)}
										<span>
											{new Date(related.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
										</span>
									</div>
								</Link>
							))}
						</div>
						<div className="mt-5 pt-4 border-t border-sand-100 text-center">
							<Link
								to={reviewListPath}
								className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A9DAA] hover:text-[#088997] transition-colors"
							>
								더 많은 후기 보기
								<ArrowLeft className="w-3.5 h-3.5 rotate-180" />
							</Link>
						</div>
					</div>
				)}
			</div>

			<NordicFooter />

			{/* Report Modal */}
			<ReportModal
				isOpen={reportModalOpen}
				onClose={() => setReportModalOpen(false)}
				targetType="review"
				targetId={review.id}
			/>

			{/* General images lightbox */}
			{lightboxOpen && uniqueGeneralImages.length > 0 && (
				<div
					className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
					onClick={() => setLightboxOpen(false)}
					role="dialog"
					aria-modal="true"
					aria-label="이미지 크게 보기"
				>
					{/* Close button */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							setLightboxOpen(false)
						}}
						className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white z-50 transition-colors text-3xl font-light"
						aria-label="닫기"
					>
						&times;
					</button>

					{/* Previous button */}
					{lightboxIndex > 0 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								setLightboxIndex(lightboxIndex - 1)
							}}
							className="absolute left-2 md:left-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white z-50 transition-colors text-4xl font-light"
							aria-label="이전 이미지"
						>
							&#8249;
						</button>
					)}

					{/* Next button */}
					{lightboxIndex < uniqueGeneralImages.length - 1 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								setLightboxIndex(lightboxIndex + 1)
							}}
							className="absolute right-2 md:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white z-50 transition-colors text-4xl font-light"
							aria-label="다음 이미지"
						>
							&#8250;
						</button>
					)}

					{/* Lightbox image */}
					<img
						src={resolveImageUrl(uniqueGeneralImages[lightboxIndex])}
						alt={`사진 ${lightboxIndex + 1}`}
						className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
						onClick={(e) => e.stopPropagation()}
					/>

					{/* Counter */}
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/80 text-sm px-4 py-1.5 rounded-full">
						{lightboxIndex + 1} / {uniqueGeneralImages.length}
					</div>
				</div>
			)}
		</div>
	)
}
