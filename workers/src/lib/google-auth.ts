// Google Service Account JWT (RS256) via crypto.subtle
// Adapted from pola_homepage onef/better worker patterns

function base64url(str: string): string {
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer)
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
	// Handle escaped newlines from Cloudflare secrets
	const cleaned = pem.replace(/\\n/g, '\n')
	const pemContents = cleaned
		.replace('-----BEGIN PRIVATE KEY-----', '')
		.replace('-----END PRIVATE KEY-----', '')
		.replace(/\s/g, '')

	const binaryString = atob(pemContents)
	const bytes = new Uint8Array(binaryString.length)
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}

	return await crypto.subtle.importKey(
		'pkcs8',
		bytes.buffer,
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign']
	)
}

async function createServiceAccountJWT(
	email: string,
	privateKey: string,
	scope: string
): Promise<string> {
	const header = { alg: 'RS256', typ: 'JWT' }
	const now = Math.floor(Date.now() / 1000)
	const payload = {
		iss: email,
		sub: email,
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600,
		scope,
	}

	const headerB64 = base64url(JSON.stringify(header))
	const payloadB64 = base64url(JSON.stringify(payload))
	const unsigned = `${headerB64}.${payloadB64}`

	const key = await importPrivateKey(privateKey)
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		key,
		new TextEncoder().encode(unsigned)
	)

	return `${unsigned}.${arrayBufferToBase64url(signature)}`
}

// Token cache: scope -> { token, expiresAt }
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

export async function getGoogleAccessToken(
	email: string,
	privateKey: string,
	scope: string
): Promise<string> {
	// Check cache (with 5 min buffer)
	const cached = tokenCache.get(scope)
	if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
		return cached.token
	}

	const jwt = await createServiceAccountJWT(email, privateKey, scope)

	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
	})

	const data = await response.json() as { access_token?: string; expires_in?: number; error?: string }
	if (!response.ok || !data.access_token) {
		throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`)
	}

	// Cache the token
	tokenCache.set(scope, {
		token: data.access_token,
		expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
	})

	return data.access_token
}

// Convenience scopes
export const SCOPES = {
	GA4_READONLY: 'https://www.googleapis.com/auth/analytics.readonly',
	SEARCH_CONSOLE: 'https://www.googleapis.com/auth/webmasters.readonly',
	GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
	INDEXING: 'https://www.googleapis.com/auth/indexing',
} as const
