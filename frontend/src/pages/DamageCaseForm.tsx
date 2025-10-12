import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { AnimatedBackground } from 'components/immersive'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, X, Upload } from 'lucide-react'

interface FormData {
	title: string
	company_name: string
	region: string
	content: string
	damage_type: string
	damage_amount: number
	resolution_status: string
	resolution_details: string
	legal_action: boolean
	legal_details: string
	images: string[]
	documents: string[]
}

const DamageCaseForm: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const isEditMode = !!id

	const [formData, setFormData] = useState<FormData>({
		title: '',
		company_name: '',
		region: '',
		content: '',
		damage_type: '',
		damage_amount: 0,
		resolution_status: 'unresolved',
		resolution_details: '',
		legal_action: false,
		legal_details: '',
		images: [],
		documents: []
	})

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [filePreviews, setFilePreviews] = useState<string[]>([])

	const token = localStorage.getItem('auth_token')

	useEffect(() => {
		if (isEditMode) {
			loadDamageCase()
		}
	}, [id])

	const loadDamageCase = async () => {
		try {
			setLoading(true)
			const response = await fetch(`http://localhost:3001/api/damage-cases/${id}`)

			if (!response.ok) {
				throw new Error('피해사례를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setFormData({
				title: data.title,
				company_name: data.company_name || '',
				region: data.region || '',
				content: data.content,
				damage_type: data.damage_type,
				damage_amount: data.damage_amount,
				resolution_status: data.resolution_status,
				resolution_details: data.resolution_details || '',
				legal_action: data.legal_action,
				legal_details: data.legal_details || '',
				images: data.images || [],
				documents: data.documents || []
			})
			setLoading(false)
		} catch (err) {
			console.error('Load damage case error:', err)
			setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!token) {
			alert('로그인이 필요합니다.')
			navigate('/admin/login')
			return
		}

		// Validation
		if (!formData.title.trim()) {
			alert('제목을 입력하세요.')
			return
		}
		if (!formData.content.trim()) {
			alert('피해 내용을 입력하세요.')
			return
		}
		if (!formData.damage_type) {
			alert('피해 유형을 선택하세요.')
			return
		}

		try {
			setLoading(true)
			setError('')

			const url = isEditMode
				? `http://localhost:3001/api/damage-cases/${id}`
				: 'http://localhost:3001/api/damage-cases'

			const method = isEditMode ? 'PATCH' : 'POST'

			// Create FormData for file upload
			const submitData = new FormData()

			// Add all form fields
			Object.keys(formData).forEach((key) => {
				const value = formData[key as keyof FormData]
				if (key !== 'images' && key !== 'documents') {
					submitData.append(key, value.toString())
				}
			})

			// Add image files
			selectedFiles.forEach((file) => {
				submitData.append('images', file)
			})

			// Add existing images if in edit mode
			if (isEditMode && formData.images.length > 0) {
				formData.images.forEach((img) => {
					submitData.append('existing_images', img)
				})
			}

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`
					// Note: Don't set Content-Type, browser will set it with boundary for FormData
				},
				body: submitData
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || '피해사례 저장에 실패했습니다.')
			}

			const result = await response.json()
			alert(isEditMode ? '피해사례가 수정되었습니다.' : '피해사례가 등록되었습니다.')
			navigate(`/community/damage-cases/${isEditMode ? id : result.data.id}`)
		} catch (err) {
			console.error('Submit error:', err)
			setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])

		// Validate file count
		const totalFiles = selectedFiles.length + files.length
		if (totalFiles > 20) {
			alert('최대 20장까지 업로드할 수 있습니다.')
			return
		}

		// Validate file sizes and types
		const validFiles: File[] = []
		for (const file of files) {
			// Check file size (2MB max)
			if (file.size > 2 * 1024 * 1024) {
				alert(`${file.name} 파일 크기가 2MB를 초과합니다.`)
				continue
			}

			// Check file type
			if (!file.type.startsWith('image/')) {
				alert(`${file.name}은(는) 이미지 파일이 아닙니다.`)
				continue
			}

			validFiles.push(file)
		}

		// Create preview URLs
		const newPreviews = validFiles.map((file) => URL.createObjectURL(file))

		setSelectedFiles([...selectedFiles, ...validFiles])
		setFilePreviews([...filePreviews, ...newPreviews])
	}

	const removeFile = (index: number) => {
		// Revoke preview URL to prevent memory leaks
		URL.revokeObjectURL(filePreviews[index])

		setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
		setFilePreviews(filePreviews.filter((_, i) => i !== index))
	}

	const removeImage = (index: number) => {
		setFormData({
			...formData,
			images: formData.images.filter((_, i) => i !== index)
		})
	}

	if (loading && isEditMode) {
		return (
			<div className='min-h-screen bg-black flex items-center justify-center'>
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]'></div>
			</div>
		)
	}

	return (
		<div className='relative min-h-screen bg-black text-white'>
			<ZipCheckHeader />

			<AnimatedBackground />

			<main className='relative z-10 container mx-auto px-4 py-12 mt-20'>
				{/* Back Button */}
				<motion.button
					onClick={() => navigate('/community?tab=damage-cases')}
					className='flex items-center gap-2 text-gray-300 hover:text-red-400 mb-8 transition-all hover:gap-3'
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<ArrowLeft size={20} />
					<span>목록으로 돌아가기</span>
				</motion.button>

				{/* Warning */}
				<motion.div
					className='glass-neon border-2 border-red-500/50 bg-red-900/10 p-8 mb-8 rounded-2xl'
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<div className='flex items-start gap-4'>
						<AlertTriangle className='text-red-400 flex-shrink-0 mt-1' size={32} />
						<div>
							<h3 className='text-xl font-bold text-red-300 mb-4'>⚠️ 주의사항 (필독)</h3>
							<div className='text-gray-300 leading-relaxed space-y-3'>
								<p className='font-semibold text-red-200 text-lg'>
									본 게시판은 업체 비방을 하는 곳이 아닙니다.
								</p>
								<p>
									실제 인테리어 진행 시 피해를 본 내용과 사례를 공유하여
									동일한 피해사례가 늘어나지 않기 위함입니다.
								</p>
								<div className='bg-red-950/50 border border-red-500/30 p-4 rounded-xl mt-4'>
									<p className='text-sm text-red-300 font-semibold'>
										※ 게시판 등록 내용으로 인한 법적 분쟁은 게시글 작성자에게 있음을 안내드립니다.
									</p>
									<p className='text-sm text-gray-400 mt-2'>
										허위 사실 유포는 법적 책임이 따를 수 있으니, 실제 경험한 피해 사실만 작성해주세요.
									</p>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Form */}
				<motion.div
					className='glass-neon rounded-3xl p-10 border-2 border-red-500/30 max-w-4xl mx-auto'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h1 className='text-4xl font-bold text-glow-red mb-8' style={{
						background: 'linear-gradient(135deg, #EF4444, #DC2626)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent'
					}}>
						{isEditMode ? '피해사례 수정' : '피해사례 등록'}
					</h1>

					{error && (
						<div className='glass-strong border-2 border-red-500/50 bg-red-900/20 text-red-300 px-6 py-4 rounded-xl mb-6'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-8'>
						{/* Basic Info */}
						<div className='space-y-6'>
							<h2 className='text-2xl font-bold text-red-300'>기본 정보</h2>

							<div>
								<label className='block text-sm font-semibold text-red-300 mb-3'>
									제목 <span className='text-red-400'>*</span>
								</label>
								<input
									type='text'
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
									placeholder='피해사례 제목을 입력하세요'
									className='w-full px-5 py-4 glass-dark border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
									required
								/>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>
										업체명 (선택사항)
									</label>
									<input
										type='text'
										value={formData.company_name}
										onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
										placeholder='업체명 (알고 있는 경우)'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
									/>
								</div>

								<div>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>
										지역 (선택사항)
									</label>
									<select
										value={formData.region}
										onChange={(e) => setFormData({ ...formData, region: e.target.value })}
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
									>
										<option value='' className='bg-gray-900'>선택하세요</option>
										<option value='서울' className='bg-gray-900'>서울</option>
										<option value='경기' className='bg-gray-900'>경기</option>
										<option value='인천' className='bg-gray-900'>인천</option>
										<option value='부산' className='bg-gray-900'>부산</option>
										<option value='대구' className='bg-gray-900'>대구</option>
										<option value='대전' className='bg-gray-900'>대전</option>
										<option value='광주' className='bg-gray-900'>광주</option>
										<option value='울산' className='bg-gray-900'>울산</option>
									</select>
								</div>
							</div>
						</div>

						{/* Damage Info */}
						<div className='space-y-6 border-t border-red-500/20 pt-8'>
							<h2 className='text-2xl font-bold text-red-300'>피해 정보</h2>

							<div>
								<label className='block text-sm font-semibold text-red-300 mb-3'>
									피해 유형 <span className='text-red-400'>*</span>
								</label>
								<select
									value={formData.damage_type}
									onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
									className='w-full px-5 py-4 glass-dark border border-red-500/30 rounded-xl text-white focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
									required
								>
									<option value='' className='bg-gray-900'>선택하세요</option>
									<option value='사기' className='bg-gray-900'>사기</option>
									<option value='부실시공' className='bg-gray-900'>부실시공</option>
									<option value='계약위반' className='bg-gray-900'>계약위반</option>
									<option value='추가비용' className='bg-gray-900'>추가비용</option>
									<option value='기타' className='bg-gray-900'>기타</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-semibold text-gray-300 mb-3'>
									피해 금액 (만원)
								</label>
								<input
									type='number'
									value={formData.damage_amount || ''}
									onChange={(e) =>
										setFormData({ ...formData, damage_amount: parseInt(e.target.value) || 0 })
									}
									placeholder='피해 금액 입력'
									className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
								/>
							</div>
						</div>

						{/* Content */}
						<div className='border-t border-red-500/20 pt-8'>
							<label className='block text-sm font-semibold text-red-300 mb-3'>
								피해 내용 <span className='text-red-400'>*</span>
							</label>
							<textarea
								value={formData.content}
								onChange={(e) => setFormData({ ...formData, content: e.target.value })}
								placeholder='피해 상황을 자세히 설명해주세요...'
								className='w-full px-5 py-4 glass-dark border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all resize-none'
								rows={10}
								required
							/>
						</div>

						{/* Resolution Status */}
						<div className='space-y-6 border-t border-red-500/20 pt-8'>
							<h2 className='text-2xl font-bold text-red-300'>해결 상태</h2>

							<div>
								<label className='block text-sm font-semibold text-gray-300 mb-3'>현재 상태</label>
								<select
									value={formData.resolution_status}
									onChange={(e) => setFormData({ ...formData, resolution_status: e.target.value })}
									className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
								>
									<option value='unresolved' className='bg-gray-900'>미해결</option>
									<option value='in_progress' className='bg-gray-900'>진행중</option>
									<option value='resolved' className='bg-gray-900'>해결됨</option>
								</select>
							</div>

							{formData.resolution_status !== 'unresolved' && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
								>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>
										해결 진행 상황
									</label>
									<textarea
										value={formData.resolution_details}
										onChange={(e) => setFormData({ ...formData, resolution_details: e.target.value })}
										placeholder='현재 진행 상황이나 해결 과정을 설명해주세요...'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all resize-none'
										rows={5}
									/>
								</motion.div>
							)}
						</div>

						{/* Legal Action */}
						<div className='space-y-6 border-t border-red-500/20 pt-8'>
							<h2 className='text-2xl font-bold text-red-300'>법적 조치</h2>

							<label className='flex items-center gap-3 cursor-pointer group'>
								<input
									type='checkbox'
									checked={formData.legal_action}
									onChange={(e) => setFormData({ ...formData, legal_action: e.target.checked })}
									className='w-6 h-6 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2'
								/>
								<span className='text-gray-200 font-semibold group-hover:text-red-300 transition-colors'>법적 조치를 진행하고 있습니다</span>
							</label>

							{formData.legal_action && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
								>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>
										법적 조치 내용
									</label>
									<textarea
										value={formData.legal_details}
										onChange={(e) => setFormData({ ...formData, legal_details: e.target.value })}
										placeholder='진행 중인 법적 조치에 대해 설명해주세요...'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all resize-none'
										rows={5}
									/>
								</motion.div>
							)}
						</div>

						{/* Evidence Images */}
						<div className='border-t border-red-500/20 pt-8'>
							<label className='block text-sm font-semibold text-red-300 mb-3'>
								증거 사진
								<span className='text-gray-400 text-xs ml-2'>(최대 20장, 각 2MB 이하)</span>
							</label>

							{/* File Upload Button */}
							<div className='mb-6'>
								<label className='flex items-center justify-center gap-3 px-8 py-6 glass-dark border-2 border-dashed border-red-500/30 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-500/5 transition-all group'>
									<Upload size={24} className='text-red-400 group-hover:scale-110 transition-transform' />
									<span className='text-gray-300 font-semibold'>증거 사진 선택</span>
									<input
										type='file'
										multiple
										accept='image/*'
										onChange={handleFileSelect}
										className='hidden'
									/>
								</label>
								<p className='text-xs text-gray-500 mt-2 text-center'>
									{selectedFiles.length + formData.images.length} / 20 장
								</p>
							</div>

							{/* New File Previews */}
							{selectedFiles.length > 0 && (
								<div className='mb-6'>
									<h3 className='text-sm font-semibold text-red-300 mb-3'>새로 추가된 사진</h3>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
										{selectedFiles.map((file, index) => (
											<div key={index} className='relative group'>
												<img
													src={filePreviews[index]}
													alt={`새 증거 사진 ${index + 1}`}
													className='w-full h-32 object-cover rounded-xl border-2 border-red-600 group-hover:border-red-400 transition-all'
												/>
												<div className='absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 rounded-b-xl'>
													<p className='text-xs text-red-300 truncate'>{file.name}</p>
													<p className='text-xs text-gray-400'>
														{(file.size / 1024).toFixed(0)}KB
													</p>
												</div>
												<button
													type='button'
													onClick={() => removeFile(index)}
													className='absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg'
												>
													<X size={16} />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Existing Images (Edit Mode) */}
							{formData.images.length > 0 && (
								<div>
									<h3 className='text-sm font-semibold text-gray-300 mb-3'>기존 사진</h3>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
										{formData.images.map((img, index) => (
											<div key={index} className='relative group'>
												<img
													src={img}
													alt={`기존 증거 사진 ${index + 1}`}
													className='w-full h-32 object-cover rounded-xl border-2 border-gray-600 group-hover:border-red-400 transition-all'
												/>
												<button
													type='button'
													onClick={() => removeImage(index)}
													className='absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg'
												>
													<X size={16} />
												</button>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Documents */}
						<div className='border-t border-red-500/20 pt-8'>
							<label className='block text-sm font-semibold text-red-300 mb-3'>관련 문서</label>
							<div className='flex gap-3 mb-6'>
								<input
									type='url'
									value={documentUrl}
									onChange={(e) => setDocumentUrl(e.target.value)}
									placeholder='문서 URL 입력 (계약서, 견적서 등)'
									className='flex-1 px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all'
								/>
								<button
									type='button'
									onClick={addDocumentUrl}
									className='px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/30'
								>
									추가
								</button>
							</div>

							{formData.documents.length > 0 && (
								<div className='space-y-3'>
									{formData.documents.map((doc, index) => (
										<div
											key={index}
											className='flex items-center justify-between p-4 glass-dark rounded-xl border border-gray-600'
										>
											<span className='text-gray-300 truncate flex-1'>문서 {index + 1}</span>
											<button
												type='button'
												onClick={() => removeDocument(index)}
												className='ml-3 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors'
											>
												<X size={18} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Submit Buttons */}
						<div className='flex gap-4 pt-8'>
							<button
								type='button'
								onClick={() => navigate('/community?tab=damage-cases')}
								className='flex-1 px-6 py-4 glass-dark border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-800/50 transition-all font-semibold'
								disabled={loading}
							>
								취소
							</button>
							<button
								type='submit'
								className='flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
								disabled={loading}
							>
								{loading ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
							</button>
						</div>
					</form>
				</motion.div>
			</main>

			<ZipCheckFooter />
		</div>
	)
}

export default DamageCaseForm
