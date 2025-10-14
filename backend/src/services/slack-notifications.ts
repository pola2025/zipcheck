/**
 * Slack 알림 서비스
 *
 * 2개의 웹훅 채널:
 * 1. 개발 알림: AI 토큰, 에러, 경고
 * 2. 관리자 알림: 결제, 게시글, 견적 신청
 */

import axios from 'axios'
import dotenv from 'dotenv'

// Ensure .env is loaded
dotenv.config()

// 웹훅 URL (환경 변수에서 로드)
const DEV_WEBHOOK_URL = process.env.SLACK_DEV_WEBHOOK_URL
const ADMIN_WEBHOOK_URL = process.env.SLACK_ADMIN_WEBHOOK_URL

interface SlackMessage {
	text?: string
	blocks?: any[]
	attachments?: any[]
}

/**
 * Slack 메시지 전송 (기본)
 */
async function sendSlackMessage(
	webhookUrl: string | undefined,
	message: SlackMessage
): Promise<void> {
	if (!webhookUrl) {
		console.warn('⚠️  Slack webhook URL not configured')
		return
	}

	try {
		await axios.post(webhookUrl, message)
		console.log('✅ Slack notification sent')
	} catch (error) {
		console.error('❌ Failed to send Slack notification:', error)
	}
}

// ============================================
// 개발 알림 (DEV_WEBHOOK_URL)
// ============================================

/**
 * GPT-5 Pro 분석 완료 알림
 */
export async function notifyAnalysisComplete(data: {
	quoteRequestId: number
	customerName: string
	totalAmount: number
	overallScore: number
	tokenUsage: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
	costUsd: number
	duration: number
	status: 'succeeded' | 'failed' | 'timeout'
}) {
	const statusEmoji =
		data.status === 'succeeded' ? '✅' : data.status === 'timeout' ? '⏰' : '❌'
	const statusText =
		data.status === 'succeeded'
			? '분석 완료'
			: data.status === 'timeout'
				? '타임아웃'
				: '분석 실패'

	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: `${statusEmoji} GPT-5 Pro 견적 분석 ${statusText}`,
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*견적 ID:*\n#${data.quoteRequestId}`
					},
					{
						type: 'mrkdwn',
						text: `*고객명:*\n${data.customerName}`
					},
					{
						type: 'mrkdwn',
						text: `*총 금액:*\n${data.totalAmount.toLocaleString()}원`
					},
					{
						type: 'mrkdwn',
						text: `*종합 점수:*\n${data.overallScore}점`
					}
				]
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*🔤 토큰 사용량:*\n${data.tokenUsage.total_tokens.toLocaleString()} tokens`
					},
					{
						type: 'mrkdwn',
						text: `*💰 비용:*\n$${data.costUsd.toFixed(4)}`
					},
					{
						type: 'mrkdwn',
						text: `*⏱️ 소요 시간:*\n${(data.duration / 1000).toFixed(1)}초`
					},
					{
						type: 'mrkdwn',
						text: `*📊 입력/출력:*\n${data.tokenUsage.prompt_tokens.toLocaleString()} / ${data.tokenUsage.completion_tokens.toLocaleString()}`
					}
				]
			},
			{
				type: 'divider'
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 토큰 사용량 경고 알림
 */
export async function notifyTokenWarning(data: {
	quoteRequestId: number
	tokenUsage: number
	tokenBudget: number
	percentage: number
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '⚠️ 토큰 사용량 경고',
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*견적 ID:*\n#${data.quoteRequestId}`
					},
					{
						type: 'mrkdwn',
						text: `*사용량:*\n${data.tokenUsage.toLocaleString()} / ${data.tokenBudget.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*비율:*\n${data.percentage.toFixed(1)}%`
					}
				]
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: '💡 *권장사항:* 입력 데이터 샘플링 또는 토큰 예산 증가를 검토하세요.'
					}
				]
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 비용 초과 경고 알림
 */
export async function notifyCostWarning(data: {
	quoteRequestId: number
	costUsd: number
	budgetUsd: number
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '💸 비용 초과 경고',
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*견적 ID:*\n#${data.quoteRequestId}`
					},
					{
						type: 'mrkdwn',
						text: `*발생 비용:*\n$${data.costUsd.toFixed(4)}`
					},
					{
						type: 'mrkdwn',
						text: `*예산:*\n$${data.budgetUsd.toFixed(2)}`
					},
					{
						type: 'mrkdwn',
						text: `*초과액:*\n$${(data.costUsd - data.budgetUsd).toFixed(4)}`
					}
				]
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 분석 에러 알림
 */
