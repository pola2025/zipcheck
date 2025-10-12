import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, User, Phone, Mail, Home, MapPin, Building, Camera } from 'lucide-react'
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

export default function QuoteSubmission() {
	const navigate = useNavigate()
	const [step, setStep] = useState(1)

	// Customer Info
	const [customerName, setCustomerName] = useState('')
	const [customerPhone, setCustomerPhone] = useState('')
	const [customerEmail, setCustomerEmail] = useState('')

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

	// Parse Image with AI Vision - supports multiple images
	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		// Check if all files are images
		const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
		if (imageFiles.length === 0) {
			alert('❌ 이미지 파일만 업로드 가능합니다.')
			return
		}

		if (imageFiles.length !== files.length) {
			alert(`⚠️ ${files.length - imageFiles.length}개의 비이미지 파일이 제외되었습니다.`)
		}

		setUploading(true)

		try {
			// Create previews for all images
			const previews: string[] = []
			const fileNames: string[] = []

			for (const file of imageFiles) {
				fileNames.push(file.name)
				const reader = new FileReader()
				const preview = await new Promise<string>((resolve) => {
					reader.onload = (e) => {
						resolve(e.target?.result as string)
					}
					reader.readAsDataURL(file)
				})
				previews.push(preview)
			}

			setImagePreviews(previews)
			setImageFileNames(fileNames)

			// Upload to server for OCR/Vision API processing
			const formData = new FormData()
			imageFiles.forEach(file => {
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
				setItems(result.items)
				alert(`✅ ${imageFiles.length}장의 이미지에서 ${result.items.length}개 항목을 추출했습니다! 확인 후 수정하실 수 있습니다.`)
			} else {
				alert('⚠️ 견적 항목을 추출하지 못했습니다. Excel 파일을 사용하거나 수동으로 입력해주세요.')
			}
		} catch (error) {
			console.error('Image parsing error:', error)
			alert('❌ 이미지 분석에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setUploading(false)
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
										<label className="block text-sm font-semibold mb-3 text-purple-300">
											건물 유형 <span className="text-red-400">*</span>
										</label>
										<div className="flex items-center gap-3">
											<Building className="w-5 h-5 text-purple-400" />
											<input
												type="text"
												value={propertyType}
												onChange={(e) => setPropertyType(e.target.value)}
												placeholder="아파트, 빌라, 주택 등"
												className="flex-1 px-5 py-4 glass-dark border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-semibold mb-3 text-gray-300">
											평수 (선택)
										</label>
										<input
											type="number"
											value={propertySize}
											onChange={(e) => setPropertySize(e.target.value)}
											placeholder="32"
											className="w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-semibold mb-3 text-purple-300">
										지역 <span className="text-red-400">*</span>
									</label>
									<div className="flex items-center gap-3">
										<MapPin className="w-5 h-5 text-purple-400" />
										<input
											type="text"
											value={region}
											onChange={(e) => setRegion(e.target.value)}
											placeholder="서울, 경기, 인천 등"
											className="flex-1 px-5 py-4 glass-dark border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-semibold mb-3 text-gray-300">
										주소 (선택)
									</label>
									<input
										type="text"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										placeholder="상세 주소"
										className="w-full px-5 py-4 glass-dark border border-gray-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
									/>
								</div>
							</div>

							<div className="flex justify-between mt-10">
								<motion.button
									onClick={() => setStep(1)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="px-8 py-4 glass-dark border border-gray-600/30 rounded-full font-bold text-lg hover:border-gray-500 transition-all"
								>
									이전
								</motion.button>
								<motion.button
									onClick={() => setStep(3)}
									disabled={!propertyType || !region}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full font-bold text-lg shadow-lg glow-purple transition-all"
								>
									다음 단계
								</motion.button>
							</div>
						</motion.div>
					)}

					{/* Step 3: Upload File or Image */}
					{step === 3 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-3xl p-10 border-2 border-green-500/30 neon-border"
						>
							<h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-green-400">
								<FileSpreadsheet className="w-8 h-8 text-green-400" />
								견적서 업로드
							</h2>

							{/* Upload Type Tabs */}
							<div className="flex gap-4 mb-8">
								<motion.button
									onClick={() => setUploadType('excel')}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className={`flex-1 px-8 py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
										uploadType === 'excel'
											? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg glow-cyan'
											: 'glass-dark text-gray-300 border border-gray-600/30 hover:border-cyan-500/50'
									}`}
								>
									<FileSpreadsheet className="w-6 h-6" />
									Excel 파일
								</motion.button>
								<motion.button
									onClick={() => setUploadType('image')}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className={`flex-1 px-8 py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
										uploadType === 'image'
											? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg glow-purple'
											: 'glass-dark text-gray-300 border border-gray-600/30 hover:border-purple-500/50'
									}`}
								>
									<Camera className="w-6 h-6" />
									견적서 사진
								</motion.button>
							</div>

							{/* Excel Upload */}
							{uploadType === 'excel' && (
								<div className="mb-8">
									<label className="block">
										<input
											type="file"
											accept=".xlsx,.xls,.csv"
											onChange={handleFileUpload}
											disabled={uploading}
											className="hidden"
										/>
										<motion.div
											whileHover={{ scale: 1.01, borderColor: 'rgba(6, 182, 212, 0.5)' }}
											className="cursor-pointer glass-dark hover:glass-neon border-2 border-dashed border-cyan-500/30 hover:border-cyan-500 rounded-2xl p-16 text-center transition-all"
										>
											<Upload className="w-16 h-16 mx-auto mb-6 text-cyan-400" />
											<p className="text-2xl font-bold mb-3 text-cyan-300">Excel 파일을 업로드하세요</p>
											<p className="text-base text-gray-400">클릭하여 파일 선택 (xlsx, xls, csv)</p>
											{fileName && uploadType === 'excel' && (
												<p className="mt-6 text-base text-green-400 font-semibold">
													📄 {fileName} ({items.length}개 항목)
												</p>
											)}
										</motion.div>
									</label>

									<div className="glass-dark border border-cyan-500/20 rounded-xl p-6 mt-6">
										<h3 className="text-base font-bold text-cyan-300 mb-3">📋 Excel 파일 형식 안내</h3>
										<p className="text-sm text-gray-300">
											필수 컬럼: 카테고리, 항목명, 수량, 단위, 단가, 총액<br />
											선택 컬럼: 비고
										</p>
									</div>
								</div>
							)}

							{/* Image Upload */}
							{uploadType === 'image' && (
								<div className="mb-8">
									<label className="block">
										<input
											type="file"
											accept="image/*"
											multiple
											onChange={handleImageUpload}
											disabled={uploading}
											className="hidden"
										/>
										<motion.div
											whileHover={{ scale: 1.01, borderColor: 'rgba(168, 85, 247, 0.5)' }}
											className="cursor-pointer glass-dark hover:glass-neon border-2 border-dashed border-purple-500/30 hover:border-purple-500 rounded-2xl p-16 text-center transition-all"
										>
											{imagePreviews.length > 0 ? (
												<div className="space-y-6">
													<div className="flex flex-wrap gap-4 justify-center">
														{imagePreviews.map((preview, idx) => (
															<motion.div
																key={idx}
																className="relative"
																whileHover={{ scale: 1.05 }}
															>
																<img src={preview} alt={`Preview ${idx + 1}`} className="h-40 rounded-xl border-2 border-purple-500 shadow-lg" />
																<div className="absolute bottom-2 right-2 bg-purple-500 text-white text-sm px-3 py-1 rounded-full font-bold">
																	{idx + 1}
																</div>
															</motion.div>
														))}
													</div>
													<p className="text-base text-green-400 font-semibold">
														📷 {imagePreviews.length}장의 이미지
													</p>
													{imageFileNames.length > 0 && (
														<div className="text-sm text-gray-400 space-y-1 max-w-2xl mx-auto">
															{imageFileNames.map((name, idx) => (
																<div key={idx}>• {name}</div>
															))}
														</div>
													)}
												</div>
											) : (
												<>
													<Camera className="w-16 h-16 mx-auto mb-6 text-purple-400" />
													<p className="text-2xl font-bold mb-3 text-purple-300">견적서 사진을 업로드하세요</p>
													<p className="text-base text-gray-400">클릭하여 사진 선택 (JPG, PNG 등)</p>
													<p className="text-sm text-purple-300 mt-4 font-semibold">💡 여러 장 선택 가능 (최대 5장)</p>
												</>
											)}
										</motion.div>
									</label>

									<div className="glass-dark border border-purple-500/20 rounded-xl p-6 mt-6">
										<h3 className="text-base font-bold text-purple-300 mb-3">🤖 AI 자동 추출</h3>
										<p className="text-sm text-gray-300">
											견적서 사진을 업로드하면 AI가 자동으로 항목을 추출합니다.<br />
											여러 장의 사진을 한번에 선택하면 모든 항목을 통합하여 추출합니다.<br />
											추출 후 확인 및 수정이 가능합니다.
										</p>
									</div>
								</div>
							)}

							{items.length > 0 && (
								<div className="mb-8 glass-dark rounded-2xl p-6 border border-green-500/20">
									<h3 className="text-lg font-bold mb-4 text-green-400">불러온 항목 ({items.length}개)</h3>
									<div className="space-y-3 max-h-72 overflow-y-auto">
										{items.slice(0, 5).map((item, idx) => (
											<div key={idx} className="glass-strong rounded-xl p-4 text-sm border border-gray-700">
												<span className="font-bold text-cyan-400">{item.category}</span>
												<span className="text-gray-400 mx-2">•</span>
												<span className="text-white">{item.item}</span>
												<span className="text-gray-400 mx-2">-</span>
												<span className="font-semibold text-green-400">₩{item.total_price.toLocaleString()}</span>
											</div>
										))}
										{items.length > 5 && (
											<div className="text-center text-gray-400 text-base font-semibold pt-2">
												...그 외 {items.length - 5}개 항목
											</div>
										)}
									</div>
								</div>
							)}

							<div className="flex justify-between gap-4">
								<motion.button
									onClick={() => setStep(2)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="px-8 py-4 glass-dark border border-gray-600/30 rounded-full font-bold text-lg hover:border-gray-500 transition-all"
								>
									이전
								</motion.button>
								<motion.button
									onClick={submitQuote}
									disabled={uploading || items.length === 0}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full font-bold text-lg shadow-lg glow-green transition-all"
								>
									{uploading ? '제출 중...' : '견적 분석 신청하기'}
								</motion.button>
							</div>
						</motion.div>
					)}

					{/* Service Notice */}
					<motion.div
						className="mt-12 glass-strong rounded-2xl p-8 border border-amber-500/30"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<h3 className="text-2xl font-bold text-amber-300 mb-4 flex items-center gap-2">
							📋 서비스 안내
						</h3>
						<ul className="text-base text-gray-300 space-y-3">
							<li className="flex items-start gap-3">
								<span className="text-amber-400 mt-1">•</span>
								<span>신청 후 관리자가 검토하여 AI 분석을 진행합니다.</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-amber-400 mt-1">•</span>
								<span>분석 완료 시 전화번호로 결과를 확인하실 수 있습니다.</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="text-amber-400 mt-1">•</span>
								<span>본 분석은 시장 데이터 기반 참고 자료이며, 업체 평가가 아닙니다.</span>
							</li>
						</ul>
					</motion.div>
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
