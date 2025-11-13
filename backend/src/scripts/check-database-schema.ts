/**
 * Notion 데이터베이스 스키마(속성) 확인
 */

import dotenv from 'dotenv'
import path from 'path'
import { Client } from '@notionhq/client'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

async function checkDatabaseSchema() {
	if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
		console.error('❌ NOTION_API_KEY 또는 NOTION_DATABASE_ID가 설정되지 않았습니다.')
		process.exit(1)
	}

	const notion = new Client({ auth: NOTION_API_KEY })

	try {
		console.log('🔍 데이터베이스 스키마 확인 중...\n')

		const database = await notion.databases.retrieve({
			database_id: NOTION_DATABASE_ID
		})

		console.log(`📊 데이터베이스: ${database.title?.[0]?.plain_text || '제목 없음'}`)
		console.log(`🔗 URL: ${database.url}\n`)

		console.log('📋 현재 속성(Properties):')
		const properties = database.properties

		Object.entries(properties).forEach(([name, prop]: [string, any]) => {
			console.log(`   - ${name} (${prop.type})`)
		})

		console.log('\n💡 필요한 속성:')
		console.log('   - 제목 (title)')
		console.log('   - 카테고리 (select)')
		console.log('   - 작성자 (rich_text)')
		console.log('   - 일시 (date)')

	} catch (error: any) {
		console.error('❌ 에러 발생:', error.message)
	}
}

checkDatabaseSchema()
