import { Hono } from 'hono'
import * as OTPAuth from 'otpauth'
import type { Env, Variables } from '../types'
import { generateToken, verifyToken } from '../middleware/auth'
import { query, findOne, insertOne } from '../lib/db'
import { sendTelegramMessage } from '../services/telegram'

const ADMIN_EMAIL = 'mkt@polarad.co.kr'
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 15 * 60 // 15 minutes in seconds
const SESSION_TTL = 300 // 5 minutes

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Rate limiting helper
async function checkRateLimit(kv: KVNamespace, ip: string): Promise<{ allowed: boolean; remaining: number }> {
	const key = `rate_limit:admin_login:${ip}`
	const raw = await kv.get(key)
	const count = raw ? parseInt(raw, 10) : 0
	if (count >= RATE_LIMIT_MAX) {
		return { allowed: false, remaining: 0 }
	}
	await kv.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW })
	return { allowed: true, remaining: RATE_LIMIT_MAX - count - 1 }
}

// Get stored TOTP secret
async function getTotpSecret(env: Env): Promise<string | null> {
	// Env secret takes priority, fallback to KV
	if (env.ADMIN_TOTP_SECRET) return env.ADMIN_TOTP_SECRET
	return await env.KV.get('admin_totp_secret')
}

// Admin login Step 1: Email verification
app.post('/admin/login', async (c) => {
	const ip = c.req.header('CF-Connecting-IP') || 'unknown'
	const { allowed, remaining } = await checkRateLimit(c.env.KV, ip)
	if (!allowed) {
		c.executionCtx.waitUntil(
			sendTelegramMessage(c.env, `<b>⚠️ 관리자 로그인 Rate Limit 초과</b>\n\nIP: <code>${ip}</code>`)
		)
		return c.json({ error: '로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도하세요.' }, 429)
	}

	const { email } = await c.req.json<{ email: string }>()

	if (!email) {
		return c.json({ error: '이메일을 입력하세요.' }, 400)
	}

	if (email.toLowerCase() !== ADMIN_EMAIL) {
		c.executionCtx.waitUntil(
			sendTelegramMessage(c.env, `<b>🔒 관리자 로그인 실패 (잘못된 이메일)</b>\n\n이메일: <code>${email}</code>\nIP: <code>${ip}</code>`)
		)
		return c.json({ error: '등록되지 않은 관리자 이메일입니다.' }, 401)
	}

	// Generate session token
	const sessionArr = new Uint8Array(32)
	crypto.getRandomValues(sessionArr)
	const sessionToken = Array.from(sessionArr).map(b => b.toString(16).padStart(2, '0')).join('')

	const existingSecret = await getTotpSecret(c.env)

	if (!existingSecret) {
		// First-time setup: generate new TOTP secret
		const secret = new OTPAuth.Secret({ size: 20 })
		const totp = new OTPAuth.TOTP({
			issuer: 'ZipCheck Admin',
			label: ADMIN_EMAIL,
			algorithm: 'SHA1',
			digits: 6,
			period: 30,
			secret,
		})

		// Store session with new secret in KV
		await c.env.KV.put(
			`admin_session:${sessionToken}`,
			JSON.stringify({ email, newSecret: secret.base32 }),
			{ expirationTtl: SESSION_TTL }
		)

		return c.json({
			step: 'totp_setup',
			sessionToken,
			secret: secret.base32,
			otpauthUri: totp.toString(),
		})
	}

	// TOTP already configured → ask for code
	await c.env.KV.put(
		`admin_session:${sessionToken}`,
		JSON.stringify({ email }),
		{ expirationTtl: SESSION_TTL }
	)

	return c.json({
		step: 'totp_required',
		sessionToken,
	})
})

