import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Building, Phone, FileText, Send, ArrowLeft, ImagePlus, X } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { getApiUrl } from '../../lib/api-config'
import { formatKoreanMoney } from '../../lib/pricing'

export default function DamageCaseCreate() {
	const navigate = useNavigate()
	const [submitting, setSubmitting] = useState(false)

	const [companyName, setCompanyName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [damageType, setDamageType] = useState('')
	const [damageAmount, setDamageAmount] = useState('')
	const [caseDescription, setCaseDescription] = useState('')
	const [evidenceImages, setEvidenceImages] = useState<File[]>([])

	const damageTypes = ['시공 불량', '계약 위반', '금전 사기', '자재 불량', '공사 지연', '사후 서비스 불이행', '기타']

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files)
			setEvidenceImages([...evidenceImages, ...files])
		}
	}

	const removeImage = (index: number) => {
		setEvidenceImages(evidenceImages.filter((_, i) => i !== index))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const token = localStorage.getItem('auth_token')
		if (!token) {
			alert('로그인이 필요합니다. 로그인 후 이용해주세요.')
			navigate('/login')
			return
		}

		if (!companyName || !companyPhone || !businessNumber) {
			alert('업체명, 연락처, 사업자번호를 모두 입력해주세요.')
			return
		}

		if (!damageType) {
			alert('피해 유형을 선택해주세요.')
			return
		}

		if (caseDescription.trim().length < 20) {
			alert('피해 내용은 최소 20자 이상 작성해주세요.')
			return
		}

		setSubmitting(true)

		try {
			const formData = new FormData()
			formData.append('company_name', companyName)
			if (companyPhone) formData.append('company_phone', companyPhone)
			if (businessNumber) formData.append('business_number', businessNumber)
			formData.append('damage_type', damageType)
			if (damageAmount) formData.append('damage_amount', damageAmount)
			formData.append('case_description', caseDescription)

			evidenceImages.forEach((image) => {
				formData.append(`evidence_images`, image)
			})

			const response = await fetch(getApiUrl('/api/damage-cases'), {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` },
				body: formData
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || '피해사례 등록에 실패했습니다.')
			}

			alert('피해사례가 등록되었습니다. 관리자 승인 후 게시됩니다.')
			navigate(`/community?tab=damage-cases`)
		} catch (error) {
			console.error('Failed to submit damage case:', error)
			alert(error instanceof Error ? error.message : '피해사례 등록에 실패했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	const inputClass = "w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="피해 사례 제보"
				description="인테리어 피해 경험을 공유해주세요. 유사 피해 방지에 기여합니다."
				path="/community/damage-cases/create"
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
							피해사례 제보
						</h1>
						<p className="text-sand-600 text-base md:text-lg">부당한 피해 사례를 공유하여 다른 사람들을 보호하세요</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
				<form onSubmit={handleSubmit} className="nordic-card rounded-2xl p-6 md:p-10">
					<div className="space-y-6">
						{/* Company Name */}
						<div>
							<label htmlFor="dc-company" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Building className="w-4 h-4 text-forest-500" />
								업체명 <span className="text-red-500">*</span>
							</label>
							<input id="dc-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="예: OO인테리어" className={inputClass} required />
						</div>

						{/* Company Phone */}
						<div>
							<label htmlFor="dc-phone" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Phone className="w-4 h-4 text-forest-500" />
								업체 전화번호 <span className="text-red-500">*</span>
							</label>
							<input id="dc-phone" type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="02-1234-5678" className={inputClass} required />
						</div>

						{/* Business Number */}
						<div>
							<label htmlFor="dc-biz" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<FileText className="w-4 h-4 text-forest-500" />
								사업자번호 <span className="text-red-500">*</span>
							</label>
							<input id="dc-biz" type="text" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} placeholder="123-45-67890" className={inputClass} required />
						</div>

						{/* Damage Type */}
						<div>
							<label htmlFor="dc-type" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 text-red-500" />
								피해 유형 <span className="text-red-500">*</span>
							</label>
							<select id="dc-type" value={damageType} onChange={(e) => setDamageType(e.target.value)} className={inputClass} required>
								<option value="">선택해주세요</option>
								{damageTypes.map((type) => (
									<option key={type} value={type}>{type}</option>
								))}
							</select>
						</div>

						{/* Damage Amount */}
						<div>
							<label htmlFor="dc-amount" className="block text-sm font-semibold mb-2 text-sand-500">피해 금액 (선택)</label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<input id="dc-amount" type="number" value={damageAmount === '10000' ? '' : damageAmount} onChange={(e) => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 9999)) { setDamageAmount(v) } }} placeholder="예: 500" className={`${inputClass} pr-14 ${damageAmount === '10000' ? 'opacity-40' : ''}`} min={0} max={9999} disabled={damageAmount === '10000'} />
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-sand-400">만원</span>
								</div>
								<button type="button" onClick={() => setDamageAmount(damageAmount === '10000' ? '' : '10000')} className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${damageAmount === '10000' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-sand-500 border-sand-300 hover:border-forest-400'}`}>
									1억원 이상
								</button>
							</div>
							{damageAmount && <p className="text-xs text-sand-400 mt-1.5">{formatKoreanMoney(Number(damageAmount))}</p>}
						</div>

						{/* Case Description */}
						<div>
							<label htmlFor="dc-desc" className="block text-sm font-semibold mb-2 text-sand-700">
								피해 내용 <span className="text-red-500">*</span>
							</label>
							<textarea
								id="dc-desc"
								value={caseDescription}
								onChange={(e) => setCaseDescription(e.target.value)}
								placeholder="피해 경위, 시공 내용, 업체의 문제점 등을 상세히 작성해주세요. (최소 20자)"
								rows={10}
								className={`${inputClass} resize-none`}
								required
							/>
							<div className="flex justify-between items-center mt-1.5">
								<p className="text-xs text-sand-400">최소 20자 이상 작성해주세요</p>
								<p className="text-xs text-sand-400">{caseDescription.length}자</p>
							</div>
						</div>

						{/* Evidence Images */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
								<ImagePlus className="w-4 h-4" />
								증거 사진 (선택)
							</label>
							<div className="border-2 border-dashed border-sand-300 rounded-xl p-6 text-center hover:border-forest-400 transition-colors">
								<input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="dc-evidence-upload" />
								<label htmlFor="dc-evidence-upload" className="cursor-pointer flex flex-col items-center gap-2">
									<ImagePlus className="w-10 h-10 text-sand-300" />
									<p className="text-sand-600 text-sm">클릭하여 이미지 업로드</p>
									<p className="text-xs text-sand-400">JPG, PNG, GIF (최대 10MB)</p>
								</label>
							</div>

							{evidenceImages.length > 0 && (
								<div className="grid grid-cols-3 gap-3 mt-4">
									{evidenceImages.map((image, index) => (
										<div key={index} className="relative group">
											<img src={URL.createObjectURL(image)} alt={`증거 ${index + 1}`} className="w-full h-28 object-cover rounded-xl border border-sand-200" />
											<button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<X className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Notice */}
						<div className="bg-sand-100 border border-sand-200 rounded-xl p-4">
							<p className="text-sm text-sand-700 font-medium mb-1.5">안내사항</p>
							<ul className="text-xs text-sand-500 space-y-1 ml-1">
								<li>• 작성하신 피해사례는 관리자 검토 후 게시됩니다</li>
								<li>• 허위 사실이나 명예훼손 내용은 게시가 거부되며 법적 책임을 질 수 있습니다</li>
								<li>• 구체적인 증거와 함께 제출하시면 신뢰도가 높아집니다</li>
								<li>• 개인정보 보호를 위해 민감한 정보는 제외해주세요</li>
							</ul>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={submitting || !companyName || !companyPhone || !businessNumber || !damageType || caseDescription.length < 20}
							className="w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
						>
							{submitting ? (
								<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 제출 중...</>
							) : (
								<><Send className="w-5 h-5" /> 피해사례 제보하기</>
							)}
						</button>
					</div>
				</form>
			</div>

			<NordicFooter />
		</div>
	)
}
