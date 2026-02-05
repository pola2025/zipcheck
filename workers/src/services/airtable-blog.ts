/**
 * Airtable Blog Service
 * CRUD operations for blog posts via Airtable REST API
 * Table: blog_posts
 */

import type { Env } from '../types'

const TABLE_NAME = 'blog_posts'

export interface AirtableBlogPost {
	id?: string // Airtable record ID
	title: string
	slug: string
	category: '정보 및 참고사항' | '피해예방'
	excerpt: string
	content: string // HTML
	read_time: string
	author: string
	thumbnail_key?: string // R2 key
	tags: string // comma-separated
	status: 'draft' | 'published'
	published_date: string // YYYY.MM.DD
	chart_data?: string // JSON string for embedded charts
}

interface AirtableRecord {
	id: string
	fields: Record<string, unknown>
	createdTime: string
}

interface AirtableResponse {
	records: AirtableRecord[]
	offset?: string
}

function airtableUrl(env: Env, recordId?: string): string {
	const base = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE_NAME}`
	return recordId ? `${base}/${recordId}` : base
}

function headers(env: Env): HeadersInit {
	return {
		Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
		'Content-Type': 'application/json',
	}
}

function recordToPost(record: AirtableRecord): AirtableBlogPost & { id: string } {
	const f = record.fields
	return {
		id: record.id,
		title: (f.title as string) || '',
		slug: (f.slug as string) || '',
		category: (f.category as AirtableBlogPost['category']) || '정보 및 참고사항',
		excerpt: (f.excerpt as string) || '',
		content: (f.content as string) || '',
		read_time: (f.read_time as string) || '3분',
		author: (f.author as string) || '집첵 에디터',
		thumbnail_key: (f.thumbnail_key as string) || undefined,
		tags: (f.tags as string) || '',
		status: (f.status as AirtableBlogPost['status']) || 'draft',
		published_date: (f.published_date as string) || '',
		chart_data: (f.chart_data as string) || undefined,
	}
}

/**
 * List published blog posts (public)
 */
export async function listPublishedPosts(env: Env): Promise<(AirtableBlogPost & { id: string })[]> {
	// Check KV cache first (5 min TTL)
	const cached = await env.KV.get('blog:published', 'json')
	if (cached) return cached as (AirtableBlogPost & { id: string })[]

	const filter = encodeURIComponent(`{status}='published'`)
	const sort = encodeURIComponent('published_date')
	const url = `${airtableUrl(env)}?filterByFormula=${filter}&sort[0][field]=${sort}&sort[0][direction]=desc`

	const res = await fetch(url, { headers: headers(env) })
	if (!res.ok) {
		console.error('Airtable list error:', await res.text())
		return []
	}

	const data = (await res.json()) as AirtableResponse
	const posts = data.records.map(recordToPost)

	// Cache for 5 minutes
	await env.KV.put('blog:published', JSON.stringify(posts), { expirationTtl: 300 })

	return posts
}

/**
 * List all blog posts (admin - includes drafts)
 */
export async function listAllPosts(env: Env): Promise<(AirtableBlogPost & { id: string })[]> {
	const sort = encodeURIComponent('published_date')
	const url = `${airtableUrl(env)}?sort[0][field]=${sort}&sort[0][direction]=desc`

	const res = await fetch(url, { headers: headers(env) })
	if (!res.ok) {
		console.error('Airtable list all error:', await res.text())
		return []
	}

	const data = (await res.json()) as AirtableResponse
	return data.records.map(recordToPost)
}

/**
 * Get a single post by slug (public - published only)
 */
export async function getPostBySlug(env: Env, slug: string): Promise<(AirtableBlogPost & { id: string }) | null> {
	// Check KV cache
	const cached = await env.KV.get(`blog:post:${slug}`, 'json')
	if (cached) return cached as (AirtableBlogPost & { id: string })

	const filter = encodeURIComponent(`AND({slug}='${slug}', {status}='published')`)
	const url = `${airtableUrl(env)}?filterByFormula=${filter}&maxRecords=1`

	const res = await fetch(url, { headers: headers(env) })
	if (!res.ok) return null

	const data = (await res.json()) as AirtableResponse
	if (data.records.length === 0) return null

	const post = recordToPost(data.records[0])

	// Cache for 5 minutes
	await env.KV.put(`blog:post:${slug}`, JSON.stringify(post), { expirationTtl: 300 })

	return post
}

/**
 * Get a single post by ID (admin - any status)
 */
export async function getPostById(env: Env, recordId: string): Promise<(AirtableBlogPost & { id: string }) | null> {
	const res = await fetch(airtableUrl(env, recordId), { headers: headers(env) })
	if (!res.ok) return null

	const record = (await res.json()) as AirtableRecord
	return recordToPost(record)
}

/**
 * Create a new blog post
 */
export async function createPost(env: Env, post: Omit<AirtableBlogPost, 'id'>): Promise<AirtableBlogPost & { id: string }> {
	const res = await fetch(airtableUrl(env), {
		method: 'POST',
		headers: headers(env),
		body: JSON.stringify({
			fields: {
				title: post.title,
				slug: post.slug,
				category: post.category,
				excerpt: post.excerpt,
				content: post.content,
				read_time: post.read_time,
				author: post.author,
				thumbnail_key: post.thumbnail_key || '',
				tags: post.tags,
				status: post.status,
				published_date: post.published_date,
				chart_data: post.chart_data || '',
			},
		}),
	})

	if (!res.ok) {
		const err = await res.text()
		throw new Error(`Airtable create error: ${err}`)
	}

	const record = (await res.json()) as AirtableRecord
	await invalidateCache(env)
	return recordToPost(record)
}

/**
 * Update an existing blog post
 */
export async function updatePost(env: Env, recordId: string, fields: Partial<AirtableBlogPost>): Promise<AirtableBlogPost & { id: string }> {
	// Remove id from fields if present
	const { id: _, ...updateFields } = fields as AirtableBlogPost & { id?: string }

	const res = await fetch(airtableUrl(env, recordId), {
		method: 'PATCH',
		headers: headers(env),
		body: JSON.stringify({ fields: updateFields }),
	})

	if (!res.ok) {
		const err = await res.text()
		throw new Error(`Airtable update error: ${err}`)
	}

	const record = (await res.json()) as AirtableRecord
	await invalidateCache(env)
	return recordToPost(record)
}

/**
 * Delete a blog post
 */
export async function deletePost(env: Env, recordId: string): Promise<boolean> {
	const res = await fetch(airtableUrl(env, recordId), {
		method: 'DELETE',
		headers: headers(env),
	})

	if (!res.ok) return false

	await invalidateCache(env)
	return true
}

/**
 * Invalidate blog cache
 */
async function invalidateCache(env: Env): Promise<void> {
	await env.KV.delete('blog:published')
	// Individual post caches will expire naturally (5 min TTL)
}

/**
 * Seed initial blog posts from static data
 */
export async function seedFromStaticData(env: Env, posts: Omit<AirtableBlogPost, 'id'>[]): Promise<number> {
	let created = 0
	for (const post of posts) {
		try {
			// Check if slug already exists
			const filter = encodeURIComponent(`{slug}='${post.slug}'`)
			const checkRes = await fetch(`${airtableUrl(env)}?filterByFormula=${filter}&maxRecords=1`, {
				headers: headers(env),
			})
			const checkData = (await checkRes.json()) as AirtableResponse

			if (checkData.records.length === 0) {
				await createPost(env, post)
				created++
			}
		} catch (err) {
			console.error(`Failed to seed post: ${post.slug}`, err)
		}
	}
	await invalidateCache(env)
	return created
}