export async function notifyAnalysisError(data: {
	quoteRequestId: number
	error: string
	errorType: 'timeout' | 'token_budget' | 'json_parse' | 'api_error' | 'unknown'
}) {
	const errorEmoji = {
		timeout: '⏰',
		token_budget: '📊',
		json_parse: '🔧',
		api_error: '🚫',
		unknown: '❌'
	}

	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: `${errorEmoji[data.errorType]} GPT-5 Pro 분석 에러`,
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*견적 ID:*\n#${data.quoteRequestId}`
					},
					{
						type: 'mrkdwn',
						text: `*에러 타입:*\n${data.errorType}`
					}
				]
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*에러 메시지:*\n\`\`\`${data.error}\`\`\``
				}
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 일일 통계 알림
 */
export async function notifyDailyStats(stats: {
	date: string
	totalJobs: number
	succeededJobs: number
	failedJobs: number
	totalTokens: number
	totalCost: number
	avgTokens: number
	avgCost: number
	successRate: number
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '📊 GPT-5 Pro 일일 통계',
					emoji: true
				}
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*날짜:* ${stats.date}`
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*총 분석:*\n${stats.totalJobs}건`
					},
					{
						type: 'mrkdwn',
						text: `*성공률:*\n${stats.successRate.toFixed(1)}%`
					},
					{
						type: 'mrkdwn',
						text: `*성공/실패:*\n${stats.succeededJobs} / ${stats.failedJobs}`
					}
				]
			},
			{
				type: 'divider'
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*🔤 총 토큰:*\n${stats.totalTokens.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*💰 총 비용:*\n$${stats.totalCost.toFixed(2)}`
					},
					{
						type: 'mrkdwn',
						text: `*📊 평균 토큰:*\n${stats.avgTokens.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*💵 평균 비용:*\n$${stats.avgCost.toFixed(4)}`
					}
				]
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text:
							stats.avgTokens > 50000
								? '⚠️ *경고:* 평균 토큰 사용량이 목표(30k-50k)를 초과했습니다.'
								: '✅ 평균 토큰 사용량이 목표 범위 내입니다.'
					}
				]
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 주간 통계 알림
 */
export async function notifyWeeklyStats(stats: {
	startDate: string
	endDate: string
	totalJobs: number
	succeededJobs: number
	failedJobs: number
	totalTokens: number
	totalCost: number
	avgTokens: number
	avgCost: number
	successRate: number
	peakDay: string
	peakDayJobs: number
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '📈 GPT-5 Pro 주간 통계',
					emoji: true
				}
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*기간:* ${stats.startDate} ~ ${stats.endDate}`
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*총 분석:*\n${stats.totalJobs}건`
					},
					{
						type: 'mrkdwn',
						text: `*성공률:*\n${stats.successRate.toFixed(1)}%`
					},
					{
						type: 'mrkdwn',
						text: `*피크 날짜:*\n${stats.peakDay} (${stats.peakDayJobs}건)`
					}
				]
			},
			{
				type: 'divider'
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*🔤 총 토큰:*\n${stats.totalTokens.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*💰 총 비용:*\n$${stats.totalCost.toFixed(2)}`
					},
					{
						type: 'mrkdwn',
						text: `*📊 평균 토큰:*\n${stats.avgTokens.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*💵 평균 비용:*\n$${stats.avgCost.toFixed(4)}`
					}
				]
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 월간 통계 알림
 */
export async function notifyMonthlyStats(stats: {
	month: string
	totalJobs: number
	succeededJobs: number
	failedJobs: number
	totalTokens: number
	totalCost: number
	avgTokens: number
	avgCost: number
	successRate: number
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '📅 GPT-5 Pro 월간 통계',
					emoji: true
				}
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*월:* ${stats.month}`
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*총 분석:*\n${stats.totalJobs}건`
					},
					{
						type: 'mrkdwn',
						text: `*성공률:*\n${stats.successRate.toFixed(1)}%`
					},
					{
						type: 'mrkdwn',
						text: `*성공/실패:*\n${stats.succeededJobs} / ${stats.failedJobs}`
					}
				]
			},
			{
				type: 'divider'
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*🔤 총 토큰:*\n${stats.totalTokens.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*💰 총 비용:*\n$${stats.totalCost.toFixed(2)}`
					},
					{
						type: 'mrkdwn',
						text: `*📊 평균 토큰:*\n${stats.avgTokens.toLocaleString()}`
					},
					{
						type: 'mrkdwn',
						text: `*💵 평균 비용:*\n$${stats.avgCost.toFixed(4)}`
					}
				]
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

// ============================================
// 관리자 알림 (ADMIN_WEBHOOK_URL)
// ============================================

/**
 * 결제 완료 알림
 */
export async function notifyPaymentComplete(data: {
	orderId: string
	customerName: string
	customerPhone: string
	planName: string
	amount: number
	paymentMethod: string
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '💳 결제 완료',
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*주문 ID:*\n${data.orderId}`
					},
					{
						type: 'mrkdwn',
						text: `*고객명:*\n${data.customerName}`
					},
					{
						type: 'mrkdwn',
						text: `*연락처:*\n${data.customerPhone}`
					},
					{
						type: 'mrkdwn',
						text: `*플랜:*\n${data.planName}`
					},
					{
						type: 'mrkdwn',
						text: `*결제 금액:*\n${data.amount.toLocaleString()}원`
					},
					{
						type: 'mrkdwn',
						text: `*결제 방법:*\n${data.paymentMethod}`
					}
				]
			},
			{
				type: 'divider'
			}
		]
	}

	await sendSlackMessage(ADMIN_WEBHOOK_URL, message)
}

