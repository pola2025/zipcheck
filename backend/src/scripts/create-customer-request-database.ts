/**
 * 고객 요청 로그 데이터베이스 자동 생성
 * (결제, 견적 신청, 분석 완료 등 고객 관련 이벤트 기록)
 */

import dotenv from 'dotenv'
import path from 'path'
import { Client } from '@notionhq/client'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const NOTION_API_KEY = process.env.NOTION_API_KEY

async function createCustomerRequestDatabase() {
	if (!NOTION_API_KEY) {
		console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
		process.exit(1)
	}

	const notion = new Client({ auth: NOTION_API_KEY })

	try {
		console.log('🔍 부모 페이지 검색 중...\n')

		// Search for "집첵 로그" page
		const searchResponse = await notion.search({
			query: '집첵 로그',
			filter: {
				value: 'page',
				property: 'object'
			}
		})

		if (searchResponse.results.length === 0) {
			console.error('❌ "집첵 로그" 페이지를 찾을 수 없습니다.')
			process.exit(1)
		}

		const parentPage = searchResponse.results[0]
		console.log('✅ 부모 페이지 선택: 집첵 로그')
		console.log('🔨 고객 요청 로그 데이터베이스 생성 중...\n')

		// Create database
		const database = await notion.databases.create({
			parent: {
				type: 'page_id',
				page_id: parentPage.id
			},
			icon: {
				type: 'emoji',
				emoji: '👥'
			},
			title: [
				{
					type: 'text',
					text: {
						content: '고객 요청 로그'
					}
				}
			],
			properties: {
				'제목': {
					title: {}
				},
				'요청타입': {
					select: {
						options: [
							{ name: '견적신청', color: 'blue' },
							{ name: '결제완료', color: 'green' },
							{ name: '도면분석', color: 'purple' },
							{ name: 'GPT분석', color: 'pink' },
							{ name: '기타', color: 'gray' }
						]
					}
				},
				'고객명': {
					rich_text: {}
				},
				'연락처': {
					phone_number: {}
				},
				'매물정보': {
					rich_text: {}
				},
				'금액': {
					number: {
						format: 'won'
					}
				},
				'상태': {
					select: {
						options: [
							{ name: '신규', color: 'yellow' },
							{ name: '처리중', color: 'blue' },
							{ name: '완료', color: 'green' },
							{ name: '취소', color: 'red' }
						]
					}
				},
				'일시': {
					date: {}
				},
				'견적ID': {
					number: {}
				}
			}
		})

		const databaseId = database.id.replace(/-/g, '')

		console.log('✅ 데이터베이스 생성 완료!\n')
		console.log(`📊 데이터베이스: 고객 요청 로그`)
		console.log(`🆔 Database ID: ${databaseId}`)
		console.log(`🔗 URL: ${database.url}\n`)

		console.log('📝 다음 단계:')
		console.log(`1. .env 파일에 추가:`)
		console.log(`   NOTION_CUSTOMER_REQUEST_DB_ID=${databaseId}`)
		console.log(`2. 고객 요청 로그 서비스 구현`)

		return databaseId

	} catch (error: any) {
		console.error('❌ 에러 발생:', error.message)
		throw error
	}
}

createCustomerRequestDatabase()
	.then((dbId) => {
		console.log('\n✅ 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 스크립트 실행 실패')
		process.exit(1)
	})
