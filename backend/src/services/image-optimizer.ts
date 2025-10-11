/**
 * Image Optimizer Service
 *
 * Uses Sharp library to compress and optimize images
 * - Converts to JPEG format with 80% quality
 * - Resizes to max width 1920px
 * - Generates thumbnails (200x200px)
 * - Reduces file size by ~90%
 */

import sharp from 'sharp'

export interface OptimizedImage {
	compressed: Buffer
	thumbnail: Buffer
	originalSize: number
	compressedSize: number
	thumbnailSize: number
	compressionRatio: number
}

export interface ImageOptimizationOptions {
	maxWidth?: number
	quality?: number
	thumbnailSize?: number
	format?: 'jpeg' | 'webp' | 'png'
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
	maxWidth: 1920,
	quality: 80,
	thumbnailSize: 200,
	format: 'jpeg'
}

/**
 * Optimize image - compress and resize
 */
export async function optimizeImage(
	imageBuffer: Buffer,
	options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
	const opts = { ...DEFAULT_OPTIONS, ...options }
	const originalSize = imageBuffer.length

	try {
		// Get image metadata
		const metadata = await sharp(imageBuffer).metadata()
		console.log(`📸 Original image: ${metadata.width}x${metadata.height}, ${(originalSize / 1024).toFixed(2)}KB`)

		// Compress and resize main image
		let pipeline = sharp(imageBuffer)

		// Resize if wider than max width
		if (metadata.width && metadata.width > opts.maxWidth!) {
			pipeline = pipeline.resize(opts.maxWidth!, undefined, {
				fit: 'inside',
				withoutEnlargement: true
			})
		}

		// Convert to specified format with quality setting
		const compressed = await pipeline
			.toFormat(opts.format!, {
				quality: opts.quality,
				mozjpeg: opts.format === 'jpeg' // Use mozjpeg for better compression
			})
			.toBuffer()

		const compressedSize = compressed.length

		// Generate thumbnail
		const thumbnail = await sharp(imageBuffer)
			.resize(opts.thumbnailSize!, opts.thumbnailSize!, {
				fit: 'cover',
				position: 'center'
			})
			.toFormat(opts.format!, {
				quality: opts.quality
			})
			.toBuffer()

		const thumbnailSize = thumbnail.length

		// Calculate compression ratio
		const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

		console.log(`✅ Compressed: ${(compressedSize / 1024).toFixed(2)}KB (${compressionRatio.toFixed(1)}% reduction)`)
		console.log(`🖼️  Thumbnail: ${(thumbnailSize / 1024).toFixed(2)}KB`)

		return {
			compressed,
			thumbnail,
			originalSize,
			compressedSize,
			thumbnailSize,
			compressionRatio
		}
	} catch (error) {
		console.error('Image optimization error:', error)
		throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Batch optimize multiple images
 */
export async function optimizeImages(
	imageBuffers: Buffer[],
	options: ImageOptimizationOptions = {}
): Promise<OptimizedImage[]> {
	console.log(`🔄 Optimizing ${imageBuffers.length} images...`)

	const results = await Promise.all(
		imageBuffers.map(buffer => optimizeImage(buffer, options))
	)

	const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0)
	const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0)
	const totalSaved = totalOriginal - totalCompressed
	const avgRatio = (totalSaved / totalOriginal) * 100

	console.log(`✨ Batch optimization complete:`)
	console.log(`   Original: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`)
	console.log(`   Compressed: ${(totalCompressed / 1024 / 1024).toFixed(2)}MB`)
	console.log(`   Saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB (${avgRatio.toFixed(1)}%)`)

	return results
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
	const metadata = await sharp(imageBuffer).metadata()
	return {
		width: metadata.width || 0,
		height: metadata.height || 0
	}
}

/**
 * Convert image to base64
 */
export async function imageToBase64(imageBuffer: Buffer, format: 'jpeg' | 'webp' | 'png' = 'jpeg'): Promise<string> {
	const optimized = await sharp(imageBuffer)
		.toFormat(format, { quality: 80 })
		.toBuffer()

	return `data:image/${format};base64,${optimized.toString('base64')}`
}
