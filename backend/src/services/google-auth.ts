/**
 * Google Service Account Authentication Module
 *
 * Shared auth for GA4, Gmail, Search Console
 * Supports both file-based (local) and env-based (production) credentials
 */

import { google, Auth } from 'googleapis'
import path from 'path'
import fs from 'fs'

/** scope별 캐시 (동일 scope 조합이면 인스턴스 재사용) */
const authCache = new Map<string, Auth.GoogleAuth>()

/**
 * Get authenticated Google Auth client
 * Uses service account credentials from key file or environment variables
 * Caches instances per scope set for reuse across requests
 */
export function getGoogleAuth(scopes: string[]) {
	const cacheKey = [...scopes].sort().join(',')
	const cached = authCache.get(cacheKey)
	if (cached) return cached

	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
	const resolvedPath = keyPath ? path.resolve(__dirname, '../../', keyPath) : null

	let auth: Auth.GoogleAuth

	// Option 1: Key file exists (local development)
	if (resolvedPath && fs.existsSync(resolvedPath)) {
		auth = new google.auth.GoogleAuth({
			keyFile: resolvedPath,
			scopes,
		})
	// Option 2: Environment variables (production)
	} else {
		const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
		const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

		if (!email || !privateKey) {
			throw new Error(
				'Google Service Account credentials not found. ' +
				'Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'
			)
		}

		auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: email,
				private_key: privateKey.replace(/\\n/g, '\n'),
			},
			scopes,
		})
	}

	authCache.set(cacheKey, auth)
	return auth
}

/**
 * Google API Scopes
 */
export const GOOGLE_SCOPES = {
	ANALYTICS_READONLY: 'https://www.googleapis.com/auth/analytics.readonly',
	GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
	SEARCH_CONSOLE: 'https://www.googleapis.com/auth/webmasters',
	SEARCH_CONSOLE_READONLY: 'https://www.googleapis.com/auth/webmasters.readonly',
	INDEXING: 'https://www.googleapis.com/auth/indexing',
} as const
