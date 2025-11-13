/**
 * Test Google Cloud Vision API Integration
 *
 * 간단한 텍스트 이미지를 생성하여 실제 API 호출 테스트
 */

import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// 샘플 base64 이미지 (간단한 텍스트 이미지)
// "주방 5평\n거실 15평\n화장실 3평" 텍스트가 포함된 PNG 이미지
const SAMPLE_IMAGE_BASE64 = `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`

async function testGoogleCloudVisionAPI() {
	console.log('🧪 Google Cloud Vision API 테스트 시작\n')
	console.log('='.repeat(80))

	const apiKey = process.env.GOOGLE_CLOUD_API_KEY

	if (!apiKey) {
		console.error('❌ GOOGLE_CLOUD_API_KEY 환경 변수가 설정되지 않았습니다.')
		console.log('   .env 파일에 API 키를 추가하세요.')
		return
	}

	console.log('✅ API 키 확인 완료')
	console.log(`   API 키: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`)

	try {
		console.log('\n📸 테스트 이미지로 OCR 호출 중...')
		console.log('   이미지 크기:', SAMPLE_IMAGE_BASE64.length, 'bytes')

		// Google Cloud Vision API 호출
		const response = await axios.post(
			`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
			{
				requests: [
					{
						image: { content: SAMPLE_IMAGE_BASE64 },
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

		console.log('\n✅ API 호출 성공!')

		// 응답 확인
		const textAnnotations = response.data.responses[0]?.textAnnotations

		if (!textAnnotations || textAnnotations.length === 0) {
			console.log('⚠️  텍스트를 찾지 못했습니다.')
			console.log('   응답:', JSON.stringify(response.data.responses[0], null, 2))
			return
		}

		// 전체 텍스트 (첫 번째 annotation)
		const fullText = textAnnotations[0].description
		console.log('\n📄 추출된 텍스트:')
		console.log('-'.repeat(80))
		console.log(fullText)
		console.log('-'.repeat(80))

		// 개별 단어들
		console.log('\n📝 개별 텍스트 요소 (처음 10개):')
		textAnnotations.slice(1, 11).forEach((annotation: any, index: number) => {
			console.log(`   ${index + 1}. "${annotation.description}"`)
		})

		// 신뢰도 정보
		if (textAnnotations[0].score) {
			console.log(`\n🎯 신뢰도: ${(textAnnotations[0].score * 100).toFixed(1)}%`)
		}

		console.log('\n✅ Google Cloud Vision API 테스트 성공!')
	} catch (error: any) {
		console.error('\n❌ API 호출 실패:')

		if (error.response) {
			console.error('   상태 코드:', error.response.status)
			console.error('   에러 메시지:', error.response.data.error?.message || error.response.data)

			if (error.response.status === 403) {
				console.error('\n💡 API 키 권한 문제일 수 있습니다.')
				console.error('   1. Google Cloud Console에서 Vision API가 활성화되어 있는지 확인')
				console.error('   2. API 키에 Vision API 권한이 있는지 확인')
			} else if (error.response.status === 400) {
				console.error('\n💡 요청 형식 문제일 수 있습니다.')
				console.error('   이미지 base64 인코딩을 확인하세요.')
			}
		} else {
			console.error('   에러:', error.message)
		}
	}

	console.log('\n' + '='.repeat(80))
	console.log('✨ 테스트 완료!\n')
}

// 실행
testGoogleCloudVisionAPI()
