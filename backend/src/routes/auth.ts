import { Router, Request, Response } from 'express'
import { generateToken } from '../utils/jwt'
import crypto from 'crypto'
import { query, insertOne, findOne } from '../lib/db'

const router = Router()

// Session storage for OAuth state (in production, use Redis or database)
const sessionStore = new Map<string, { state: string; timestamp: number }>()

// Clean up expired sessions (older than 10 minutes)
setInterval(() => {
	const now = Date.now()
	const tenMinutes = 10 * 60 * 1000
	for (const [key, value] of sessionStore.entries()) {
		if (now - value.timestamp > tenMinutes) {
			sessionStore.delete(key)
		}
	}
}, 60 * 1000) // Run every minute

/**
 * Generate random state for CSRF protection
 */
function generateState(): string {
	return crypto.randomBytes(16).toString('hex')
}

// 관리자 로그인
router.post('/admin/login', async (req, res) => {
	try {
		const { password } = req.body

		if (!password) {
			return res.status(400).json({ error: '비밀번호를 입력하세요.' })
		}

		const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

		if (!ADMIN_PASSWORD) {
			console.error('ADMIN_PASSWORD environment variable is not set')
			return res.status(500).json({ error: '서버 설정 오류가 발생했습니다.' })
		}

		// 비밀번호 확인
		if (password !== ADMIN_PASSWORD) {
			return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' })
		}

		// JWT 토큰 생성
		const token = generateToken()

		console.log('✅ Admin login successful')

		// 사용자 정보
		const user = {
			username: 'admin',
			role: 'admin'
		}

		res.json({
			success: true,
			message: '로그인 성공',
			token,
			user
		})
	} catch (error) {
		console.error('Admin login error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// 토큰 검증 (현재 로그인 상태 확인)
router.get('/verify', (req, res) => {
	// JWT 미들웨어를 통과했다면 이미 인증된 상태
	res.json({
		success: true,
		authenticated: true,
		role: 'admin'
	})
})

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', (req, res) => {
	res.json({
		success: true,
		message: '로그아웃 되었습니다.'
	})
})

// ============================================
// Naver OAuth 2.0 Authentication
// ============================================

/**
 * GET /api/auth/naver
 * Redirect to Naver OAuth login page
 */
router.get('/naver', (req: Request, res: Response) => {
	const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
	const NAVER_CALLBACK_URL = process.env.NAVER_CALLBACK_URL || 'http://localhost:5173/auth/naver/callback'

	if (!NAVER_CLIENT_ID) {
		console.error('⚠️  NAVER_CLIENT_ID not found in environment variables')
		return res.status(500).json({ error: '네이버 로그인이 설정되지 않았습니다.' })
	}

	// Generate and store state
	const state = generateState()
	const sessionId = crypto.randomUUID()
	sessionStore.set(sessionId, { state, timestamp: Date.now() })

	// Store sessionId in cookie
	res.cookie('naver_session_id', sessionId, {
		httpOnly: true,
		maxAge: 10 * 60 * 1000, // 10 minutes
		sameSite: 'lax'
	})

	// Build Naver OAuth URL
	const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
	naverAuthUrl.searchParams.set('response_type', 'code')
	naverAuthUrl.searchParams.set('client_id', NAVER_CLIENT_ID)
	naverAuthUrl.searchParams.set('redirect_uri', NAVER_CALLBACK_URL)
	naverAuthUrl.searchParams.set('state', state)

	console.log(`🔐 Redirecting to Naver OAuth: ${naverAuthUrl.toString()}`)

	res.redirect(naverAuthUrl.toString())
})

/**
 * GET /api/auth/naver/callback
 * Handle Naver OAuth callback
 */
router.get('/naver/callback', async (req: Request, res: Response) => {
	try {
		const { code, state, error, error_description } = req.query

		// Check for OAuth errors
		if (error) {
			console.error(`❌ Naver OAuth error: ${error} - ${error_description}`)
			return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=oauth_failed`)
		}

		if (!code || !state) {
			console.error('❌ Missing code or state parameter')
			return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=invalid_request`)
		}

		// Verify state (CSRF protection)
		const sessionId = req.cookies.naver_session_id
		if (!sessionId) {
			console.error('❌ No session ID found in cookies')
			return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=session_expired`)
		}

		const session = sessionStore.get(sessionId)
		if (!session || session.state !== state) {
			console.error('❌ State mismatch - possible CSRF attack')
			sessionStore.delete(sessionId)
			return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=invalid_state`)
		}

		// Clean up session
		sessionStore.delete(sessionId)
		res.clearCookie('naver_session_id')

		console.log('✅ State verified successfully')

		// Exchange code for access token
		const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: process.env.NAVER_CLIENT_ID!,
				client_secret: process.env.NAVER_CLIENT_SECRET!,
				code: code as string,
				state: state as string
			})
		})

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json()
			console.error('❌ Failed to get access token:', errorData)
			throw new Error('Failed to get access token')
		}

		const tokenData = (await tokenResponse.json()) as { access_token: string }
		const accessToken = tokenData.access_token

		console.log('✅ Access token received')

		// Get user profile from Naver
		const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		})

		if (!profileResponse.ok) {
			console.error('❌ Failed to get user profile')
			throw new Error('Failed to get user profile')
		}

		const profileData = (await profileResponse.json()) as {
			resultcode: string
			message?: string
			response: {
				id: string
				email: string
				name: string
				mobile: string
				profile_image: string
			}
		}

		if (profileData.resultcode !== '00') {
			console.error('❌ Naver API error:', profileData.message)
			throw new Error('Failed to get user profile')
		}

		const naverUser = profileData.response
		console.log('✅ User profile received:', naverUser.email)

		// ✅ CONVERTED: Check if user exists in database
		// OLD: const { data: existingUser, error: findError } = await supabase.from('users').select('*').eq('naver_id', naverUser.id).single()
		const existingUser = await findOne<any>('users', { naver_id: naverUser.id })

		let userId: string

		if (existingUser) {
			// ✅ CONVERTED: Update existing user
			// OLD: const { data: updatedUser, error: updateError } = await supabase.from('users').update({...}).eq('naver_id', naverUser.id).select().single()
			console.log('📝 Updating existing user')
			const updateResult = await query(
				`UPDATE users
				SET email = $1, name = $2, phone = $3, profile_image = $4, updated_at = $5
				WHERE naver_id = $6
				RETURNING *`,
				[naverUser.email, naverUser.name, naverUser.mobile, naverUser.profile_image, new Date().toISOString(), naverUser.id]
			)

			const updatedUser = updateResult.rows[0]

			if (!updatedUser) {
				console.error('❌ Failed to update user')
				throw new Error('Failed to update user')
			}

			userId = updatedUser.id
		} else {
			// ✅ CONVERTED: Create new user
			// OLD: const { data: newUser, error: createError } = await supabase.from('users').insert({...}).select().single()
			console.log('🆕 Creating new user')
			const newUser = await insertOne<any>('users', {
				naver_id: naverUser.id,
				email: naverUser.email,
				name: naverUser.name,
				phone: naverUser.mobile,
				profile_image: naverUser.profile_image,
				oauth_provider: 'naver',
				joined_at: new Date().toISOString()
			})

			if (!newUser) {
				console.error('❌ Failed to create user')
				throw new Error('Failed to create user')
			}

			userId = newUser.id
		}

		// Generate JWT token
		const jwt = require('jsonwebtoken')
		const jwtToken = jwt.sign(
			{
				userId,
				email: naverUser.email,
				name: naverUser.name,
				role: 'user'
			},
			process.env.JWT_SECRET || 'zipcheck_jwt_secret_key_2025_production',
			{ expiresIn: '7d' }
		)

		console.log('✅ JWT token generated')

		// Redirect to frontend with token
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
		res.redirect(`${frontendUrl}/auth/naver/success?token=${jwtToken}`)
	} catch (error) {
		console.error('❌ OAuth callback error:', error)
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
		res.redirect(`${frontendUrl}?error=oauth_failed`)
	}
})

/**
 * GET /api/auth/me
 * Get current user info (requires JWT token)
 */
router.get('/me', async (req: Request, res: Response) => {
	try {
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		const token = authHeader.substring(7)
		const jwt = require('jsonwebtoken')

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zipcheck_jwt_secret_key_2025_production')

		// ✅ CONVERTED: Get user from database
		// OLD: const { data: user, error } = await supabase.from('users').select('*').eq('id', decoded.userId).single()
		const user = await findOne<any>('users', { id: decoded.userId })

		if (!user) {
			return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
		}

		// Remove sensitive data
		delete user.naver_id

		res.json(user)
	} catch (error) {
		console.error('❌ Auth error:', error)
		res.status(401).json({ error: '인증에 실패했습니다.' })
	}
})

export default router
