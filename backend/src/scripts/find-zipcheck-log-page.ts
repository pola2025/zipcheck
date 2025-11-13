/**
 * "집첵 로그" 페이지 찾기
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { Client } from '@notionhq/client'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const DEV_DB_ID = process.env.NOTION_DATABASE_ID
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_REQUEST_DB_ID

if (!NOTION_API_KEY) {
	console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
	process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

async function findZipCheckLogPage() {
	console.log('🔍 "집첵 로그" 페이지 찾는 중...\n')

	try {
		// 1. 개발 로그 DB 정보 조회
		console.log('=== 📊 ZipCheck 개발로그 ===\n')
		const devDb = await notion.databases.retrieve({
			database_id: DEV_DB_ID!
		})

		console.log(`Database ID: ${DEV_DB_ID}`)
		console.log(`제목: ${(devDb as any).title?.[0]?.plain_text || 'Untitled'}`)
		console.log(`Parent 타입: ${(devDb as any).parent?.type}`)

		if ((devDb as any).parent?.type === 'page_id') {
			const parentPageId = (devDb as any).parent.page_id
			console.log(`Parent Page ID: ${parentPageId}`)
			console.log(`Parent Page URL: https://www.notion.so/${parentPageId.replace(/-/g, '')}`)

			// Parent 페이지 정보 조회
			try {
				const parentPage = await notion.pages.retrieve({
					page_id: parentPageId
				})
				const parentTitle = (parentPage as any).properties?.title?.title?.[0]?.plain_text ||
				                   (parentPage as any).properties?.Name?.title?.[0]?.plain_text ||
				                   '제목 없음'
				console.log(`Parent 페이지 제목: "${parentTitle}"`)
			} catch (error) {
				console.log('Parent 페이지 정보를 가져올 수 없습니다.')
			}
		} else {
			console.log('Parent: workspace')
		}

		console.log()

		// 2. 고객여정 DB 정보 조회
		console.log('=== 🙋 ZipCheck 고객여정DB ===\n')
		const customerDb = await notion.databases.retrieve({
			database_id: CUSTOMER_DB_ID!
		})

		console.log(`Database ID: ${CUSTOMER_DB_ID}`)
		console.log(`제목: ${(customerDb as any).title?.[0]?.plain_text || 'Untitled'}`)
		console.log(`Parent 타입: ${(customerDb as any).parent?.type}`)

		if ((customerDb as any).parent?.type === 'page_id') {
			const parentPageId = (customerDb as any).parent.page_id
			console.log(`Parent Page ID: ${parentPageId}`)
			console.log(`Parent Page URL: https://www.notion.so/${parentPageId.replace(/-/g, '')}`)

			// Parent 페이지 정보 조회
			try {
				const parentPage = await notion.pages.retrieve({
					page_id: parentPageId
				})
				const parentTitle = (parentPage as any).properties?.title?.title?.[0]?.plain_text ||
				                   (parentPage as any).properties?.Name?.title?.[0]?.plain_text ||
				                   '제목 없음'
				console.log(`Parent 페이지 제목: "${parentTitle}"`)
			} catch (error) {
				console.log('Parent 페이지 정보를 가져올 수 없습니다.')
			}
		} else {
			console.log('Parent: workspace')
		}

		console.log()
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('📝 Notion에서 수동으로 이동하는 방법:')
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log()
		console.log('1. Notion에서 "ZipCheck 고객여정DB" 데이터베이스 열기')
		console.log('2. 데이터베이스 제목 옆의 "⋮⋮" (6점 아이콘) 클릭')
		console.log('3. "Move to" 메뉴 선택')
		console.log('4. "집첵 로그" 페이지를 찾아서 선택')
		console.log('5. 완료!')
		console.log()
		console.log('💡 또는:')
		console.log('1. 사이드바에서 "ZipCheck 고객여정DB" 찾기')
		console.log('2. 드래그해서 "집첵 로그" 페이지 안으로 이동')
		console.log()
		console.log('⚠️  참고: Notion API로는 데이터베이스의 parent를 변경할 수 없습니다.')
		console.log('   데이터베이스 생성 시에만 parent를 지정할 수 있습니다.')

	} catch (error: any) {
		console.error('❌ 조회 실패:', error.message)
		process.exit(1)
	}
}

findZipCheckLogPage()
	.then(() => {
		console.log('\n✅ 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 스크립트 실행 실패:', error)
		process.exit(1)
	})
