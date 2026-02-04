import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Building, Phone, FileText, Send, ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { getApiUrl } from '../../lib/api-config'
import { formatKoreanMoney } from '../../lib/pricing'

export default function ReviewCreate() {
	const navigate = useNavigate()
	const [submitting, setSubmitting] = useState(false)

	const [companyName, setCompanyName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [region, setRegion] = useState('')
	const [projectType, setProjectType] = useState('')
	const [projectSize, setProjectSize] = useState('')
	const [projectCost, setProjectCost] = useState('')
	const [rating, setRating] = useState(0)
	const [reviewText, setReviewText] = useState('')
	const [images, setImages] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files) return

		const fileArray = Array.from(files)
		const remainingSlots = 10 - images.length

		if (fileArray.length > remainingSlots) {
			alert(`최대 10장까지 업로드할 수 있습니다. (현재: ${images.length}장, 추가 가능: ${remainingSlots}장)`)
			return
		}

		const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'))
		if (invalidFiles.length > 0) {
			alert('이미지 파일만 업로드할 수 있습니다.')
			return
		}

		const newImages = [...images, ...fileArray]
		setImages(newImages)

		const newPreviews = fileArray.map(file => URL.createObjectURL(file))
		setImagePreviews([...imagePreviews, ...newPreviews])
	}

	const handleRemoveImage = (index: number) => {
		const newImages = images.filter((_, i) => i !== index)
		const newPreviews = imagePreviews.filter((_, i) => i !== index)
		URL.revokeObjectURL(imagePreviews[index])
		setImages(newImages)
		setImagePreviews(newPreviews)
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

		if (rating === 0) {
			alert('별점을 선택해주세요.')
			return
		}

		if (reviewText.trim().length < 10) {
			alert('후기는 최소 10자 이상 작성해주세요.')
			return
		}

		setSubmitting(true)

		try {
			const formData = new FormData()
			formData.append('company_name', companyName)
			formData.append('company_phone', companyPhone || '')
			formData.append('business_number', businessNumber || '')
			formData.append('region', region || '')
			formData.append('project_type', projectType || '')
			formData.append('project_size', projectSize || '')
			formData.append('project_cost', projectCost || '')
			formData.append('rating', rating.toString())
			formData.append('review_text', reviewText)

			images.forEach((image) => {
				formData.append('images', image)
			})

			const response = await fetch(getApiUrl('/api/company-reviews'), {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
				},
				body: formData
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || '후기 등록에 실패했습니다.')
			}

			alert('후기가 등록되었습니다. 관리자 승인 후 게시됩니다.')
			navigate(`/community?tab=reviews`)
		} catch (error) {
			console.error('Failed to submit review:', error)
			alert(error instanceof Error ? error.message : '후기 등록에 실패했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	const inputClass = "w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
	const selectClass = "w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="업체 후기 작성"
				description="인테리어 업체 이용 후기를 남겨주세요. 다른 소비자들의 현명한 선택에 도움이 됩니다."
				path="/community/reviews/create"
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-3xl mx-auto px-5 md:px-8">
					<button
						onClick={() => navigate('/community?tab=reviews')}
						className="flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						커뮤니티로 돌아가기
					</button>
					<div className="text-center">
						<div className="flex items-center justify-center gap-3 mb-6">
							<div className="w-8 h-[2px] bg-forest-500" />
							<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">Review</span>
							<div className="w-8 h-[2px] bg-forest-500" />
						</div>
						<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
							업체 후기 작성
						</h1>
						<p className="text-sand-600 text-base md:text-lg">만족스러운 시공 경험을 공유해주세요</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
				<form onSubmit={handleSubmit} className="nordic-card rounded-2xl p-6 md:p-10">
					<div className="space-y-6">
						{/* Company Name */}
						<div>
							<label htmlFor="rc-company" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Building className="w-4 h-4 text-forest-500" />
								업체명 <span className="text-red-500">*</span>
							</label>
							<input id="rc-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="예: OO인테리어" className={inputClass} required />
						</div>

						{/* Company Phone */}
						<div>
							<label htmlFor="rc-phone" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Phone className="w-4 h-4 text-forest-500" />
								업체 전화번호 <span className="text-red-500">*</span>
							</label>
							<input id="rc-phone" type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="02-1234-5678" className={inputClass} required />
						</div>

						{/* Business Number */}
						<div>
							<label htmlFor="rc-biz" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<FileText className="w-4 h-4 text-forest-500" />
								사업자번호 <span className="text-red-500">*</span>
							</label>
							<input id="rc-biz" type="text" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} placeholder="123-45-67890" className={inputClass} required />
						</div>

						{/* Region */}
						<div>
							<label htmlFor="rc-region" className="block text-sm font-semibold mb-2 text-sand-500">지역</label>
							<select id="rc-region" value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
								<option value="">선택 안 함</option>
								{['서울','경기','인천','부산','대구','대전','광주','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'].map(r => (
									<option key={r} value={r}>{r}</option>
								))}
							</select>
						</div>

						{/* Project Type */}
						<div>
							<label htmlFor="rc-type" className="block text-sm font-semibold mb-2 text-sand-500">시공유형</label>
							<select id="rc-type" value={projectType} onChange={(e) => setProjectType(e.target.value)} className={selectClass}>
								<option value="">선택 안 함</option>
								<option value="주거공간">주거공간</option>
								<option value="상업공간">상업공간</option>
							</select>
						</div>

						{/* Project Size */}
						<div>
							<label htmlFor="rc-size" className="block text-sm font-semibold mb-2 text-sand-500">시공 면적 (m²)</label>
							<input id="rc-size" type="number" value={projectSize} onChange={(e) => setProjectSize(e.target.value)} placeholder="예: 85" className={inputClass} />
							{projectSize && <p className="text-xs text-sand-400 mt-1.5">약 {(Number(projectSize) / 3.3058).toFixed(1)}평</p>}
						</div>

						{/* Project Cost */}
						<div>
							<label htmlFor="rc-cost" className="block text-sm font-semibold mb-2 text-sand-500">시공비용 (만원)</label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<input id="rc-cost" type="number" value={projectCost === '10000' ? '' : projectCost} onChange={(e) => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 9999)) { setProjectCost(v) } }} placeholder="예: 3000" className={`${inputClass} pr-14 ${projectCost === '10000' ? 'opacity-40' : ''}`} min={0} max={9999} disabled={projectCost === '10000'} />
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-sand-400">만원</span>
								</div>
								<button type="button" onClick={() => setProjectCost(projectCost === '10000' ? '' : '10000')} className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${projectCost === '10000' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-sand-500 border-sand-300 hover:border-forest-400'}`}>
									1억원 이상
								</button>
							</div>
							{projectCost && <p className="text-xs text-sand-400 mt-1.5">{formatKoreanMoney(Number(projectCost))}</p>}
						</div>

						{/* Rating */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Star className="w-4 h-4 text-forest-500" />
								별점 <span className="text-red-500">*</span>
							</label>
							<div className="flex gap-1.5">
								{[1, 2, 3, 4, 5].map((star) => (
									<button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
										<Star className={`w-9 h-9 transition-all ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-sand-300 hover:text-amber-300'}`} />
									</button>
								))}
							</div>
							{rating > 0 && <p className="text-sm text-forest-600 mt-1.5">{rating}점 선택됨</p>}
						</div>

						{/* Review Text */}
						<div>
							<label htmlFor="rc-text" className="block text-sm font-semibold mb-2 text-sand-700">
								후기 내용 <span className="text-red-500">*</span>
							</label>
							<textarea
								id="rc-text"
								value={reviewText}
								onChange={(e) => setReviewText(e.target.value)}
								placeholder="시공 경험, 업체의 장점, 추천 이유 등을 자유롭게 작성해주세요. (최소 10자)"
								rows={8}
								className={`${inputClass} resize-none`}
								required
							/>
							<div className="flex justify-between items-center mt-1.5">
								<p className="text-xs text-sand-400">최소 10자 이상 작성해주세요</p>
								<p className="text-xs text-sand-400">{reviewText.length}자</p>
							</div>
						</div>

						{/* Image Upload */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-sand-500 flex items-center gap-2">
								<ImageIcon className="w-4 h-4" />
								시공 사진 업로드 (선택, 최대 10장)
							</label>
							<p className="text-xs text-sand-400 mb-3">JPG, PNG, WebP 형식 지원 / 파일당 2MB 이하 / 최대 10장</p>

							<input type="file" id="rc-image-upload" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={images.length >= 10} />
							<label
								htmlFor="rc-image-upload"
								className={`flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
									images.length >= 10
										? 'border-sand-200 bg-sand-100 cursor-not-allowed text-sand-400'
										: 'border-sand-300 bg-white hover:bg-sand-50 hover:border-forest-400 text-sand-600'
								}`}
							>
								<ImageIcon className="w-5 h-5" />
								<span className="font-medium">
									{images.length >= 10 ? '최대 10장까지 업로드 가능' : `사진 추가 (${images.length}/10)`}
								</span>
							</label>

							{imagePreviews.length > 0 && (
								<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
									{imagePreviews.map((preview, index) => (
										<div key={index} className="relative group aspect-square">
											<img src={preview} alt={`사진 ${index + 1}`} className="w-full h-full object-cover rounded-xl border border-sand-200" />
											<button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<X className="w-4 h-4" />
											</button>
											<div className="absolute bottom-1 left-1 bg-sand-900/60 text-xs text-white px-2 py-0.5 rounded-lg">{index + 1}</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Notice */}
						<div className="bg-sand-100 border border-sand-200 rounded-xl p-4">
							<p className="text-sm text-sand-700 font-medium mb-1.5">안내사항</p>
							<ul className="text-xs text-sand-500 space-y-1 ml-1">
								<li>• 작성하신 후기는 관리자 승인 후 게시됩니다</li>
								<li>• 허위 사실이나 비방 내용은 게시가 거부될 수 있습니다</li>
								<li>• 연락처/사업자번호 입력 시 커뮤니티 데이터와 자동 연계됩니다</li>
							</ul>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={submitting || !companyName || !companyPhone || !businessNumber || rating === 0 || reviewText.length < 10}
							className="w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
						>
							{submitting ? (
								<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 제출 중...</>
							) : (
								<><Send className="w-5 h-5" /> 후기 등록하기</>
							)}
						</button>
					</div>
				</form>
			</div>

			<NordicFooter />
		</div>
	)
}
