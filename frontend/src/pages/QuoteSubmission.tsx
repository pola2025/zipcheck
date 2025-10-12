import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, FileSpreadsheet, User, Phone, Mail, Home, MapPin, Building, Camera, CheckCircle2, Plus, Trash2, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'

interface QuoteItem {
	category: string
	item: string
	quantity: number
	unit: string
	unit_price: number
	total_price: number
	notes?: string
}

interface PaymentInfo {
	paymentId: string
	planId: string
	planName: string
	price: number
	customerName: string
	customerPhone: string
	customerEmail: string
}

export default function QuoteSubmission() {
	const navigate = useNavigate()
	const location = useLocation()
	const paymentInfo = location.state as PaymentInfo | null

	const [step, setStep] = useState(1)

	// Customer Info (auto-filled from payment)
	const [customerName, setCustomerName] = useState(paymentInfo?.customerName || '')
	const [customerPhone, setCustomerPhone] = useState(paymentInfo?.customerPhone || '')
	const [customerEmail, setCustomerEmail] = useState(paymentInfo?.customerEmail || '')

	// Property Info
	const [propertyType, setPropertyType] = useState('')
	const [propertySize, setPropertySize] = useState('')
	const [region, setRegion] = useState('')
	const [address, setAddress] = useState('')

	// Quote Items
	const [items, setItems] = useState<QuoteItem[]>([])
	const [fileName, setFileName] = useState('')
	const [uploading, setUploading] = useState(false)
	const [uploadType, setUploadType] = useState<'excel' | 'image'>('excel')
	const [imagePreviews, setImagePreviews] = useState<string[]>([])
	const [imageFileNames, setImageFileNames] = useState<string[]>([])

	// Redirect if no payment info
	useEffect(() => {
		if (!paymentInfo) {
			alert('결제를 먼저 진행해주세요.')
			navigate('/plan-selection')
		}
	}, [paymentInfo, navigate])

	if (!paymentInfo) {
		return null
	}

	// Parse Excel file
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setFileName(file.name)
		setUploading(true)

		try {
			const data = await file.arrayBuffer()
			const workbook = XLSX.read(data, { type: 'array' })
			const sheetName = workbook.SheetNames[0]
			const worksheet = workbook.Sheets[sheetName]
			const jsonData = XLSX.utils.sheet_to_json(worksheet)

			// Parse items from Excel
			const parsedItems: QuoteItem[] = jsonData.map((row: any) => ({
				category: row['카테고리'] || row['Category'] || '',
				item: row['항목명'] || row['Item'] || row['항목'] || '',
				quantity: Number(row['수량'] || row['Quantity'] || 1),
				unit: row['단위'] || row['Unit'] || '개',
				unit_price: Number(row['단가'] || row['UnitPrice'] || row['Unit Price'] || 0),
				total_price: Number(row['총액'] || row['TotalPrice'] || row['Total'] || 0),
				notes: row['비고'] || row['Notes'] || ''
			}))

			setItems(parsedItems)
			alert(`✅ ${parsedItems.length}개 항목을 불러왔습니다!`)
		} catch (error) {
			console.error('Excel parsing error:', error)
			alert('❌ Excel 파일 읽기에 실패했습니다. 파일 형식을 확인해주세요.')
		} finally {
			setUploading(false)
		}
	}

	// Parse Image with AI Vision - supports up to 3 images
	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		const MAX_IMAGES = 3
		const currentImageCount = imagePreviews.length

		// Check max limit
		if (currentImageCount >= MAX_IMAGES) {
			alert(`❌ 최대 ${MAX_IMAGES}장까지만 업로드 가능합니다. 추가 내용은 직접 작성해주세요.`)
			event.target.value = '' // Reset input
			return
		}

		// Check if all files are images
		const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
		if (imageFiles.length === 0) {
			alert('❌ 이미지 파일만 업로드 가능합니다.')
			event.target.value = ''
			return
		}

		if (imageFiles.length !== files.length) {
			alert(`⚠️ ${files.length - imageFiles.length}개의 비이미지 파일이 제외되었습니다.`)
		}

		// Limit to remaining slots
		const remainingSlots = MAX_IMAGES - currentImageCount
		const filesToUpload = imageFiles.slice(0, remainingSlots)

		if (imageFiles.length > remainingSlots) {
			alert(`⚠️ ${remainingSlots}장만 업로드됩니다. (최대 ${MAX_IMAGES}장 제한)`)
		}

		setUploading(true)

		try {
			// Create previews for new images
			const newPreviews: string[] = []
			const newFileNames: string[] = []

			for (const file of filesToUpload) {
				newFileNames.push(file.name)
				const reader = new FileReader()
				const preview = await new Promise<string>((resolve) => {
					reader.onload = (e) => {
						resolve(e.target?.result as string)
					}
					reader.readAsDataURL(file)
				})
				newPreviews.push(preview)
			}

			// Add to existing images
			setImagePreviews([...imagePreviews, ...newPreviews])
			setImageFileNames([...imageFileNames, ...newFileNames])

			// Upload to server for OCR/Vision API processing
			const formData = new FormData()
			filesToUpload.forEach(file => {
				formData.append('images', file)
			})

			const response = await fetch('http://localhost:3001/api/quote-requests/parse-image', {
				method: 'POST',
				body: formData
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || '이미지 분석에 실패했습니다.')
			}

			const result = await response.json()

			if (result.items && result.items.length > 0) {
				// Add new items to existing items
				setItems([...items, ...result.items])
				alert(`✅ ${filesToUpload.length}장의 이미지에서 ${result.items.length}개 항목을 추출했습니다! 확인 후 수정하실 수 있습니다.`)
			} else {
				alert('⚠️ 견적 항목을 추출하지 못했습니다. 수동으로 입력해주세요.')
			}
		} catch (error) {
			console.error('Image parsing error:', error)
			alert('❌ 이미지 분석에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setUploading(false)
			event.target.value = '' // Reset input for next upload
		}
	}

	// Remove a specific image
	const removeImage = (index: number) => {
		setImagePreviews(imagePreviews.filter((_, i) => i !== index))
		setImageFileNames(imageFileNames.filter((_, i) => i !== index))
	}

	// Update a specific item field
	const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
		const updatedItems = [...items]
		if (field === 'quantity' || field === 'unit_price' || field === 'total_price') {
			updatedItems[index][field] = Number(value) || 0
		} else {
			updatedItems[index][field] = value as any
		}
		setItems(updatedItems)
	}

	// Add new empty item
	const addNewItem = () => {
		const newItem: QuoteItem = {
			category: '',
			item: '',
			quantity: 1,
			unit: '개',
			unit_price: 0,
			total_price: 0,
			notes: ''
		}
		setItems([...items, newItem])
	}

	// Delete an item
	const deleteItem = (index: number) => {
		if (confirm('이 항목을 삭제하시겠습니까?')) {
			setItems(items.filter((_, i) => i !== index))
		}
	}

	// Submit quote request
	const submitQuote = async () => {
		// Validation
		if (!customerName || !customerPhone || !propertyType || !region) {
			alert('필수 정보를 모두 입력해주세요.')
			return
		}

		if (items.length === 0) {
			alert('견적 항목을 업로드해주세요.')
			return
		}

		setUploading(true)
		try {
			const response = await fetch('http://localhost:3001/api/quote-requests/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					customer_name: customerName,
					customer_phone: customerPhone,
					customer_email: customerEmail,
					property_type: propertyType,
					property_size: propertySize ? Number(propertySize) : undefined,
					region,
					address,
					items
				})
			})

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || '견적 신청에 실패했습니다.')
			}

			if (result.success === false) {
				alert(`⚠️ ${result.message}\n${result.validation_notes || ''}`)
				return
			}

			alert(`✅ ${result.message}\n\n신청 ID: ${result.request_id}\n전화번호로 진행 상황을 확인하실 수 있습니다.`)

			// Navigate to status page
			navigate(`/quote-status?phone=${encodeURIComponent(customerPhone)}`)
		} catch (error) {
			console.error('Quote submission error:', error)
			alert('❌ 견적 신청에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setUploading(false)
		}
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated neon background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-5xl">
					{/* Page Title */}
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1
							className="text-5xl md:text-7xl font-bold mb-6 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0A9DAA, #9B6BA8, #C9A86A)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							견적 분석 신청
						</h1>
						<p className="text-xl md:text-2xl text-gray-300">Excel 파일 또는 견적서 사진을 업로드하여 AI 견적 분석을 신청하세요</p>
					</motion.div>

					{/* Progress Steps */}
					<div className="flex items-center justify-center mb-16">
						<div className="flex items-center gap-6">
							<motion.div
								className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-xl ${
									step >= 1
										? 'bg-gradient-to-r from-cyan-500 to-blue-600 glow-cyan text-white'
										: 'glass-dark text-gray-500'
								}`}
								animate={
									step >= 1
										? {
												boxShadow: [
													'0 0 20px rgba(6, 182, 212, 0.4)',
													'0 0 40px rgba(6, 182, 212, 0.6)',
													'0 0 20px rgba(6, 182, 212, 0.4)'
												]
											}
										: {}
								}
								transition={{ duration: 2, repeat: Infinity }}
							>
								1
							</motion.div>
							<div className={`h-2 w-24 rounded ${step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : 'bg-gray-800'}`} />
							<motion.div
								className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-xl ${
									step >= 2
										? 'bg-gradient-to-r from-cyan-500 to-purple-600 glow-cyan text-white'
										: 'glass-dark text-gray-500'
								}`}
								animate={
									step >= 2
										? {
												boxShadow: [
													'0 0 20px rgba(155, 107, 168, 0.4)',
													'0 0 40px rgba(155, 107, 168, 0.6)',
													'0 0 20px rgba(155, 107, 168, 0.4)'
												]
											}
										: {}
								}
								transition={{ duration: 2, repeat: Infinity }}
							>
								2
							</motion.div>
							<div className={`h-2 w-24 rounded ${step >= 3 ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-800'}`} />
							<motion.div
								className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-xl ${
									step >= 3
										? 'bg-gradient-to-r from-purple-600 to-pink-600 glow-purple text-white'
										: 'glass-dark text-gray-500'
								}`}
								animate={
									step >= 3
										? {
												boxShadow: [
													'0 0 20px rgba(147, 51, 234, 0.4)',
													'0 0 40px rgba(147, 51, 234, 0.6)',
													'0 0 20px rgba(147, 51, 234, 0.4)'
												]
											}
										: {}
								}
								transition={{ duration: 2, repeat: Infinity }}
							>
								3
							</motion.div>
						</div>
					</div>

					{/* Step 1: Customer Info */}
					{step === 1 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-3xl p-10 border-2 border-cyan-500/30 neon-border"
						>
							<h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-glow-cyan">
								<User className="w-8 h-8 text-cyan-400" />
								고객 정보
							</h2>

							<div className="space-y-6">
								<div>
									<label className="block text-sm font-semibold mb-3 text-cyan-300">
										이름 <span className="text-red-400">*</span>
									</label>
									<input
										type="text"
										value={customerName}
										onChange={(e) => setCustomerName(e.target.value)}
										placeholder="홍길동"
										className="w-full px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
									/>
								</div>

								<div>
									<label className="block text-sm font-semibold mb-3 text-cyan-300">
										전화번호 <span className="text-red-400">*</span>
									</label>
									<div className="flex items-center gap-3">
										<Phone className="w-5 h-5 text-cyan-400" />
										<input
											type="tel"
											value={customerPhone}
											onChange={(e) => setCustomerPhone(e.target.value)}
											placeholder="010-1234-5678"
											className="flex-1 px-5 py-4 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-semibold mb-3 text-gray-300">
										이메일 (선택)
									</label>
									<div className="flex items-center gap-3">
										<Mail className="w-5 h-5 text-gray-400" />
										<input
											type="email"
											value={customerEmail}
											onChange={(e) => setCustomerEmail(e.target.value)}
											placeholder="example@email.com"
											className="flex-1 px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
										/>
									</div>
								</div>
							</div>

							<div className="flex justify-end mt-10">
								<motion.button
									onClick={() => setStep(2)}
									disabled={!customerName || !customerPhone}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full font-bold text-lg shadow-lg glow-cyan transition-all"
								>
									다음 단계
								</motion.button>
							</div>
						</motion.div>
					)}

					{/* Step 2: Construction Site Info */}
					{step === 2 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-3xl p-10 border-2 border-purple-500/30 neon-border"
						>
							<h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-purple-400">
								<Home className="w-8 h-8 text-purple-400" />
								시공 대상 정보
							</h2>

						<div className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-semibold mb-2">
										건물 유형 <span className="text-red-400">*</span>
									</label>
									<div className="flex items-center gap-2">
										<Building className="w-5 h-5 text-gray-400" />
										<input
											type="text"
											value={propertyType}
											onChange={(e) => setPropertyType(e.target.value)}
											placeholder="아파트, 빌라, 주택 등"
											className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-semibold mb-2">
										평수 (선택)
									</label>
									<input
										type="number"
										value={propertySize}
										onChange={(e) => setPropertySize(e.target.value)}
										placeholder="32"
										className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold mb-2">
									지역 <span className="text-red-400">*</span>
								</label>
								<div className="flex items-center gap-2">
									<MapPin className="w-5 h-5 text-gray-400" />
									<input
										type="text"
										value={region}
										onChange={(e) => setRegion(e.target.value)}
										placeholder="서울, 경기, 인천 등"
										className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold mb-2">
									주소 (선택)
								</label>
								<input
									type="text"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="상세 주소"
									className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
								/>
							</div>
						</div>

						<div className="flex justify-between mt-8">
							<button
								onClick={() => setStep(1)}
								className="px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all"
							>
								이전
							</button>
							<button
								onClick={() => setStep(3)}
								disabled={!propertyType || !region}
								className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
							>
								다음 단계
							</button>
						</div>
					</motion.div>
				)}

				{/* Step 3: Upload File or Image */}
				{step === 3 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
					>
						<h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
							<FileSpreadsheet className="w-6 h-6 text-green-400" />
							견적서 업로드
						</h2>

						{/* Upload Type Tabs */}
						<div className="flex gap-4 mb-6">
							<button
								onClick={() => setUploadType('excel')}
								className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
									uploadType === 'excel'
										? 'bg-cyan-500 text-white'
										: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
								}`}
							>
								<FileSpreadsheet className="w-5 h-5" />
								Excel 파일
							</button>
							<button
								onClick={() => setUploadType('image')}
								className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
									uploadType === 'image'
										? 'bg-purple-500 text-white'
										: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
								}`}
							>
								<Camera className="w-5 h-5" />
								견적서 사진
							</button>
						</div>

						{/* Excel Upload */}
						{uploadType === 'excel' && (
							<div className="mb-6">
								<label className="block">
									<input
										type="file"
										accept=".xlsx,.xls,.csv"
										onChange={handleFileUpload}
										disabled={uploading}
										className="hidden"
									/>
									<div className="cursor-pointer bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-xl p-12 text-center transition-all">
										<Upload className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
										<p className="text-lg font-semibold mb-2">Excel 파일을 업로드하세요</p>
										<p className="text-sm text-gray-400">클릭하여 파일 선택 (xlsx, xls, csv)</p>
										{fileName && uploadType === 'excel' && (
											<p className="mt-4 text-sm text-green-400">
												📄 {fileName} ({items.length}개 항목)
											</p>
										)}
									</div>
								</label>

								<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
									<h3 className="text-sm font-semibold text-blue-300 mb-2">📋 Excel 파일 형식 안내</h3>
									<p className="text-xs text-gray-300">
										필수 컬럼: 카테고리, 항목명, 수량, 단위, 단가, 총액<br />
										선택 컬럼: 비고
									</p>
								</div>
							</div>
						)}

						{/* Image Upload */}
						{uploadType === 'image' && (
							<div className="mb-6">
								{/* Image Previews with Delete Buttons */}
								{imagePreviews.length > 0 && (
									<div className="mb-4">
										<div className="flex items-center justify-between mb-3">
											<p className="text-sm font-semibold text-purple-300">
												📷 업로드된 이미지 ({imagePreviews.length}/3장)
											</p>
										</div>
										<div className="flex flex-wrap gap-4">
											{imagePreviews.map((preview, idx) => (
												<div key={idx} className="relative group">
													<img
														src={preview}
														alt={`Preview ${idx + 1}`}
														className="h-32 rounded-lg border-2 border-purple-500/50 group-hover:border-purple-400 transition-all"
													/>
													<div className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs px-2 py-1 rounded">
														{idx + 1}
													</div>
													{/* Delete button on hover */}
													<button
														onClick={() => removeImage(idx)}
														className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
														title="이미지 삭제"
													>
														<Trash2 className="w-3 h-3" />
													</button>
													{imageFileNames[idx] && (
														<div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded max-w-[100px] truncate opacity-0 group-hover:opacity-100 transition-all">
															{imageFileNames[idx]}
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{/* Upload Area or Max Limit Warning */}
								{imagePreviews.length < 3 ? (
									<label className="block">
										<input
											type="file"
											accept="image/*"
											multiple
											onChange={handleImageUpload}
											disabled={uploading}
											className="hidden"
										/>
										<div className="cursor-pointer bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-purple-600 hover:border-purple-500 rounded-xl p-12 text-center transition-all">
											<Camera className="w-12 h-12 mx-auto mb-4 text-purple-400" />
											<p className="text-lg font-semibold mb-2">
												{imagePreviews.length > 0 ? '추가 이미지 업로드' : '견적서 사진을 업로드하세요'}
											</p>
											<p className="text-sm text-gray-400">클릭하여 사진 선택 (JPG, PNG 등)</p>
											<p className="text-xs text-purple-300 mt-2">
												💡 최대 3장까지 업로드 가능 (현재 {imagePreviews.length}/3)
											</p>
										</div>
									</label>
								) : (
									<div className="bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded-xl p-8 text-center">
										<div className="text-amber-400 mb-3">
											<CheckCircle2 className="w-12 h-12 mx-auto" />
										</div>
										<p className="text-lg font-semibold text-amber-300 mb-2">
											최대 3장 업로드 완료
										</p>
										<p className="text-sm text-gray-300">
											추가 항목은 아래 표에서 직접 작성해주세요.
										</p>
									</div>
								)}

								<div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-4">
									<h3 className="text-sm font-semibold text-purple-300 mb-2">🤖 AI 자동 추출</h3>
									<p className="text-xs text-gray-300">
										견적서 사진을 업로드하면 AI가 자동으로 항목을 추출합니다.<br />
										최대 3장까지 업로드 가능하며, 모든 항목을 통합하여 추출합니다.<br />
										추출 후 확인 및 수정이 가능하고, 항목을 추가하거나 삭제할 수 있습니다.
									</p>
								</div>
							</div>
						)}

						{items.length > 0 && (
							<div className="mb-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold flex items-center gap-2">
										<Edit3 className="w-5 h-5 text-cyan-400" />
										견적 항목 확인 및 수정 ({items.length}개)
									</h3>
									<button
										onClick={addNewItem}
										className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-semibold transition-all"
									>
										<Plus className="w-4 h-4" />
										항목 추가
									</button>
								</div>

								{/* Excel-style Table */}
								<div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-gray-800/80 border-b border-gray-700">
												<th className="px-3 py-3 text-left font-semibold text-cyan-300 w-24">카테고리</th>
												<th className="px-3 py-3 text-left font-semibold text-cyan-300 w-48">항목명</th>
												<th className="px-3 py-3 text-right font-semibold text-cyan-300 w-20">수량</th>
												<th className="px-3 py-3 text-left font-semibold text-cyan-300 w-16">단위</th>
												<th className="px-3 py-3 text-right font-semibold text-cyan-300 w-28">단가</th>
												<th className="px-3 py-3 text-right font-semibold text-cyan-300 w-32">총액</th>
												<th className="px-3 py-3 text-left font-semibold text-cyan-300 w-32">비고</th>
												<th className="px-3 py-3 text-center font-semibold text-red-300 w-16">삭제</th>
											</tr>
										</thead>
										<tbody>
											{items.map((item, idx) => (
												<tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.category}
															onChange={(e) => updateItem(idx, 'category', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
															placeholder="예: 목공"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.item}
															onChange={(e) => updateItem(idx, 'item', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
															placeholder="항목 상세"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="number"
															value={item.quantity}
															onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs text-right focus:outline-none focus:border-cyan-500"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.unit}
															onChange={(e) => updateItem(idx, 'unit', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
															placeholder="개"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="number"
															value={item.unit_price}
															onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs text-right focus:outline-none focus:border-cyan-500"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="number"
															value={item.total_price}
															onChange={(e) => updateItem(idx, 'total_price', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs text-right focus:outline-none focus:border-cyan-500 font-semibold"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.notes || ''}
															onChange={(e) => updateItem(idx, 'notes', e.target.value)}
															className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
															placeholder="비고"
														/>
													</td>
													<td className="px-3 py-2 text-center">
														<button
															onClick={() => deleteItem(idx)}
															className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
														>
															<Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr className="bg-gray-800/60">
												<td colSpan={5} className="px-3 py-3 text-right font-semibold text-cyan-300">
													총 합계:
												</td>
												<td className="px-3 py-3 text-right font-bold text-cyan-400 text-base">
													₩{items.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()}
												</td>
												<td colSpan={2}></td>
											</tr>
										</tfoot>
									</table>
								</div>

								<div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
									<p className="text-xs text-blue-300">
										💡 <strong>팁:</strong> AI가 추출한 항목을 확인하고 수정하세요. 항목을 추가하거나 삭제할 수도 있습니다.
									</p>
								</div>
							</div>
						)}

						<div className="flex justify-between">
							<button
								onClick={() => setStep(2)}
								className="px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all"
							>
								이전
							</button>
							<button
								onClick={submitQuote}
								disabled={uploading || items.length === 0}
								className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
							>
								{uploading ? '제출 중...' : '견적 분석 신청하기'}
							</button>
						</div>
					</motion.div>
				)}

				{/* Service Notice */}
				<div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
					<h3 className="text-lg font-bold text-amber-300 mb-2">📋 서비스 안내</h3>
					<ul className="text-sm text-gray-300 space-y-2">
						<li>• 신청 후 관리자가 검토하여 AI 분석을 진행합니다.</li>
						<li>• 분석 완료 시 전화번호로 결과를 확인하실 수 있습니다.</li>
						<li>• 본 분석은 시장 데이터 기반 참고 자료이며, 업체 평가가 아닙니다.</li>
					</ul>
				</div>
			</div>
		</div>

		{/* Footer */}
		<ZipCheckFooter />
	</div>
	)
}
