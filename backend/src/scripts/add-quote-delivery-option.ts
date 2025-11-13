/**
 * Notion 고객 요청 데이터베이스에 '견적발송' 옵션 추가
 */

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { Client } from '@notionhq/client'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_REQUEST_DB_ID

if (!NOTION_API_KEY || !CUSTOMER_DB_ID) {
	console.error('❌ NOTION_API_KEY 또는 NOTION_CUSTOMER_REQUEST_DB_ID가 설정되지 않았습니다.')
	process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

async function addQuoteDeliveryOption() {
	console.log('📝 Notion 고객 요청 DB에 "견적발송" 옵션 추가 중...\n')

	try {
		// 현재 데이터베이스 스키마 조회
		const database = await notion.databases.retrieve({
			database_id: CUSTOMER_DB_ID
		})

		console.log('✅ 데이터베이스 조회 완료')
		console.log(`   Database: ${(database as any).title?.[0]?.plain_text || 'Untitled'}`)

		// 요청타입 속성 업데이트
		await notion.databases.update({
			database_id: CUSTOMER_DB_ID,
			properties: {
				'요청타입': {
					select: {
						options: [
							{ name: '견적신청', color: 'blue' },
							{ name: '결제완료', color: 'green' },
							{ name: '도면분석', color: 'purple' },
							{ name: 'GPT분석', color: 'pink' },
							{ name: '견적발송', color: 'yellow' }, // 새로 추가
							{ name: '기타', color: 'gray' }
						]
					}
				}
			}
		})

		console.log('✅ "견적발송" 옵션 추가 완료')
		console.log('\n📊 업데이트된 요청타입:')
		console.log('   - 견적신청 (blue)')
		console.log('   - 결제완료 (green)')
		console.log('   - 도면분석 (purple)')
		console.log('   - GPT분석 (pink)')
		console.log('   - 견적발송 (yellow) ✨ 신규')
		console.log('   - 기타 (gray)')

	} catch (error) {
		console.error('❌ 옵션 추가 실패:', error)
		process.exit(1)
	}
}

addQuoteDeliveryOption()
	.then(() => {
		console.log('\n✅ 스크립트 실행 완료')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ 스크립트 실행 실패:', error)
		process.exit(1)
	})
