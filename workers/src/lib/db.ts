import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let sql: NeonQueryFunction<false, false> | null = null

function getSQL(databaseUrl: string): NeonQueryFunction<false, false> {
	if (!sql) {
		sql = neon(databaseUrl)
	}
	return sql
}

export function query(databaseUrl: string, text: string, params: unknown[] = []) {
	const sql = getSQL(databaseUrl)
	return sql(text, params)
}

export async function findOne<T = Record<string, unknown>>(
	databaseUrl: string,
	text: string,
	params: unknown[] = []
): Promise<T | null> {
	const rows = await query(databaseUrl, text, params)
	return (rows[0] as T) || null
}

export async function findMany<T = Record<string, unknown>>(
	databaseUrl: string,
	text: string,
	params: unknown[] = []
): Promise<T[]> {
	const rows = await query(databaseUrl, text, params)
	return rows as T[]
}

export async function insertOne<T = Record<string, unknown>>(
	databaseUrl: string,
	table: string,
	data: Record<string, unknown>
): Promise<T> {
	const keys = Object.keys(data)
	const values = Object.values(data)
	const placeholders = keys.map((_, i) => `$${i + 1}`)

	const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
	const rows = await query(databaseUrl, text, values)
	return rows[0] as T
}

export async function updateOne<T = Record<string, unknown>>(
	databaseUrl: string,
	table: string,
	id: string | number,
	data: Record<string, unknown>,
	idColumn = 'id'
): Promise<T | null> {
	const keys = Object.keys(data)
	const values = Object.values(data)
	const setClauses = keys.map((key, i) => `${key} = $${i + 1}`)

	const text = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${idColumn} = $${keys.length + 1} RETURNING *`
	const rows = await query(databaseUrl, text, [...values, id])
	return (rows[0] as T) || null
}

export async function deleteOne(
	databaseUrl: string,
	table: string,
	id: string | number,
	idColumn = 'id'
): Promise<boolean> {
	const rows = await query(databaseUrl, `DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING id`, [id])
	return rows.length > 0
}

export async function transaction(
	databaseUrl: string,
	fn: (sql: NeonQueryFunction<false, false>) => Promise<void>
): Promise<void> {
	const sql = getSQL(databaseUrl)
	await sql('BEGIN')
	try {
		await fn(sql)
		await sql('COMMIT')
	} catch (err) {
		await sql('ROLLBACK')
		throw err
	}
}
