/**
 * 고객 여정 로깅 시스템 검증
 *
 * 검증 항목:
 * 1. Notion 데이터베이스에 '견적발송' 옵션 존재 확인
 * 2. notion-customer-log.ts에 모든 로깅 함수 존재 확인
 * 3. quote-requests.ts에 모든 로깅 호출 존재 확인
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { Client } from '@notionhq/client'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_REQUEST_DB_ID

if (!NOTION_API_KEY || !CUSTOMER_DB_ID) {
	console.error('❌ NOTION_API_KEY 또는 NOTION_CUSTOMER_REQUEST_DB_ID가 설정되지 않았습니다.')
	process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

async function verifyCustomerJourneyLogging() {
	console.log('🔍 고객 여정 로깅 시스템 검증 시작...\n')

	let allChecksPassed = true

	// 1. Notion 데이터베이스 스키마 검증
	console.log('=== 1️⃣  Notion 데이터베이스 스키마 검증 ===\n')
	try {
		const database = await notion.databases.retrieve({
			database_id: CUSTOMER_DB_ID
		})

		const requestTypeProperty = (database as any).properties['요청타입']
		if (requestTypeProperty && requestTypeProperty.select) {
			const options = requestTypeProperty.select.options.map((opt: any) => opt.name)

			console.log('📊 요청타입 옵션:')
			options.forEach((opt: string) => console.log(`   - ${opt}`))
			console.log()

			const requiredOptions = ['견적신청', '결제완료', '도면분석', 'GPT분석', '견적발송']
			const missingOptions = requiredOptions.filter(opt => !options.includes(opt))

			if (missingOptions.length === 0) {
				console.log('✅ 모든 필수 옵션이 존재합니다\n')
			} else {
				console.log(`❌ 누락된 옵션: ${missingOptions.join(', ')}\n`)
				allChecksPassed = false
			}
		} else {
			console.log('❌ 요청타입 속성을 찾을 수 없습니다\n')
			allChecksPassed = false
		}
	} catch (error: any) {
		console.error('❌ 데이터베이스 조회 실패:', error.message, '\n')
		allChecksPassed = false
	}

	// 2. notion-customer-log.ts 파일 검증
	console.log('=== 2️⃣  Notion 로깅 서비스 파일 검증 ===\n')
	const logServicePath = path.resolve(__dirname, '../services/notion-customer-log.ts')

	if (!fs.existsSync(logServicePath)) {
		console.log('❌ notion-customer-log.ts 파일을 찾을 수 없습니다\n')
		allChecksPassed = false
	} else {
		const logServiceContent = fs.readFileSync(logServicePath, 'utf-8')

		const requiredFunctions = [
			'logQuoteRequest',
			'logPaymentComplete',
			'logAnalysisComplete',
			'logQuoteDelivery'
		]

		const requiredInterfaces = [
			'QuoteRequestLog',
			'PaymentCompleteLog',
			'AnalysisCompleteLog',
			'QuoteDeliveryLog'
		]

		console.log('📝 필수 함수 확인:')
		requiredFunctions.forEach(func => {
			const exists = logServiceContent.includes(`export async function ${func}`)
			console.log(`   ${exists ? '✅' : '❌'} ${func}`)
			if (!exists) allChecksPassed = false
		})
		console.log()

		console.log('📝 필수 인터페이스 확인:')
		requiredInterfaces.forEach(iface => {
			const exists = logServiceContent.includes(`interface ${iface}`)
			console.log(`   ${exists ? '✅' : '❌'} ${iface}`)
			if (!exists) allChecksPassed = false
		})
		console.log()
	}

	// 3. quote-requests.ts 파일 검증
	console.log('=== 3️⃣  Quote Requests 라우터 통합 검증 ===\n')
	const routerPath = path.resolve(__dirname, '../routes/quote-requests.ts')

	if (!fs.existsSync(routerPath)) {
		console.log('❌ quote-requests.ts 파일을 찾을 수 없습니다\n')
		allChecksPassed = false
	} else {
		const routerContent = fs.readFileSync(routerPath, 'utf-8')

		// Import 확인
		const hasImport = routerContent.includes('import { logQuoteRequest, logPaymentComplete, logAnalysisComplete, logQuoteDelivery }')
		console.log(`${hasImport ? '✅' : '❌'} Notion 로깅 함수 import\n`)
		if (!hasImport) allChecksPassed = false

		// 각 단계별 로깅 호출 확인
		console.log('📍 고객 여정 로깅 포인트 확인:\n')

		const loggingPoints = [
			{
				name: '1️⃣  결제 완료 (Payment Complete)',
				pattern: /logPaymentComplete\(/,
				description: '/submit-multiple 엔드포인트'
			},
			{
				name: '2️⃣  견적 신청 (Quote Request)',
				pattern: /logQuoteRequest\(/,
				description: '/submit 및 /submit-multiple 엔드포인트'
			},
			{
				name: '3️⃣  도면 분석 완료 (Floor Plan Analysis)',
				pattern: /logAnalysisComplete\([^)]*analysisType:\s*['"]도면분석['"]/,
				description: '/admin/:id/analyze 엔드포인트'
			},
			{
				name: '4️⃣  GPT 분석 완료 (GPT Analysis)',
				pattern: /logAnalysisComplete\([^)]*analysisType:\s*['"]GPT분석['"]/,
				description: '/admin/:id/analyze 및 /admin/:id/analyze-comprehensive 엔드포인트'
			},
			{
				name: '5️⃣  견적 발송 (Quote Delivery)',
				pattern: /logQuoteDelivery\(/,
				description: '/result/:id 엔드포인트'
			}
		]

		loggingPoints.forEach(point => {
			const matches = routerContent.match(point.pattern)
			const count = matches ? routerContent.split(point.pattern).length - 1 : 0

			if (count > 0) {
				console.log(`✅ ${point.name}`)
				console.log(`   위치: ${point.description}`)
				console.log(`   호출 횟수: ${count}회\n`)
			} else {
				console.log(`❌ ${point.name}`)
				console.log(`   위치: ${point.description}`)
				console.log(`   ⚠️  로깅 호출을 찾을 수 없습니다\n`)
				allChecksPassed = false
			}
		})
	}

	// 4. 최종 결과
	console.log('=== 📊 검증 결과 ===\n')
	if (allChecksPassed) {
		console.log('🎉 모든 검증을 통과했습니다!')
		console.log('\n✅ 고객 여정 로깅 시스템이 올바르게 구현되었습니다:')
		console.log('   1️⃣  결제 완료 → Notion 로그')
		console.log('   2️⃣  견적 신청 → Notion 로그')
		console.log('   3️⃣  도면/GPT 분석 완료 → Notion 로그')
		console.log('   4️⃣  견적 발송 (웹 조회) → Notion 로그')
		console.log('\n🚀 프로덕션 배포 준비 완료!')
	} else {
		console.log('❌ 일부 검증에 실패했습니다')
		console.log('   위의 오류를 확인하고 수정해주세요')
		process.exit(1)
	}
}

verifyCustomerJourneyLogging()
	.then(() => {
		console.log('\n✅ 검증 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 검증 스크립트 실행 실패:', error)
		process.exit(1)
	})
