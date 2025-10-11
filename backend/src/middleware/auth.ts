import { Request, Response, NextFunction } from 'express'
import { verifyToken, JWTPayload } from '../utils/jwt'

// Request에 user 속성 추가를 위한 타입 확장
declare global {
	namespace Express {
		interface Request {
			user?: JWTPayload
		}
	}
}

/**
 * JWT 토큰 검증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하고 검증
 */
export function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

	if (!token) {
		res.status(401).json({ error: '인증 토큰이 필요합니다.' })
		return
	}

	const payload = verifyToken(token)

	if (!payload) {
		res.status(403).json({ error: '유효하지 않은 토큰입니다.' })
		return
	}

	req.user = payload
	next()
}

/**
 * 선택적 JWT 토큰 검증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과
 */
export function optionalAuthenticateToken(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]

	if (token) {
		const payload = verifyToken(token)
		if (payload) {
			req.user = payload
		}
	}

	next()
}

/**
 * 관리자 권한 체크 미들웨어
 * authenticateToken 미들웨어 이후에 사용
 */
export function requireAdmin(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	if (!req.user) {
		res.status(401).json({ error: '인증이 필요합니다.' })
		return
	}

	if (req.user.role !== 'admin') {
		res.status(403).json({ error: '관리자 권한이 필요합니다.' })
		return
	}

	next()
}
