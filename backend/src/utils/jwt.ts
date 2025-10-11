import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'
const JWT_EXPIRES_IN = '7d' // 7일간 유효

export interface JWTPayload {
	role: 'admin'
	iat?: number
	exp?: number
}

/**
 * JWT 토큰 생성
 */
export function generateToken(): string {
	const payload: JWTPayload = {
		role: 'admin'
	}

	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN
	})
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
		return decoded
	} catch (error) {
		console.error('JWT verification failed:', error)
		return null
	}
}
