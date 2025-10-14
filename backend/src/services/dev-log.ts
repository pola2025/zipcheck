/**
 * 개발 로그 Slack 전송 서비스
 *
 * 개발 과정 중 중요한 작업 내역을 Slack에 기록
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const DEV_WEBHOOK_URL = process.env.SLACK_DEV_WEBHOOK_URL

interface DevLogData {
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
 * 개발 로그를 Slack으로 전송
 */
export async function sendDevLog(data: DevLogData) {
	if (!DEV_WEBHOOK_URL) {
		console.warn('⚠️  Slack Dev Webhook URL not configured')
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

	const blocks: any[] = [
		{
			type: 'header',
			text: {
				type: 'plain_text',
				text: `${emoji} ${data.title}`,
				emoji: true
			}
		},
		{
			type: 'section',
			fields: [
				{
					type: 'mrkdwn',
					text: `*카테고리:*\n${data.category || '기타'}`
				},
				{
					type: 'mrkdwn',
					text: `*시간:*\n${timestamp.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
				}
			]
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: data.description
			}
		}
	]

	// 상세 내용이 있으면 추가
	if (data.details && data.details.length > 0) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*상세 내역:*\n${data.details.map(d => `• ${d}`).join('\n')}`
			}
		})
	}

	// 코드 변경사항이 있으면 추가
	if (data.codeChanges && data.codeChanges.length > 0) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*코드 변경:*\n${data.codeChanges.map(c => `• \`${c.file}\`: ${c.summary}`).join('\n')}`
			}
		})
	}

	// 작성자 정보
	if (data.author) {
		blocks.push({
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: `작성자: ${data.author}`
				}
			]
		})
	}

	blocks.push({ type: 'divider' })

	try {
		await axios.post(DEV_WEBHOOK_URL, { blocks })
		console.log('✅ Dev log sent to Slack')
	} catch (error) {
		console.error('❌ Failed to send dev log:', error)
	}
}

/**
 * 작업 완료 로그 (간편 버전)
 */
export async function logTaskComplete(task: string, details?: string[]) {
	await sendDevLog({
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
	await sendDevLog({
		title: `버그 수정: ${bugTitle}`,
		category: '버그수정',
		description: `**문제:** ${bugTitle}\n**해결:** ${solution}`,
		details: files ? files.map(f => `수정된 파일: ${f}`) : undefined,
		author: 'Claude Code',
		timestamp: new Date()
	})
}

/**
 * 배포 로그
 */
export async function logDeployment(environment: 'production' | 'staging' | 'development', version?: string, changes?: string[]) {
	await sendDevLog({
		title: `배포 완료: ${environment}`,
		category: '배포',
		description: version ? `버전 ${version}이(가) ${environment} 환경에 배포되었습니다.` : `${environment} 환경에 배포되었습니다.`,
		details: changes,
		author: 'Claude Code',
		timestamp: new Date()
	})
}

/**
 * 회의/논의 내용 로그
 */
export async function logDiscussion(topic: string, summary: string, decisions?: string[]) {
	await sendDevLog({
		title: `논의: ${topic}`,
		category: '회의',
		description: summary,
		details: decisions,
		author: 'Claude Code & Team',
		timestamp: new Date()
	})
}
