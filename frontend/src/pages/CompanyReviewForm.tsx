import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { AnimatedBackground } from 'components/immersive'
import { motion } from 'framer-motion'
import { Star, ArrowLeft, Upload, X } from 'lucide-react'

interface FormData {
	title: string
	company_name: string
	region: string
	company_type: string
	content: string
	rating: number
	quality_rating: number
	price_rating: number
	communication_rating: number
	schedule_rating: number
	project_type: string
	project_size: number
	project_cost: number
	project_period: number
	is_recommended: boolean
	images: string[]
}

const CompanyReviewForm: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const isEditMode = !!id

	const [formData, setFormData] = useState<FormData>({
		title: '',
		company_name: '',
		region: '',
		company_type: '',
		content: '',
		rating: 5,
		quality_rating: 5,
		price_rating: 5,
		communication_rating: 5,
		schedule_rating: 5,
		project_type: '',
		project_size: 0,
		project_cost: 0,
		project_period: 0,
		is_recommended: true,
		images: []
	})

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [filePreviews, setFilePreviews] = useState<string[]>([])

	const token = localStorage.getItem('auth_token')

	useEffect(() => {
		if (isEditMode) {
			loadReview()
		}
	}, [id])

	const loadReview = async () => {
		try {
			setLoading(true)
			const response = await fetch(`http://localhost:3001/api/company-reviews/${id}`)

			if (!response.ok) {
				throw new Error('후기를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setFormData({
				title: data.title,
				company_name: data.company_name,
				region: data.region,
				company_type: data.company_type,
				content: data.content,
				rating: data.rating,
				quality_rating: data.quality_rating,
				price_rating: data.price_rating,
				communication_rating: data.communication_rating,
				schedule_rating: data.schedule_rating,
				project_type: data.project_type,
				project_size: data.project_size,
				project_cost: data.project_cost,
				project_period: data.project_period,
				is_recommended: data.is_recommended,
				images: data.images || []
			})
			setLoading(false)
		} catch (err) {
			console.error('Load review error:', err)
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
		if (!formData.company_name.trim()) {
			alert('업체명을 입력하세요.')
			return
		}
		if (!formData.content.trim()) {
			alert('후기 내용을 입력하세요.')
			return
		}

		try {
			setLoading(true)
			setError('')

			const url = isEditMode
				? `http://localhost:3001/api/company-reviews/${id}`
				: 'http://localhost:3001/api/company-reviews'

			const method = isEditMode ? 'PATCH' : 'POST'

			// Create FormData for file upload
			const submitData = new FormData()

			// Add all form fields
			Object.keys(formData).forEach((key) => {
				const value = formData[key as keyof FormData]
				if (key !== 'images') {
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
				throw new Error(errorData.error || '후기 저장에 실패했습니다.')
			}

			const result = await response.json()
			alert(isEditMode ? '후기가 수정되었습니다.' : '후기가 작성되었습니다.')
			navigate(`/community/reviews/${isEditMode ? id : result.id}`)
		} catch (err) {
			console.error('Submit error:', err)
			setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const handleRatingChange = (field: keyof FormData, value: number) => {
		setFormData({ ...formData, [field]: value })

		// Auto-calculate overall rating
		if (field !== 'rating') {
			const ratings = [
				field === 'quality_rating' ? value : formData.quality_rating,
				field === 'price_rating' ? value : formData.price_rating,
				field === 'communication_rating' ? value : formData.communication_rating,
				field === 'schedule_rating' ? value : formData.schedule_rating
			]
			const avgRating = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
			setFormData(prev => ({ ...prev, rating: avgRating }))
		}
	}

	const renderStarRating = (field: keyof FormData, value: number) => {
		return (
			<div className='flex items-center gap-2'>
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type='button'
						onClick={() => handleRatingChange(field, star)}
						className='focus:outline-none'
					>
						<Star
							size={32}
							className={
								star <= value
									? 'fill-yellow-400 text-yellow-400 cursor-pointer hover:scale-110 transition-transform'
									: 'text-gray-600 cursor-pointer hover:text-yellow-300 hover:scale-110 transition-all'
							}
						/>
					</button>
				))}
				<span className='ml-3 text-lg font-semibold text-cyan-300'>{value}점</span>
			</div>
		)
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
		const newPreviews = validFiles.map(file => URL.createObjectURL(file))

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
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]'></div>
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
					onClick={() => navigate('/community?tab=reviews')}
					className='flex items-center gap-2 text-gray-300 hover:text-cyan-400 mb-8 transition-all hover:gap-3'
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<ArrowLeft size={20} />
					<span>목록으로 돌아가기</span>
				</motion.button>

				{/* Form */}
				<motion.div
					className='glass-neon rounded-3xl p-10 border-2 border-cyan-500/30 max-w-4xl mx-auto'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h1 className='text-4xl font-bold text-glow-cyan mb-8' style={{
						background: 'linear-gradient(135deg, #0A9DAA, #06B6D4)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent'
					}}>
						{isEditMode ? '후기 수정' : '후기 작성'}
					</h1>

					{error && (
						<div className='glass-strong border-2 border-red-500/50 bg-red-900/20 text-red-300 px-6 py-4 rounded-xl mb-6'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-8'>
						{/* Basic Info */}
						<div className='space-y-6'>
							<h2 className='text-2xl font-bold text-cyan-300'>기본 정보</h2>

							<div>
								<label className='block text-sm font-semibold text-cyan-300 mb-3'>
									제목 <span className='text-red-400'>*</span>
								</label>
								<input
									type='text'
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
									placeholder='후기 제목을 입력하세요'
									className='w-full px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
									required
								/>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-semibold text-cyan-300 mb-3'>
										업체명 <span className='text-red-400'>*</span>
									</label>
									<input
										type='text'
										value={formData.company_name}
										onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
										placeholder='업체명'
										className='w-full px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-semibold text-cyan-300 mb-3'>
										지역 <span className='text-red-400'>*</span>
									</label>
									<select
										value={formData.region}
										onChange={(e) => setFormData({ ...formData, region: e.target.value })}
										className='w-full px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
										required
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

							<div>
								<label className='block text-sm font-semibold text-cyan-300 mb-3'>
									업체 유형 <span className='text-red-400'>*</span>
								</label>
								<select
									value={formData.company_type}
									onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
									className='w-full px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
									required
								>
									<option value='' className='bg-gray-900'>선택하세요</option>
									<option value='종합 인테리어' className='bg-gray-900'>종합 인테리어</option>
									<option value='주방/욕실' className='bg-gray-900'>주방/욕실</option>
									<option value='도배/장판' className='bg-gray-900'>도배/장판</option>
									<option value='전기/조명' className='bg-gray-900'>전기/조명</option>
									<option value='가구/목공' className='bg-gray-900'>가구/목공</option>
									<option value='기타' className='bg-gray-900'>기타</option>
								</select>
							</div>
						</div>

						{/* Ratings */}
						<div className='space-y-6 border-t border-cyan-500/20 pt-8'>
							<h2 className='text-2xl font-bold text-cyan-300'>평가</h2>

							<div className='glass-dark p-6 rounded-xl border border-cyan-500/20'>
								<label className='block text-sm font-semibold text-cyan-300 mb-4'>전체 평점</label>
								{renderStarRating('rating', formData.rating)}
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='glass-dark p-5 rounded-xl border border-cyan-500/20'>
									<label className='block text-sm font-semibold text-gray-300 mb-4'>시공 품질</label>
									{renderStarRating('quality_rating', formData.quality_rating)}
								</div>

								<div className='glass-dark p-5 rounded-xl border border-cyan-500/20'>
									<label className='block text-sm font-semibold text-gray-300 mb-4'>가격 만족도</label>
									{renderStarRating('price_rating', formData.price_rating)}
								</div>

								<div className='glass-dark p-5 rounded-xl border border-cyan-500/20'>
									<label className='block text-sm font-semibold text-gray-300 mb-4'>소통</label>
									{renderStarRating('communication_rating', formData.communication_rating)}
								</div>

								<div className='glass-dark p-5 rounded-xl border border-cyan-500/20'>
									<label className='block text-sm font-semibold text-gray-300 mb-4'>일정 준수</label>
									{renderStarRating('schedule_rating', formData.schedule_rating)}
								</div>
							</div>
						</div>

						{/* Project Info */}
						<div className='space-y-6 border-t border-cyan-500/20 pt-8'>
							<h2 className='text-2xl font-bold text-cyan-300'>시공 정보</h2>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>시공 유형</label>
									<input
										type='text'
										value={formData.project_type}
										onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
										placeholder='예: 아파트 전체, 주방 리모델링'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
									/>
								</div>

								<div>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>평수</label>
									<input
										type='number'
										value={formData.project_size || ''}
										onChange={(e) =>
											setFormData({ ...formData, project_size: parseInt(e.target.value) || 0 })
										}
										placeholder='평수 입력'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
									/>
								</div>

								<div>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>비용 (만원)</label>
									<input
										type='number'
										value={formData.project_cost || ''}
										onChange={(e) =>
											setFormData({ ...formData, project_cost: parseInt(e.target.value) || 0 })
										}
										placeholder='비용 입력'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
									/>
								</div>

								<div>
									<label className='block text-sm font-semibold text-gray-300 mb-3'>기간 (일)</label>
									<input
										type='number'
										value={formData.project_period || ''}
										onChange={(e) =>
											setFormData({ ...formData, project_period: parseInt(e.target.value) || 0 })
										}
										placeholder='시공 기간'
										className='w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all'
									/>
								</div>
							</div>
						</div>

						{/* Content */}
						<div className='border-t border-cyan-500/20 pt-8'>
							<label className='block text-sm font-semibold text-cyan-300 mb-3'>
								후기 내용 <span className='text-red-400'>*</span>
							</label>
							<textarea
								value={formData.content}
								onChange={(e) => setFormData({ ...formData, content: e.target.value })}
								placeholder='상세한 후기를 작성해주세요...'
								className='w-full px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all resize-none'
								rows={10}
								required
							/>
						</div>

						{/* Images */}
						<div className='border-t border-cyan-500/20 pt-8'>
							<label className='block text-sm font-semibold text-cyan-300 mb-3'>
								시공 사진
								<span className='text-gray-400 text-xs ml-2'>(최대 20장, 각 2MB 이하)</span>
							</label>

							{/* File Upload Button */}
							<div className='mb-6'>
								<label className='flex items-center justify-center gap-3 px-8 py-6 glass-dark border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5 transition-all group'>
									<Upload size={24} className='text-cyan-400 group-hover:scale-110 transition-transform' />
									<span className='text-gray-300 font-semibold'>이미지 파일 선택</span>
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
									<h3 className='text-sm font-semibold text-cyan-300 mb-3'>새로 추가된 이미지</h3>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
										{selectedFiles.map((file, index) => (
											<div key={index} className='relative group'>
												<img
													src={filePreviews[index]}
													alt={`새 이미지 ${index + 1}`}
													className='w-full h-32 object-cover rounded-xl border-2 border-cyan-600 group-hover:border-cyan-400 transition-all'
												/>
												<div className='absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 rounded-b-xl'>
													<p className='text-xs text-cyan-300 truncate'>{file.name}</p>
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
									<h3 className='text-sm font-semibold text-gray-300 mb-3'>기존 이미지</h3>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
										{formData.images.map((img, index) => (
											<div key={index} className='relative group'>
												<img
													src={img}
													alt={`기존 이미지 ${index + 1}`}
													className='w-full h-32 object-cover rounded-xl border-2 border-gray-600 group-hover:border-cyan-400 transition-all'
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

						{/* Recommendation */}
						<div className='border-t border-cyan-500/20 pt-8'>
							<label className='flex items-center gap-3 cursor-pointer group'>
								<input
									type='checkbox'
									checked={formData.is_recommended}
									onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
									className='w-6 h-6 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2'
								/>
								<span className='text-gray-200 font-semibold group-hover:text-cyan-300 transition-colors'>이 업체를 추천합니다</span>
							</label>
						</div>

						{/* Submit Buttons */}
						<div className='flex gap-4 pt-8'>
							<button
								type='button'
								onClick={() => navigate('/community?tab=reviews')}
								className='flex-1 px-6 py-4 glass-dark border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-800/50 transition-all font-semibold'
								disabled={loading}
							>
								취소
							</button>
							<button
								type='submit'
								className='flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
								disabled={loading}
							>
								{loading ? '저장 중...' : isEditMode ? '수정하기' : '작성하기'}
							</button>
						</div>
					</form>
				</motion.div>
			</main>

			<ZipCheckFooter />
		</div>
	)
}

export default CompanyReviewForm
