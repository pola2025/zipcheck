/**
 * Test Google Cloud Vision API with actual generated image
 */

import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'
import { createCanvas } from 'canvas'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function createFloorPlanImage(): string {
	// 캔버스 생성 (800x600)
	const canvas = createCanvas(800, 600)
	const ctx = canvas.getContext('2d')

	// 배경 (흰색)
	ctx.fillStyle = 'white'
	ctx.fillRect(0, 0, 800, 600)

	// 타이틀
	ctx.fillStyle = 'black'
	ctx.font = 'bold 48px Arial'
	ctx.fillText('평면도', 300, 100)

	// 공간별 면적 텍스트
	ctx.font = '36px Arial'
	const spaces = [
		{ name: '주방', area: '5.5평' },
		{ name: '거실', area: '15.3평' },
		{ name: '안방', area: '8평' },
		{ name: '화장실', area: '3.2평' },
		{ name: '베란다', area: '2평' }
	]

	let y = 200
	spaces.forEach((space, index) => {
		ctx.fillText(`${space.name}: ${space.area}`, 150, y)
		y += 60
	})

	// PNG로 변환하여 base64 반환
	const buffer = canvas.toBuffer('image/png')
	return buffer.toString('base64')
}

async function testWithGeneratedImage() {
	console.log('🧪 Canvas로 생성한 이미지로 테스트\n')
	console.log('='.repeat(80))

	const apiKey = process.env.GOOGLE_CLOUD_API_KEY

	if (!apiKey) {
		console.error('❌ GOOGLE_CLOUD_API_KEY가 설정되지 않았습니다.')
		return
	}

	try {
		console.log('🎨 도면 이미지 생성 중...')
		const imageBase64 = createFloorPlanImage()
		console.log(`✅ 이미지 생성 완료 (${imageBase64.length} bytes)`)

		console.log('\n📸 Google Cloud Vision API 호출 중...')
		const response = await axios.post(
			`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
			{
				requests: [
					{
						image: { content: imageBase64 },
						features: [
							{
								type: 'TEXT_DETECTION',
								maxResults: 1
							}
						]
					}
				]
			}
		)

		console.log('✅ API 호출 성공!')

		const textAnnotations = response.data.responses[0]?.textAnnotations

		if (!textAnnotations || textAnnotations.length === 0) {
			console.log('⚠️  텍스트를 찾지 못했습니다.')
			return
		}

		const fullText = textAnnotations[0].description
		console.log('\n📄 추출된 텍스트:')
		console.log('-'.repeat(80))
		console.log(fullText)
		console.log('-'.repeat(80))

		console.log('\n✅ 테스트 성공!')
	} catch (error: any) {
		console.error('\n❌ 에러:', error.response?.data || error.message)
	}

	console.log('\n' + '='.repeat(80))
}

testWithGeneratedImage()
