import imageCompression from 'browser-image-compression'

interface CompressionOptions {
	maxSizeMB?: number
	maxWidthOrHeight?: number
	useWebWorker?: boolean
	fileType?: string
}

/**
 * 이미지를 WebP로 압축하고 최적화
 * @param file 원본 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
	file: File,
	options: CompressionOptions = {}
): Promise<File> {
	const {
		maxSizeMB = 2, // 최대 2MB
		maxWidthOrHeight = 1920, // 최대 너비/높이
		useWebWorker = true,
		fileType = 'image/webp' // WebP 형식으로 변환
	} = options

	try {
		console.log(`📸 Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

		const compressedBlob = await imageCompression(file, {
			maxSizeMB,
			maxWidthOrHeight,
			useWebWorker,
			fileType
		})

		// Blob을 File로 변환
		const compressedFile = new File(
			[compressedBlob],
			file.name.replace(/\.[^/.]+$/, '.webp'), // 확장자를 .webp로 변경
			{
				type: 'image/webp',
				lastModified: Date.now()
			}
		)

		console.log(`✅ Compressed: ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`)
		console.log(`📊 Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduced`)

		return compressedFile
	} catch (error) {
		console.error('❌ Image compression failed:', error)
		throw new Error('이미지 압축에 실패했습니다.')
	}
}

/**
 * 여러 이미지를 한 번에 압축
 * @param files 원본 이미지 파일 배열
 * @param options 압축 옵션
 * @returns 압축된 이미지 파일 배열
 */
export async function compressImages(
	files: File[],
	options: CompressionOptions = {}
): Promise<File[]> {
	console.log(`📦 Starting batch compression: ${files.length} images`)

	const compressionPromises = files.map((file) => compressImage(file, options))

	try {
		const compressedFiles = await Promise.all(compressionPromises)
		console.log(`✅ Batch compression completed: ${compressedFiles.length} images`)
		return compressedFiles
	} catch (error) {
		console.error('❌ Batch compression failed:', error)
		throw error
	}
}

/**
 * 파일 크기 검증
 * @param file 파일
 * @param maxSizeMB 최대 크기 (MB)
 * @returns 유효성 여부
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
	const fileSizeMB = file.size / 1024 / 1024
	return fileSizeMB <= maxSizeMB
}

/**
 * 이미지 파일 타입 검증
 * @param file 파일
 * @returns 유효성 여부
 */
export function validateImageType(file: File): boolean {
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
	return validTypes.includes(file.type)
}

/**
 * 파일 배열 검증 (개수, 크기, 타입)
 * @param files 파일 배열
 * @param maxFiles 최대 파일 개수
 * @param maxSizeMB 최대 파일 크기 (MB)
 * @returns 검증 결과 { valid: boolean, message?: string }
 */
export function validateImageFiles(
	files: File[],
	maxFiles: number = 10,
	maxSizeMB: number = 5
): { valid: boolean; message?: string } {
	// 개수 체크
	if (files.length > maxFiles) {
		return {
			valid: false,
			message: `이미지는 최대 ${maxFiles}장까지 업로드할 수 있습니다.`
		}
	}

	// 각 파일 검증
	for (const file of files) {
		// 타입 체크
		if (!validateImageType(file)) {
			return {
				valid: false,
				message: `${file.name}은(는) 지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)`
			}
		}

		// 크기 체크
		if (!validateFileSize(file, maxSizeMB)) {
			return {
				valid: false,
				message: `${file.name}의 크기가 ${maxSizeMB}MB를 초과합니다.`
			}
		}
	}

	return { valid: true }
}
