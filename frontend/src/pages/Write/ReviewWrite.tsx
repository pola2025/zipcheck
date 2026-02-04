import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
	Star,
	Building,
	Phone,
	FileText,
	Send,
	MapPin,
	Ruler,
	Banknote,
	Wrench,
	CheckCircle,
	XCircle,
	ThumbsUp,
	ChevronRight,
	User,
} from 'lucide-react'
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'
import ImageUploader from '../../components/community/ImageUploader'
import LegalDisclaimer from '../../components/community/LegalDisclaimer'
import { useUser } from '../../contexts/UserAuthContext'
import { getApiUrl } from '../../lib/api-config'
import { formatKoreanMoney } from '../../lib/pricing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_TYPES = [
	'풀리모델링',
	'부분리모델링',
	'욕실',
	'주방',
	'도배',
	'바닥',
	'기타',
] as const

const STEPS = ['업체 정보', '시공 정보', '평가', '사진 & 제출'] as const
type StepIndex = 0 | 1 | 2 | 3

const BRAND = '#0A9DAA'

// ---------------------------------------------------------------------------
// StarRating (inline, interactive with hover preview)
// ---------------------------------------------------------------------------

interface StarRatingProps {
	label: string
	value: number
	onChange: (v: number) => void
	required?: boolean
	id: string
}