/**
 * 견적 신청 알림
 */
export async function notifyQuoteRequest(data: {
	requestId: number
	customerName: string
	customerPhone: string
	propertyType: string
	propertySize?: number
	region: string
	itemCount: number
	totalAmount: number
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '📝 새 견적 신청',
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*견적 ID:*\n#${data.requestId}`
					},
					{
						type: 'mrkdwn',
						text: `*고객명:*\n${data.customerName}`
					},
					{
						type: 'mrkdwn',
						text: `*연락처:*\n${data.customerPhone}`
					},
					{
						type: 'mrkdwn',
						text: `*물건 유형:*\n${data.propertyType}`
					},
					{
						type: 'mrkdwn',
						text: `*면적:*\n${data.propertySize ? data.propertySize + '평' : '미상'}`
					},
					{
						type: 'mrkdwn',
						text: `*지역:*\n${data.region}`
					},
					{
						type: 'mrkdwn',
						text: `*항목 수:*\n${data.itemCount}개`
					},
					{
						type: 'mrkdwn',
						text: `*총 금액:*\n${data.totalAmount.toLocaleString()}원`
					}
				]
			},
			{
				type: 'divider'
			}
		]
	}

	await sendSlackMessage(ADMIN_WEBHOOK_URL, message)
}

/**
 * 게시글 작성 알림 (리뷰, 문의 등)
 */
export async function notifyPostCreated(data: {
	postType: '리뷰' | '문의' | '공지' | '기타'
	title: string
	author: string
	content?: string
	postId?: number
}) {
	const typeEmoji = {
		리뷰: '⭐',
		문의: '❓',
		공지: '📢',
		기타: '📄'
	}

	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: `${typeEmoji[data.postType]} 새 ${data.postType} 작성`,
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*작성자:*\n${data.author}`
					},
					{
						type: 'mrkdwn',
						text: `*제목:*\n${data.title}`
					}
				]
			}
		]
	}

	// 내용이 있으면 추가
	if (data.content) {
		message.blocks!.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*내용:*\n${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}`
			}
		})
	}

	message.blocks!.push({
		type: 'divider'
	})

	await sendSlackMessage(ADMIN_WEBHOOK_URL, message)
}

/**
 * 도면 분석 완료 알림
 */
export async function notifyFloorPlanAnalysis(data: {
	quoteRequestId: number
	customerName: string
	totalArea: number
	roomCount: number
	confidence: number
	rooms: Record<string, number>
}) {
	const roomList = Object.entries(data.rooms)
		.map(([room, area]) => `• ${room}: ${area.toFixed(1)}평`)
		.join('\n')

	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '🏠 도면 분석 완료',
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*견적 ID:*\n#${data.quoteRequestId}`
					},
					{
						type: 'mrkdwn',
						text: `*고객명:*\n${data.customerName}`
					},
					{
						type: 'mrkdwn',
						text: `*총 면적:*\n${data.totalArea.toFixed(1)}평`
					},
					{
						type: 'mrkdwn',
						text: `*공간 수:*\n${data.roomCount}개`
					},
					{
						type: 'mrkdwn',
						text: `*신뢰도:*\n${(data.confidence * 100).toFixed(1)}%`
					}
				]
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*공간별 면적:*\n${roomList}`
				}
			},
			{
				type: 'divider'
			}
		]
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}

/**
 * 시스템 에러 알림 (Critical)
 */
export async function notifySystemError(data: {
	errorType: string
	errorMessage: string
	stack?: string
	context?: Record<string, any>
}) {
	const message: SlackMessage = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '🚨 시스템 에러',
					emoji: true
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*에러 타입:*\n${data.errorType}`
					},
					{
						type: 'mrkdwn',
						text: `*시각:*\n${new Date().toLocaleString('ko-KR')}`
					}
				]
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*에러 메시지:*\n\`\`\`${data.errorMessage}\`\`\``
				}
			}
		]
	}

	if (data.stack) {
		message.blocks!.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Stack Trace:*\n\`\`\`${data.stack.substring(0, 500)}\`\`\``
			}
		})
	}

	await sendSlackMessage(DEV_WEBHOOK_URL, message)
}
