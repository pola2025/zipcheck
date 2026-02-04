import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Building, Phone, FileText, Send, ArrowLeft, Banknote, MapPin, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import GoogleLoginButton from 'components/auth/GoogleLoginButton'
import ImageUploader from 'components/community/ImageUploader'
import LegalDisclaimer from 'components/community/LegalDisclaimer'
import { useUser } from '../../contexts/UserAuthContext'
import { getApiUrl } from '../../lib/api-config'
import { formatKoreanMoney } from '../../lib/pricing'

const DAMAGE_TYPES = ['시공불량', '계약위반', '금전사기', '자재불량', '공사지연', '사후서비스불이행', '기타']
const SEVERITY_OPTIONS = [
	{ value: 'low', label: '경미', description: '경미한 수준의 피해' },
	{ value: 'medium', label: '보통', description: '일반적인 수준의 피해' },
	{ value: 'high', label: '심각', description: '심각한 수준의 피해' },
	{ value: 'critical', label: '매우 심각', description: '매우 심각한 수준의 피해' },
]
const RESOLUTION_OPTIONS = [
	{ value: 'open', label: '미해결' },
	{ value: 'in_progress', label: '진행중' },
	{ value: 'resolved', label: '해결됨' },
]

export default function DamageCaseWrite() {
	const navigate = useNavigate()
	const { user, isLoggedIn, token } = useUser()
	const [submitting, setSubmitting] = useState(false)
	const [agreed, setAgreed] = useState(false)

	// Form state
	const [companyName, setCompanyName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [damageType, setDamageType] = useState('')
	const [region, setRegion] = useState('')
	const [damageAmount, setDamageAmount] = useState('')
	const [severity, setSeverity] = useState('')
	const [title, setTitle] = useState('')
	const [caseDescription, setCaseDescription] = useState('')
	const [evidenceImages, setEvidenceImages] = useState<File[]>([])
	const [resolutionStatus, setResolutionStatus] = useState('open')
	const [legalAction, setLegalAction] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!token || !isLoggedIn) {
			alert('로그인이 필요합니다.')
			return
		}

		if (!companyName.trim()) {
			alert('업체명을 입력해주세요.')
			return
		}

		if (!damageType) {
			alert('피해 유형을 선택해주세요.')
			return
		}

		if (!title.trim()) {
			alert('제목을 입력해주세요.')
			return
		}

		if (caseDescription.trim().length < 100) {
			alert('상세 내용은 최소 100자 이상 작성해주세요.')
			return
		}

		if (!agreed) {
			alert('면책 조항에 동의해주세요.')
			return
		}

		setSubmitting(true)

		try {
			const formData = new FormData()
			formData.append('company_name', companyName)
			if (companyPhone) formData.append('company_phone', companyPhone)
			if (businessNumber) formData.append('business_number', businessNumber)
			formData.append('damage_type', damageType)
			if (region) formData.append('region', region)
			if (damageAmount) formData.append('damage_amount', damageAmount)
			if (severity) formData.append('severity', severity)
			formData.append('title', title)
			formData.append('case_description', caseDescription)
			formData.append('resolution_status', resolutionStatus)
			formData.append('legal_action', legalAction.toString())
			formData.append('disclaimer_agreed', 'true')

			evidenceImages.forEach((image) => {
				formData.append('evidence_images', image)
			})

			const response = await fetch(getApiUrl('/api/damage-cases'), {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
				},
				body: formData
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || '피해사례 등록에 실패했습니다.')
			}

			alert('피해사례가 등록되었습니다. 관리자 승인 후 게시됩니다.')
			navigate('/community?tab=damage-cases')
		} catch (error) {
			console.error('Failed to submit damage case:', error)
			alert(error instanceof Error ? error.message : '피해사례 등록에 실패했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	const inputClass = "w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
	const selectClass = "w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"

	const canSubmit = isLoggedIn && companyName.trim() && damageType && title.trim() && caseDescription.length >= 100 && agreed

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="피해사례 등록"
				description="인테리어 피해 경험을 상세하게 등록해주세요. 증거 사진과 함께 제출하면 신뢰도가 높아집니다."
				path="/write/damage-case"
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-3xl mx-auto px-5 md:px-8">
					<button
						onClick={() => navigate('/community?tab=damage-cases')}
						className="flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						커뮤니티로 돌아가기
					</button>
					<div className="text-center">
						<div className="flex items-center justify-center gap-3 mb-6">
							<div className="w-8 h-[2px] bg-forest-500" />
							<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">Report</span>
							<div className="w-8 h-[2px] bg-forest-500" />
						</div>
						<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
							피해사례 등록
						</h1>
						<p className="text-sand-600 text-base md:text-lg">부당한 피해 사례를 공유하여 다른 소비자를 보호하세요</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
				{/* Login Gate */}
				{!isLoggedIn ? (
					<div className="nordic-card rounded-2xl p-8 md:p-12 text-center">
						<div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
							<AlertTriangle className="w-8 h-8 text-red-500" />
						</div>
						<h2 className="font-outfit text-xl font-bold text-sand-900 mb-2">로그인이 필요합니다</h2>
						<p className="text-sand-600 text-sm mb-6">피해사례를 등록하려면 Google 계정으로 로그인해주세요.</p>
						<GoogleLoginButton size="lg" className="mx-auto" redirectTo="/write/damage-case" />
					</div>
				) : (
					<form onSubmit={handleSubmit} className="nordic-card rounded-2xl p-6 md:p-10">
						{/* Logged in user info */}
						<div className="flex items-center gap-3 mb-8 pb-5 border-b border-sand-200">
							{user?.avatar_url ? (
								<img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full" />
							) : (
								<div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-semibold text-sm">
									{user?.name?.charAt(0) || 'U'}
								</div>
							)}
							<div>
								<p className="text-sm font-semibold text-sand-900">{user?.name}</p>
								<p className="text-xs text-sand-500">{user?.email}</p>
							</div>
						</div>

						<div className="space-y-6">
							{/* Company Info Section */}
							<div className="space-y-4">
								<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider">업체 정보</h3>

								<div>
									<label htmlFor="dcw-company" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
										<Building className="w-4 h-4 text-forest-500" />
										업체명 <span className="text-red-500">*</span>
									</label>
									<input id="dcw-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="예: OO인테리어" className={inputClass} required />
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="dcw-phone" className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
											<Phone className="w-4 h-4" />
											업체 전화번호
										</label>
										<input id="dcw-phone" type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="02-1234-5678" className={inputClass} />
									</div>
									<div>
										<label htmlFor="dcw-biz" className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
											<FileText className="w-4 h-4" />
											사업자번호
										</label>
										<input id="dcw-biz" type="text" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} placeholder="123-45-67890" className={inputClass} />
									</div>
								</div>
							</div>

							{/* Damage Details Section */}
							<div className="space-y-4 pt-2">
								<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider">피해 정보</h3>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="dcw-type" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
											<AlertTriangle className="w-4 h-4 text-red-500" />
											피해 유형 <span className="text-red-500">*</span>
										</label>
										<select id="dcw-type" value={damageType} onChange={(e) => setDamageType(e.target.value)} className={selectClass} required>
											<option value="">선택해주세요</option>
											{DAMAGE_TYPES.map((type) => (
												<option key={type} value={type}>{type}</option>
											))}
										</select>
									</div>
									<div>
										<label htmlFor="dcw-region" className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
											<MapPin className="w-4 h-4" />
											피해 지역
										</label>
										<input id="dcw-region" type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 서울 강남구" className={inputClass} />
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="dcw-amount" className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
											<Banknote className="w-4 h-4" />
											피해 금액
										</label>
										<div className="flex gap-2">
											<div className="relative flex-1">
												<input id="dcw-amount" type="number" value={damageAmount === '10000' ? '' : damageAmount} onChange={(e) => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 9999)) { setDamageAmount(v) } }} placeholder="예: 500" className={`${inputClass} pr-14 ${damageAmount === '10000' ? 'opacity-40' : ''}`} min={0} max={9999} disabled={damageAmount === '10000'} />
												<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-sand-400">만원</span>
											</div>
											<button type="button" onClick={() => setDamageAmount(damageAmount === '10000' ? '' : '10000')} className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${damageAmount === '10000' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-sand-500 border-sand-300 hover:border-forest-400'}`}>
												1억원 이상
											</button>
										</div>
										{damageAmount && (
											<p className="text-xs text-sand-400 mt-1.5">{formatKoreanMoney(Number(damageAmount))}</p>
										)}
									</div>
									<div>
										<label htmlFor="dcw-severity" className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
											<ShieldAlert className="w-4 h-4" />
											피해 심각도
										</label>
										<select id="dcw-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
											<option value="">선택 안 함</option>
											{SEVERITY_OPTIONS.map((opt) => (
												<option key={opt.value} value={opt.value}>{opt.label} - {opt.description}</option>
											))}
										</select>
									</div>
								</div>
							</div>

							{/* Title and Description Section */}
							<div className="space-y-4 pt-2">
								<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider">상세 내용</h3>

								<div>
									<label htmlFor="dcw-title" className="block text-sm font-semibold mb-2 text-sand-700">
										제목 <span className="text-red-500">*</span>
									</label>
									<input id="dcw-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: OO인테리어 시공불량으로 인한 피해" className={inputClass} required />
								</div>

								<div>
									<label htmlFor="dcw-desc" className="block text-sm font-semibold mb-2 text-sand-700">
										상세 내용 <span className="text-red-500">*</span>
									</label>
									<textarea
										id="dcw-desc"
										value={caseDescription}
										onChange={(e) => setCaseDescription(e.target.value)}
										placeholder="날짜, 계약 내용, 피해 상황을 사실에 기반하여 작성해주세요."
										rows={10}
										className={`${inputClass} resize-none`}
										required
									/>
									<div className="flex justify-between items-center mt-1.5">
										<p className="text-xs text-sand-400">날짜, 계약 내용, 피해 상황을 사실에 기반하여 작성해주세요 (최소 100자)</p>
										<p className={`text-xs shrink-0 ml-2 ${caseDescription.length >= 100 ? 'text-forest-500' : 'text-sand-400'}`}>{caseDescription.length}자</p>
									</div>
								</div>
							</div>

							{/* Evidence Images */}
							<div className="pt-2">
								<ImageUploader
									images={evidenceImages}
									setImages={setEvidenceImages}
									maxImages={10}
									label="증거 사진"
									category="evidence"
								/>
								<p className="text-xs text-amber-600 mt-2">최소 1장 권장 - 증거 사진이 있으면 사례의 신뢰도가 높아집니다.</p>
							</div>

							{/* Resolution & Legal Section */}
							<div className="space-y-4 pt-2">
								<h3 className="text-sm font-bold text-sand-800 uppercase tracking-wider">진행 상태</h3>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="dcw-resolution" className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
											<CheckCircle2 className="w-4 h-4" />
											해결 상태
										</label>
										<select id="dcw-resolution" value={resolutionStatus} onChange={(e) => setResolutionStatus(e.target.value)} className={selectClass}>
											{RESOLUTION_OPTIONS.map((opt) => (
												<option key={opt.value} value={opt.value}>{opt.label}</option>
											))}
										</select>
									</div>
									<div className="flex items-end pb-1">
										<label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
											<input
												type="checkbox"
												checked={legalAction}
												onChange={(e) => setLegalAction(e.target.checked)}
												className="w-4 h-4 min-w-[16px] text-[#0A9DAA] border-gray-300 rounded focus:ring-[#0A9DAA] focus:ring-2 cursor-pointer accent-[#0A9DAA]"
											/>
											<span className="flex items-center gap-2 text-sm font-semibold text-sand-700">
												<Scale className="w-4 h-4 text-purple-500" />
												법적 조치 진행 중
											</span>
										</label>
									</div>
								</div>
							</div>

							{/* Legal Disclaimer - REQUIRED */}
							<LegalDisclaimer agreed={agreed} onAgreeChange={setAgreed} />

							{/* Submit */}
							<button
								type="submit"
								disabled={submitting || !canSubmit}
								className="w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
							>
								{submitting ? (
									<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 제출 중...</>
								) : (
									<><Send className="w-5 h-5" /> 피해사례 등록하기</>
								)}
							</button>
						</div>
					</form>
				)}
			</div>

			<NordicFooter />
		</div>
	)
}
