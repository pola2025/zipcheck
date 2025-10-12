/**
 * Image Parser Service
 *
 * Uses Google Cloud Vision API for OCR + GPT-5 for structuring
 * Includes image optimization to reduce storage costs
 */

import vision from '@google-cloud/vision'
import OpenAI from 'openai'
import { optimizeImage } from './image-optimizer'

interface ParsedQuoteItem {
	category: string
	item: string
	quantity: number
	unit: string
	unit_price: number
	total_price: number
	notes?: string
}

interface ImageParseResult {
	items: ParsedQuoteItem[]
	success: boolean
	message?: string
	optimizedImage?: Buffer // Compressed image to save
	thumbnail?: Buffer // Thumbnail for list view
	compressionStats?: {
		originalSize: number
		compressedSize: number
		compressionRatio: number
	}
}

/**
 * Parse quote image using Google Vision (OCR) + GPT-5 (structuring)
 * More cost-effective than using vision-only models
 */
export async function parseQuoteImage(imageBuffer: Buffer): Promise<ImageParseResult> {
	try {
		const OPENAI_API_KEY = process.env.OPENAI_API_KEY
		const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY

		if (!GOOGLE_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			console.error('⚠️  Google Cloud credentials not found')
			return {
				success: false,
				items: [],
				message: 'Google Cloud Vision API 키가 설정되지 않았습니다.'
			}
		}

		if (!OPENAI_API_KEY) {
			console.error('⚠️  OPENAI_API_KEY not found')
			return {
				success: false,
				items: [],
				message: 'OpenAI API 키가 설정되지 않았습니다.'
			}
		}

		// Initialize OpenAI client
		const openai = new OpenAI({
			apiKey: OPENAI_API_KEY
		})

		// Step 1: Optimize image first (compress and resize)
		console.log('📦 Optimizing image before OCR...')
		const optimized = await optimizeImage(imageBuffer, {
			maxWidth: 1920,
			quality: 80,
			thumbnailSize: 200,
			format: 'jpeg'
		})

		// Step 2: Extract text using Google Cloud Vision API (OCR)
		console.log('🔍 Performing OCR with Google Cloud Vision API...')

		const client = new vision.ImageAnnotatorClient({
			apiKey: GOOGLE_API_KEY
		})

		const [result] = await client.textDetection(optimized.compressed)
		const detections = result.textAnnotations

		if (!detections || detections.length === 0) {
			return {
				success: false,
				items: [],
				message: '이미지에서 텍스트를 찾을 수 없습니다.'
			}
		}

		// The first annotation contains all detected text
		const extractedText = detections[0]?.description || ''

		if (!extractedText.trim()) {
			return {
				success: false,
				items: [],
				message: '텍스트 추출에 실패했습니다.'
			}
		}

		console.log('📝 Extracted text length:', extractedText.length)
		console.log('📄 Sample text:', extractedText.substring(0, 200))

		// Step 3: Structure the extracted text using GPT-5 (cost-effective and accurate)
		console.log('🤖 Structuring data with GPT-5...')

		const completion = await openai.chat.completions.create({
			model: 'gpt-5',
			messages: [
				{
					role: 'system',
					content: '당신은 인테리어 시공 견적서를 분석하는 전문가입니다. 추출된 텍스트를 정확하게 구조화된 JSON 형식으로 변환합니다.'
				},
				{
					role: 'user',
					content: `다음은 견적서 이미지에서 OCR로 추출한 텍스트입니다.
이 텍스트를 분석하여 시공 항목을 추출하고 JSON 형식으로만 반환하세요.

추출된 텍스트:
${extractedText}

반환 형식:
{
  "items": [
    {
      "category": "카테고리 (예: 철거, 목공, 도배, 타일, 전기, 배관 등)",
      "item": "구체적인 항목명",
      "quantity": 수량(숫자),
      "unit": "단위 (예: 평, 개, m 등)",
      "unit_price": 단가(숫자),
      "total_price": 총액(숫자),
      "notes": "비고 (선택사항)"
    }
  ]
}

주의사항:
- 모든 숫자는 쉼표 없이 순수 숫자로 변환
- 카테고리는 일반적인 인테리어 분류 사용 (철거, 목공, 도배, 타일, 전기, 배관, 페인트, 주방, 욕실, 바닥, 창호 등)
- 항목명은 구체적으로 작성
- 없는 정보는 추정하지 말고 비워두거나 기본값 사용
- JSON만 출력하고 다른 설명은 추가하지 마세요`
				}
			],
			max_tokens: 4096,
			temperature: 0.0, // 정확도 우선
			response_format: { type: 'json_object' } // JSON 모드 활성화
		})

		const content = completion.choices[0]?.message?.content

		if (!content) {
			throw new Error('GPT-5 API 응답이 비어있습니다.')
		}

		console.log('📝 GPT-5 Response:', content)

		// Parse JSON response
		let jsonContent = content.trim()
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '')
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '')
		}

		const parsed = JSON.parse(jsonContent)

		if (!parsed.items || !Array.isArray(parsed.items)) {
			throw new Error('응답 형식이 올바르지 않습니다.')
		}

		// Validate and clean items
		const cleanedItems: ParsedQuoteItem[] = parsed.items.map((item: any) => ({
			category: String(item.category || '기타'),
			item: String(item.item || ''),
			quantity: Number(item.quantity) || 1,
			unit: String(item.unit || '개'),
			unit_price: Number(item.unit_price) || 0,
			total_price: Number(item.total_price) || 0,
			notes: item.notes ? String(item.notes) : undefined
		}))

		console.log(`✅ Successfully parsed ${cleanedItems.length} items from image`)

		return {
			success: true,
			items: cleanedItems,
			optimizedImage: optimized.compressed,
			thumbnail: optimized.thumbnail,
			compressionStats: {
				originalSize: optimized.originalSize,
				compressedSize: optimized.compressedSize,
				compressionRatio: optimized.compressionRatio
			}
		}
	} catch (error) {
		console.error('Image parsing error:', error)
		return {
			success: false,
			items: [],
			message: error instanceof Error ? error.message : 'Unknown error'
		}
	}
}
