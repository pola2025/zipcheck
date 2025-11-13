/**
 * 최근 Notion 로그 확인
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { Client } from '@notionhq/client'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_REQUEST_DB_ID
const DEV_DB_ID = process.env.NOTION_DATABASE_ID

const notion = new Client({ auth: NOTION_API_KEY })

async function checkRecentLogs() {
	console.log('📊 최근 Notion 로그 확인 중...\n')

	try {
		// 고객 요청 로그 확인
		console.log('=== 🙋 고객 요청 로그 (최근 5개) ===\n')
		const customerLogs = await notion.databases.query({
			database_id: CUSTOMER_DB_ID!,
			page_size: 5,
			sorts: [{ property: '일시', direction: 'descending' }]
		})

		for (const page of customerLogs.results) {
			if ('properties' in page) {
				const title = page.properties['제목'] as any
				const requestType = page.properties['요청타입'] as any
				const customerName = page.properties['고객명'] as any
				const amount = page.properties['금액'] as any
				const date = page.properties['일시'] as any

				console.log(`📝 ${title.title?.[0]?.text?.content || 'Untitled'}`)
				console.log(`   타입: ${requestType.select?.name || '-'}`)
				console.log(`   고객: ${customerName.rich_text?.[0]?.text?.content || '-'}`)
				console.log(`   금액: ${amount.number?.toLocaleString() || 0}원`)
				console.log(`   일시: ${date.date?.start || '-'}`)
				console.log(`   URL: https://www.notion.so/${page.id.replace(/-/g, '')}`)
				console.log()
			}
		}

		// 개발 로그 확인
		console.log('\n=== 🔨 개발 로그 (최근 5개) ===\n')
		const devLogs = await notion.databases.query({
			database_id: DEV_DB_ID!,
			page_size: 5,
			sorts: [{ property: '일시', direction: 'descending' }]
		})

		for (const page of devLogs.results) {
			if ('properties' in page) {
				const title = page.properties['제목'] as any
				const category = page.properties['카테고리'] as any
				const author = page.properties['작성자'] as any
				const date = page.properties['일시'] as any

				console.log(`🔨 ${title.title?.[0]?.text?.content || 'Untitled'}`)
				console.log(`   카테고리: ${category.select?.name || '-'}`)
				console.log(`   작성자: ${author.rich_text?.[0]?.text?.content || '-'}`)
				console.log(`   일시: ${date.date?.start || '-'}`)
				console.log(`   URL: https://www.notion.so/${page.id.replace(/-/g, '')}`)
				console.log()
			}
		}

		console.log('✅ 로그 확인 완료')

	} catch (error) {
		console.error('❌ 로그 확인 실패:', error)
		process.exit(1)
	}
}

checkRecentLogs()
	.then(() => {
		console.log('\n✅ 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 스크립트 실행 실패:', error)
		process.exit(1)
	})
