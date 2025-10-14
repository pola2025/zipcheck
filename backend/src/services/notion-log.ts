/**
 * Notion 개발 로그 서비스
 *
 * 개발 과정 중 중요한 작업 내역을 Notion 데이터베이스에 기록
 */

import { Client } from '@notionhq/client'
import dotenv from 'dotenv'

dotenv.config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

// Notion 클라이언트 초기화
const notion = NOTION_API_KEY ? new Client({ auth: NOTION_API_KEY }) : null

interface NotionLogData {
	title: string
	category?: '구현' | '버그수정' | '배포' | '테스트' | '문서화' | '회의' | '기타'
	description: string
	details?: string[]
	codeChanges?: {
		file: string
		summary: string
	}[]
	author?: string
	timestamp?: Date
}

/**
 * Notion 데이터베이스에 개발 로그 페이지 생성
 */
export async function logToNotion(data: NotionLogData) {
	if (!notion) {
		console.warn('⚠️  Notion API key not configured')
		return
	}

	if (!NOTION_DATABASE_ID) {
		console.warn('⚠️  Notion Database ID not configured')
		console.log('📝 Notion 데이터베이스를 생성하고 DATABASE_ID를 .env에 추가해주세요')
		return
	}

	const categoryEmoji = {
		'구현': '🔨',
		'버그수정': '🐛',
		'배포': '🚀',
		'테스트': '🧪',
		'문서화': '📝',
		'회의': '💬',
		'기타': '📌'
	}

	const emoji = data.category ? categoryEmoji[data.category] : '📌'
	const timestamp = data.timestamp || new Date()

	try {
		// Notion 페이지 내용 구성
		const children: any[] = [
			{
				object: 'block',
				type: 'heading_2',
				heading_2: {
					rich_text: [{
						type: 'text',
						text: { content: '📋 설명' }
					}]
				}
			},
			{
				object: 'block',
				type: 'paragraph',
				paragraph: {
					rich_text: [{
						type: 'text',
						text: { content: data.description }
					}]
				}
			}
		]

		// 상세 내역 추가
		if (data.details && data.details.length > 0) {
			children.push({
				object: 'block',
				type: 'heading_3',
				heading_3: {
					rich_text: [{
						type: 'text',
						text: { content: '📌 상세 내역' }
					}]
				}
			})

			// 각 detail을 bulleted list로 추가
			data.details.forEach(detail => {
				children.push({
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: detail }
						}]
					}
				})
			})
		}

		// 코드 변경사항 추가
		if (data.codeChanges && data.codeChanges.length > 0) {
			children.push({
				object: 'block',
				type: 'heading_3',
				heading_3: {
					rich_text: [{
						type: 'text',
						text: { content: '💻 코드 변경' }
					}]
				}
			})

			data.codeChanges.forEach(change => {
				children.push({
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: change.file },
								annotations: { code: true }
							},
							{
								type: 'text',
								text: { content: `: ${change.summary}` }
							}
						]
					}
				})
			})
		}

		// Notion 데이터베이스에 페이지 생성
		const response = await notion.pages.create({
			parent: {
				database_id: NOTION_DATABASE_ID
			},
			icon: {
				type: 'emoji',
				emoji: emoji
			},
			properties: {
				'제목': {
					title: [{
						text: { content: data.title }
					}]
				},
				'카테고리': {
					select: {
						name: data.category || '기타'
					}
				},
				'작성자': {
					rich_text: [{
						text: { content: data.author || 'Claude Code' }
					}]
				},
				'일시': {
					date: {
						start: timestamp.toISOString()
					}
				}
			},
			children: children
		})

		console.log('✅ Notion 로그 저장 완료:', response.url)
		return response
	} catch (error: any) {
		console.error('❌ Notion 로그 저장 실패:', error.message)

		// Database ID 오류 상세 안내
		if (error.code === 'object_not_found' || error.message.includes('database_id')) {
			console.log('\n📝 Notion 데이터베이스 설정 방법:')
			console.log('1. Notion에서 새 데이터베이스 페이지 생성')
			console.log('2. 데이터베이스 속성 추가:')
			console.log('   - 제목 (Title 타입)')
			console.log('   - 카테고리 (Select 타입: 구현, 버그수정, 배포, 테스트, 문서화, 회의, 기타)')
			console.log('   - 작성자 (Text 타입)')
			console.log('   - 일시 (Date 타입)')
			console.log('3. 데이터베이스 공유 → 통합 추가 (ZipCheck Dev Log)')
			console.log('4. URL에서 database_id 복사: notion.so/[이부분]?v=...')
			console.log('5. .env 파일의 NOTION_DATABASE_ID에 붙여넣기\n')
		}

		throw error
	}
}

/**
 * 작업 완료 로그
 */
export async function logTaskComplete(task: string, details?: string[]) {
	await logToNotion({
		title: `작업 완료: ${task}`,
		category: '구현',
		description: `${task} 작업이 완료되었습니다.`,
		details,
		author: 'Claude Code',
		timestamp: new Date()
	})
}

/**
 * 버그 수정 로그
 */
export async function logBugFix(bugTitle: string, solution: string, files?: string[]) {
	await logToNotion({
		title: `버그 수정: ${bugTitle}`,
		category: '버그수정',
		description: solution,
		details: files ? files.map(f => `수정된 파일: ${f}`) : undefined,
		author: 'Claude Code',
		timestamp: new Date()
	})
}

/**
 * 배포 로그
 */
export async function logDeployment(
	environment: 'production' | 'staging' | 'development',
	version?: string,
	changes?: string[]
) {
	await logToNotion({
		title: `배포 완료: ${environment}`,
		category: '배포',
		description: version
			? `버전 ${version}이(가) ${environment} 환경에 배포되었습니다.`
			: `${environment} 환경에 배포되었습니다.`,
		details: changes,
		author: 'Claude Code',
		timestamp: new Date()
	})
}

/**
 * 테스트 결과 로그
 */
export async function logTestResult(
	testName: string,
	passed: boolean,
	details?: string[]
) {
	await logToNotion({
		title: `테스트 ${passed ? '성공' : '실패'}: ${testName}`,
		category: '테스트',
		description: passed
			? `${testName} 테스트가 성공적으로 완료되었습니다.`
			: `${testName} 테스트가 실패했습니다.`,
		details,
		author: 'Claude Code',
		timestamp: new Date()
	})
}

/**
 * 회의/논의 내용 로그
 */
export async function logDiscussion(
	topic: string,
	summary: string,
	decisions?: string[]
) {
	await logToNotion({
		title: `논의: ${topic}`,
		category: '회의',
		description: summary,
		details: decisions,
		author: 'Claude Code & Team',
		timestamp: new Date()
	})
}
