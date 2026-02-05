import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, FileSpreadsheet, User, Phone, Mail, Home, MapPin, Building, Camera, CheckCircle2, Plus, Trash2, Edit3 } from 'lucide-react'
import * as XLSX from 'xlsx'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { getApiUrl } from '../lib/api-config'

interface QuoteItem {
	category: string
	item: string
	quantity: number
	unit: string
	unit_price: number
	total_price: number
	notes?: string
}

interface QuoteSet {
	setId: 'SET_A' | 'SET_B' | 'SET_C'
	vendorName: string
	vendorPhone: string
	vendorRepresentative: string
	vendorBusinessNumber: string
	vendorLicenseStatus: 'yes' | 'no' | 'unknown'
	vendorWarrantyInsurance: 'yes' | 'no' | 'unknown'
	uploadType: 'excel' | 'image'
	images: string[] // base64 previews
	imageFileNames: string[]
	fileName: string // for excel
	items: QuoteItem[]
}

interface PaymentInfo {
	paymentId: string
	planId: string
	planName: string
	quantity: number
	price: number
	originalAmount: number
	discountAmount: number
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

	// Quote Sets (multiple quotes)
	const quantity = paymentInfo?.quantity || 1
	const [currentSetIndex, setCurrentSetIndex] = useState(0)
	const [uploading, setUploading] = useState(false)

	// Initialize quote sets based on quantity
	const initializeQuoteSets = (): QuoteSet[] => {
		const setIds: Array<'SET_A' | 'SET_B' | 'SET_C'> = ['SET_A', 'SET_B', 'SET_C']
		return Array.from({ length: quantity }, (_, i) => ({
			setId: setIds[i],
			vendorName: '',
			vendorPhone: '',
			vendorRepresentative: '',
			vendorBusinessNumber: '',
			vendorLicenseStatus: 'unknown' as const,
			vendorWarrantyInsurance: 'unknown' as const,
			uploadType: 'excel' as const,
			images: [],
			imageFileNames: [],
			fileName: '',
			items: []
		}))
	}

	const [quoteSets, setQuoteSets] = useState<QuoteSet[]>(initializeQuoteSets())

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

	// Helper: Update a specific quote set
	const updateQuoteSet = (index: number, updates: Partial<QuoteSet>) => {
		setQuoteSets(prev => {
			const newSets = [...prev]
			newSets[index] = { ...newSets[index], ...updates }
			return newSets
		})
	}

	// Parse Excel file
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		updateQuoteSet(currentSetIndex, { fileName: file.name })
		setUploading(true)

