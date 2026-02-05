import type { Env } from '../types'

// Gmail OAuth2 refresh token flow (not service account)
async function refreshAccessToken(env: Env): Promise<string> {
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.GMAIL_CLIENT_ID,
			client_secret: env.GMAIL_CLIENT_SECRET,
			refresh_token: env.GMAIL_REFRESH_TOKEN,
			grant_type: 'refresh_token',
		}),
	})
	const data = await res.json() as { access_token?: string; error?: string }
	if (!data.access_token) throw new Error(`Gmail token refresh failed: ${data.error}`)
	return data.access_token
}

function toBase64Url(input: string): string {
	const bytes = new TextEncoder().encode(input)
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function encodeMimeWord(text: string): string {
	const bytes = new TextEncoder().encode(text)
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return '=?UTF-8?B?' + btoa(binary) + '?='
}

interface EmailOptions {
	to: string
	subject: string
	html: string
}

export async function sendEmail(env: Env, { to, subject, html }: EmailOptions) {
	try {
		const accessToken = await refreshAccessToken(env)
		const senderEmail = env.GMAIL_SENDER_EMAIL

		const htmlBytes = new TextEncoder().encode(html)
		let htmlBinary = ''
		for (let i = 0; i < htmlBytes.length; i++) {
			htmlBinary += String.fromCharCode(htmlBytes[i])
		}

		const raw = [
			`From: "${encodeMimeWord('ZipCheck')}" <${senderEmail}>`,
			`To: ${to}`,
			`Subject: ${encodeMimeWord(subject)}`,
			'MIME-Version: 1.0',
			'Content-Type: text/html; charset=UTF-8',
			'Content-Transfer-Encoding: base64',
			'',
			btoa(htmlBinary),
		].join('\r\n')

		const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ raw: toBase64Url(raw) }),
		})

		if (!res.ok) {
			const err = await res.text()
			throw new Error(`Gmail send failed (${res.status}): ${err}`)
		}

		const data = await res.json() as { id: string }
		return { success: true, messageId: data.id }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { success: false, error: message }
	}
}

export async function sendQuoteReceivedEmail(env: Env, to: string, quoteId: string, customerName: string) {
	return sendEmail(env, {
		to,
		subject: `[ZipCheck] 견적 분석 접수 완료 (#${quoteId})`,
		html: `
			<div style="font-family: 'Pretendard', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
				<div style="background: linear-gradient(135deg, #2D5A3D, #4A7C59); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
					<h1 style="color: #fff; font-size: 24px; margin: 0;">견적 분석 접수 완료</h1>
				</div>
				<p style="font-size: 16px; color: #374151; line-height: 1.6;">안녕하세요, <strong>${customerName}</strong>님.</p>
				<p style="font-size: 16px; color: #374151; line-height: 1.6;">견적서가 정상적으로 접수되었습니다.</p>
				<div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 24px 0;">
					<p style="margin: 0; color: #6B7280; font-size: 14px;">접수 번호</p>
					<p style="margin: 4px 0 0; color: #111827; font-size: 20px; font-weight: 700;">#${quoteId}</p>
				</div>
				<p style="font-size: 14px; color: #6B7280;">분석 현황은 <a href="https://zcheck.co.kr/quote-status" style="color: #2D5A3D; font-weight: 600;">견적 현황 조회</a>에서 확인하세요.</p>
				<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
				<p style="font-size: 12px; color: #9CA3AF; text-align: center;">ZipCheck &copy; ${new Date().getFullYear()}</p>
			</div>
		`,
	})
}

export async function sendAdminNewQuoteEmail(env: Env, data: { id: string; name: string; phone: string; planName: string }) {
	const adminEmail = env.GMAIL_SENDER_EMAIL // 관리자 = hello@zcheck.co.kr
	return sendEmail(env, {
		to: adminEmail,
		subject: `[관리자] 새 견적 접수 #${data.id} - ${data.name}`,
		html: `
			<div style="font-family: 'Pretendard', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
				<div style="background: linear-gradient(135deg, #1E3A5F, #2D5A8E); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
					<h1 style="color: #fff; font-size: 20px; margin: 0;">새 견적 접수 알림</h1>
				</div>
				<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
					<tr><td style="padding: 8px 12px; color: #6B7280; font-size: 14px;">접수번호</td><td style="padding: 8px 12px; font-weight: 700;">#${data.id}</td></tr>
					<tr style="background: #F9FAFB;"><td style="padding: 8px 12px; color: #6B7280; font-size: 14px;">고객명</td><td style="padding: 8px 12px;">${data.name}</td></tr>
					<tr><td style="padding: 8px 12px; color: #6B7280; font-size: 14px;">연락처</td><td style="padding: 8px 12px;">${data.phone}</td></tr>
					<tr style="background: #F9FAFB;"><td style="padding: 8px 12px; color: #6B7280; font-size: 14px;">유형</td><td style="padding: 8px 12px;">${data.planName}</td></tr>
				</table>
				<div style="text-align: center; margin: 24px 0;">
					<a href="https://admin.zcheck.co.kr" style="display: inline-block; background: #1E3A5F; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600;">관리자 페이지에서 확인</a>
				</div>
			</div>
		`,
	})
}

