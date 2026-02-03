/**
 * Google Service Account Authentication Module
 *
 * Shared auth for GA4, Gmail, Search Console
 * Supports both file-based (local) and env-based (production) credentials
 */

import { google, Auth } from 'googleapis'
import path from 'path'
import fs from 'fs'

/**
 * Get authenticated Google Auth client
 * Uses service account credentials from key file or environment variables
 */
export function getGoogleAuth(scopes: string[]) {
	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
	const resolvedPath = keyPath ? path.resolve(__dirname, '../../', keyPath) : null

	// Option 1: Key file exists (local development)
	if (resolvedPath && fs.existsSync(resolvedPath)) {
		return new google.auth.GoogleAuth({
			keyFile: resolvedPath,
			scopes,
		})
	}

	// Option 2: Environment variables (Railway production)
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
	const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

	if (email && privateKey) {
		return new google.auth.GoogleAuth({
			credentials: {
				client_email: email,
				private_key: privateKey.replace(/\\n/g, '\n'),
			},
			scopes,
		})
	}

	throw new Error(
		'Google Service Account credentials not found. ' +
		'Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'
	)
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
