import { Context, MiddlewareHandler } from 'hono'
import type { Env, JWTPayload, Variables } from '../types'

// JWT helpers using crypto.subtle HMAC-SHA256

function base64urlEncode(data: string): string {
	return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
	const padded = str + '='.repeat((4 - str.length % 4) % 4)
	return atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
	return await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	)
}

export async function generateToken(
	payload: Omit<JWTPayload, 'iat' | 'exp'>,
	secret: string,
	expiresInDays = 7
): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' }
	const now = Math.floor(Date.now() / 1000)
	const fullPayload: JWTPayload = {
		...payload,
		iat: now,
		exp: now + expiresInDays * 24 * 60 * 60,
	}

	const headerB64 = base64urlEncode(JSON.stringify(header))
	const payloadB64 = base64urlEncode(JSON.stringify(fullPayload))
	const unsigned = `${headerB64}.${payloadB64}`

	const key = await getSigningKey(secret)
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(unsigned)
	)

	const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
		.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

	return `${unsigned}.${sigB64}`
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null

		const [headerB64, payloadB64, sigB64] = parts
		const unsigned = `${headerB64}.${payloadB64}`

		// Verify signature
		const key = await getSigningKey(secret)
		const sigPadded = sigB64 + '='.repeat((4 - sigB64.length % 4) % 4)
		const sigBytes = Uint8Array.from(
			atob(sigPadded.replace(/-/g, '+').replace(/_/g, '/')),
			c => c.charCodeAt(0)
		)

		const valid = await crypto.subtle.verify(
			'HMAC',
			key,
			sigBytes,
			new TextEncoder().encode(unsigned)
		)
		if (!valid) return null

		// Decode payload
		const payload = JSON.parse(base64urlDecode(payloadB64)) as JWTPayload

		// Check expiration
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			return null
		}

		return payload
	} catch {
		return null
	}
}

// Hono middleware: require authentication
export function authenticateToken(): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> {
	return async (c, next) => {
		const authHeader = c.req.header('Authorization')
		if (!authHeader?.startsWith('Bearer ')) {
			return c.json({ error: '인증 토큰이 필요합니다' }, 401)
		}

		const token = authHeader.slice(7)
		const payload = await verifyToken(token, c.env.JWT_SECRET)
		if (!payload) {
			return c.json({ error: '유효하지 않은 토큰입니다' }, 403)
		}

		c.set('user', payload)
		await next()
	}
}

// Hono middleware: optional authentication (sets user if token present)
export function optionalAuth(): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> {
	return async (c, next) => {
		const authHeader = c.req.header('Authorization')
		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.slice(7)
			const payload = await verifyToken(token, c.env.JWT_SECRET)
			if (payload) {
				c.set('user', payload)
			}
		}
		await next()
	}
}

// Hono middleware: require admin role (must follow authenticateToken)
export function requireAdmin(): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> {
	return async (c, next) => {
		const user = c.get('user')
		if (!user || user.role !== 'admin') {
			return c.json({ error: '관리자 권한이 필요합니다' }, 403)
		}
		await next()
	}
}
