import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Building, Phone, FileText, Send, ArrowLeft, ImagePlus } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { getApiUrl } from '../../lib/api-config'

export default function DamageCaseCreate() {
	const navigate = useNavigate()
	const [submitting, setSubmitting] = useState(false)

	// Form fields
	const [companyName, setCompanyName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [damageType, setDamageType] = useState('')
	const [damageAmount, setDamageAmount] = useState('')
	const [caseDescription, setCaseDescription] = useState('')
	const [evidenceImages, setEvidenceImages] = useState<File[]>([])

	const damageTypes = [
		'시공 불량',
		'계약 위반',
		'금전 사기',
		'자재 불량',
		'공사 지연',
		'사후 서비스 불이행',
		'기타'
	]

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

		// Check authentication
		const token = localStorage.getItem('auth_token')
		if (!token) {
			alert('로그인이 필요합니다. 로그인 후 이용해주세요.')
			navigate('/login')
			return
		}

		// Validate: 업체명, 연락처, 사업자번호 모두 필수
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

			// Add images
			evidenceImages.forEach((image, index) => {
				formData.append(`evidence_images`, image)
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

			const data = await response.json()
			alert('✅ 피해사례가 등록되었습니다! 관리자 승인 후 게시됩니다.')
			navigate(`/community?tab=damage-cases`)
		} catch (error) {
			console.error('Failed to submit damage case:', error)
			alert('❌ ' + (error instanceof Error ? error.message : '피해사례 등록에 실패했습니다.'))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-3xl">
					{/* Back Button */}
					<motion.button
						onClick={() => navigate('/community?tab=damage-cases')}
						className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<ArrowLeft className="w-5 h-5" />
						<span>커뮤니티로 돌아가기</span>
					</motion.button>

					{/* Page Title */}
					<motion.div
						className="text-center mb-12"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1
							className="text-5xl md:text-6xl font-bold mb-4"
							style={{
								background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.6))'
							}}
						>
							피해사례 제보
						</h1>
						<p className="text-lg text-gray-300">부당한 피해 사례를 공유하여 다른 사람들을 보호하세요</p>
					</motion.div>

					{/* Form */}
					<motion.form
						onSubmit={handleSubmit}
						className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30"
						style={{
							boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.05)'
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{/* Company Name */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
								<Building className="w-4 h-4" />
								업체명 <span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder="예: OO인테리어"
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
								required
							/>
						</div>

						{/* Company Phone */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
								<Phone className="w-4 h-4" />
								업체 전화번호 <span className="text-red-400">*</span>
							</label>
							<input
								type="tel"
								value={companyPhone}
								onChange={(e) => setCompanyPhone(e.target.value)}
								placeholder="02-1234-5678"
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
								required
							/>
						</div>

						{/* Business Number */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
								<FileText className="w-4 h-4" />
								사업자번호 <span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								value={businessNumber}
								onChange={(e) => setBusinessNumber(e.target.value)}
								placeholder="123-45-67890"
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
								required
							/>
						</div>

						{/* Damage Type */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400 flex items-center gap-2">
								<AlertTriangle className="w-4 h-4" />
								피해 유형 <span className="text-red-400">*</span>
							</label>
							<select
								value={damageType}
								onChange={(e) => setDamageType(e.target.value)}
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
								required
							>
								<option value="" className="bg-gray-900 text-white">선택해주세요</option>
								{damageTypes.map((type) => (
									<option key={type} value={type} className="bg-gray-900 text-white">
										{type}
									</option>
								))}
							</select>
						</div>

						{/* Damage Amount (Optional) */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-gray-300">
								피해 금액 (선택)
							</label>
							<input
								type="text"
								value={damageAmount}
								onChange={(e) => setDamageAmount(e.target.value)}
								placeholder="예: 500만원"
								className="w-full px-5 py-4 bg-black/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
							/>
						</div>

						{/* Case Description */}
						<div className="mb-6">
							<label className="block text-sm font-semibold mb-3 text-cyan-400">
								피해 내용 <span className="text-red-400">*</span>
							</label>
							<textarea
								value={caseDescription}
								onChange={(e) => setCaseDescription(e.target.value)}
								placeholder="피해 경위, 시공 내용, 업체의 문제점 등을 상세히 작성해주세요. (최소 20자)"
								rows={10}
								className="w-full px-5 py-4 bg-black/60 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all resize-none"
								required
							/>
							<div className="flex justify-between items-center mt-2">
								<p className="text-xs text-gray-400">최소 20자 이상 작성해주세요</p>
								<p className="text-xs text-gray-400">{caseDescription.length}자</p>
							</div>
						</div>

						{/* Evidence Images */}
						<div className="mb-8">
							<label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
								<ImagePlus className="w-4 h-4" />
								증거 사진 (선택)
							</label>
							<div className="border-2 border-dashed border-gray-600/50 rounded-xl p-6 text-center hover:border-cyan-400/50 transition-colors">
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageUpload}
									className="hidden"
									id="evidence-upload"
								/>
								<label
									htmlFor="evidence-upload"
									className="cursor-pointer flex flex-col items-center gap-3"
								>
									<ImagePlus className="w-12 h-12 text-gray-400" />
									<p className="text-gray-300">클릭하여 이미지 업로드</p>
									<p className="text-xs text-gray-500">JPG, PNG, GIF (최대 10MB)</p>
								</label>
							</div>

							{/* Image Previews */}
							{evidenceImages.length > 0 && (
								<div className="grid grid-cols-3 gap-4 mt-4">
									{evidenceImages.map((image, index) => (
										<div key={index} className="relative group">
											<img
												src={URL.createObjectURL(image)}
												alt={`증거 ${index + 1}`}
												className="w-full h-32 object-cover rounded-lg border border-cyan-500/30"
											/>
											<button
												type="button"
												onClick={() => removeImage(index)}
												className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Notice */}
						<div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
							<p className="text-sm text-blue-300">
								💡 <strong>안내사항</strong>
							</p>
							<ul className="text-xs text-gray-300 mt-2 space-y-1 ml-4">
								<li>• 작성하신 피해사례는 관리자 검토 후 게시됩니다</li>
								<li>• 허위 사실이나 명예훼손 내용은 게시가 거부되며 법적 책임을 질 수 있습니다</li>
								<li>• 구체적인 증거와 함께 제출하시면 신뢰도가 높아집니다</li>
								<li>• 개인정보 보호를 위해 민감한 정보는 제외해주세요</li>
							</ul>
						</div>

						{/* Submit Button */}
						<motion.button
							type="submit"
							disabled={submitting || !companyName || !companyPhone || !businessNumber || !damageType || caseDescription.length < 20}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
							style={{
								boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
							}}
						>
							{submitting ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									제출 중...
								</>
							) : (
								<>
									<Send className="w-5 h-5" />
									피해사례 제보하기
								</>
							)}
						</motion.button>
					</motion.form>
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
