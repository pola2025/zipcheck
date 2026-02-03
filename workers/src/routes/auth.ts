import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { generateToken, verifyToken } from '../middleware/auth'
import { query, findOne, insertOne } from '../lib/db'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Admin login
app.post('/admin/login', async (c) => {
	const { password } = await c.req.json<{ password: string }>()

	if (!password) {
		return c.json({ error: '비밀번호를 입력하세요.' }, 400)
	}

	if (password !== c.env.ADMIN_PASSWORD) {
		return c.json({ error: '비밀번호가 올바르지 않습니다.' }, 401)
	}

	const token = await generateToken({ role: 'admin' }, c.env.JWT_SECRET)

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

	// Generate state and store in KV
	const stateArr = new Uint8Array(16)
	crypto.getRandomValues(stateArr)
	const state = Array.from(stateArr).map(b => b.toString(16).padStart(2, '0')).join('')
	const sessionId = crypto.randomUUID()

	await c.env.KV.put(`naver_state:${sessionId}`, state, { expirationTtl: 600 })

	const apiOrigin = new URL(c.req.url).origin
	const callbackUrl = `${apiOrigin}/api/auth/naver/callback`
	const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
	naverAuthUrl.searchParams.set('response_type', 'code')
	naverAuthUrl.searchParams.set('client_id', clientId)
	naverAuthUrl.searchParams.set('redirect_uri', callbackUrl)
	naverAuthUrl.searchParams.set('state', state)

	// Set session cookie and redirect
	return new Response(null, {
		status: 302,
		headers: {
			Location: naverAuthUrl.toString(),
			'Set-Cookie': `naver_session_id=${sessionId}; HttpOnly; Max-Age=600; SameSite=Lax; Path=/`,
		},
	})
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

		// Get session ID from cookie
		const cookies = c.req.header('Cookie') || ''
		const sessionMatch = cookies.match(/naver_session_id=([^;]+)/)
		const sessionId = sessionMatch?.[1]

		if (!sessionId) {
			return c.redirect(`${frontendUrl}?error=session_expired`)
		}

		// Verify state from KV
		const storedState = await c.env.KV.get(`naver_state:${sessionId}`)
		if (!storedState || storedState !== state) {
			return c.redirect(`${frontendUrl}?error=invalid_state`)
		}

		// Clean up KV state
		await c.env.KV.delete(`naver_state:${sessionId}`)

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
				`UPDATE users SET email = $1, name = $2, phone = $3, profile_image = $4, updated_at = $5
				WHERE naver_id = $6 RETURNING id`,
				[naverUser.email, naverUser.name, naverUser.mobile, naverUser.profile_image, new Date().toISOString(), naverUser.id]
			)
			userId = (rows[0] as { id: string }).id
		} else {
			const newUser = await insertOne<{ id: string }>(c.env.DATABASE_URL, 'users', {
				naver_id: naverUser.id,
				email: naverUser.email,
				name: naverUser.name,
				phone: naverUser.mobile,
				profile_image: naverUser.profile_image,
				oauth_provider: 'naver',
				joined_at: new Date().toISOString(),
			})
			userId = newUser.id
		}

		// Generate JWT
		const jwtToken = await generateToken(
			{ role: 'user', userId, email: naverUser.email, name: naverUser.name },
			c.env.JWT_SECRET
		)

		return c.redirect(`${frontendUrl}/auth/naver/success?token=${jwtToken}`)
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

	// Generate state and store in KV
	const stateArr = new Uint8Array(16)
	crypto.getRandomValues(stateArr)
	const state = Array.from(stateArr).map(b => b.toString(16).padStart(2, '0')).join('')
	const sessionId = crypto.randomUUID()

	await c.env.KV.put(`google_state:${sessionId}`, state, { expirationTtl: 600 })

	// Get redirect_to from query params (for post-login redirect)
	const redirectTo = c.req.query('redirect_to') || '/'

	// Store redirect_to in KV along with state
	await c.env.KV.put(`google_redirect:${sessionId}`, redirectTo, { expirationTtl: 600 })

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

	// Set session cookie and redirect
	return new Response(null, {
		status: 302,
		headers: {
			Location: googleAuthUrl.toString(),
			'Set-Cookie': `google_session_id=${sessionId}; HttpOnly; Max-Age=600; SameSite=Lax; Path=/`,
		},
	})
})

// Google OAuth callback
app.get('/google/callback', async (c) => {
	const frontendUrl = c.env.FRONTEND_URL
	try {
		const { code, state, error: oauthError } = c.req.query()

		if (oauthError) {
			return c.redirect(`${frontendUrl}?error=oauth_failed`)
		}

		if (!code || !state) {
			return c.redirect(`${frontendUrl}?error=invalid_request`)
		}

		// Get session ID from cookie
		const cookies = c.req.header('Cookie') || ''
		const sessionMatch = cookies.match(/google_session_id=([^;]+)/)
		const sessionId = sessionMatch?.[1]

		if (!sessionId) {
			return c.redirect(`${frontendUrl}?error=session_expired`)
		}

		// Verify state from KV
		const storedState = await c.env.KV.get(`google_state:${sessionId}`)
		if (!storedState || storedState !== state) {
			return c.redirect(`${frontendUrl}?error=invalid_state`)
		}

		// Get stored redirect_to
		const redirectTo = await c.env.KV.get(`google_redirect:${sessionId}`) || '/'

		// Clean up KV state
		await c.env.KV.delete(`google_state:${sessionId}`)
		await c.env.KV.delete(`google_redirect:${sessionId}`)

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

		if (!tokenResponse.ok) throw new Error('Failed to get access token')
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
					avatar_url: googleUser.picture,
					auth_provider: 'google',
					joined_at: new Date().toISOString(),
				})
				userId = newUser.id
			}
		}

		// Generate JWT
		const jwtToken = await generateToken(
			{ role: 'user', userId, email: googleUser.email, name: googleUser.name },
			c.env.JWT_SECRET
		)

		return c.redirect(`${frontendUrl}/auth/google/success?token=${jwtToken}&redirect_to=${encodeURIComponent(redirectTo)}`)
	} catch (err) {
		console.error('Google OAuth callback error:', err)
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
		'SELECT id, email, name, phone, profile_image, avatar_url, oauth_provider, auth_provider, joined_at FROM users WHERE id = $1',
		[payload.userId]
	)

	if (!user) {
		return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)
	}

	return c.json(user)
})

export default app
