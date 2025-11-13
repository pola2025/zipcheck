/**
 * Slack 알림 테스트 스크립트
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables FIRST (before importing slack-notifications)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Now import after env is loaded
import {
	notifyQuoteRequest,
	notifyPaymentComplete,
	notifyAnalysisComplete,
	notifyFloorPlanAnalysis,
	notifyDailyStats
} from '../services/slack-notifications'

async function testSlackNotifications() {
	console.log('🧪 Slack 알림 테스트 시작...\n')

	try {
		// 1. Admin Webhook 테스트 - 견적 신청 알림
		console.log('📝 테스트 1: 견적 신청 알림 (Admin Webhook)')
		await notifyQuoteRequest({
			requestId: 99999,
			customerName: '테스트 고객',
			customerPhone: '010-1234-5678',
			propertyType: '아파트',
			propertySize: 34,
			region: '서울 강남구',
			itemCount: 15,
			totalAmount: 12500000
		})
		console.log('✅ 견적 신청 알림 전송 완료\n')

		// 잠시 대기
		await new Promise(resolve => setTimeout(resolve, 1000))

		// 2. Admin Webhook 테스트 - 결제 완료 알림
		console.log('💳 테스트 2: 결제 완료 알림 (Admin Webhook)')
		await notifyPaymentComplete({
			orderId: 'TEST-ORDER-123',
			customerName: '테스트 고객',
			customerPhone: '010-1234-5678',
			planName: '3견적 비교 플랜',
			amount: 59000,
			paymentMethod: '카드'
		})
		console.log('✅ 결제 완료 알림 전송 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		// 3. Dev Webhook 테스트 - 도면 분석 완료 알림
		console.log('🏠 테스트 3: 도면 분석 완료 알림 (Dev Webhook)')
		await notifyFloorPlanAnalysis({
			quoteRequestId: 99999,
			customerName: '테스트 고객',
			totalArea: 34.5,
			roomCount: 4,
			confidence: 0.85,
			rooms: {
				'거실': 15.3,
				'주방': 5.5,
				'안방': 10.2,
				'화장실': 3.5
			}
		})
		console.log('✅ 도면 분석 알림 전송 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		// 4. Dev Webhook 테스트 - GPT-5 Pro 분석 완료 알림
		console.log('🤖 테스트 4: GPT-5 Pro 분석 완료 알림 (Dev Webhook)')
		await notifyAnalysisComplete({
			quoteRequestId: 99999,
			customerName: '테스트 고객',
			totalAmount: 12500000,
			overallScore: 75,
			tokenUsage: {
				prompt_tokens: 12450,
				completion_tokens: 2850,
				total_tokens: 15300
			},
			costUsd: 0.58,
			duration: 8500,
			status: 'succeeded'
		})
		console.log('✅ 분석 완료 알림 전송 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		// 5. Dev Webhook 테스트 - 일일 통계 알림
		console.log('📊 테스트 5: 일일 통계 알림 (Dev Webhook)')
		await notifyDailyStats({
			date: new Date().toISOString().split('T')[0],
			totalJobs: 25,
			succeededJobs: 22,
			failedJobs: 3,
			totalTokens: 385000,
			totalCost: 14.25,
			avgTokens: 15400,
			avgCost: 0.57,
			successRate: 88.0
		})
		console.log('✅ 일일 통계 알림 전송 완료\n')

		console.log('🎉 모든 Slack 알림 테스트 완료!')
		console.log('\n📱 Slack 채널을 확인하여 메시지가 도착했는지 확인하세요:')
		console.log('   - Admin Webhook: 견적 신청, 결제 완료')
		console.log('   - Dev Webhook: 도면 분석, GPT-5 Pro 분석, 일일 통계')

	} catch (error) {
		console.error('❌ 테스트 중 에러 발생:', error)
		if (error instanceof Error) {
			console.error('에러 메시지:', error.message)
		}
	}
}

// 스크립트 실행
testSlackNotifications()
	.then(() => {
		console.log('\n✅ 테스트 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 테스트 스크립트 실행 실패:', error)
		process.exit(1)
	})
