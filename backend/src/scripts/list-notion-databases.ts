/**
 * Notion API로 접근 가능한 데이터베이스 목록 확인
 */

import dotenv from 'dotenv'
import path from 'path'
import { Client } from '@notionhq/client'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const NOTION_API_KEY = process.env.NOTION_API_KEY

async function listDatabases() {
	if (!NOTION_API_KEY) {
		console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
		process.exit(1)
	}

	const notion = new Client({ auth: NOTION_API_KEY })

	try {
		console.log('🔍 현재 API 키로 접근 가능한 페이지/데이터베이스를 검색 중...\n')

		// Search for all databases
		const response = await notion.search({
			filter: {
				value: 'database',
				property: 'object'
			},
			sort: {
				direction: 'descending',
				timestamp: 'last_edited_time'
			}
		})

		if (response.results.length === 0) {
			console.log('❌ 접근 가능한 데이터베이스가 없습니다.\n')
			console.log('📝 해결 방법:')
			console.log('1. Notion에서 데이터베이스 페이지 생성')
			console.log('2. 데이터베이스 페이지 우측 상단 "•••" → "연결 추가"')
			console.log('3. 이 API 키로 만든 통합 선택')
			console.log('4. https://www.notion.so/my-integrations 에서 통합 이름 확인 가능\n')
			process.exit(0)
		}

		console.log(`✅ ${response.results.length}개의 데이터베이스 발견:\n`)

		response.results.forEach((db: any, index) => {
			const title = db.title?.[0]?.plain_text || '제목 없음'
			const id = db.id.replace(/-/g, '')
			const url = db.url

			console.log(`${index + 1}. ${title}`)
			console.log(`   ID: ${id}`)
			console.log(`   URL: ${url}`)
			console.log(`   마지막 수정: ${db.last_edited_time}\n`)
		})

		console.log('💡 .env 파일의 NOTION_DATABASE_ID에 원하는 데이터베이스 ID를 붙여넣으세요.')

	} catch (error: any) {
		console.error('❌ 에러 발생:', error.message)
		if (error.code === 'unauthorized') {
			console.log('\n🔑 API 키가 유효하지 않습니다.')
			console.log('https://www.notion.so/my-integrations 에서 확인해주세요.')
		}
	}
}

listDatabases()