function StarRating({ label, value, onChange, required = false, id }: StarRatingProps) {
	const [hover, setHover] = useState(0)

	return (
		<div>
			<label htmlFor={id} className="block text-sm font-semibold mb-1.5 text-gray-700">
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>
			<div
				id={id}
				role="radiogroup"
				aria-label={label}
				className="flex gap-1"
				onMouseLeave={() => setHover(0)}
			>
				{[1, 2, 3, 4, 5].map((star) => {
					const filled = star <= (hover || value)
					return (
						<button
							key={star}
							type="button"
							role="radio"
							aria-checked={star === value}
							aria-label={`${star}점`}
							onClick={() => onChange(star)}
							onMouseEnter={() => setHover(star)}
							className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
							style={{ WebkitTapHighlightColor: 'transparent' }}
						>
							<Star
								className="w-8 h-8 transition-colors"
								fill={filled ? BRAND : 'none'}
								stroke={filled ? BRAND : '#D1D5DB'}
								strokeWidth={1.5}
							/>
						</button>
					)
				})}
			</div>
			{value > 0 && (
				<p className="text-xs mt-1" style={{ color: BRAND }}>
					{value}점 선택됨
				</p>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

interface ToggleSwitchProps {
	checked: boolean
	onChange: (v: boolean) => void
	label: string
	id: string
}

function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
	return (
		<label htmlFor={id} className="flex items-center gap-3 cursor-pointer min-h-[44px]">
			<div className="relative">
				<input
					id={id}
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="sr-only peer"
				/>
				<div
					className="w-11 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
					style={{ backgroundColor: checked ? BRAND : '#D1D5DB' }}
				/>
				<div
					className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
						checked ? 'translate-x-5' : 'translate-x-0'
					}`}
				/>
			</div>
			<span className="text-sm font-medium text-gray-700 select-none flex items-center gap-1.5">
				<ThumbsUp className="w-4 h-4" style={{ color: checked ? BRAND : '#9CA3AF' }} />
				{label}
			</span>
		</label>
	)
}

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------

function StepProgress({ current, steps }: { current: StepIndex; steps: readonly string[] }) {
	return (
		<div className="mb-8">
			{/* Step dots with labels */}
			<div className="flex items-center justify-between mb-3">
				{steps.map((stepLabel, i) => {
					const isActive = i === current
					const isDone = i < current
					return (
						<div key={stepLabel} className="flex items-center gap-1">
							<div
								className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0"
								style={{
									backgroundColor: isDone ? BRAND : isActive ? BRAND : '#E5E7EB',
									color: isDone || isActive ? '#fff' : '#9CA3AF',
								}}
							>
								{isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
							</div>
							<span
								className={`text-xs font-medium hidden sm:inline transition-colors ${
									isActive ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-400'
								}`}
							>
								{stepLabel}
							</span>
							{i < steps.length - 1 && (
								<ChevronRight className="w-3.5 h-3.5 text-gray-300 mx-0.5 hidden sm:block" />
							)}
						</div>
					)
				})}
			</div>
			{/* Bar */}
			<div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-300"
					style={{ width: `${((current + 1) / steps.length) * 100}%`, backgroundColor: BRAND }}
				/>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReviewWrite() {
	const navigate = useNavigate()
	const { user, isLoggedIn, token, loading } = useUser()

	// Multi-step state
	const [step, setStep] = useState<StepIndex>(0)

	// Form fields
	const [companyName, setCompanyName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [representativeName, setRepresentativeName] = useState('')
	const [projectType, setProjectType] = useState('')
	const [region, setRegion] = useState('')
	const [projectSize, setProjectSize] = useState('')
	const [projectCost, setProjectCost] = useState('')

	const [rating, setRating] = useState(0)
	const [qualityRating, setQualityRating] = useState(0)
	const [priceRating, setPriceRating] = useState(0)
	const [communicationRating, setCommunicationRating] = useState(0)
	const [scheduleRating, setScheduleRating] = useState(0)

	const [title, setTitle] = useState('')
	const [reviewText, setReviewText] = useState('')
	const [isRecommended, setIsRecommended] = useState(true)

	const [beforeImages, setBeforeImages] = useState<File[]>([])
	const [afterImages, setAfterImages] = useState<File[]>([])
	const [generalImages, setGeneralImages] = useState<File[]>([])

	const [agreed, setAgreed] = useState(false)

	// Submission
	const [submitting, setSubmitting] = useState(false)
	const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null)
	const [submitError, setSubmitError] = useState('')

	// ---------------------------------------------------------------------------
	// Validation helpers
	// ---------------------------------------------------------------------------

	const step0Valid = useMemo(() => companyName.trim().length > 0, [companyName])

	const step1Valid = useMemo(
		() => projectType !== '' && region.trim().length > 0,
		[projectType, region]
	)

	const step2Valid = useMemo(
		() => rating > 0 && title.trim().length > 0 && reviewText.trim().length >= 50,
		[rating, title, reviewText]
	)

	const step3Valid = useMemo(() => agreed, [agreed])

	const canSubmit = step0Valid && step1Valid && step2Valid && step3Valid

	// ---------------------------------------------------------------------------
	// Navigation
	// ---------------------------------------------------------------------------

	const goNext = useCallback(() => {
		setStep((prev) => Math.min(prev + 1, 3) as StepIndex)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}, [])

	const goPrev = useCallback(() => {
		setStep((prev) => Math.max(prev - 1, 0) as StepIndex)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}, [])

	// ---------------------------------------------------------------------------
	// Submit handler
	// ---------------------------------------------------------------------------

	const handleSubmit = useCallback(async () => {
		if (!token || !isLoggedIn || !canSubmit) return

		setSubmitting(true)
		setSubmitResult(null)
		setSubmitError('')

		try {
			const formData = new FormData()

			formData.append('company_name', companyName.trim())
			if (companyPhone.trim()) formData.append('company_phone', companyPhone.trim())
			if (businessNumber.trim()) formData.append('business_number', businessNumber.trim())
			if (representativeName.trim()) formData.append('representative_name', representativeName.trim())
			formData.append('project_type', projectType)
			formData.append('region', region.trim())
			if (projectSize) formData.append('project_size', projectSize)
			if (projectCost) formData.append('project_cost', projectCost)

			formData.append('rating', rating.toString())
			if (qualityRating > 0) formData.append('quality_rating', qualityRating.toString())
			if (priceRating > 0) formData.append('price_rating', priceRating.toString())
			if (communicationRating > 0)
				formData.append('communication_rating', communicationRating.toString())
			if (scheduleRating > 0) formData.append('schedule_rating', scheduleRating.toString())

			formData.append('title', title.trim())
			formData.append('review_text', reviewText.trim())
			formData.append('is_recommended', isRecommended ? 'true' : 'false')

			beforeImages.forEach((img) => formData.append('before_images', img))
			afterImages.forEach((img) => formData.append('after_images', img))
			generalImages.forEach((img) => formData.append('images', img))

			const response = await fetch(getApiUrl('/api/company-reviews'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			})

			if (!response.ok) {
				const body = await response.json().catch(() => null)
				throw new Error(body?.error || '후기 등록에 실패했습니다.')
			}

			setSubmitResult('success')
		} catch (err) {
			console.error('Review submit failed:', err)
			setSubmitError(err instanceof Error ? err.message : '후기 등록에 실패했습니다.')
			setSubmitResult('error')
		} finally {
			setSubmitting(false)
		}
	}, [
		token,
		isLoggedIn,
		canSubmit,
		companyName,
		companyPhone,
		businessNumber,
		projectType,
		region,
		projectSize,
		projectCost,
		rating,
		qualityRating,
		priceRating,
		communicationRating,
		scheduleRating,
		title,
		reviewText,
		isRecommended,
		beforeImages,
		afterImages,
		generalImages,
	])

	// ---------------------------------------------------------------------------
	// Shared class strings
	// ---------------------------------------------------------------------------

	const inputClass =
		'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A9DAA] focus:ring-2 focus:ring-[#0A9DAA]/20 transition-all text-base'
	const selectClass = inputClass

	const sectionCard = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6'

	// ---------------------------------------------------------------------------
	// Loading spinner
	// ---------------------------------------------------------------------------

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div
					className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
					style={{ borderColor: `${BRAND} transparent ${BRAND} ${BRAND}` }}
				/>
			</div>
		)
	}

	// ---------------------------------------------------------------------------
	// Success screen
	// ---------------------------------------------------------------------------

	if (submitResult === 'success') {
		return (
			<>
				<Helmet>
					<title>후기 등록 완료 | 집첵</title>
				</Helmet>
				<div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
					<div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
						<div
							className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
							style={{ backgroundColor: `${BRAND}15` }}
						>
							<CheckCircle className="w-8 h-8" style={{ color: BRAND }} />
						</div>
						<h1 className="text-xl font-bold text-gray-900 mb-2">후기가 등록되었습니다</h1>
						<p className="text-sm text-gray-500 mb-6 leading-relaxed">
							관리자 승인 후 게시됩니다.
							<br />
							소중한 후기를 남겨주셔서 감사합니다.
						</p>
						<button
							onClick={() => navigate('/community?tab=reviews')}
							className="w-full py-3 rounded-xl font-semibold text-white text-base transition-colors hover:opacity-90"
							style={{ backgroundColor: BRAND }}
						>
							커뮤니티로 돌아가기
						</button>
					</div>
				</div>
			</>
		)
	}

	// ---------------------------------------------------------------------------
	// Login gate
	// ---------------------------------------------------------------------------

	if (!isLoggedIn) {
		return (
			<>
				<Helmet>
					<title>업체 후기 작성 | 집첵</title>
					<meta
						name="description"
						content="인테리어 업체 이용 후기를 작성하세요. Before/After 사진과 함께 다른 소비자의 선택에 도움이 됩니다."
					/>
				</Helmet>
				<div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
					<div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
						<div
							className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
							style={{ backgroundColor: `${BRAND}15` }}
						>
							<Star className="w-8 h-8" style={{ color: BRAND }} />
						</div>
						<h1 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
						<p className="text-sm text-gray-500 mb-6">
							후기를 작성하려면 Google 계정으로 로그인해주세요.
						</p>
						<GoogleLoginButton size="lg" redirectTo="/write/review" className="mx-auto" />
					</div>
				</div>
			</>
		)
	}

	// ---------------------------------------------------------------------------
	// Main form
	// ---------------------------------------------------------------------------

	return (
		<>
			<Helmet>
				<title>업체 후기 작성 | 집첵</title>
				<meta
					name="description"
					content="인테리어 업체 이용 후기를 작성하세요. Before/After 사진과 함께 다른 소비자의 선택에 도움이 됩니다."
				/>
			</Helmet>

			<div className="min-h-screen bg-gray-50">
				{/* Sticky mobile header */}
				<header className="sticky top-0 z-30 bg-white border-b border-gray-100">
					<div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
						<button
							onClick={() => navigate(-1)}
							className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
							aria-label="뒤로 가기"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M12.5 15L7.5 10L12.5 5"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
						<h1 className="text-base font-bold text-gray-900">업체 후기 작성</h1>
						<div className="w-11" aria-hidden="true" />
					</div>
				</header>

				{/* Body */}
				<main className="max-w-lg mx-auto px-4 pt-5 pb-32">
					{/* User badge */}
					<div className="flex items-center gap-3 mb-5">
						{user?.avatar_url ? (
							<img
								src={user.avatar_url}
								alt=""
								className="w-9 h-9 rounded-full border border-gray-200"
							/>
						) : (
							<div
								className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
								style={{ backgroundColor: BRAND }}
							>
								{user?.name?.charAt(0) || 'U'}
							</div>
						)}
						<div className="min-w-0">
							<p className="text-sm font-semibold text-gray-900 truncate">
								{user?.name}
							</p>
							<p className="text-xs text-gray-400 truncate">{user?.email}</p>
						</div>
					</div>

					{/* Progress */}
					<StepProgress current={step} steps={STEPS} />

					{/* ============================================================
					   STEP 0 - 업체 정보
					============================================================= */}
					{step === 0 && (
						<section className={sectionCard} aria-label="업체 정보">
							<h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
								<Building className="w-4 h-4" style={{ color: BRAND }} />
								업체 정보
							</h2>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="rw-company"
										className="block text-sm font-semibold mb-1.5 text-gray-700"
									>
										업체명 <span className="text-red-500">*</span>
									</label>
									<input
										id="rw-company"
										type="text"
										value={companyName}
										onChange={(e) => setCompanyName(e.target.value)}
										placeholder="예: OO인테리어"
										className={inputClass}
										required
									/>
								</div>

								<div>
									<label
										htmlFor="rw-phone"
										className="block text-sm font-semibold mb-1.5 text-gray-700 flex items-center gap-1.5"
									>
										<Phone className="w-3.5 h-3.5 text-gray-400" />
										업체 전화번호
									</label>
									<input
										id="rw-phone"
										type="tel"
										value={companyPhone}
										onChange={(e) => setCompanyPhone(e.target.value)}
										placeholder="02-1234-5678"
										className={inputClass}
									/>
								</div>

								<div>
									<label
										htmlFor="rw-biz"
										className="block text-sm font-semibold mb-1.5 text-gray-700 flex items-center gap-1.5"
									>
										<FileText className="w-3.5 h-3.5 text-gray-400" />
										사업자번호
									</label>
									<input
										id="rw-biz"
										type="text"
										value={businessNumber}
										onChange={(e) => setBusinessNumber(e.target.value)}
										placeholder="123-45-67890"
										className={inputClass}
									/>
								</div>

								<div>
									<label
										htmlFor="rw-rep"
										className="block text-sm font-semibold mb-1.5 text-gray-700 flex items-center gap-1.5"
									>
										<User className="w-3.5 h-3.5 text-gray-400" />
										대표자/담당자 이름
									</label>
									<input
										id="rw-rep"
										type="text"
										value={representativeName}
										onChange={(e) => setRepresentativeName(e.target.value)}
										placeholder="예: 홍길동"
										className={inputClass}
									/>
								</div>
							</div>

							<button
								type="button"
								disabled={!step0Valid}
								onClick={goNext}
								className="mt-6 w-full py-3 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
								style={{ backgroundColor: BRAND }}
							>
								다음 <ChevronRight className="w-4 h-4" />
							</button>
						</section>
					)}

					{/* ============================================================
					   STEP 1 - 시공 정보
					============================================================= */}
					{step === 1 && (
						<section className={sectionCard} aria-label="시공 정보">
							<h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
								<Wrench className="w-4 h-4" style={{ color: BRAND }} />
								시공 정보
							</h2>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="rw-type"
										className="block text-sm font-semibold mb-1.5 text-gray-700"
									>
										시공 유형 <span className="text-red-500">*</span>
									</label>
									<select
										id="rw-type"
										value={projectType}
										onChange={(e) => setProjectType(e.target.value)}
										className={selectClass}
										required
									>
										<option value="">선택해주세요</option>
										{PROJECT_TYPES.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
									</select>
								</div>

								<div>
									<label
										htmlFor="rw-region"
										className="block text-sm font-semibold mb-1.5 text-gray-700 flex items-center gap-1.5"
									>
										<MapPin className="w-3.5 h-3.5" style={{ color: BRAND }} />
										시공 지역 <span className="text-red-500">*</span>
									</label>
									<input
										id="rw-region"
										type="text"
										value={region}
										onChange={(e) => setRegion(e.target.value)}
										placeholder="예: 서울 강남구"
										className={inputClass}
										required
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label
											htmlFor="rw-size"
											className="block text-sm font-semibold mb-1.5 text-gray-700 flex items-center gap-1.5"
										>
											<Ruler className="w-3.5 h-3.5" />
											평수
										</label>
										<input
											id="rw-size"
											type="number"
											value={projectSize}
											onChange={(e) => setProjectSize(e.target.value)}
											placeholder="예: 32"
											className={inputClass}
											min={0}
										/>
										{projectSize && (
											<p className="text-xs text-gray-400 mt-1">
												약 {(Number(projectSize) * 3.3058).toFixed(0)}m&sup2;
											</p>
										)}
									</div>
									<div>
										<label
											htmlFor="rw-cost"
											className="block text-sm font-semibold mb-1.5 text-gray-700 flex items-center gap-1.5"
										>
											<Banknote className="w-3.5 h-3.5" />
											시공 비용
										</label>
										<div className="flex gap-2">
											<div className="relative flex-1">
												<input
													id="rw-cost"
													type="number"
													value={projectCost === '10000' ? '' : projectCost}
													onChange={(e) => {
														const v = e.target.value
														if (v === '' || (Number(v) >= 0 && Number(v) <= 9999)) {
															setProjectCost(v)
														}
													}}
													placeholder="예: 3000"
													className={`${inputClass} pr-12 ${projectCost === '10000' ? 'opacity-40' : ''}`}
													min={0}
													max={9999}
													disabled={projectCost === '10000'}
												/>
												<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
													만원
												</span>
											</div>
											<button
												type="button"
												onClick={() => setProjectCost(projectCost === '10000' ? '' : '10000')}
												className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${projectCost === '10000' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-gray-500 border-gray-300 hover:border-forest-400'}`}
											>
												1억원 이상
											</button>
										</div>
										{projectCost && (
											<p className="text-xs text-gray-400 mt-1">
												{formatKoreanMoney(Number(projectCost))}
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="mt-6 flex gap-3">
								<button
									type="button"
									onClick={goPrev}
									className="flex-1 py-3 rounded-xl font-semibold text-gray-600 text-base bg-gray-100 hover:bg-gray-200 transition-colors"
								>
									이전
								</button>
								<button
									type="button"
									disabled={!step1Valid}
									onClick={goNext}
									className="flex-[2] py-3 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
									style={{ backgroundColor: BRAND }}
								>
									다음 <ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</section>
					)}

					{/* ============================================================
					   STEP 2 - 평가
					============================================================= */}
					{step === 2 && (
						<section className={sectionCard} aria-label="평가">
							<h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
								<Star className="w-4 h-4" style={{ color: BRAND }} />
								평가
							</h2>

							<div className="space-y-5">
								{/* Overall rating */}
								<StarRating
									label="전체 평점"
									value={rating}
									onChange={setRating}
									required
									id="rw-rating"
								/>

								{/* Detail ratings */}
								<div className="border-t border-gray-100 pt-4">
									<p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
										세부 평가 (선택)
									</p>
									<div className="grid grid-cols-1 gap-4">
										<StarRating
											label="품질"
											value={qualityRating}
											onChange={setQualityRating}
											id="rw-quality"
										/>
										<StarRating
											label="가격"
											value={priceRating}
											onChange={setPriceRating}
											id="rw-price"
										/>
										<StarRating
											label="소통"
											value={communicationRating}
											onChange={setCommunicationRating}
											id="rw-comm"
										/>
										<StarRating
											label="일정"
											value={scheduleRating}
											onChange={setScheduleRating}
											id="rw-sched"
										/>
									</div>
								</div>

								{/* Recommend toggle */}
								<div className="border-t border-gray-100 pt-4">
									<ToggleSwitch
										checked={isRecommended}
										onChange={setIsRecommended}
										label="이 업체를 추천합니다"
										id="rw-recommend"
									/>
								</div>

								{/* Title */}
								<div>
									<label
										htmlFor="rw-title"
										className="block text-sm font-semibold mb-1.5 text-gray-700"
									>
										제목 <span className="text-red-500">*</span>
									</label>
									<input
										id="rw-title"
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="후기 제목을 입력하세요"
										className={inputClass}
										maxLength={100}
										required
									/>
								</div>

								{/* Review body */}
								<div>
									<label
										htmlFor="rw-text"
										className="block text-sm font-semibold mb-1.5 text-gray-700"
									>
										후기 내용 <span className="text-red-500">*</span>
									</label>
									<textarea
										id="rw-text"
										value={reviewText}
										onChange={(e) => setReviewText(e.target.value)}
										placeholder="시공 과정, 결과물 만족도, 업체 소통 등을 자세히 작성해주세요"
										rows={7}
										className={`${inputClass} resize-none`}
										required
									/>
									<div className="flex justify-between items-center mt-1.5">
										<p className="text-xs text-gray-400">
											최소 50자 이상 작성해주세요
										</p>
										<p
											className="text-xs font-medium"
											style={{
												color:
													reviewText.length >= 50 ? BRAND : '#9CA3AF',
											}}
										>
											{reviewText.length}자
										</p>
									</div>
								</div>
							</div>

							<div className="mt-6 flex gap-3">
								<button
									type="button"
									onClick={goPrev}
									className="flex-1 py-3 rounded-xl font-semibold text-gray-600 text-base bg-gray-100 hover:bg-gray-200 transition-colors"
								>
									이전
								</button>
								<button
									type="button"
									disabled={!step2Valid}
									onClick={goNext}
									className="flex-[2] py-3 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
									style={{ backgroundColor: BRAND }}
								>
									다음 <ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</section>
					)}

					{/* ============================================================
					   STEP 3 - 사진 & 제출
					============================================================= */}
					{step === 3 && (
						<div className="space-y-5">
							{/* Image uploads */}
							<section className={sectionCard} aria-label="사진 업로드">
								<h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">
									Before / After 사진
								</h2>
								<p className="text-xs text-gray-400 mb-5">
									시공 전후 사진을 첨부하면 후기의 신뢰도가 높아집니다.
								</p>

								<div className="space-y-5">
									<ImageUploader
										images={beforeImages}
										setImages={setBeforeImages}
										maxImages={5}
										label="시공 전 (Before)"
										category="before"
									/>
									<ImageUploader
										images={afterImages}
										setImages={setAfterImages}
										maxImages={5}
										label="시공 후 (After)"
										category="after"
									/>
									<ImageUploader
										images={generalImages}
										setImages={setGeneralImages}
										maxImages={5}
										label="추가 사진"
										category="general"
									/>
								</div>
							</section>

							{/* Legal disclaimer */}
							<LegalDisclaimer agreed={agreed} onAgreeChange={setAgreed} />

							{/* Submission error */}
							{submitResult === 'error' && submitError && (
								<div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
									<XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
									<p className="text-sm text-red-700">{submitError}</p>
								</div>
							)}

							{/* Navigation / submit */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={goPrev}
									className="flex-1 py-3 rounded-xl font-semibold text-gray-600 text-base bg-gray-100 hover:bg-gray-200 transition-colors"
								>
									이전
								</button>
								<button
									type="button"
									disabled={submitting || !canSubmit}
									onClick={handleSubmit}
									className="flex-[2] py-3.5 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
									style={{
										backgroundColor: BRAND,
										boxShadow: canSubmit
											? `0 8px 24px ${BRAND}30`
											: undefined,
									}}
								>
									{submitting ? (
										<>
											<div
												className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
												aria-hidden="true"
											/>
											제출 중...
										</>
									) : (
										<>
											<Send className="w-5 h-5" />
											후기 등록하기
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</main>
			</div>
		</>
	)
}
