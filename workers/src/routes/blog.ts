/**
 * Public Blog Routes
 * GET /api/blog/posts - List published posts
 * GET /api/blog/posts/:slug - Get single post by slug
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { listPublishedPosts, getPostBySlug } from '../services/airtable-blog'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * GET /posts
 * List all published blog posts
 */
app.get('/posts', async (c) => {
	try {
		const posts = await listPublishedPosts(c.env)

		// Map thumbnail_key to full image URL
		const apiBase = new URL(c.req.url).origin
		const mapped = posts.map((post) => ({
			...post,
			thumbnail_url: post.thumbnail_key
				? `${apiBase}/images/${post.thumbnail_key}`
				: null,
			tags_array: post.tags ? post.tags.split(',').map((t) => t.trim()) : [],
		}))

		return c.json({ posts: mapped, total: mapped.length })
	} catch (error) {
		console.error('Blog list error:', error)
		return c.json({ error: 'Failed to fetch blog posts' }, 500)
	}
})

/**
 * GET /posts/:slug
 * Get a single published blog post by slug
 */
app.get('/posts/:slug', async (c) => {
	try {
		const slug = c.req.param('slug')
		const post = await getPostBySlug(c.env, slug)

		if (!post) {
			return c.json({ error: 'Post not found' }, 404)
		}

		const apiBase = new URL(c.req.url).origin
		return c.json({
			...post,
			thumbnail_url: post.thumbnail_key
				? `${apiBase}/images/${post.thumbnail_key}`
				: null,
			tags_array: post.tags ? post.tags.split(',').map((t) => t.trim()) : [],
		})
	} catch (error) {
		console.error('Blog post error:', error)
		return c.json({ error: 'Failed to fetch blog post' }, 500)
	}
})

export default app
