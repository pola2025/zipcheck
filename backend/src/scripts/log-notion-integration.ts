/**
 * Notion 통합 작업 내역을 Notion에 기록
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { logToNotion } from '../services/notion-log'

async function logNotionIntegration() {
	console.log('📝 Notion 통합 작업 내역을 기록 중...\n')

	try {
		// 1. Notion 통합 구현 완료
		await logToNotion({
			title: 'Notion 개발 로그 시스템 구현 완료',
			category: '구현',
			description: '개발 작업 내역을 Notion 데이터베이스에 자동으로 기록하는 시스템 구축 완료',
			details: [
				'@notionhq/client SDK를 사용한 Notion API 통합',
				'다양한 카테고리 지원: 구현, 버그수정, 배포, 테스트, 문서화, 회의, 기타',
				'Rich text formatting 및 emoji 아이콘 지원',
				'코드 변경사항 자동 기록 기능',
				'에러 처리 및 사용자 안내 개선'
			],
			codeChanges: [
				{ file: 'backend/src/services/notion-log.ts', summary: 'Notion 로그 서비스 생성 (logToNotion, logTaskComplete, logBugFix 등)' },
				{ file: 'backend/src/scripts/test-notion-log.ts', summary: 'Notion 로그 테스트 스크립트' },
				{ file: 'backend/src/scripts/create-dev-log-database.ts', summary: '데이터베이스 자동 생성 스크립트' },
				{ file: 'backend/src/scripts/list-notion-databases.ts', summary: '접근 가능한 데이터베이스 목록 확인 스크립트' },
				{ file: 'backend/src/scripts/check-database-schema.ts', summary: '데이터베이스 스키마 확인 스크립트' },
				{ file: 'backend/package.json', summary: '@notionhq/client 패키지 추가' },
				{ file: 'backend/.env', summary: 'NOTION_API_KEY 및 NOTION_DATABASE_ID 설정' },
				{ file: 'C:\\Users\\flame\\AppData\\Roaming\\Claude\\claude_desktop_config.json', summary: 'Claude Desktop MCP Notion 통합 설정' }
			],
			author: 'Claude Code',
			timestamp: new Date()
		})
		console.log('✅ 작업 1/3 기록 완료\n')
		await new Promise(resolve => setTimeout(resolve, 1000))

		// 2. 데이터베이스 자동 생성
		await logToNotion({
			title: 'ZipCheck 개발 로그 데이터베이스 자동 생성',
			category: '구현',
			description: 'Notion API를 통해 "집첵 로그" 페이지 하위에 "ZipCheck 개발 로그" 데이터베이스 자동 생성',
			details: [
				'데이터베이스 속성 구성:',
				'  - 제목 (Title 타입)',
				'  - 카테고리 (Select 타입: 구현, 버그수정, 배포, 테스트, 문서화, 회의, 기타)',
				'  - 작성자 (Text 타입)',
				'  - 일시 (Date 타입)',
				'',
				'Database ID: <your-notion-log-db-id>',
				'URL: https://www.notion.so/<your-notion-log-db-id>',
				'',
				'Claude MCP 통합 자동 연결 완료'
			],
			codeChanges: [
				{ file: 'backend/src/scripts/create-dev-log-database.ts', summary: 'Notion API로 데이터베이스 자동 생성 스크립트' }
			],
			author: 'Claude Code',
			timestamp: new Date()
		})
		console.log('✅ 작업 2/3 기록 완료\n')
		await new Promise(resolve => setTimeout(resolve, 1000))

		// 3. 테스트 및 검증
		await logToNotion({
			title: 'Notion 로그 시스템 테스트 완료',
			category: '테스트',
			description: '모든 Notion 로그 기능 테스트 완료 및 정상 작동 확인',
			details: [
				'✅ 작업 완료 로그 (logTaskComplete) - 정상',
				'✅ 버그 수정 로그 (logBugFix) - 정상',
				'✅ 배포 로그 (logDeployment) - 정상',
				'✅ 커스텀 로그 (logToNotion) - 정상',
				'',
				'총 4개의 테스트 로그가 Notion 데이터베이스에 성공적으로 저장됨',
				'',
				'환경 변수 설정 확인:',
				'  - NOTION_API_KEY: ✅',
				'  - NOTION_DATABASE_ID: ✅',
				'',
				'Claude MCP 통합 설정 확인:',
				'  - claude_desktop_config.json 설정 완료'
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

logNotionIntegration()
	.then(() => {
		console.log('\n✅ 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 스크립트 실행 실패:', error)
		process.exit(1)
	})
