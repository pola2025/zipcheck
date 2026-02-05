/**
 * Admin Blog Routes
 * POST   /posts          - Create post
 * GET    /posts          - List all posts (including drafts)
 * GET    /posts/:id      - Get post by Airtable record ID
 * PUT    /posts/:id      - Update post
 * DELETE /posts/:id      - Delete post
 * POST   /posts/seed     - Seed initial static data
 * POST   /images/upload  - Upload image to R2
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import {
	listAllPosts,
	getPostById,
	createPost,
	updatePost,
	deletePost,
	seedFromStaticData,
} from '../../services/airtable-blog'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// All admin blog routes require admin auth
app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /posts - List all posts (including drafts)
 */
app.get('/posts', async (c) => {
	try {
		const posts = await listAllPosts(c.env)
		const apiBase = new URL(c.req.url).origin
		const mapped = posts.map((post) => ({
			...post,
			thumbnail_url: post.thumbnail_key
				? `${apiBase}/images/${post.thumbnail_key}`
				: null,
		}))
		return c.json({ posts: mapped, total: mapped.length })
	} catch (error) {
		console.error('Admin blog list error:', error)
		return c.json({ error: 'Failed to fetch posts' }, 500)
	}
})

/**
 * GET /posts/:id - Get post by Airtable record ID
 */
app.get('/posts/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const post = await getPostById(c.env, id)
		if (!post) return c.json({ error: 'Post not found' }, 404)

		const apiBase = new URL(c.req.url).origin
		return c.json({
			...post,
			thumbnail_url: post.thumbnail_key
				? `${apiBase}/images/${post.thumbnail_key}`
				: null,
		})
	} catch (error) {
		console.error('Admin blog get error:', error)
		return c.json({ error: 'Failed to fetch post' }, 500)
	}
})

/**
 * POST /posts - Create a new post
 */
app.post('/posts', async (c) => {
	try {
		const body = await c.req.json()
		const { title, slug, category, excerpt, content, read_time, author, thumbnail_key, tags, status, published_date, chart_data } = body

		if (!title || !slug || !category || !content) {
			return c.json({ error: 'title, slug, category, content are required' }, 400)
		}

		const post = await createPost(c.env, {
			title,
			slug,
			category,
			excerpt: excerpt || '',
			content,
			read_time: read_time || '3분',
			author: author || '집첵 에디터',
			thumbnail_key: thumbnail_key || '',
			tags: tags || '',
			status: status || 'draft',
			published_date: published_date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
			chart_data: chart_data || '',
		})

		return c.json(post, 201)
	} catch (error) {
		console.error('Admin blog create error:', error)
		return c.json({ error: 'Failed to create post' }, 500)
	}
})

/**
 * PUT /posts/:id - Update a post
 */
app.put('/posts/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json()

		const post = await updatePost(c.env, id, body)
		return c.json(post)
	} catch (error) {
		console.error('Admin blog update error:', error)
		return c.json({ error: 'Failed to update post' }, 500)
	}
})

/**
 * DELETE /posts/:id - Delete a post
 */
app.delete('/posts/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const success = await deletePost(c.env, id)

		if (!success) return c.json({ error: 'Failed to delete' }, 500)
		return c.json({ success: true })
	} catch (error) {
		console.error('Admin blog delete error:', error)
		return c.json({ error: 'Failed to delete post' }, 500)
	}
})

/**
 * POST /images/upload - Upload blog image to R2
 * Expects multipart form with 'file' field
 */
app.post('/images/upload', async (c) => {
	try {
		const formData = await c.req.formData()
		const file = formData.get('file')

		if (!file || typeof file === 'string') {
			return c.json({ error: 'File is required' }, 400)
		}

		const blob = file as unknown as { type: string; size: number; name: string; arrayBuffer(): Promise<ArrayBuffer> }

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
		if (!allowedTypes.includes(blob.type)) {
			return c.json({ error: 'Allowed types: JPEG, PNG, WebP, GIF' }, 400)
		}

		// Max 5MB
		if (blob.size > 5 * 1024 * 1024) {
			return c.json({ error: 'File too large (max 5MB)' }, 400)
		}

		// Generate R2 key
		const ext = blob.name.split('.').pop() || 'webp'
		const key = `blog/${crypto.randomUUID()}.${ext}`

		await c.env.R2.put(key, await blob.arrayBuffer(), {
			httpMetadata: { contentType: blob.type },
		})

		const apiBase = new URL(c.req.url).origin
		return c.json({
			key,
			url: `${apiBase}/images/${key}`,
		})
	} catch (error) {
		console.error('Blog image upload error:', error)
		return c.json({ error: 'Failed to upload image' }, 500)
	}
})

/**
 * POST /posts/seed - Seed initial static data to Airtable
 */
app.post('/posts/seed', async (c) => {
	try {
		const body = await c.req.json()
		const { posts } = body

		if (!posts || !Array.isArray(posts)) {
			return c.json({ error: 'posts array is required' }, 400)
		}

		const count = await seedFromStaticData(c.env, posts)
		return c.json({ success: true, created: count })
	} catch (error) {
		console.error('Blog seed error:', error)
		return c.json({ error: 'Failed to seed posts' }, 500)
	}
})

export default app
