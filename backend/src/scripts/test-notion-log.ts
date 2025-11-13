/**
 * Notion 로그 테스트 스크립트
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { logToNotion, logTaskComplete, logBugFix, logDeployment } from '../services/notion-log'

async function testNotionLog() {
	console.log('🧪 Notion 로그 테스트 시작...\n')

	try {
		// 환경 변수 확인
		const hasApiKey = !!process.env.NOTION_API_KEY
		const hasDatabaseId = !!process.env.NOTION_DATABASE_ID

		console.log('📋 환경 변수 확인:')
		console.log(`   NOTION_API_KEY: ${hasApiKey ? '✅ 설정됨' : '❌ 없음'}`)
		console.log(`   NOTION_DATABASE_ID: ${hasDatabaseId ? '✅ 설정됨' : '❌ 없음'}\n`)

		if (!hasApiKey) {
			console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
			console.log('   .env 파일에 NOTION_API_KEY를 추가해주세요.\n')
			process.exit(1)
		}

		if (!hasDatabaseId) {
			console.error('❌ NOTION_DATABASE_ID가 설정되지 않았습니다.')
			console.log('\n📝 Notion 데이터베이스 설정 방법:')
			console.log('1. Notion에서 새 페이지 생성 → "데이터베이스 - 전체 페이지" 선택')
			console.log('2. 데이터베이스 이름: "ZipCheck 개발 로그"')
			console.log('3. 다음 속성(열) 추가:')
			console.log('   - 제목 (이미 있음, Title 타입)')
			console.log('   - 카테고리 (Select 타입)')
			console.log('     옵션: 구현, 버그수정, 배포, 테스트, 문서화, 회의, 기타')
			console.log('   - 작성자 (Text 타입)')
			console.log('   - 일시 (Date 타입)')
			console.log('4. 데이터베이스 우측 상단 "•••" → "연결 추가" → 통합 선택')
			console.log('   (통합이 없으면 https://www.notion.so/my-integrations 에서 생성)')
			console.log('5. 브라우저 URL에서 database_id 복사:')
			console.log('   https://notion.so/[이_부분이_database_id]?v=...')
			console.log('6. .env 파일에 추가:')
			console.log('   NOTION_DATABASE_ID=복사한_database_id\n')
			process.exit(1)
		}

		console.log('📝 테스트 1: 작업 완료 로그')
		await logTaskComplete('Notion 통합 구현', [
			'@notionhq/client 패키지 추가',
			'notion-log.ts 서비스 생성',
			'환경 변수 설정',
			'테스트 스크립트 작성'
		])
		console.log('✅ 작업 완료 로그 전송 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		console.log('🐛 테스트 2: 버그 수정 로그')
		await logBugFix(
			'환경 변수 로딩 순서 문제',
			'dotenv.config()를 import 전에 호출하도록 수정',
			['backend/src/services/slack-notifications.ts', 'backend/src/scripts/test-slack-notifications.ts']
		)
		console.log('✅ 버그 수정 로그 전송 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		console.log('🚀 테스트 3: 배포 로그')
		await logDeployment('development', 'v1.0.0', [
			'Slack 알림 시스템 구축',
			'Notion 로그 시스템 구축',
			'GPT-5 Pro 분석 최적화'
		])
		console.log('✅ 배포 로그 전송 완료\n')

		await new Promise(resolve => setTimeout(resolve, 1000))

		console.log('📌 테스트 4: 커스텀 로그')
		await logToNotion({
			title: 'Notion 로그 시스템 구현 완료',
			category: '구현',
			description: '개발 작업 내역을 Notion 데이터베이스에 자동 기록하는 시스템 구축',
			details: [
				'Notion API 통합',
				'다양한 로그 타입 지원 (구현/버그수정/배포/테스트/문서화/회의)',
				'Rich text formatting 및 emoji 지원',
				'에러 처리 및 사용자 안내 개선'
			],
			codeChanges: [
				{ file: 'backend/src/services/notion-log.ts', summary: 'Notion 로그 서비스 생성' },
				{ file: 'backend/src/scripts/test-notion-log.ts', summary: '테스트 스크립트 생성' },
				{ file: 'backend/package.json', summary: '@notionhq/client 패키지 추가' },
				{ file: 'backend/.env', summary: 'Notion API 설정 추가' }
			],
			author: 'Claude Code',
			timestamp: new Date()
		})
		console.log('✅ 커스텀 로그 전송 완료\n')

		console.log('🎉 모든 Notion 로그 테스트 완료!')
		console.log('\n📱 Notion 데이터베이스를 확인하여 로그가 기록되었는지 확인하세요.')
		console.log(`   Database ID: ${process.env.NOTION_DATABASE_ID}`)

	} catch (error) {
		console.error('❌ 테스트 중 에러 발생:', error)
		if (error instanceof Error) {
			console.error('에러 메시지:', error.message)
		}
		process.exit(1)
	}
}

// 스크립트 실행
testNotionLog()
	.then(() => {
		console.log('\n✅ 테스트 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 테스트 스크립트 실행 실패:', error)
		process.exit(1)
	})
