/**
 * 고객 요청 로그 시스템 작업 내역을 Notion에 기록
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { logToNotion } from '../services/notion-log'

async function logCustomerLogSystem() {
	console.log('📝 고객 요청 로그 시스템 작업 내역을 Notion에 기록 중...\n')

	try {
		// 1. 고객 요청 로그 데이터베이스 생성
		await logToNotion({
			title: '고객 요청 로그 데이터베이스 생성 완료',
			category: '구현',
			description: 'Notion에 결제, 견적 신청, 분석 완료 등 고객 관련 이벤트를 기록하는 전용 데이터베이스 생성',
			details: [
				'데이터베이스 속성 구성:',
				'  - 제목 (Title)',
				'  - 요청타입 (Select: 견적신청, 결제완료, 도면분석, GPT분석, 기타)',
				'  - 고객명 (Text)',
				'  - 연락처 (Phone)',
				'  - 매물정보 (Text)',
				'  - 금액 (Number - 원화)',
				'  - 상태 (Select: 신규, 처리중, 완료, 취소)',
				'  - 일시 (Date)',
				'  - 견적ID (Number)',
				'',
				'Database ID: <your-notion-customer-request-db-id>',
				'URL: https://www.notion.so/<your-notion-customer-request-db-id>',
				'',
				'Claude MCP 통합 자동 연결 완료'
			],
			codeChanges: [
				{ file: 'backend/src/scripts/create-customer-request-database.ts', summary: 'Notion API로 고객 요청 로그 데이터베이스 생성 스크립트' }
			],
			author: 'Claude Code',
			timestamp: new Date()
		})
		console.log('✅ 작업 1/3 기록 완료\n')
		await new Promise(resolve => setTimeout(resolve, 1000))

		// 2. 고객 요청 로그 서비스 구현
		await logToNotion({
			title: '고객 요청 Notion 로그 서비스 구현 완료',
			category: '구현',
			description: '결제, 견적 신청, 분석 완료 등 고객 관련 이벤트를 Notion에 자동으로 기록하는 서비스',
			details: [
				'구현된 로그 함수:',
				'  - logQuoteRequest(): 견적 신청 로그 (고객명, 매물 정보, 금액, 항목 수)',
				'  - logPaymentComplete(): 결제 완료 로그 (주문 ID, 플랜, 결제 금액)',
				'  - logAnalysisComplete(): 분석 완료 로그 (도면분석/GPT분석 구분, 점수)',
				'',
				'Rich content 지원:',
				'  - 상세 항목을 bulleted list로 표시',
				'  - 이모지 아이콘 자동 할당 (📝, 💳, 🏠, 🤖)',
				'  - 상태 자동 설정 (신규, 완료, 취소)',
				'',
				'에러 처리:',
				'  - 로그 실패 시에도 메인 로직에 영향 없음',
				'  - 에러는 콘솔에만 기록',
				'  - API 호출 실패 처리'
			],
			codeChanges: [
				{ file: 'backend/src/services/notion-customer-log.ts', summary: 'Notion 고객 요청 로그 서비스 생성 (3개 로그 함수)' },
				{ file: 'backend/.env', summary: 'NOTION_CUSTOMER_REQUEST_DB_ID 환경 변수 추가' }
			],
			author: 'Claude Code',
			timestamp: new Date()
		})
		console.log('✅ 작업 2/3 기록 완료\n')
		await new Promise(resolve => setTimeout(resolve, 1000))

		// 3. 엔드포인트 통합 및 테스트
		await logToNotion({
			title: 'Notion 로그를 기존 엔드포인트에 통합 완료',
			category: '구현',
			description: '견적 신청 및 결제 엔드포인트에 Notion 자동 로깅 통합 완료',
			details: [
				'통합된 엔드포인트:',
				'  1. POST /api/quote-requests/submit',
				'     → 견적 신청 로그 자동 기록',
				'',
				'  2. POST /api/quote-requests/submit-multiple',
				'     → 결제 완료 + 견적 신청 로그 자동 기록',
				'',
				'동작 방식:',
				'  - 기존 Slack 알림과 병행하여 Notion에도 기록',
				'  - 로그 실패 시에도 견적 신청은 정상 처리',
				'  - 모든 고객 요청이 Notion에 구조화되어 저장됨',
				'',
				'테스트 결과:',
				'  ✅ 견적 신청 로그 - 정상',
				'  ✅ 결제 완료 로그 - 정상',
				'  ✅ 도면 분석 로그 - 정상',
				'  ✅ GPT 분석 로그 - 정상',
				'',
				'총 4개의 테스트 로그가 성공적으로 기록됨'
			],
			codeChanges: [
				{ file: 'backend/src/routes/quote-requests.ts', summary: 'Notion 로그 import 추가 및 2개 엔드포인트에 통합' },
				{ file: 'backend/src/scripts/test-customer-log.ts', summary: '고객 요청 로그 테스트 스크립트 생성' }
			],
			author: 'Claude Code',
			timestamp: new Date()
		})
		console.log('✅ 작업 3/3 기록 완료\n')

		console.log('🎉 모든 작업 내역이 Notion에 기록되었습니다!')
	console.log('📱 Notion에서 확인: https://www.notion.so/<your-notion-log-db-id>')

	} catch (error) {
		console.error('❌ 작업 내역 기록 실패:', error)
		process.exit(1)
	}
}

logCustomerLogSystem()
	.then(() => {
		console.log('\n✅ 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 스크립트 실행 실패:', error)
		process.exit(1)
	})
