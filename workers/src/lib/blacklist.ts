import { findOne } from './db'

/**
 * Check if an IP address is blacklisted
 */
export async function isBlacklisted(databaseUrl: string, ipAddress: string): Promise<boolean> {
	if (!ipAddress || ipAddress === 'unknown') return false

	try {
		const row = await findOne(
			databaseUrl,
			`SELECT id FROM blacklists WHERE ip_address = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
			[ipAddress]
		)

		return !!row
	} catch {
		// If table doesn't exist yet, don't block
		return false
	}
}
