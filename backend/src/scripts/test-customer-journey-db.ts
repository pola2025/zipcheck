/**
 * 고객여정DB 테스트 데이터 기록
 *
 * 4가지 로그 타입 모두 테스트:
 * 1. 결제 완료
 * 2. 견적 신청
 * 3. 분석 완료 (도면분석, GPT분석)
 * 4. 견적 발송
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import {
	logPaymentComplete,
	logQuoteRequest,
	logAnalysisComplete,
	logQuoteDelivery
} from '../services/notion-customer-log'

async function testCustomerJourneyDB() {
	console.log('🧪 고객여정DB 테스트 데이터 기록 시작...\n')

	try {
		// 1. 결제 완료 테스트
		console.log('1️⃣  결제 완료 로그 테스트...')
		await logPaymentComplete({
			orderId: 'test_order_' + Date.now(),
			planType: '베이직 플랜',
			amount: 50000,
			customerName: '테스트 고객'
		})
		console.log('✅ 결제 완료 로그 기록 성공\n')
		await sleep(1000)

		// 2. 견적 신청 테스트
		console.log('2️⃣  견적 신청 로그 테스트...')
		await logQuoteRequest({
			quoteRequestId: 9999,
			customerName: '김집첵',
			customerPhone: '010-1234-5678',
			propertyInfo: '서울시 강남구 테헤란로 123 (테스트 매물)',
			amount: 850000,
			itemCount: 12
		})
		console.log('✅ 견적 신청 로그 기록 성공\n')
		await sleep(1000)

		// 3-1. 도면 분석 완료 테스트
		console.log('3️⃣  도면 분석 완료 로그 테스트...')
		await logAnalysisComplete({
			quoteRequestId: 9999,
			customerName: '김집첵',
			analysisType: '도면분석',
			totalAmount: 850000,
			overallScore: 82,
			status: 'succeeded'
		})
		console.log('✅ 도면 분석 완료 로그 기록 성공\n')
		await sleep(1000)

		// 3-2. GPT 분석 완료 테스트
		console.log('4️⃣  GPT 분석 완료 로그 테스트...')
		await logAnalysisComplete({
			quoteRequestId: 9999,
			customerName: '김집첵',
			analysisType: 'GPT분석',
			totalAmount: 850000,
			overallScore: 78,
			status: 'succeeded'
		})
		console.log('✅ GPT 분석 완료 로그 기록 성공\n')
		await sleep(1000)

		// 4. 견적 발송 테스트 (웹 조회)
		console.log('5️⃣  견적 발송 로그 테스트 (웹 조회)...')
		await logQuoteDelivery({
			quoteRequestId: 9999,
			customerName: '김집첵',
			customerPhone: '010-1234-5678',
			deliveryMethod: 'web',
			overallScore: 78,
			totalAmount: 850000
		})
		console.log('✅ 견적 발송 로그 기록 성공 (웹 조회)\n')

		// 최종 요약
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('🎉 모든 테스트 로그 기록 완료!')
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('\n📊 기록된 로그:')
		console.log('   1. ✅ 결제 완료 - "테스트 고객" (50,000원)')
		console.log('   2. ✅ 견적 신청 - "김집첵" (850,000원, 12개 항목)')
		console.log('   3. ✅ 도면 분석 완료 - "김집첵" (점수 82)')
		console.log('   4. ✅ GPT 분석 완료 - "김집첵" (점수 78)')
		console.log('   5. ✅ 견적 발송 - "김집첵" (웹 조회)')
		console.log('\n📱 Notion에서 확인:')
	console.log('   https://www.notion.so/<your-notion-customer-request-db-id>')
		console.log('\n✨ 고객 여정 전체 플로우가 Notion에 기록되었습니다!')

	} catch (error) {
		console.error('❌ 테스트 로그 기록 실패:', error)
		process.exit(1)
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

testCustomerJourneyDB()
	.then(() => {
		console.log('\n✅ 테스트 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 테스트 스크립트 실행 실패:', error)
		process.exit(1)
	})
