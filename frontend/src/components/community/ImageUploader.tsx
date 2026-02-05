import { useState, useCallback, useRef } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { compressImage, validateImageType, validateFileSize } from '../../lib/image-compression'

interface ImageUploaderProps {
	images: File[]
	setImages: (files: File[]) => void
	maxImages?: number
	label?: string
	required?: boolean
	category?: 'before' | 'after' | 'evidence' | 'general'
}

type CompressionStatus = 'idle' | 'validating' | 'compressing' | 'done' | 'error'

const categoryLabels: Record<string, string> = {
	before: '시공 전',
	after: '시공 후',
	evidence: '증거 자료',
	general: '일반',
}

export default function ImageUploader({
	images,
	setImages,
	maxImages = 10,
	label,
	required = false,
	category = 'general',
}: ImageUploaderProps) {
	const [previews, setPreviews] = useState<string[]>([])
	const [status, setStatus] = useState<CompressionStatus>('idle')
	const [statusMessage, setStatusMessage] = useState('')
	const [isDragOver, setIsDragOver] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const inputId = `img-uploader-${category}`

	const displayLabel = label ?? `${categoryLabels[category]} 사진 업로드`
	const isFull = images.length >= maxImages

	const processFiles = useCallback(
		async (fileList: FileList | File[]) => {
			const fileArray = Array.from(fileList)
			const remainingSlots = maxImages - images.length

			if (fileArray.length === 0) return

			if (fileArray.length > remainingSlots) {
				alert(
					`최대 ${maxImages}장까지 업로드할 수 있습니다. (현재: ${images.length}장, 추가 가능: ${remainingSlots}장)`
				)
				return
			}

			// Step 1: Validate file types
			setStatus('validating')
			setStatusMessage('파일 검증 중...')

			const invalidTypeFiles = fileArray.filter((file) => !validateImageType(file))
			if (invalidTypeFiles.length > 0) {
				setStatus('error')
				setStatusMessage('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)')
				setTimeout(() => {
					setStatus('idle')
					setStatusMessage('')
				}, 3000)
				return
			}

			// Step 2: Validate file sizes (max 5MB before compression)
			const oversizedFiles = fileArray.filter((file) => !validateFileSize(file, 5))
			if (oversizedFiles.length > 0) {
				const names = oversizedFiles.map((f) => f.name).join(', ')
				setStatus('error')
				setStatusMessage(`파일 크기 초과 (최대 5MB): ${names}`)
				setTimeout(() => {
					setStatus('idle')
					setStatusMessage('')
				}, 3000)
				return
			}

			// Step 3: Compress images
			setStatus('compressing')
			setStatusMessage(`${fileArray.length}장 압축 중...`)

			try {
				const compressed: File[] = []
				for (let i = 0; i < fileArray.length; i++) {
					setStatusMessage(
						`압축 중... (${i + 1}/${fileArray.length}) ${fileArray[i].name}`
					)
					const result = await compressImage(fileArray[i], {
						maxSizeMB: 0.03,
						maxWidthOrHeight: 1200,
						fileType: 'image/webp',
					})
					compressed.push(result)
				}

				const newImages = [...images, ...compressed]
				setImages(newImages)

				// Generate previews
				const newPreviews = compressed.map((file) => URL.createObjectURL(file))
				setPreviews((prev) => [...prev, ...newPreviews])

				setStatus('done')
				setStatusMessage(`${compressed.length}장 업로드 완료`)
				setTimeout(() => {
					setStatus('idle')
					setStatusMessage('')
				}, 2000)
			} catch (error) {
				console.error('Image compression failed:', error)
				setStatus('error')
				setStatusMessage('이미지 압축에 실패했습니다. 다시 시도해주세요.')
				setTimeout(() => {
					setStatus('idle')
					setStatusMessage('')
				}, 3000)
			}
		},
		[images, maxImages, setImages]
	)

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files
			if (!files || files.length === 0) return
			await processFiles(files)
			// Reset file input so the same file can be selected again
			e.target.value = ''
		},
		[processFiles]
	)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(false)
	}, [])

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragOver(false)

			if (isFull || status === 'compressing') return

			const files = e.dataTransfer.files
			if (files && files.length > 0) {
				await processFiles(files)
			}
		},
		[isFull, status, processFiles]
	)

	const handleRemove = useCallback(
		(index: number) => {
			const newImages = images.filter((_, i) => i !== index)
			setImages(newImages)

			setPreviews((prev) => {
				const removed = prev[index]
				if (removed) URL.revokeObjectURL(removed)
				return prev.filter((_, i) => i !== index)
			})
		},
		[images, setImages]
	)

	const handleZoneClick = useCallback(() => {
		if (!isFull && status !== 'compressing') {
			fileInputRef.current?.click()
		}
	}, [isFull, status])

	const isProcessing = status === 'validating' || status === 'compressing'

	return (
		<div>
			{/* Label */}
			<label
				htmlFor={inputId}
				className="block text-sm font-semibold mb-1.5 text-gray-700"
			>
				<span className="flex items-center gap-2">
					<ImageIcon className="w-4 h-4 text-[#0A9DAA]" />
					{displayLabel}
					{required && <span className="text-red-500">*</span>}
					<span className="text-xs font-normal text-gray-400">
						(최대 {maxImages}장)
					</span>
				</span>
			</label>
			<p className="text-xs text-gray-400 mb-3">
				JPG, PNG, WebP 형식 / 최대 5MB
			</p>

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				id={inputId}
				accept="image/jpeg,image/png,image/gif,image/webp"
				multiple
				onChange={handleFileSelect}
				className="hidden"
				disabled={isFull || isProcessing}
			/>

			{/* Drag & Drop Zone */}
			<div
				role="button"
				tabIndex={0}
				aria-label={`${displayLabel} 영역. 클릭하거나 파일을 드래그하세요.`}
				onClick={handleZoneClick}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						handleZoneClick()
					}
				}}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`flex flex-col items-center justify-center gap-2 w-full min-h-[120px] py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
					isFull || isProcessing
						? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400'
						: isDragOver
							? 'border-[#0A9DAA] bg-[#0A9DAA]/5 text-[#0A9DAA] scale-[1.01]'
							: 'border-gray-300 bg-white hover:bg-gray-50 hover:border-[#0A9DAA]/60 text-gray-500'
				}`}
			>
				{isProcessing ? (
					<>
						<Loader2 className="w-8 h-8 animate-spin text-[#0A9DAA]" />
						<span className="text-sm font-medium text-[#0A9DAA]">
							{statusMessage}
						</span>
					</>
				) : (
					<>
						<Upload className="w-8 h-8" />
						<span className="text-sm font-medium">
							{isFull
								? `최대 ${maxImages}장까지 업로드 가능`
								: '클릭 또는 드래그하여 사진 추가'}
						</span>
						<span className="text-xs text-gray-400">
							{images.length}/{maxImages}장 업로드됨
						</span>
					</>
				)}
			</div>

			{/* Status message (for done/error states outside of the drop zone) */}
			{(status === 'done' || status === 'error') && statusMessage && (
				<p
					className={`text-xs mt-2 font-medium ${
						status === 'done' ? 'text-green-600' : 'text-red-500'
					}`}
				>
					{statusMessage}
				</p>
			)}

			{/* Preview Thumbnails */}
			{previews.length > 0 && (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
					{previews.map((preview, index) => (
						<div key={index} className="relative group aspect-square">
							<img
								src={preview}
								alt={`${categoryLabels[category]} 사진 ${index + 1}`}
								className="w-full h-full object-cover rounded-xl border border-gray-200"
							/>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									handleRemove(index)
								}}
								aria-label={`사진 ${index + 1} 삭제`}
								className="absolute -top-2 -right-2 min-w-[28px] min-h-[28px] w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-md"
							>
								<X className="w-4 h-4" />
							</button>
							<div className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded-md">
								{index + 1}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
