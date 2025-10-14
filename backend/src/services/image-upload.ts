/**
 * Image Upload Service for Community Features
 *
 * Handles image uploads with:
 * - File size validation (2MB max per image)
 * - Image count validation (20 images max)
 * - WebP compression using Sharp
 * - Upload to Supabase Storage
 */

import { supabase } from '../lib/supabase'
import { optimizeImage } from './image-optimizer'
import crypto from 'crypto'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes
const MAX_IMAGE_COUNT = 10 // Max 10 images per review
const STORAGE_BUCKET = 'community-images'

export interface ImageUploadResult {
	url: string
	filename: string
	size: number
}

export interface ImageValidationError {
	field: string
	message: string
}

/**
 * Validate image files before upload
 */
export function validateImages(files: Express.Multer.File[]): ImageValidationError[] {
	const errors: ImageValidationError[] = []

	// Check image count
	if (files.length > MAX_IMAGE_COUNT) {
		errors.push({
			field: 'images',
			message: `최대 ${MAX_IMAGE_COUNT}장까지 업로드할 수 있습니다. (현재: ${files.length}장)`
		})
	}

	// Check each file size and type
	files.forEach((file, index) => {
		// Check file size
		if (file.size > MAX_FILE_SIZE) {
			const sizeMB = (file.size / 1024 / 1024).toFixed(2)
			errors.push({
				field: `images[${index}]`,
				message: `이미지 ${index + 1}의 크기가 너무 큽니다. (${sizeMB}MB, 최대: 2MB)`
			})
		}

		// Check file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.mimetype)) {
			errors.push({
				field: `images[${index}]`,
				message: `이미지 ${index + 1}의 형식이 올바르지 않습니다. (허용: JPG, PNG, WebP)`
			})
		}
	})

	return errors
}

/**
 * Upload images to Supabase Storage with WebP compression
 */
export async function uploadImages(
	files: Express.Multer.File[],
	folder: 'reviews' | 'damage-cases' | 'floor-plans' = 'reviews'
): Promise<ImageUploadResult[]> {
	// Check if Supabase is available
	if (!supabase) {
		throw new Error('이미지 업로드 기능을 사용할 수 없습니다: Supabase가 설정되지 않았습니다.')
	}

	// Validate images first
	const validationErrors = validateImages(files)
	if (validationErrors.length > 0) {
		throw new Error(validationErrors.map(e => e.message).join(', '))
	}

	console.log(`📤 Uploading ${files.length} images to ${folder}...`)

	const uploadResults: ImageUploadResult[] = []

	for (const file of files) {
		try {
			// Optimize image to WebP format
			const optimized = await optimizeImage(file.buffer, {
				format: 'webp',
				quality: 85,
				maxWidth: 1920
			})

			// Generate unique filename
			const timestamp = Date.now()
			const randomString = crypto.randomBytes(8).toString('hex')
			const filename = `${folder}/${timestamp}-${randomString}.webp`

			console.log(`   Uploading ${filename} (${(optimized.compressedSize / 1024).toFixed(2)}KB)`)

			// Upload to Supabase Storage
			const { data, error } = await supabase.storage
				.from(STORAGE_BUCKET)
				.upload(filename, optimized.compressed, {
					contentType: 'image/webp',
					cacheControl: '3600',
					upsert: false
				})

			if (error) {
				console.error(`❌ Upload failed for ${filename}:`, error)
				throw new Error(`이미지 업로드 실패: ${error.message}`)
			}

			// Get public URL
			const { data: urlData } = supabase.storage
				.from(STORAGE_BUCKET)
				.getPublicUrl(data.path)

			uploadResults.push({
				url: urlData.publicUrl,
				filename: data.path,
				size: optimized.compressedSize
			})

			console.log(`   ✅ Uploaded: ${urlData.publicUrl}`)
		} catch (error) {
			console.error(`❌ Error uploading image:`, error)
			throw error
		}
	}

	const totalSize = uploadResults.reduce((sum, r) => sum + r.size, 0)
	console.log(`✨ Upload complete: ${uploadResults.length} images, ${(totalSize / 1024 / 1024).toFixed(2)}MB`)

	return uploadResults
}

/**
 * Delete images from Supabase Storage
 */
export async function deleteImages(filenames: string[]): Promise<void> {
	if (filenames.length === 0) return

	// Check if Supabase is available
	if (!supabase) {
		throw new Error('이미지 삭제 기능을 사용할 수 없습니다: Supabase가 설정되지 않았습니다.')
	}

	console.log(`🗑️  Deleting ${filenames.length} images...`)

	const { error } = await supabase.storage
		.from(STORAGE_BUCKET)
		.remove(filenames)

	if (error) {
		console.error('❌ Delete failed:', error)
		throw new Error(`이미지 삭제 실패: ${error.message}`)
	}

	console.log(`✅ Deleted ${filenames.length} images`)
}

/**
 * Check if storage bucket exists, create if not
 */
export async function ensureStorageBucket(): Promise<void> {
	// Skip if Supabase is not available
	if (!supabase) {
		return
	}

	try {
		const { data: buckets, error: listError } = await supabase.storage.listBuckets()

		if (listError) {
			console.error('❌ Failed to list buckets:', listError)
			return
		}

		const bucketExists = buckets?.some((bucket: any) => bucket.name === STORAGE_BUCKET)

		if (!bucketExists) {
			console.log(`📦 Creating storage bucket: ${STORAGE_BUCKET}`)

			const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
				public: true,
				fileSizeLimit: MAX_FILE_SIZE
			})

			if (createError) {
				console.error('❌ Failed to create bucket:', createError)
			} else {
				console.log(`✅ Storage bucket created: ${STORAGE_BUCKET}`)
			}
		}
	} catch (error) {
		console.error('❌ Error ensuring storage bucket:', error)
	}
}