		try {
			const data = await file.arrayBuffer()
			const workbook = XLSX.read(data, { type: 'array' })
			const sheetName = workbook.SheetNames[0]
			const worksheet = workbook.Sheets[sheetName]
			const jsonData = XLSX.utils.sheet_to_json(worksheet)

			const parsedItems: QuoteItem[] = jsonData.map((row: any) => ({
				category: row['카테고리'] || row['Category'] || '',
				item: row['항목명'] || row['Item'] || row['항목'] || '',
				quantity: Number(row['수량'] || row['Quantity'] || 1),
				unit: row['단위'] || row['Unit'] || '개',
				unit_price: Number(row['단가'] || row['UnitPrice'] || row['Unit Price'] || 0),
				total_price: Number(row['총액'] || row['TotalPrice'] || row['Total'] || 0),
				notes: row['비고'] || row['Notes'] || ''
			}))

			updateQuoteSet(currentSetIndex, { items: parsedItems })
			alert(`${parsedItems.length}개 항목을 불러왔습니다.`)
		} catch (error) {
			console.error('Excel parsing error:', error)
			alert('Excel 파일 읽기에 실패했습니다. 파일 형식을 확인해주세요.')
		} finally {
			setUploading(false)
		}
	}

	// Parse Image with AI Vision - supports up to 3 images per set
	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		const currentSet = quoteSets[currentSetIndex]
		const MAX_IMAGES = 3
		const currentImageCount = currentSet.images.length

		if (currentImageCount >= MAX_IMAGES) {
			alert(`최대 ${MAX_IMAGES}장까지만 업로드 가능합니다. 추가 내용은 직접 작성해주세요.`)
			event.target.value = ''
			return
		}

		const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
		if (imageFiles.length === 0) {
			alert('이미지 파일만 업로드 가능합니다.')
			event.target.value = ''
			return
		}

		if (imageFiles.length !== files.length) {
			alert(`${files.length - imageFiles.length}개의 비이미지 파일이 제외되었습니다.`)
		}

		const remainingSlots = MAX_IMAGES - currentImageCount
		const filesToUpload = imageFiles.slice(0, remainingSlots)

		if (imageFiles.length > remainingSlots) {
			alert(`${remainingSlots}장만 업로드됩니다. (최대 ${MAX_IMAGES}장 제한)`)
		}

		setUploading(true)

		try {
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

			updateQuoteSet(currentSetIndex, {
				images: [...currentSet.images, ...newPreviews],
				imageFileNames: [...currentSet.imageFileNames, ...newFileNames]
			})

			if (currentSet.items.length === 0) {
				const newItem: QuoteItem = {
					category: '',
					item: '',
					quantity: 1,
					unit: '개',
					unit_price: 0,
					total_price: 0,
					notes: ''
				}
				updateQuoteSet(currentSetIndex, { items: [newItem] })
			}

			alert(`${filesToUpload.length}장의 이미지가 업로드되었습니다. 아래 표에 견적 항목을 입력해주세요.`)
		} catch (error) {
			console.error('Image upload error:', error)
			alert('이미지 업로드에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setUploading(false)
			event.target.value = ''
		}
	}

	const removeImage = (index: number) => {
		const currentSet = quoteSets[currentSetIndex]
		updateQuoteSet(currentSetIndex, {
			images: currentSet.images.filter((_, i) => i !== index),
			imageFileNames: currentSet.imageFileNames.filter((_, i) => i !== index)
		})
	}

	const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
		const currentSet = quoteSets[currentSetIndex]
		const updatedItems = [...currentSet.items]
		if (field === 'quantity' || field === 'unit_price' || field === 'total_price') {
			updatedItems[index][field] = Number(value) || 0
		} else {
			updatedItems[index][field] = value as any
		}
		updateQuoteSet(currentSetIndex, { items: updatedItems })
	}

	const addNewItem = () => {
		const currentSet = quoteSets[currentSetIndex]
		const newItem: QuoteItem = {
			category: '',
			item: '',
			quantity: 1,
			unit: '개',
			unit_price: 0,
			total_price: 0,
			notes: ''
		}
		updateQuoteSet(currentSetIndex, { items: [...currentSet.items, newItem] })
	}

	const deleteItem = (index: number) => {
		if (confirm('이 항목을 삭제하시겠습니까?')) {
			const currentSet = quoteSets[currentSetIndex]
			updateQuoteSet(currentSetIndex, {
				items: currentSet.items.filter((_, i) => i !== index)
			})
		}
	}

	const submitQuote = async () => {
		if (!customerName || !customerPhone || !propertyType || !region) {
			alert('필수 정보를 모두 입력해주세요.')
			return
		}

		for (let i = 0; i < quoteSets.length; i++) {
			const set = quoteSets[i]
			if (!set.vendorName.trim()) {
				alert(`견적서 ${String.fromCharCode(65 + i)} - 업체명을 입력해주세요.`)
				return
			}
			if (!set.vendorBusinessNumber.trim()) {
				alert(`견적서 ${String.fromCharCode(65 + i)} - 사업자등록번호를 입력해주세요.`)
				return
			}
			if (set.items.length === 0) {
				alert(`견적서 ${String.fromCharCode(65 + i)} - 견적 항목을 업로드해주세요.`)
				return
			}
		}

		setUploading(true)
		try {
			const response = await fetch(getApiUrl('/api/quote-requests/submit-multiple'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					payment_id: paymentInfo.paymentId,
					plan_id: paymentInfo.planId,
					plan_name: paymentInfo.planName,
					quantity: quantity,
					original_amount: paymentInfo.originalAmount,
					discount_amount: paymentInfo.discountAmount,
					paid_amount: paymentInfo.price,
					customer_name: customerName,
					customer_phone: customerPhone,
					customer_email: customerEmail,
					property_type: propertyType,
					property_size: propertySize ? Number(propertySize) : undefined,
					region,
					address,
					quote_sets: quoteSets.map(set => ({
						set_id: set.setId,
						vendor_name: set.vendorName,
						vendor_phone: set.vendorPhone || undefined,
						vendor_representative: set.vendorRepresentative || undefined,
						vendor_business_number: set.vendorBusinessNumber || undefined,
						vendor_license_status: set.vendorLicenseStatus,
						vendor_warranty_insurance: set.vendorWarrantyInsurance,
						upload_type: set.uploadType,
						images: set.images,
						items: set.items
					}))
				})
			})

			const contentType = response.headers.get('content-type')
			if (!contentType || !contentType.includes('application/json')) {
				const textResponse = await response.text()
				console.error('Non-JSON response:', textResponse.substring(0, 500))
				throw new Error(
					`서버가 올바른 응답을 반환하지 않았습니다 (${response.status} ${response.statusText}). ` +
					`응답 타입: ${contentType || '없음'}. ` +
					`백엔드 서버가 실행 중인지 확인해주세요.`
				)
			}

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || '견적 신청에 실패했습니다.')
			}

			if (result.success === false) {
				alert(`${result.message}\n${result.validation_notes || ''}`)
				return
			}

			alert(`견적 분석 신청이 완료되었습니다.\n\n신청 ID: ${result.request_id}\n전화번호로 진행 상황을 확인하실 수 있습니다.`)
			navigate(`/quote-status?phone=${encodeURIComponent(customerPhone)}`)
		} catch (error) {
			console.error('Quote submission error:', error)
			alert('견적 신청에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setUploading(false)
		}
	}

	const stepLabels = ['고객 정보', '시공 대상', '견적서 업로드']

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="견적서 제출"
				description="인테리어 견적서를 업로드하면 AI가 항목별 적정 가격과 과다 청구 여부를 분석해드립니다."
				path="/quote-submission"
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">
							Quote Submission
						</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						견적 분석 신청
					</h1>
					<p className="text-sand-600 text-base md:text-lg max-w-md mx-auto">
						Excel 파일 또는 견적서 사진을 업로드하여 분석을 신청하세요
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-5 md:px-8 pb-20">
				{/* Payment Info Display */}
				<div className="mb-8 nordic-card rounded-2xl p-5 md:p-6 border border-forest-200 bg-forest-50/30">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<p className="text-xs text-sand-500 mb-1">선택한 요금제</p>
							<p className="text-xl font-bold text-forest-600">{paymentInfo?.planName}</p>
						</div>
						<div>
							<p className="text-xs text-sand-500 mb-1">견적 분석 건수</p>
							<p className="text-xl font-bold text-sand-900">{quantity}건</p>
						</div>
						<div className="text-right">
							<p className="text-xs text-sand-500 mb-1">결제 금액</p>
							<p className="text-xl font-bold text-forest-600">
								{paymentInfo?.price.toLocaleString()}원
							</p>
						</div>
					</div>
				</div>

				{/* Progress Steps */}
				<div className="flex items-center justify-center mb-12">
					<div className="flex items-center gap-3 md:gap-5">
						{stepLabels.map((label, i) => {
							const stepNum = i + 1
							const isActive = step >= stepNum
							return (
								<div key={label} className="flex items-center gap-3 md:gap-5">
									<div className="flex flex-col items-center gap-1.5">
										<div
											className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full font-bold text-sm md:text-base transition-colors ${
												isActive
													? 'bg-forest-600 text-white'
													: 'bg-sand-200 text-sand-500'
											}`}
										>
											{stepNum}
										</div>
										<span className={`text-xs font-medium ${isActive ? 'text-forest-600' : 'text-sand-400'}`}>
											{label}
										</span>
									</div>
									{i < stepLabels.length - 1 && (
										<div className={`h-[2px] w-12 md:w-20 rounded ${step > stepNum ? 'bg-forest-500' : 'bg-sand-200'}`} />
									)}
								</div>
							)
						})}
					</div>
				</div>

				{/* Step 1: Customer Info */}
				{step === 1 && (
					<div className="nordic-card rounded-2xl p-6 md:p-10">
						<h2 className="text-xl font-bold text-sand-900 mb-8 flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
								<User className="w-5 h-5 text-forest-600" />
							</div>
							고객 정보
						</h2>

						<div className="space-y-6">
							<div>
								<label htmlFor="qs-name" className="block text-sm font-semibold mb-2 text-sand-700">
									이름 <span className="text-red-500">*</span>
								</label>
								<input
									id="qs-name"
									type="text"
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
									placeholder="홍길동"
									className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
								/>
							</div>

							<div>
								<label htmlFor="qs-phone" className="block text-sm font-semibold mb-2 text-sand-700">
									전화번호 <span className="text-red-500">*</span>
								</label>
								<div className="flex items-center gap-3">
									<Phone className="w-5 h-5 text-forest-500 flex-shrink-0" />
									<input
										id="qs-phone"
										type="tel"
										value={customerPhone}
										onChange={(e) => setCustomerPhone(e.target.value)}
										placeholder="010-1234-5678"
										className="flex-1 px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="qs-email" className="block text-sm font-semibold mb-2 text-sand-500">
									이메일 (선택)
								</label>
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-sand-400 flex-shrink-0" />
									<input
										id="qs-email"
										type="email"
										value={customerEmail}
										onChange={(e) => setCustomerEmail(e.target.value)}
										placeholder="example@email.com"
										className="flex-1 px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
							</div>
						</div>

						<div className="flex justify-end mt-10">
							<button
								onClick={() => setStep(2)}
								disabled={!customerName || !customerPhone}
								className="px-8 py-3 rounded-xl font-semibold text-base transition-all disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
							>
								다음 단계
							</button>
						</div>
					</div>
				)}

				{/* Step 2: Construction Site Info */}
				{step === 2 && (
					<div className="nordic-card rounded-2xl p-6 md:p-10">
						<h2 className="text-xl font-bold text-sand-900 mb-8 flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
								<Home className="w-5 h-5 text-forest-600" />
							</div>
							시공 대상 정보
						</h2>

						<div className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<label htmlFor="qs-property-type" className="block text-sm font-semibold mb-2 text-sand-700">
										건물 유형 <span className="text-red-500">*</span>
									</label>
									<div className="flex items-center gap-3">
										<Building className="w-5 h-5 text-forest-500 flex-shrink-0" />
										<input
											id="qs-property-type"
											type="text"
											value={propertyType}
											onChange={(e) => setPropertyType(e.target.value)}
											placeholder="아파트, 빌라, 주택 등"
											className="flex-1 px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
										/>
									</div>
								</div>

								<div>
									<label htmlFor="qs-property-size" className="block text-sm font-semibold mb-2 text-sand-500">
										시공 면적 (m²)
									</label>
									<input
										id="qs-property-size"
										type="number"
										value={propertySize}
										onChange={(e) => setPropertySize(e.target.value)}
										placeholder="예: 85"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
									{propertySize && (
										<p className="text-xs text-sand-400 mt-2">
											약 {(Number(propertySize) / 3.3058).toFixed(1)}평
										</p>
									)}
								</div>
							</div>

							<div>
								<label htmlFor="qs-region" className="block text-sm font-semibold mb-2 text-sand-700">
									지역 <span className="text-red-500">*</span>
								</label>
								<div className="flex items-center gap-3">
									<MapPin className="w-5 h-5 text-forest-500 flex-shrink-0" />
									<input
										id="qs-region"
										type="text"
										value={region}
										onChange={(e) => setRegion(e.target.value)}
										placeholder="서울, 경기, 인천 등"
										className="flex-1 px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="qs-address" className="block text-sm font-semibold mb-2 text-sand-500">
									주소 (선택)
								</label>
								<input
									id="qs-address"
									type="text"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="상세 주소"
									className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
								/>
							</div>
						</div>

						<div className="flex justify-between mt-10">
							<button
								onClick={() => setStep(1)}
								className="px-8 py-3 bg-sand-200 text-sand-700 hover:bg-sand-300 rounded-xl font-semibold transition-all"
							>
								이전
							</button>
							<button
								onClick={() => setStep(3)}
								disabled={!propertyType || !region}
								className="px-8 py-3 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
							>
								다음 단계
							</button>
						</div>
					</div>
				)}

				{/* Step 3: Upload File or Image */}
				{step === 3 && (
					<div className="nordic-card rounded-2xl p-6 md:p-10">
						<h2 className="text-xl font-bold text-sand-900 mb-8 flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
								<FileSpreadsheet className="w-5 h-5 text-forest-600" />
							</div>
							견적서 업로드 ({quantity}건)
						</h2>

						{/* Quote Set Tabs (only shown when quantity > 1) */}
						{quantity > 1 && (
							<div className="flex gap-3 mb-6">
								{quoteSets.map((set, index) => {
									const isActive = currentSetIndex === index
									const hasData = set.vendorName.trim() || set.items.length > 0
									return (
										<button
											key={set.setId}
											onClick={() => setCurrentSetIndex(index)}
											className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all ${
												isActive
													? 'bg-forest-600 text-white'
													: hasData
													? 'bg-forest-50 text-forest-600 border border-forest-200'
													: 'bg-sand-100 text-sand-500 border border-sand-200'
											}`}
										>
											<div className="flex items-center justify-center gap-2">
												<span>견적서 {String.fromCharCode(65 + index)}</span>
												{hasData && <CheckCircle2 className="w-4 h-4" />}
											</div>
											{set.vendorName && (
												<p className="text-xs mt-1 opacity-80">{set.vendorName}</p>
											)}
										</button>
									)
								})}
							</div>
						)}

						{/* Current Quote Set Label */}
						{quantity > 1 && (
							<div className="mb-6 p-4 bg-forest-50 border border-forest-200 rounded-xl">
								<p className="text-sm text-sand-600">
									현재 입력 중: <span className="font-bold text-forest-600">견적서 {String.fromCharCode(65 + currentSetIndex)}</span>
								</p>
							</div>
						)}

						{/* Vendor Info Section */}
						<div className="mb-8 p-6 bg-sand-50 rounded-xl border border-sand-200">
							<h3 className="text-base font-bold text-sand-900 mb-4 flex items-center gap-2">
								<Building className="w-5 h-5 text-forest-500" />
								업체 정보
							</h3>
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label htmlFor="qs-vendor-name" className="block text-sm font-semibold mb-2 text-sand-700">
										업체명 <span className="text-red-500">*</span>
									</label>
									<input
										id="qs-vendor-name"
										type="text"
										value={quoteSets[currentSetIndex].vendorName}
										onChange={(e) => updateQuoteSet(currentSetIndex, { vendorName: e.target.value })}
										placeholder="예: OO건설"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
								<div>
									<label htmlFor="qs-vendor-phone" className="block text-sm font-semibold mb-2 text-sand-500">
										업체 전화번호 (선택)
									</label>
									<input
										id="qs-vendor-phone"
										type="tel"
										value={quoteSets[currentSetIndex].vendorPhone}
										onChange={(e) => updateQuoteSet(currentSetIndex, { vendorPhone: e.target.value })}
										placeholder="02-1234-5678"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
								<div>
									<label htmlFor="qs-vendor-rep" className="block text-sm font-semibold mb-2 text-sand-500">
										대표자명 (선택)
									</label>
									<input
										id="qs-vendor-rep"
										type="text"
										value={quoteSets[currentSetIndex].vendorRepresentative}
										onChange={(e) => updateQuoteSet(currentSetIndex, { vendorRepresentative: e.target.value })}
										placeholder="홍길동"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
								<div>
									<label htmlFor="qs-vendor-biz" className="block text-sm font-semibold mb-2 text-sand-700">
										사업자등록번호 <span className="text-red-500">*</span>
									</label>
									<input
										id="qs-vendor-biz"
										type="text"
										value={quoteSets[currentSetIndex].vendorBusinessNumber}
										onChange={(e) => updateQuoteSet(currentSetIndex, { vendorBusinessNumber: e.target.value })}
										placeholder="123-45-67890"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
							</div>

							{/* 면허 및 보험 */}
							<div className="grid md:grid-cols-2 gap-4 mt-4">
								<div>
									<label className="block text-sm font-semibold mb-2 text-sand-700">
										실내건축 건설업면허 보유 여부
									</label>
									<div className="flex gap-2">
										{([['yes', '보유'], ['no', '미보유'], ['unknown', '확인중']] as const).map(([val, label]) => (
											<button
												key={val}
												type="button"
												onClick={() => updateQuoteSet(currentSetIndex, { vendorLicenseStatus: val })}
												className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
													quoteSets[currentSetIndex].vendorLicenseStatus === val
														? val === 'yes'
															? 'bg-forest-600 text-white border-forest-600'
															: val === 'no'
															? 'bg-red-500 text-white border-red-500'
															: 'bg-amber-500 text-white border-amber-500'
														: 'bg-white text-sand-600 border-sand-200 hover:border-sand-400'
												}`}
											>
												{label}
											</button>
										))}
									</div>
								</div>
								<div>
									<label className="block text-sm font-semibold mb-2 text-sand-700">
										하자보증보험 가입 여부
									</label>
									<div className="flex gap-2">
										{([['yes', '가입'], ['no', '미가입'], ['unknown', '확인중']] as const).map(([val, label]) => (
											<button
												key={val}
												type="button"
												onClick={() => updateQuoteSet(currentSetIndex, { vendorWarrantyInsurance: val })}
												className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
													quoteSets[currentSetIndex].vendorWarrantyInsurance === val
														? val === 'yes'
															? 'bg-forest-600 text-white border-forest-600'
															: val === 'no'
															? 'bg-red-500 text-white border-red-500'
															: 'bg-amber-500 text-white border-amber-500'
														: 'bg-white text-sand-600 border-sand-200 hover:border-sand-400'
												}`}
											>
												{label}
											</button>
										))}
									</div>
								</div>
							</div>

							<p className="text-xs text-sand-600 mt-3">
								업체 정보를 정확히 입력하면 분석 결과의 신뢰성이 높아지고, 커뮤니티의 업체 후기 및 피해사례와 자동 연계됩니다
							</p>
						</div>

						{/* Upload Type Tabs */}
						<div className="flex gap-3 mb-6">
							<button
								onClick={() => updateQuoteSet(currentSetIndex, { uploadType: 'excel' })}
								className={`flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
									quoteSets[currentSetIndex].uploadType === 'excel'
										? 'bg-forest-600 text-white'
										: 'bg-sand-100 text-sand-600 hover:bg-sand-200 border border-sand-200'
								}`}
							>
								<FileSpreadsheet className="w-5 h-5" />
								Excel 파일
							</button>
							<button
								onClick={() => updateQuoteSet(currentSetIndex, { uploadType: 'image' })}
								className={`flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
									quoteSets[currentSetIndex].uploadType === 'image'
										? 'bg-forest-600 text-white'
										: 'bg-sand-100 text-sand-600 hover:bg-sand-200 border border-sand-200'
								}`}
							>
								<Camera className="w-5 h-5" />
								견적서 사진
							</button>
						</div>

						{/* Excel Upload */}
						{quoteSets[currentSetIndex].uploadType === 'excel' && (
							<div className="mb-6">
								<label className="block">
									<input
										type="file"
										accept=".xlsx,.xls,.csv"
										onChange={handleFileUpload}
										disabled={uploading}
										className="hidden"
									/>
									<div className="cursor-pointer bg-white hover:bg-sand-50 border-2 border-dashed border-sand-300 hover:border-forest-500 rounded-xl p-10 text-center transition-all">
										<Upload className="w-10 h-10 mx-auto mb-3 text-forest-500" />
										<p className="text-base font-semibold text-sand-900 mb-1">Excel 파일을 업로드하세요</p>
										<p className="text-sm text-sand-400">클릭하여 파일 선택 (xlsx, xls, csv)</p>
										{quoteSets[currentSetIndex].fileName && (
											<p className="mt-3 text-sm text-forest-600 font-medium">
												{quoteSets[currentSetIndex].fileName} ({quoteSets[currentSetIndex].items.length}개 항목)
											</p>
										)}
									</div>
								</label>

								<div className="bg-sand-100 border border-sand-200 rounded-xl p-4 mt-4">
									<h3 className="text-sm font-semibold text-sand-700 mb-2">Excel 파일 형식 안내</h3>
									<p className="text-xs text-sand-500">
										필수 컬럼: 카테고리, 항목명, 수량, 단위, 단가, 총액<br />
										선택 컬럼: 비고
									</p>
								</div>
							</div>
						)}

						{/* Image Upload */}
						{quoteSets[currentSetIndex].uploadType === 'image' && (
							<div className="mb-6">
								{/* Image Previews */}
								{quoteSets[currentSetIndex].images.length > 0 && (
									<div className="mb-4">
										<div className="flex items-center justify-between mb-3">
											<p className="text-sm font-semibold text-sand-700">
												업로드된 이미지 ({quoteSets[currentSetIndex].images.length}/3장)
											</p>
										</div>
										<div className="flex flex-wrap gap-4">
											{quoteSets[currentSetIndex].images.map((preview, idx) => (
												<div key={idx} className="relative group">
													<img
														src={preview}
														alt={`견적서 이미지 ${idx + 1}`}
														className="h-32 rounded-xl border-2 border-sand-200 group-hover:border-forest-500 transition-all"
													/>
													<div className="absolute bottom-1 left-1 bg-forest-600 text-white text-xs px-2 py-1 rounded-lg">
														{idx + 1}
													</div>
													<button
														onClick={() => removeImage(idx)}
														className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
														aria-label={`이미지 ${idx + 1} 삭제`}
													>
														<Trash2 className="w-3 h-3" />
													</button>
													{quoteSets[currentSetIndex].imageFileNames[idx] && (
														<div className="absolute bottom-1 right-1 bg-sand-900/70 text-white text-xs px-2 py-1 rounded-lg max-w-[100px] truncate opacity-0 group-hover:opacity-100 transition-all">
															{quoteSets[currentSetIndex].imageFileNames[idx]}
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{/* Upload Area or Max Limit */}
								{quoteSets[currentSetIndex].images.length < 3 ? (
									<label className="block">
										<input
											type="file"
											accept="image/*"
											multiple
											onChange={handleImageUpload}
											disabled={uploading}
											className="hidden"
										/>
										<div className="cursor-pointer bg-white hover:bg-sand-50 border-2 border-dashed border-sand-300 hover:border-forest-500 rounded-xl p-10 text-center transition-all">
											<Camera className="w-10 h-10 mx-auto mb-3 text-forest-500" />
											<p className="text-base font-semibold text-sand-900 mb-1">
												{quoteSets[currentSetIndex].images.length > 0 ? '추가 이미지 업로드' : '견적서 사진을 업로드하세요'}
											</p>
											<p className="text-sm text-sand-400">클릭하여 사진 선택 (JPG, PNG 등)</p>
											<p className="text-xs text-forest-500 mt-2">
												최대 3장까지 업로드 가능 (현재 {quoteSets[currentSetIndex].images.length}/3)
											</p>
										</div>
									</label>
								) : (
									<div className="bg-wood-50 border-2 border-dashed border-wood-300 rounded-xl p-8 text-center">
										<CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-forest-500" />
										<p className="text-base font-semibold text-sand-900 mb-1">
											최대 3장 업로드 완료
										</p>
										<p className="text-sm text-sand-500">
											추가 항목은 아래 표에서 직접 작성해주세요.
										</p>
									</div>
								)}

								<div className="bg-sand-100 border border-sand-200 rounded-xl p-4 mt-4">
									<h3 className="text-sm font-semibold text-sand-700 mb-2">견적서 업로드 안내</h3>
									<p className="text-xs text-sand-500">
										견적서 사진을 업로드하고 아래 표에 항목을 직접 입력해주세요.<br />
										최대 3장까지 업로드 가능합니다.<br />
										신청 후 관리자가 이미지를 확인하여 집첵 시스템 분석을 진행합니다.
									</p>
								</div>
							</div>
						)}

						{/* Quote Items Table */}
						{quoteSets[currentSetIndex].items.length > 0 && (
							<div className="mb-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-bold text-sand-900 flex items-center gap-2">
										<Edit3 className="w-5 h-5 text-forest-500" />
										견적 항목 확인 및 수정 ({quoteSets[currentSetIndex].items.length}개)
									</h3>
									<button
										onClick={addNewItem}
										className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-all"
									>
										<Plus className="w-4 h-4" />
										항목 추가
									</button>
								</div>

								<div className="bg-white rounded-xl border border-sand-200 overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-sand-100 border-b border-sand-200">
												<th className="px-3 py-3 text-left font-semibold text-sand-700 w-24">카테고리</th>
												<th className="px-3 py-3 text-left font-semibold text-sand-700 w-48">항목명</th>
												<th className="px-3 py-3 text-right font-semibold text-sand-700 w-20">수량</th>
												<th className="px-3 py-3 text-left font-semibold text-sand-700 w-16">단위</th>
												<th className="px-3 py-3 text-right font-semibold text-sand-700 w-28">단가</th>
												<th className="px-3 py-3 text-right font-semibold text-sand-700 w-32">총액</th>
												<th className="px-3 py-3 text-left font-semibold text-sand-700 w-32">비고</th>
												<th className="px-3 py-3 text-center font-semibold text-red-400 w-16">삭제</th>
											</tr>
										</thead>
										<tbody>
											{quoteSets[currentSetIndex].items.map((item, idx) => (
												<tr key={idx} className="border-b border-sand-100 hover:bg-sand-50 transition-colors">
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.category}
															onChange={(e) => updateItem(idx, 'category', e.target.value)}
															className="w-full px-2 py-1.5 bg-white border border-sand-200 rounded text-sand-900 text-xs focus:outline-none focus:border-forest-500"
															placeholder="예: 목공"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.item}
															onChange={(e) => updateItem(idx, 'item', e.target.value)}
															className="w-full px-2 py-1.5 bg-white border border-sand-200 rounded text-sand-900 text-xs focus:outline-none focus:border-forest-500"
															placeholder="항목 상세"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="number"
															value={item.quantity}
															onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
															className="w-full px-2 py-1.5 bg-sand-50 border border-sand-200 rounded text-sand-900 text-xs text-right focus:outline-none focus:border-forest-500"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.unit}
															onChange={(e) => updateItem(idx, 'unit', e.target.value)}
															className="w-full px-2 py-1.5 bg-white border border-sand-200 rounded text-sand-900 text-xs focus:outline-none focus:border-forest-500"
															placeholder="개"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="number"
															value={item.unit_price}
															onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
															className="w-full px-2 py-1.5 bg-sand-50 border border-sand-200 rounded text-sand-900 text-xs text-right focus:outline-none focus:border-forest-500"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="number"
															value={item.total_price}
															onChange={(e) => updateItem(idx, 'total_price', e.target.value)}
															className="w-full px-2 py-1.5 bg-sand-50 border border-sand-200 rounded text-sand-900 text-xs text-right focus:outline-none focus:border-forest-500 font-semibold"
														/>
													</td>
													<td className="px-3 py-2">
														<input
															type="text"
															value={item.notes || ''}
															onChange={(e) => updateItem(idx, 'notes', e.target.value)}
															className="w-full px-2 py-1.5 bg-white border border-sand-200 rounded text-sand-900 text-xs focus:outline-none focus:border-forest-500"
															placeholder="비고"
														/>
													</td>
													<td className="px-3 py-2 text-center">
														<button
															onClick={() => deleteItem(idx)}
															className="p-1.5 hover:bg-red-50 rounded transition-colors"
															aria-label={`항목 ${idx + 1} 삭제`}
														>
															<Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr className="bg-sand-100">
												<td colSpan={5} className="px-3 py-3 text-right font-semibold text-sand-700">
													총 합계:
												</td>
												<td className="px-3 py-3 text-right font-bold text-forest-600 text-base">
													{quoteSets[currentSetIndex].items.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()}원
												</td>
												<td colSpan={2}></td>
											</tr>
										</tfoot>
									</table>
								</div>

								<div className="mt-4 bg-wood-50 border border-wood-200 rounded-xl p-4">
									<p className="text-xs text-sand-600">
										<strong>팁:</strong> 업로드한 이미지를 참고하여 견적 항목을 입력하세요. 항목을 추가하거나 삭제할 수 있습니다.
									</p>
								</div>
							</div>
						)}

						<div className="flex justify-between">
							<button
								onClick={() => setStep(2)}
								className="px-8 py-3 bg-sand-200 text-sand-700 hover:bg-sand-300 rounded-xl font-semibold transition-all"
							>
								이전
							</button>
							<button
								onClick={submitQuote}
								disabled={uploading || quoteSets.some(set => set.items.length === 0)}
								className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
							>
								{uploading ? (
									<span className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
										제출 중...
									</span>
								) : '견적 분석 신청하기'}
							</button>
						</div>
					</div>
				)}

				{/* Service Notice */}
				<div className="mt-10 nordic-card rounded-2xl p-6 md:p-8 border border-wood-200 bg-wood-50/50">
					<h3 className="font-semibold text-sand-900 mb-3">서비스 안내</h3>
					<ul className="text-sm text-sand-600 space-y-1.5">
						<li>• 신청 후 관리자가 검토하여 집첵 시스템 분석을 진행합니다.</li>
						<li>• 분석 완료 시 전화번호로 결과를 확인하실 수 있습니다.</li>
						<li>• 본 분석은 시장 데이터 기반 참고 자료이며, 업체 평가가 아닙니다.</li>
					</ul>
				</div>
			</div>

			<NordicFooter />
		</div>
	)
}
