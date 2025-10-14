/**
 * Notion 고객 요청 로그 서비스
 *
 * 결제, 견적 신청, 분석 완료 등 고객 관련 이벤트를 Notion에 기록
 */

import { Client } from '@notionhq/client'
import dotenv from 'dotenv'

dotenv.config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const CUSTOMER_DB_ID = process.env.NOTION_CUSTOMER_REQUEST_DB_ID

const notion = NOTION_API_KEY ? new Client({ auth: NOTION_API_KEY }) : null

interface QuoteRequestLog {
	requestId: number
	customerName: string
	customerPhone: string
	propertyType: string
	propertySize: number
	region: string
	itemCount: number
	totalAmount: number
	timestamp?: Date
}

interface PaymentLog {
	orderId: string
	customerName: string
	customerPhone: string
	planName: string
	amount: number
	paymentMethod: string
	timestamp?: Date
}

interface AnalysisLog {
	quoteRequestId: number
	customerName: string
	analysisType: '도면분석' | 'GPT분석'
	totalAmount?: number
	overallScore?: number
	status: 'succeeded' | 'failed'
	timestamp?: Date
}

interface QuoteDeliveryLog {
	quoteRequestId: number
	customerName: string
	customerPhone?: string
	deliveryMethod: 'web' | 'sms' | 'email' | 'api'
	overallScore?: number
	totalAmount?: number
	timestamp?: Date
}

/**
 * 견적 신청 로그 저장
 */
export async function logQuoteRequest(data: QuoteRequestLog) {
	if (!notion || !CUSTOMER_DB_ID) {
		console.warn('⚠️  Notion customer request DB not configured')
		return
	}

	try {
		const timestamp = data.timestamp || new Date()

		await notion.pages.create({
			parent: {
				database_id: CUSTOMER_DB_ID
			},
			icon: {
				type: 'emoji',
				emoji: '📝'
			},
			properties: {
				'제목': {
					title: [{
						text: { content: `견적 신청 - ${data.customerName}` }
					}]
				},
				'요청타입': {
					select: { name: '견적신청' }
				},
				'고객명': {
					rich_text: [{
						text: { content: data.customerName }
					}]
				},
				'연락처': {
					phone_number: data.customerPhone
				},
				'매물정보': {
					rich_text: [{
						text: { content: `${data.propertyType} ${data.propertySize}평 (${data.region})` }
					}]
				},
				'금액': {
					number: data.totalAmount
				},
				'상태': {
					select: { name: '신규' }
				},
				'일시': {
					date: {
						start: timestamp.toISOString()
					}
				},
				'견적ID': {
					number: data.requestId
				}
			},
			children: [
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{
							type: 'text',
							text: { content: '📋 견적 상세' }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `견적 ID: ${data.requestId}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `고객명: ${data.customerName}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `연락처: ${data.customerPhone}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `매물: ${data.propertyType} ${data.propertySize}평` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `지역: ${data.region}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `항목 수: ${data.itemCount}개` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `총 금액: ${data.totalAmount.toLocaleString()}원` }
						}]
					}
				}
			]
		})

		console.log('✅ Notion에 견적 신청 로그 저장 완료')
	} catch (error: any) {
		console.error('❌ Notion 견적 신청 로그 저장 실패:', error.message)
	}
}

/**
 * 결제 완료 로그 저장
 */
export async function logPaymentComplete(data: PaymentLog) {
	if (!notion || !CUSTOMER_DB_ID) {
		console.warn('⚠️  Notion customer request DB not configured')
		return
	}

	try {
		const timestamp = data.timestamp || new Date()

		await notion.pages.create({
			parent: {
				database_id: CUSTOMER_DB_ID
			},
			icon: {
				type: 'emoji',
				emoji: '💳'
			},
			properties: {
				'제목': {
					title: [{
						text: { content: `결제 완료 - ${data.customerName}` }
					}]
				},
				'요청타입': {
					select: { name: '결제완료' }
				},
				'고객명': {
					rich_text: [{
						text: { content: data.customerName }
					}]
				},
				'연락처': {
					phone_number: data.customerPhone
				},
				'매물정보': {
					rich_text: [{
						text: { content: data.planName }
					}]
				},
				'금액': {
					number: data.amount
				},
				'상태': {
					select: { name: '완료' }
				},
				'일시': {
					date: {
						start: timestamp.toISOString()
					}
				}
			},
			children: [
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{
							type: 'text',
							text: { content: '💳 결제 상세' }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `주문 ID: ${data.orderId}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `고객명: ${data.customerName}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `연락처: ${data.customerPhone}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `플랜: ${data.planName}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `결제 금액: ${data.amount.toLocaleString()}원` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `결제 수단: ${data.paymentMethod}` }
						}]
					}
				}
			]
		})

		console.log('✅ Notion에 결제 완료 로그 저장 완료')
	} catch (error: any) {
		console.error('❌ Notion 결제 완료 로그 저장 실패:', error.message)
	}
}

/**
 * 분석 완료 로그 저장
 */
