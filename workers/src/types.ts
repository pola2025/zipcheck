export interface Env {
	// KV / R2 bindings
	KV: KVNamespace
	R2: R2Bucket

	// Non-sensitive (wrangler.toml [vars])
	GA4_PROPERTY_ID: string
	SEARCH_CONSOLE_SITE_URL: string
	FRONTEND_URL: string
	GMAIL_SENDER_EMAIL: string

	// Secrets (wrangler secret put)
	DATABASE_URL: string
	JWT_SECRET: string
	ADMIN_PASSWORD: string
	GOOGLE_SERVICE_ACCOUNT_EMAIL: string
	GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: string
	NAVER_CLIENT_ID: string
	NAVER_CLIENT_SECRET: string
	AIRTABLE_API_KEY: string
	AIRTABLE_BASE_ID: string
	NOTION_API_KEY: string
	SLACK_DEV_WEBHOOK_URL: string
	SLACK_ADMIN_WEBHOOK_URL: string
	GMAIL_CLIENT_ID: string
	GMAIL_CLIENT_SECRET: string
	GMAIL_REFRESH_TOKEN: string
	GOOGLE_OAUTH_CLIENT_ID: string
	GOOGLE_OAUTH_CLIENT_SECRET: string
	TELEGRAM_BOT_TOKEN: string
	TELEGRAM_CHAT_ID: string
	ADMIN_TOTP_SECRET?: string
}

export interface JWTPayload {
	role: 'admin' | 'user'
	userId?: string
	email?: string
	name?: string
	iat: number
	exp: number
}

export interface AnalysisJob {
	jobId: string
	quoteRequestId: string
	type: 'standard' | 'comprehensive'
}

// Hono context variables
export type Variables = {
	user: JWTPayload
}
