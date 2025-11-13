/**
 * ZipCheck 개발 로그 데이터베이스 자동 생성
 */

import dotenv from 'dotenv'
import path from 'path'
import { Client } from '@notionhq/client'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const NOTION_API_KEY = process.env.NOTION_API_KEY

async function createDevLogDatabase() {
	if (!NOTION_API_KEY) {
		console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
		process.exit(1)
	}

	const notion = new Client({ auth: NOTION_API_KEY })

	try {
		console.log('🔍 부모 페이지 검색 중...\n')

		// Search for a page to use as parent
		const searchResponse = await notion.search({
			filter: {
				value: 'page',
				property: 'object'
			},
			page_size: 10
		})

		if (searchResponse.results.length === 0) {
			console.error('❌ 부모 페이지를 찾을 수 없습니다.')
			console.log('💡 Notion에서 먼저 워크스페이스 페이지를 만들고 통합을 연결해주세요.\n')
			process.exit(1)
		}

		console.log('📄 사용 가능한 페이지:')
		searchResponse.results.forEach((page: any, index) => {
			const title = page.properties?.title?.title?.[0]?.plain_text ||
			              page.properties?.Name?.title?.[0]?.plain_text ||
			              '제목 없음'
			console.log(`   ${index + 1}. ${title}`)
		})

		// Use first page as parent
		const parentPage = searchResponse.results[0]
		const parentTitle = (parentPage as any).properties?.title?.title?.[0]?.plain_text ||
		                   (parentPage as any).properties?.Name?.title?.[0]?.plain_text ||
		                   '제목 없음'

		console.log(`\n✅ 부모 페이지 선택: ${parentTitle}`)
		console.log('🔨 ZipCheck 개발 로그 데이터베이스 생성 중...\n')

		// Create database
		const database = await notion.databases.create({
			parent: {
				type: 'page_id',
				page_id: parentPage.id
			},
			icon: {
				type: 'emoji',
				emoji: '📝'
			},
			title: [
				{
					type: 'text',
					text: {
						content: 'ZipCheck 개발 로그'
					}
				}
			],
			properties: {
				'제목': {
					title: {}
				},
				'카테고리': {
					select: {
						options: [
							{ name: '구현', color: 'blue' },
							{ name: '버그수정', color: 'red' },
							{ name: '배포', color: 'green' },
							{ name: '테스트', color: 'yellow' },
							{ name: '문서화', color: 'purple' },
							{ name: '회의', color: 'orange' },
							{ name: '기타', color: 'gray' }
						]
					}
				},
				'작성자': {
					rich_text: {}
				},
				'일시': {
					date: {}
				}
			}
		})

		const databaseId = database.id.replace(/-/g, '')

		console.log('✅ 데이터베이스 생성 완료!\n')
		console.log(`📊 데이터베이스: ZipCheck 개발 로그`)
		console.log(`🆔 Database ID: ${databaseId}`)
		console.log(`🔗 URL: ${database.url}\n`)

		console.log('📝 다음 단계:')
		console.log(`1. .env 파일 업데이트:`)
		console.log(`   NOTION_DATABASE_ID=${databaseId}`)
		console.log(`2. 테스트 실행: npx tsx src/scripts/test-notion-log.ts`)

	} catch (error: any) {
		console.error('❌ 에러 발생:', error.message)

		if (error.code === 'unauthorized') {
			console.log('\n🔑 API 키가 유효하지 않습니다.')
		} else if (error.code === 'object_not_found') {
			console.log('\n📝 해결 방법:')
			console.log('1. Notion에서 워크스페이스 페이지 생성')
			console.log('2. 페이지 우측 상단 "•••" → "연결 추가" → "Claude MCP" 선택')
			console.log('3. 다시 이 스크립트 실행')
		}
	}
}

createDevLogDatabase()
