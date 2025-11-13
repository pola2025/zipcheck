/**
 * 고객 요청 로그 테스트 스크립트
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { logQuoteRequest, logPaymentComplete, logAnalysisComplete } from '../services/notion-customer-log'

async function testCustomerLog() {
	console.log('🧪 고객 요청 로그 테스트 시작...\n')

	try {
		// 환경 변수 확인
		const hasApiKey = !!process.env.NOTION_API_KEY
		const hasDbId = !!process.env.NOTION_CUSTOMER_REQUEST_DB_ID

		console.log('📋 환경 변수 확인:')
		console.log(`   NOTION_API_KEY: ${hasApiKey ? '✅ 설정됨' : '❌ 없음'}`)
		console.log(`   NOTION_CUSTOMER_REQUEST_DB_ID: ${hasDbId ? '✅ 설정됨' : '❌ 없음'}\n`)

		if (!hasApiKey || !hasDbId) {
			console.error('❌ 환경 변수가 설정되지 않았습니다.')
			process.exit(1)
		}

		// 테스트 1: 견적 신청 로그
		console.log('📝 테스트 1: 견적 신청 로그')
		await logQuoteRequest({
			requestId: 99999,
			customerName: '테스트 고객',
			customerPhone: '010-1234-5678',
			propertyType: '아파트',
			propertySize: 34,
			region: '서울 강남구',
			itemCount: 15,
			totalAmount: 12500000
		})
		console.log('✅ 견적 신청 로그 저장 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		// 테스트 2: 결제 완료 로그
		console.log('💳 테스트 2: 결제 완료 로그')
		await logPaymentComplete({
			orderId: 'TEST-ORDER-123',
			customerName: '테스트 고객',
			customerPhone: '010-1234-5678',
			planName: '3견적 비교 플랜',
			amount: 59000,
			paymentMethod: '카드'
		})
		console.log('✅ 결제 완료 로그 저장 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		// 테스트 3: 도면 분석 완료 로그
		console.log('🏠 테스트 3: 도면 분석 완료 로그')
		await logAnalysisComplete({
			quoteRequestId: 99999,
			customerName: '테스트 고객',
			analysisType: '도면분석',
			totalAmount: 12500000,
			status: 'succeeded'
		})
		console.log('✅ 도면 분석 로그 저장 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		// 테스트 4: GPT 분석 완료 로그
		console.log('🤖 테스트 4: GPT 분석 완료 로그')
		await logAnalysisComplete({
			quoteRequestId: 99999,
			customerName: '테스트 고객',
			analysisType: 'GPT분석',
			totalAmount: 12500000,
			overallScore: 75,
			status: 'succeeded'
		})
		console.log('✅ GPT 분석 로그 저장 완료\n')

		console.log('🎉 모든 고객 요청 로그 테스트 완료!')
		console.log('\n📱 Notion 데이터베이스를 확인하여 로그가 기록되었는지 확인하세요.')
		console.log(`   Database ID: ${process.env.NOTION_CUSTOMER_REQUEST_DB_ID}`)
	console.log('   https://www.notion.so/<your-notion-customer-request-db-id>')

	} catch (error) {
		console.error('❌ 테스트 중 에러 발생:', error)
		if (error instanceof Error) {
			console.error('에러 메시지:', error.message)
		}
		process.exit(1)
	}
}

// 스크립트 실행
testCustomerLog()
	.then(() => {
		console.log('\n✅ 테스트 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 테스트 스크립트 실행 실패:', error)
		process.exit(1)
	})
