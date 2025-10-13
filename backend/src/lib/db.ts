/**
 * PostgreSQL Database Client (Neon DB)
 * Supabase 클라이언트를 대체하는 PostgreSQL 직접 연결
 */

import { Pool, QueryResult, QueryResultRow } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

if (!process.env.DATABASE_URL) {
	throw new Error('Missing DATABASE_URL environment variable')
}

// Create PostgreSQL connection pool
export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	},
	// Connection pool settings
	max: 20, // Maximum number of clients in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
})

// Test connection on startup
pool.on('connect', () => {
	console.log('✅ Connected to Neon DB (PostgreSQL)')
})

pool.on('error', (err) => {
	console.error('❌ Unexpected error on idle PostgreSQL client', err)
	process.exit(-1)
})

/**
 * Query helper function
 * Supabase `.from()` 스타일을 SQL 쿼리로 대체
 */
export const query = async <T extends QueryResultRow = any>(
	text: string,
	params?: any[]
): Promise<QueryResult<T>> => {
	const start = Date.now()
	try {
		const result = await pool.query<T>(text, params)
		const duration = Date.now() - start
		console.log('Executed query', { text, duration, rows: result.rowCount })
		return result
	} catch (error) {
		console.error('Query error:', { text, error })
		throw error
	}
}

/**
 * Transaction helper
 * 여러 쿼리를 트랜잭션으로 실행
 */
export const transaction = async <T>(
	callback: (client: any) => Promise<T>
): Promise<T> => {
	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		const result = await callback(client)
		await client.query('COMMIT')
		return result
	} catch (error) {
		await client.query('ROLLBACK')
		throw error
	} finally {
		client.release()
	}
}

// Export pool as db for convenience
export const db = pool

/**
 * Helper: Insert and return the inserted row
 */
export const insertOne = async <T extends QueryResultRow = any>(
	table: string,
	data: Record<string, any>
): Promise<T | null> => {
	const keys = Object.keys(data)
	const values = Object.values(data)
	const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
	const columns = keys.join(', ')

	const queryText = `
		INSERT INTO ${table} (${columns})
		VALUES (${placeholders})
		RETURNING *
	`

	const result = await query<T>(queryText, values)
	return result.rows[0] || null
}

/**
 * Helper: Update and return the updated row
 */
export const updateOne = async <T extends QueryResultRow = any>(
	table: string,
	id: string,
	data: Record<string, any>
): Promise<T | null> => {
	const keys = Object.keys(data)
	const values = Object.values(data)
	const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')

	const queryText = `
		UPDATE ${table}
		SET ${setClause}
		WHERE id = $${keys.length + 1}
		RETURNING *
	`

	const result = await query<T>(queryText, [...values, id])
	return result.rows[0] || null
}

/**
 * Helper: Delete and return the deleted row
 */
export const deleteOne = async <T extends QueryResultRow = any>(
	table: string,
	id: string
): Promise<T | null> => {
	const queryText = `
		DELETE FROM ${table}
		WHERE id = $1
		RETURNING *
	`

	const result = await query<T>(queryText, [id])
	return result.rows[0] || null
}

/**
 * Helper: Find one by condition
 */
export const findOne = async <T extends QueryResultRow = any>(
	table: string,
	condition: Record<string, any>
): Promise<T | null> => {
	const keys = Object.keys(condition)
	const values = Object.values(condition)
	const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')

	const queryText = `
		SELECT * FROM ${table}
		WHERE ${whereClause}
		LIMIT 1
	`

	const result = await query<T>(queryText, values)
	return result.rows[0] || null
}

/**
 * Helper: Find many by condition
 */
export const findMany = async <T extends QueryResultRow = any>(
	table: string,
	condition?: Record<string, any>,
	orderBy?: string,
	limit?: number
): Promise<T[]> => {
	let queryText = `SELECT * FROM ${table}`
	const values: any[] = []

	if (condition && Object.keys(condition).length > 0) {
		const keys = Object.keys(condition)
		const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')
		queryText += ` WHERE ${whereClause}`
		values.push(...Object.values(condition))
	}

	if (orderBy) {
		queryText += ` ORDER BY ${orderBy}`
	}

	if (limit) {
		queryText += ` LIMIT ${limit}`
	}

	const result = await query<T>(queryText, values)
	return result.rows
}

// Export all helpers
export default {
	pool,
	query,
	transaction,
	insertOne,
	updateOne,
	deleteOne,
	findOne,
	findMany,
}

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('\n🔌 Closing database connections...')
	await pool.end()
	console.log('✅ Database connections closed')
	process.exit(0)
})