// Admin login Step 2: TOTP verification
app.post('/admin/login/verify-totp', async (c) => {
	const ip = c.req.header('CF-Connecting-IP') || 'unknown'
	const { allowed } = await checkRateLimit(c.env.KV, ip)
	if (!allowed) {
		return c.json({ error: '로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도하세요.' }, 429)
	}

	const { code, sessionToken, newSecret } = await c.req.json<{
		code: string
		sessionToken: string
		newSecret?: string
	}>()

	if (!code || !sessionToken) {
		return c.json({ error: '인증 코드와 세션 토큰이 필요합니다.' }, 400)
	}

	// Validate session token
	const sessionRaw = await c.env.KV.get(`admin_session:${sessionToken}`)
	if (!sessionRaw) {
		return c.json({ error: '세션이 만료되었습니다. 다시 로그인하세요.' }, 401)
	}

	const session = JSON.parse(sessionRaw) as { email: string; newSecret?: string }

	// Determine which secret to use for verification
	const secretBase32 = newSecret || session.newSecret || await getTotpSecret(c.env)
	if (!secretBase32) {
		return c.json({ error: 'TOTP 시크릿이 설정되지 않았습니다.' }, 500)
	}

	// Verify TOTP code
	const totp = new OTPAuth.TOTP({
		issuer: 'ZipCheck Admin',
		label: ADMIN_EMAIL,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(secretBase32),
	})

	const delta = totp.validate({ token: code, window: 1 })
	if (delta === null) {
		c.executionCtx.waitUntil(
			sendTelegramMessage(c.env, `<b>🔒 관리자 TOTP 인증 실패</b>\n\nIP: <code>${ip}</code>`)
		)
		return c.json({ error: '인증 코드가 올바르지 않습니다.' }, 401)
	}

	// If first-time setup, save the TOTP secret to KV
	if (newSecret || session.newSecret) {
		const secretToSave = newSecret || session.newSecret
		await c.env.KV.put('admin_totp_secret', secretToSave!)
	}

	// Delete session token (one-time use)
	await c.env.KV.delete(`admin_session:${sessionToken}`)

	// Generate JWT
	const token = await generateToken({ role: 'admin' }, c.env.JWT_SECRET)

	// Telegram success notification
	const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
	c.executionCtx.waitUntil(
		sendTelegramMessage(
			c.env,
			`<b>✅ 관리자 로그인 성공</b>\n\nIP: <code>${ip}</code>\n시각: ${now}${newSecret || session.newSecret ? '\n<i>최초 TOTP 등록 완료</i>' : ''}`
		)
	)

	return c.json({
		success: true,
		message: '로그인 성공',
		token,
		user: { username: 'admin', role: 'admin' },
	})
})

// Token verification
app.get('/verify', (c) => {
	return c.json({ success: true, authenticated: true, role: 'admin' })
})

// Logout (client-side token removal)
app.post('/logout', (c) => {
	return c.json({ success: true, message: '로그아웃 되었습니다.' })
})

// Naver OAuth: redirect to Naver login
app.get('/naver', async (c) => {
	const clientId = c.env.NAVER_CLIENT_ID
	if (!clientId) {
		return c.json({ error: '네이버 로그인이 설정되지 않았습니다.' }, 500)
	}

	// Generate state token - used as KV key (no cookie needed)
	const stateArr = new Uint8Array(16)
	crypto.getRandomValues(stateArr)
	const state = Array.from(stateArr).map(b => b.toString(16).padStart(2, '0')).join('')

	// Get redirect_to from query params (for post-login redirect)
	const redirectTo = c.req.query('redirect_to') || '/'

	// Store session data in KV keyed by state (Naver returns state via URL param)
	await c.env.KV.put(`naver_oauth:${state}`, JSON.stringify({ redirectTo }), { expirationTtl: 600 })

	const apiOrigin = new URL(c.req.url).origin
	const callbackUrl = `${apiOrigin}/api/auth/naver/callback`
	const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
	naverAuthUrl.searchParams.set('response_type', 'code')
	naverAuthUrl.searchParams.set('client_id', clientId)
	naverAuthUrl.searchParams.set('redirect_uri', callbackUrl)
	naverAuthUrl.searchParams.set('state', state)

	return c.redirect(naverAuthUrl.toString())
})

