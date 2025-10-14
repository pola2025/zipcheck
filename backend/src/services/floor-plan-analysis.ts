/**
 * Floor Plan Analysis Service
 *
 * Google Cloud Vision API를 사용해서 도면 이미지 분석:
 * 1. OCR로 텍스트 추출 (평면도에 적힌 면적 정보)
 * 2. 텍스트에서 공간별 면적 파싱
 * 3. { "주방": 5.5, "거실": 15.3, "화장실": 3.2 } 형태로 반환
 */

import axios from 'axios'

interface RoomArea {
	[roomName: string]: number // 예: { "주방": 5.5, "거실": 15.3 }
}

interface FloorPlanAnalysisResult {
	roomAreas: RoomArea
	totalArea: number
	rawText: string // OCR 원본 텍스트
	confidence: number // 신뢰도 (0-1)
}

/**
 * Google Cloud Vision API로 이미지에서 텍스트 추출
 */
async function extractTextFromImage(imageUrl: string): Promise<string> {
	const apiKey = process.env.GOOGLE_CLOUD_API_KEY

	if (!apiKey) {
		throw new Error('GOOGLE_CLOUD_API_KEY not configured')
	}

	try {
		console.log('📸 Extracting text from floor plan image...')

		// 이미지를 base64로 변환 (URL인 경우)
		let imageContent: string
		if (imageUrl.startsWith('http')) {
			const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
			imageContent = Buffer.from(response.data).toString('base64')
		} else {
			// 이미 base64인 경우
			imageContent = imageUrl.replace(/^data:image\/\w+;base64,/, '')
		}

		// Google Cloud Vision API 호출
		const visionResponse = await axios.post(
			`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
			{
				requests: [
					{
						image: { content: imageContent },
						features: [
							{
								type: 'TEXT_DETECTION', // OCR
								maxResults: 1
							}
						]
					}
				]
			}
		)

		const textAnnotations = visionResponse.data.responses[0]?.textAnnotations
		if (!textAnnotations || textAnnotations.length === 0) {
			throw new Error('No text found in image')
		}

		// 첫 번째 annotation이 전체 텍스트
		const fullText = textAnnotations[0].description
		console.log('✅ Text extracted successfully')

		return fullText
	} catch (error) {
		console.error('❌ Google Cloud Vision API error:', error)
		throw new Error('Failed to extract text from floor plan image')
	}
}

/**
 * 추출된 텍스트에서 공간별 면적 파싱
 *
 * 예상 패턴:
 * - "주방 5평"
 * - "거실: 15.3평"
 * - "화장실 3.2㎡" → 평수로 변환 (㎡ / 3.3)
 * - "안방(8평)"
 */
function parseRoomAreas(text: string): RoomArea {
	const roomAreas: RoomArea = {}

	// 공간 키워드
	const roomKeywords = [
		'주방',
		'거실',
		'안방',
		'방',
		'침실',
		'화장실',
		'욕실',
		'베란다',
		'발코니',
		'현관',
		'복도',
		'드레스룸',
		'서재',
		'창고',
		'다용도실',
		'식당',
		'다이닝',
		'주방식당'
	]

	// 각 라인별로 파싱
	const lines = text.split('\n')

	for (const line of lines) {
		// 공간 키워드 찾기
		for (const room of roomKeywords) {
			if (line.includes(room)) {
				// 숫자 추출 (평수 또는 제곱미터)
				// 패턴: 숫자.숫자 또는 숫자
				const numberMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:평|㎡|m2|M2)/i)

				if (numberMatch) {
					let area = parseFloat(numberMatch[1])

					// ㎡인 경우 평수로 변환
					if (line.match(/㎡|m2|M2/i)) {
						area = area / 3.3
					}

					// 같은 공간이 여러 번 나오면 합산
					if (roomAreas[room]) {
						roomAreas[room] += area
					} else {
						roomAreas[room] = area
					}

					console.log(`  ✓ ${room}: ${area.toFixed(1)}평`)
					break // 해당 라인에서 첫 번째 매치만 사용
				}
			}
		}
	}

	return roomAreas
}

/**
 * 도면 이미지 분석 (메인 함수)
 */
export async function analyzeFloorPlan(imageUrl: string): Promise<FloorPlanAnalysisResult> {
	console.log('🏠 Starting floor plan analysis...')

	// 1. OCR로 텍스트 추출
	const rawText = await extractTextFromImage(imageUrl)
	console.log('\n📄 Extracted text:')
	console.log(rawText)

	// 2. 텍스트에서 공간별 면적 파싱
	console.log('\n🔍 Parsing room areas...')
	const roomAreas = parseRoomAreas(rawText)

	// 3. 총 면적 계산
	const totalArea = Object.values(roomAreas).reduce((sum, area) => sum + area, 0)

	// 4. 신뢰도 계산 (간단한 휴리스틱)
	const confidence = Object.keys(roomAreas).length > 0 ? 0.8 : 0.0

	console.log('\n✨ Analysis complete!')
	console.log(`Total area: ${totalArea.toFixed(1)}평`)
	console.log(`Confidence: ${(confidence * 100).toFixed(0)}%`)

	return {
		roomAreas,
		totalArea,
		rawText,
		confidence
	}
}

/**
 * 여러 도면 이미지 분석 (복수 이미지)
 */
export async function analyzeMultipleFloorPlans(
	imageUrls: string[]
): Promise<FloorPlanAnalysisResult> {
	console.log(`📐 Analyzing ${imageUrls.length} floor plan images...`)

	const allRoomAreas: RoomArea = {}
	let allRawText = ''

	for (let i = 0; i < imageUrls.length; i++) {
		console.log(`\n[Image ${i + 1}/${imageUrls.length}]`)

		const result = await analyzeFloorPlan(imageUrls[i])

		// 면적 합산
		for (const [room, area] of Object.entries(result.roomAreas)) {
			if (allRoomAreas[room]) {
				allRoomAreas[room] += area
			} else {
				allRoomAreas[room] = area
			}
		}

		allRawText += `\n\n=== Image ${i + 1} ===\n${result.rawText}`
	}

	const totalArea = Object.values(allRoomAreas).reduce((sum, area) => sum + area, 0)
	const confidence = Object.keys(allRoomAreas).length > 0 ? 0.8 : 0.0

	console.log('\n✅ All images analyzed!')
	console.log(`Total rooms: ${Object.keys(allRoomAreas).length}`)
	console.log(`Total area: ${totalArea.toFixed(1)}평`)

	return {
		roomAreas: allRoomAreas,
		totalArea,
		rawText: allRawText,
		confidence
	}
}
