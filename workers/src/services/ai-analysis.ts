import type { Env } from '../types'
import { query } from '../lib/db'

// Save analysis job to DB as pending (manual analysis via Claude + Dash)
export async function enqueueAnalysis(
	env: Env,
	quoteRequestId: string,
	type: 'standard' | 'comprehensive' = 'standard'
): Promise<string> {
	const jobId = crypto.randomUUID()

	await query(env.DATABASE_URL, `
		INSERT INTO analysis_jobs (id, quote_request_id, type, status, created_at)
		VALUES ($1, $2, $3, 'pending', NOW())
	`, [jobId, quoteRequestId, type])

	return jobId
}