// Naver OAuth callback
app.get('/naver/callback', async (c) => {
	const frontendUrl = c.env.FRONTEND_URL
	try {
		const { code, state, error: oauthError } = c.req.query()

		if (oauthError) {
			return c.redirect(`${frontendUrl}?error=oauth_failed`)
		}

		if (!code || !state) {
			return c.redirect(`${frontendUrl}?error=invalid_request`)
		}

		// Verify state by looking up KV (no cookie needed - state comes via URL from Naver)
		const sessionRaw = await c.env.KV.get(`naver_oauth:${state}`)
		if (!sessionRaw) {
			return c.redirect(`${frontendUrl}?error=session_expired`)
		}

		const sessionData = JSON.parse(sessionRaw) as { redirectTo?: string }
		const redirectTo = sessionData.redirectTo || '/'

		// Clean up KV
		await c.env.KV.delete(`naver_oauth:${state}`)

		// Exchange code for access token
		const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: c.env.NAVER_CLIENT_ID,
				client_secret: c.env.NAVER_CLIENT_SECRET,
				code,
				state,
			}),
		})

		if (!tokenResponse.ok) throw new Error('Failed to get access token')
		const tokenData = await tokenResponse.json() as { access_token: string }

		// Get user profile
		const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		})

		if (!profileResponse.ok) throw new Error('Failed to get user profile')
		const profileData = await profileResponse.json() as {
			resultcode: string
			response: { id: string; email: string; name: string; mobile: string; profile_image: string }
		}

		if (profileData.resultcode !== '00') throw new Error('Naver API error')
		const naverUser = profileData.response

		// Check existing user
		const existingUser = await findOne<{ id: string }>(
			c.env.DATABASE_URL,
			'SELECT * FROM users WHERE naver_id = $1',
			[naverUser.id]
		)

		let userId: string

		if (existingUser) {
			const rows = await query(
				c.env.DATABASE_URL,
				`UPDATE users SET email = $1, name = $2, phone = $3, avatar_url = $4, updated_at = $5
				WHERE naver_id = $6 RETURNING id`,
				[naverUser.email, naverUser.name, naverUser.mobile, naverUser.profile_image, new Date().toISOString(), naverUser.id]
			)
			userId = (rows[0] as { id: string }).id
		} else {
			const newUser = await insertOne<{ id: string }>(c.env.DATABASE_URL, 'users', {
				naver_id: naverUser.id,
				email: naverUser.email,
				name: naverUser.name,
				phone: naverUser.mobile || `naver:${naverUser.id}`,
				avatar_url: naverUser.profile_image,
				auth_provider: 'naver',
			})
			userId = newUser.id
		}

		// Generate JWT
		const jwtToken = await generateToken(
			{ role: 'user', userId, email: naverUser.email, name: naverUser.name },
			c.env.JWT_SECRET
		)

		// Support subdomain redirects (*.zcheck.co.kr)
		let finalRedirectBase = frontendUrl
		if (redirectTo.startsWith('http')) {
			try {
				const redirectUrl = new URL(redirectTo)
				if (redirectUrl.hostname.endsWith('.zcheck.co.kr') || redirectUrl.hostname === 'zcheck.co.kr') {
					finalRedirectBase = redirectUrl.origin
				}
			} catch {
				// Invalid URL, use default
			}
		}

		const redirectPath = redirectTo.startsWith('http') ? new URL(redirectTo).pathname : redirectTo
		const finalUrl = `${finalRedirectBase}/auth/naver/success?token=${jwtToken}&redirect_to=${encodeURIComponent(redirectPath)}`
		return c.redirect(finalUrl)
	} catch (err) {
		console.error('OAuth callback error:', err)
		return c.redirect(`${frontendUrl}?error=oauth_failed`)
	}
})

// ============================================
// Google OAuth
// ============================================

// Google OAuth: redirect to Google login
app.get('/google', async (c) => {
	const clientId = c.env.GOOGLE_OAUTH_CLIENT_ID
	if (!clientId) {
		return c.json({ error: 'Google 로그인이 설정되지 않았습니다.' }, 500)
	}

	// Generate state token - used as KV key (no cookie needed)
	const stateArr = new Uint8Array(16)
	crypto.getRandomValues(stateArr)
	const state = Array.from(stateArr).map(b => b.toString(16).padStart(2, '0')).join('')

	// Get redirect_to from query params (for post-login redirect)
	const redirectTo = c.req.query('redirect_to') || '/'

	// Store redirect_to in KV keyed by state (Google returns state via URL param)
	await c.env.KV.put(`google_oauth:${state}`, JSON.stringify({ redirectTo }), { expirationTtl: 600 })

	const apiOrigin = new URL(c.req.url).origin
	const callbackUrl = `${apiOrigin}/api/auth/google/callback`
	const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
	googleAuthUrl.searchParams.set('client_id', clientId)
	googleAuthUrl.searchParams.set('redirect_uri', callbackUrl)
	googleAuthUrl.searchParams.set('response_type', 'code')
	googleAuthUrl.searchParams.set('scope', 'openid email profile')
	googleAuthUrl.searchParams.set('state', state)
	googleAuthUrl.searchParams.set('access_type', 'offline')
	googleAuthUrl.searchParams.set('prompt', 'consent')

	return c.redirect(googleAuthUrl.toString())
})