export async function logAnalysisComplete(data: AnalysisLog) {
	if (!notion || !CUSTOMER_DB_ID) {
		console.warn('⚠️  Notion customer request DB not configured')
		return
	}

	try {
		const timestamp = data.timestamp || new Date()
		const emoji = data.analysisType === '도면분석' ? '🏠' : '🤖'
		const statusEmoji = data.status === 'succeeded' ? '✅' : '❌'

		await notion.pages.create({
			parent: {
				database_id: CUSTOMER_DB_ID
			},
			icon: {
				type: 'emoji',
				emoji: emoji
			},
			properties: {
				'제목': {
					title: [{
						text: { content: `${data.analysisType} ${statusEmoji} - ${data.customerName}` }
					}]
				},
				'요청타입': {
					select: { name: data.analysisType === '도면분석' ? '도면분석' : 'GPT분석' }
				},
				'고객명': {
					rich_text: [{
						text: { content: data.customerName }
					}]
				},
				'매물정보': {
					rich_text: [{
						text: { content: `견적 #${data.quoteRequestId}` }
					}]
				},
				'금액': {
					number: data.totalAmount || 0
				},
				'상태': {
					select: { name: data.status === 'succeeded' ? '완료' : '취소' }
				},
				'일시': {
					date: {
						start: timestamp.toISOString()
					}
				},
				'견적ID': {
					number: data.quoteRequestId
				}
			},
			children: [
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{
							type: 'text',
							text: { content: `${emoji} 분석 결과` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `견적 ID: ${data.quoteRequestId}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `고객명: ${data.customerName}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `분석 타입: ${data.analysisType}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `상태: ${data.status === 'succeeded' ? '성공' : '실패'}` }
						}]
					}
				},
				...(data.totalAmount ? [{
					object: 'block' as const,
					type: 'bulleted_list_item' as const,
					bulleted_list_item: {
						rich_text: [{
							type: 'text' as const,
							text: { content: `총 금액: ${data.totalAmount.toLocaleString()}원` }
						}]
					}
				}] : []),
				...(data.overallScore ? [{
					object: 'block' as const,
					type: 'bulleted_list_item' as const,
					bulleted_list_item: {
						rich_text: [{
							type: 'text' as const,
							text: { content: `종합 점수: ${data.overallScore}점` }
						}]
					}
				}] : [])
			]
		})

		console.log('✅ Notion에 분석 완료 로그 저장 완료')
	} catch (error: any) {
		console.error('❌ Notion 분석 완료 로그 저장 실패:', error.message)
	}
}

/**
 * 견적 발송 로그 저장
 */
export async function logQuoteDelivery(data: QuoteDeliveryLog) {
	if (!notion || !CUSTOMER_DB_ID) {
		console.warn('⚠️  Notion customer request DB not configured')
		return
	}

	try {
		const timestamp = data.timestamp || new Date()

		// 발송 방법별 이모지
		const methodEmoji = {
			'web': '🌐',
			'sms': '📱',
			'email': '📧',
			'api': '🔗'
		}

		// 발송 방법 한글 표시
		const methodName = {
			'web': '웹 조회',
			'sms': 'SMS 발송',
			'email': '이메일 발송',
			'api': 'API 연동'
		}

		await notion.pages.create({
			parent: {
				database_id: CUSTOMER_DB_ID
			},
			icon: {
				type: 'emoji',
				emoji: methodEmoji[data.deliveryMethod]
			} as any,
			properties: {
				'제목': {
					title: [{
						text: { content: `견적 발송 - ${data.customerName}` }
					}]
				},
				'요청타입': {
					select: { name: '견적발송' }
				},
				'고객명': {
					rich_text: [{
						text: { content: data.customerName }
					}]
				},
				...(data.customerPhone ? {
					'연락처': {
						phone_number: data.customerPhone
					}
				} : {}),
				'매물정보': {
					rich_text: [{
						text: { content: `견적 #${data.quoteRequestId} (${methodName[data.deliveryMethod]})` }
					}]
				},
				'금액': {
					number: data.totalAmount || 0
				},
				'상태': {
					select: { name: '완료' }
				},
				'일시': {
					date: {
						start: timestamp.toISOString()
					}
				},
				'견적ID': {
					number: data.quoteRequestId
				}
			},
			children: [
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{
							type: 'text',
							text: { content: `${methodEmoji[data.deliveryMethod]} 견적 발송` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `견적 ID: ${data.quoteRequestId}` }
						}]
					}
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `고객명: ${data.customerName}` }
						}]
					}
				},
				...(data.customerPhone ? [{
					object: 'block' as const,
					type: 'bulleted_list_item' as const,
					bulleted_list_item: {
						rich_text: [{
							type: 'text' as const,
							text: { content: `연락처: ${data.customerPhone}` }
						}]
					}
				}] : []),
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [{
							type: 'text',
							text: { content: `발송 방법: ${methodName[data.deliveryMethod]}` }
						}]
					}
				},
				...(data.overallScore ? [{
					object: 'block' as const,
					type: 'bulleted_list_item' as const,
					bulleted_list_item: {
						rich_text: [{
							type: 'text' as const,
							text: { content: `종합 점수: ${data.overallScore}점` }
						}]
					}
				}] : []),
				...(data.totalAmount ? [{
					object: 'block' as const,
					type: 'bulleted_list_item' as const,
					bulleted_list_item: {
						rich_text: [{
							type: 'text' as const,
							text: { content: `총 금액: ${data.totalAmount.toLocaleString()}원` }
						}]
					}
				}] : [])
			]
		})

		console.log('✅ Notion에 견적 발송 로그 저장 완료')
	} catch (error: any) {
		console.error('❌ Notion 견적 발송 로그 저장 실패:', error.message)
	}
}