export async function sendAnalysisResultEmail(
	env: Env,
	to: string,
	customerName: string,
	result: { totalScore: number; grade: { label: string; description: string }; scoreBreakdown: { categories: Array<{ category: string; score: number; avg_deviation: number; weight: number }>; bonuses: Array<{ label: string; points: number }>; penalties: Array<{ label: string; points: number }> } }
) {
	const { totalScore, grade, scoreBreakdown } = result

	// Grade color mapping
	const gradeColors: Record<string, string> = {
		A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', F: '#EF4444',
	}
	const gradeColor = gradeColors[grade.label] || '#6B7280'

	// Top 3 categories by weight
	const topCategories = [...scoreBreakdown.categories]
		.sort((a, b) => b.weight - a.weight)
		.slice(0, 3)

	const categoryRows = topCategories.map(cat => {
		const devSign = cat.avg_deviation > 0 ? '+' : ''
		const devColor = cat.avg_deviation <= 10 ? '#10B981' : cat.avg_deviation <= 25 ? '#F59E0B' : '#EF4444'
		return `<tr>
			<td style="padding: 10px 14px; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${cat.category}</td>
			<td style="padding: 10px 14px; border-bottom: 1px solid #E5E7EB; text-align: center;">${cat.score}점</td>
			<td style="padding: 10px 14px; border-bottom: 1px solid #E5E7EB; text-align: center; color: ${devColor};">${devSign}${cat.avg_deviation.toFixed(1)}%</td>
		</tr>`
	}).join('')

	return sendEmail(env, {
		to,
		subject: `[ZipCheck] 견적 분석 완료 - ${grade.label}등급 (${totalScore}점)`,
		html: `
			<div style="font-family: 'Pretendard', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
				<div style="background: linear-gradient(135deg, #2D5A3D, #4A7C59); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
					<h1 style="color: #fff; font-size: 24px; margin: 0;">견적 분석이 완료되었습니다</h1>
				</div>

				<p style="font-size: 16px; color: #374151; line-height: 1.6;">안녕하세요, <strong>${customerName}</strong>님.</p>
				<p style="font-size: 16px; color: #374151; line-height: 1.6;">요청하신 견적서에 대한 집첵 분석 결과를 안내드립니다.</p>

				<!-- Score Summary -->
				<div style="background: #F9FAFB; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
					<div style="font-size: 48px; font-weight: 800; color: ${gradeColor}; line-height: 1;">
						${totalScore}
					</div>
					<div style="font-size: 14px; color: #6B7280; margin-top: 4px;">/ 100점</div>
					<div style="display: inline-block; background: ${gradeColor}; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; margin-top: 12px;">
						${grade.label}등급
					</div>
					<div style="font-size: 14px; color: #374151; margin-top: 8px;">
						${grade.description}
					</div>
				</div>

				<!-- Top Categories Table -->
				<div style="margin: 24px 0;">
					<h3 style="font-size: 16px; color: #111827; margin-bottom: 12px;">주요 카테고리 분석</h3>
					<table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
						<thead>
							<tr style="background: #F3F4F6;">
								<th style="padding: 10px 14px; text-align: left; font-size: 13px; color: #6B7280;">카테고리</th>
								<th style="padding: 10px 14px; text-align: center; font-size: 13px; color: #6B7280;">점수</th>
								<th style="padding: 10px 14px; text-align: center; font-size: 13px; color: #6B7280;">편차</th>
							</tr>
						</thead>
						<tbody>
							${categoryRows}
						</tbody>
					</table>
				</div>

				<!-- CTA Button -->
				<div style="text-align: center; margin: 32px 0;">
					<a href="https://zcheck.co.kr/quote-status" style="display: inline-block; background: #2D5A3D; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
						상세 결과 확인하기
					</a>
				</div>

				<p style="font-size: 13px; color: #9CA3AF; text-align: center;">
					더 궁금한 사항이 있으시면 카카오톡으로 문의해주세요.
				</p>
				<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
				<p style="font-size: 12px; color: #9CA3AF; text-align: center;">ZipCheck &copy; ${new Date().getFullYear()}</p>
			</div>
		`,
	})
}

export async function sendQuoteCompletedEmail(env: Env, to: string, quoteId: string, customerName: string) {
	return sendEmail(env, {
		to,
		subject: `[ZipCheck] 견적 분석 완료 - 결과를 확인해주세요 (#${quoteId})`,
		html: `
			<div style="font-family: 'Pretendard', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
				<div style="background: linear-gradient(135deg, #2D5A3D, #4A7C59); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
					<h1 style="color: #fff; font-size: 24px; margin: 0;">분석이 완료되었습니다</h1>
				</div>
				<p style="font-size: 16px; color: #374151;">안녕하세요, <strong>${customerName}</strong>님.</p>
				<p style="font-size: 16px; color: #374151;">요청하신 견적서 분석이 완료되었습니다.</p>
				<div style="text-align: center; margin: 32px 0;">
					<a href="https://zcheck.co.kr/quote-status" style="display: inline-block; background: #2D5A3D; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">분석 결과 확인하기</a>
				</div>
				<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
				<p style="font-size: 12px; color: #9CA3AF; text-align: center;">ZipCheck &copy; ${new Date().getFullYear()}</p>
			</div>
		`,
	})
}