// Google OAuth callback
app.get('/google/callback', async (c) => {
	const frontendUrl = c.env.FRONTEND_URL
	try {
		const { code, state, error: oauthError } = c.req.query()

		if (oauthError) {
			console.error('Google OAuth error:', oauthError)
			return c.redirect(`${frontendUrl}?error=oauth_failed`)
		}

		if (!code || !state) {
			console.error('Google OAuth: missing code or state')
			return c.redirect(`${frontendUrl}?error=invalid_request`)
		}

		// Look up session data by state (no cookie needed - state comes via URL from Google)
		const sessionRaw = await c.env.KV.get(`google_oauth:${state}`)
		if (!sessionRaw) {
			console.error('Google OAuth: session expired for state:', state?.slice(0, 8))
			return c.redirect(`${frontendUrl}?error=session_expired`)
		}

		const sessionData = JSON.parse(sessionRaw) as { redirectTo: string }
		const redirectTo = sessionData.redirectTo || '/'

		// Clean up KV
		await c.env.KV.delete(`google_oauth:${state}`)

		// Exchange code for access token (redirect_uri must match the one used in /google init)
		const apiOrigin = new URL(c.req.url).origin
		const callbackUrl = `${apiOrigin}/api/auth/google/callback`
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: c.env.GOOGLE_OAUTH_CLIENT_ID,
				client_secret: c.env.GOOGLE_OAUTH_CLIENT_SECRET,
				code,
				redirect_uri: callbackUrl,
			}),
		})

		if (!tokenResponse.ok) {
			const errBody = await tokenResponse.text()
			console.error('Google OAuth token exchange failed:', tokenResponse.status, errBody)
			throw new Error('Failed to get access token')
		}
		const tokenData = await tokenResponse.json() as { access_token: string; id_token?: string }

		// Get user profile
		const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		})

		if (!profileResponse.ok) throw new Error('Failed to get user profile')
		const googleUser = await profileResponse.json() as {
			id: string; email: string; name: string; picture: string
		}

		// Check existing user by google_id
		const existingUser = await findOne<{ id: string }>(
			c.env.DATABASE_URL,
			'SELECT * FROM users WHERE google_id = $1',
			[googleUser.id]
		)

		let userId: string

		if (existingUser) {
			const rows = await query(
				c.env.DATABASE_URL,
				`UPDATE users SET email = $1, name = $2, avatar_url = $3, updated_at = $4
				WHERE google_id = $5 RETURNING id`,
				[googleUser.email, googleUser.name, googleUser.picture, new Date().toISOString(), googleUser.id]
			)
			userId = (rows[0] as { id: string }).id
		} else {
			// Check if user exists by email (might have registered via Naver)
			const existingByEmail = await findOne<{ id: string; google_id: string | null }>(
				c.env.DATABASE_URL,
				'SELECT id, google_id FROM users WHERE email = $1',
				[googleUser.email]
			)

			if (existingByEmail && !existingByEmail.google_id) {
				// Link Google account to existing user
				const rows = await query(
					c.env.DATABASE_URL,
					`UPDATE users SET google_id = $1, avatar_url = $2, auth_provider = 'google', updated_at = $3
					WHERE id = $4 RETURNING id`,
					[googleUser.id, googleUser.picture, new Date().toISOString(), existingByEmail.id]
				)
				userId = (rows[0] as { id: string }).id
			} else {
				// Create new user
				const newUser = await insertOne<{ id: string }>(c.env.DATABASE_URL, 'users', {
					google_id: googleUser.id,
					email: googleUser.email,
					name: googleUser.name,
					phone: `google:${googleUser.id}`,
					avatar_url: googleUser.picture,
					auth_provider: 'google',
				})
				userId = newUser.id
			}
		}

		// Generate JWT
		const jwtToken = await generateToken(
			{ role: 'user', userId, email: googleUser.email, name: googleUser.name },
			c.env.JWT_SECRET
		)

		// Support subdomain redirects (*.zcheck.co.kr)
		let finalRedirectBase = frontendUrl
		if (redirectTo.startsWith('http')) {
			try {
				const redirectUrl = new URL(redirectTo)
				if (redirectUrl.hostname.endsWith('.zcheck.co.kr') || redirectUrl.hostname === 'zcheck.co.kr') {
					finalRedirectBase = redirectUrl.origin
				}
			} catch {
				// Invalid URL, use default
			}
		}

		const redirectPath = redirectTo.startsWith('http') ? new URL(redirectTo).pathname : redirectTo
		const finalUrl = `${finalRedirectBase}/auth/google/success?token=${jwtToken}&redirect_to=${encodeURIComponent(redirectPath)}`
		return c.redirect(finalUrl)
	} catch (err) {
		console.error('Google OAuth callback error:', err instanceof Error ? err.message : err)
		return c.redirect(`${frontendUrl}?error=oauth_failed`)
	}
})

// ============================================
// User Info
// ============================================

// Get current user info
app.get('/me', async (c) => {
	const authHeader = c.req.header('Authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return c.json({ error: '인증이 필요합니다.' }, 401)
	}

	const payload = await verifyToken(authHeader.slice(7), c.env.JWT_SECRET)
	if (!payload || !payload.userId) {
		return c.json({ error: '인증에 실패했습니다.' }, 401)
	}

	const user = await findOne(
		c.env.DATABASE_URL,
		'SELECT id, email, name, phone, avatar_url, auth_provider, created_at FROM users WHERE id = $1',
		[payload.userId]
	)

	if (!user) {
		return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)
	}

	return c.json(user)
})

export default app
