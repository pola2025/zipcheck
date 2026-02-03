/**
 * Gmail API Service
 *
 * 서비스 계정으로 이메일을 발송합니다.
 *
 * ⚠️ 중요: 서비스 계정으로 Gmail을 사용하려면 Google Workspace가 필요합니다.
 * - Google Workspace Admin > Security > API Controls > Domain-wide Delegation
 * - 서비스 계정에 Gmail 전송 권한 위임
 * - 일반 @gmail.com 계정은 서비스 계정 직접 발송 불가
 *
 * 대안: 일반 Gmail 사용 시 OAuth2 (Client ID + Refresh Token) 방식 사용
 */

import { google } from 'googleapis'
import { getGoogleAuth, GOOGLE_SCOPES } from './google-auth'

interface EmailOptions {
	to: string
	subject: string
	html: string
	from?: string
}

/**
 * Gmail API로 이메일 발송 (Google Workspace 도메인 위임 필요)
 */
export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const senderEmail = from || process.env.GMAIL_SENDER_EMAIL
		if (!senderEmail) {
			throw new Error('GMAIL_SENDER_EMAIL 환경변수가 설정되지 않았습니다.')
		}

		const auth = getGoogleAuth([GOOGLE_SCOPES.GMAIL_SEND])

		// Google Workspace 도메인 위임: 발신자 이메일로 impersonate
		const authClient = await auth.getClient() as any
		if (authClient.subject === undefined) {
			authClient.subject = senderEmail
		}

		const gmail = google.gmail({ version: 'v1', auth: authClient })

		// RFC 2822 형식 이메일 메시지 생성
		const messageParts = [
			`From: ZipCheck <${senderEmail}>`,
			`To: ${to}`,
			`Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
			'MIME-Version: 1.0',
			'Content-Type: text/html; charset=UTF-8',
			'',
			html,
		]
		const rawMessage = messageParts.join('\r\n')

		// Base64url 인코딩
		const encodedMessage = Buffer.from(rawMessage)
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')

		const res = await gmail.users.messages.send({
			userId: 'me',
			requestBody: {
				raw: encodedMessage,
			},
		})

		console.log(`✅ Email sent to ${to}, messageId: ${res.data.id}`)
		return { success: true, messageId: res.data.id || undefined }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error(`❌ Email send failed to ${to}:`, message)
		return { success: false, error: message }
	}
}

/**
 * 견적 접수 확인 이메일
 */
export async function sendQuoteReceivedEmail(to: string, quoteId: string, customerName: string): Promise<{ success: boolean }> {
	return sendEmail({
		to,
		subject: `[ZipCheck] 견적 분석 접수 완료 (#${quoteId})`,
		html: `
			<div style="font-family: 'Pretendard', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
				<div style="background: linear-gradient(135deg, #2D5A3D, #4A7C59); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
					<h1 style="color: #fff; font-size: 24px; margin: 0;">견적 분석 접수 완료</h1>
				</div>

				<p style="font-size: 16px; color: #374151; line-height: 1.6;">
					안녕하세요, <strong>${customerName}</strong>님.
				</p>
				<p style="font-size: 16px; color: #374151; line-height: 1.6;">
					견적서가 정상적으로 접수되었습니다. 전문가가 꼼꼼히 분석 후 결과를 안내드리겠습니다.
				</p>

				<div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 24px 0;">
					<p style="margin: 0; color: #6B7280; font-size: 14px;">접수 번호</p>
					<p style="margin: 4px 0 0; color: #111827; font-size: 20px; font-weight: 700;">#${quoteId}</p>
				</div>

				<p style="font-size: 14px; color: #6B7280; line-height: 1.6;">
					분석 현황은 <a href="https://zcheck.co.kr/quote-status" style="color: #2D5A3D; font-weight: 600;">견적 현황 조회</a> 페이지에서 확인하실 수 있습니다.
				</p>

				<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
				<p style="font-size: 12px; color: #9CA3AF; text-align: center;">
					ZipCheck - 인테리어 견적 분석 서비스<br/>
					© ${new Date().getFullYear()} ZipCheck. All rights reserved.
				</p>
			</div>
		`,
	})
}

/**
 * 견적 분석 완료 이메일
 */
export async function sendQuoteCompletedEmail(to: string, quoteId: string, customerName: string): Promise<{ success: boolean }> {
	return sendEmail({
		to,
		subject: `[ZipCheck] 견적 분석 완료 - 결과를 확인해주세요 (#${quoteId})`,
		html: `
			<div style="font-family: 'Pretendard', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
				<div style="background: linear-gradient(135deg, #2D5A3D, #4A7C59); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
					<h1 style="color: #fff; font-size: 24px; margin: 0;">분석이 완료되었습니다</h1>
				</div>

				<p style="font-size: 16px; color: #374151; line-height: 1.6;">
					안녕하세요, <strong>${customerName}</strong>님.
				</p>
				<p style="font-size: 16px; color: #374151; line-height: 1.6;">
					요청하신 견적서 분석이 완료되었습니다. 아래 링크에서 상세 결과를 확인해주세요.
				</p>

				<div style="text-align: center; margin: 32px 0;">
					<a href="https://zcheck.co.kr/quote-status"
					   style="display: inline-block; background: #2D5A3D; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
						분석 결과 확인하기
					</a>
				</div>

				<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
				<p style="font-size: 12px; color: #9CA3AF; text-align: center;">
					ZipCheck - 인테리어 견적 분석 서비스<br/>
					© ${new Date().getFullYear()} ZipCheck. All rights reserved.
				</p>
			</div>
		`,
	})
}
