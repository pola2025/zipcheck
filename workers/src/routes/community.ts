import { Hono } from 'hono'
import type { Env, Variables } from '../types'
import { query, findOne, findMany, insertOne } from '../lib/db'
import { authenticateToken, optionalAuth } from '../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================
// Comments Endpoints
// ============================================

/**
 * GET /comments/:targetType/:targetId
 * Get all comments for a specific target
 */
app.get('/comments/:targetType/:targetId', optionalAuth(), async (c) => {
	try {
		const targetType = c.req.param('targetType')
		const targetId = c.req.param('targetId')

		if (!['review', 'damage_case'].includes(targetType)) {
			return c.json({ error: '유효하지 않은 대상 타입입니다.' }, 400)
		}

		console.log(`Fetching comments for ${targetType}/${targetId}`)

		const rows = await findMany<any>(
			c.env.DATABASE_URL,
			`SELECT * FROM comments
			WHERE target_type = $1 AND target_id = $2 AND is_deleted = false
			ORDER BY created_at ASC`,
			[targetType, targetId]
		)

		// Organize comments with replies
		const commentsMap = new Map<string, any>()
		const rootComments: any[] = []

		rows.forEach((comment: any) => {
			commentsMap.set(comment.id, { ...comment, replies: [] })
		})

		rows.forEach((comment: any) => {
			const commentWithReplies = commentsMap.get(comment.id)
			if (comment.parent_comment_id) {
				const parent = commentsMap.get(comment.parent_comment_id)
				if (parent) {
					parent.replies.push(commentWithReplies)
				}
			} else {
				rootComments.push(commentWithReplies)
			}
		})

		console.log(`Found ${rootComments.length} root comments`)

		return c.json(rootComments)
	} catch (error) {
		console.error('Get comments error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * POST /comments
 * Create a new comment
 */
app.post('/comments', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		const { target_type, target_id, content, parent_comment_id } = await c.req.json()

		if (!target_type || !target_id || !content) {
			return c.json({ error: '필수 정보가 누락되었습니다.' }, 400)
		}

		if (!['review', 'damage_case'].includes(target_type)) {
			return c.json({ error: '유효하지 않은 대상 타입입니다.' }, 400)
		}

		// Get user info
		const userData = await findOne<{ name: string; email: string }>(
			c.env.DATABASE_URL,
			'SELECT name, email FROM users WHERE id = $1',
			[userId]
		)

		if (!userData) {
			return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)
		}

		console.log(`Creating comment on ${target_type}/${target_id} by ${userData.name}`)

		const data = await insertOne<any>(c.env.DATABASE_URL, 'comments', {
			user_id: userId,
			author_name: userData.name,
			author_email: userData.email,
			target_type,
			target_id,
			content,
			parent_comment_id: parent_comment_id || null,
			status: 'published'
		})

		console.log(`Comment created: ${data.id}`)

		return c.json({
			success: true,
			message: '댓글이 등록되었습니다.',
			data
		})
	} catch (error) {
		console.error('Create comment error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * PATCH /comments/:id
 * Update a comment (only by author)
 */
app.patch('/comments/:id', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const id = c.req.param('id')
		const { content } = await c.req.json()

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		if (!content) {
			return c.json({ error: '내용을 입력하세요.' }, 400)
		}

		console.log(`Updating comment ${id} by user ${userId}`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE comments SET content = $1, updated_at = $2
			WHERE id = $3 AND user_id = $4
			RETURNING *`,
			[content, new Date().toISOString(), id, userId]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '댓글을 찾을 수 없거나 수정 권한이 없습니다.' }, 404)
		}

		console.log(`Comment updated: ${id}`)

		return c.json({
			success: true,
			message: '댓글이 수정되었습니다.',
			data: rows[0]
		})
	} catch (error) {
		console.error('Update comment error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * DELETE /comments/:id
 * Delete a comment (only by author)
 */
app.delete('/comments/:id', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const id = c.req.param('id')

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		console.log(`Deleting comment ${id} by user ${userId}`)

		// Soft delete
		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE comments SET is_deleted = true, content = '삭제된 댓글입니다.'
			WHERE id = $1 AND user_id = $2
			RETURNING *`,
			[id, userId]
		)

		if (!rows || rows.length === 0) {
			return c.json({ error: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' }, 404)
		}

		console.log(`Comment deleted: ${id}`)

		return c.json({
			success: true,
			message: '댓글이 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete comment error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

// ============================================
// Likes Endpoints
// ============================================

/**
 * POST /likes
 * Toggle like on a target (review, damage_case, comment)
 */
app.post('/likes', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		const { target_type, target_id } = await c.req.json()

		if (!target_type || !target_id) {
			return c.json({ error: '필수 정보가 누락되었습니다.' }, 400)
		}

		if (!['review', 'damage_case', 'comment'].includes(target_type)) {
			return c.json({ error: '유효하지 않은 대상 타입입니다.' }, 400)
		}

		console.log(`Toggling like on ${target_type}/${target_id} by user ${userId}`)

		// Check if already liked
		const existingLike = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
			[userId, target_type, target_id]
		)

		if (existingLike) {
			// Unlike - remove the like
			await query(
				c.env.DATABASE_URL,
				'DELETE FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
				[userId, target_type, target_id]
			)

			console.log(`Like removed from ${target_type}/${target_id}`)

			return c.json({
				success: true,
				message: '좋아요가 취소되었습니다.',
				liked: false
			})
		} else {
			// Like - add new like
			const data = await insertOne<any>(c.env.DATABASE_URL, 'likes', {
				user_id: userId,
				target_type,
				target_id
			})

			console.log(`Like added to ${target_type}/${target_id}`)

			return c.json({
				success: true,
				message: '좋아요를 눌렀습니다.',
				liked: true,
				data
			})
		}
	} catch (error) {
		console.error('Toggle like error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /likes/:targetType/:targetId/count
 * Get like count for a target
 */
app.get('/likes/:targetType/:targetId/count', async (c) => {
	try {
		const targetType = c.req.param('targetType')
		const targetId = c.req.param('targetId')

		const rows = await query(
			c.env.DATABASE_URL,
			'SELECT COUNT(*) as count FROM likes WHERE target_type = $1 AND target_id = $2',
			[targetType, targetId]
		)

		const count = rows[0] ? parseInt((rows[0] as any).count) : 0

		return c.json({ count })
	} catch (error) {
		console.error('Get like count error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /likes/:targetType/:targetId/check
 * Check if current user liked a target
 */
app.get('/likes/:targetType/:targetId/check', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId
		const targetType = c.req.param('targetType')
		const targetId = c.req.param('targetId')

		if (!userId) {
			return c.json({ liked: false })
		}

		const data = await findOne<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
			[userId, targetType, targetId]
		)

		return c.json({ liked: !!data })
	} catch (error) {
		return c.json({ liked: false })
	}
})

// ============================================
// Reports Endpoints
// ============================================

/**
 * POST /reports
 * Create a report
 */
app.post('/reports', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		const { target_type, target_id, reason, description } = await c.req.json()

		if (!target_type || !target_id || !reason) {
			return c.json({ error: '필수 정보가 누락되었습니다.' }, 400)
		}

		if (!['review', 'damage_case', 'comment'].includes(target_type)) {
			return c.json({ error: '유효하지 않은 대상 타입입니다.' }, 400)
		}

		// Get user email
		const userData = await findOne<{ email: string }>(
			c.env.DATABASE_URL,
			'SELECT email FROM users WHERE id = $1',
			[userId]
		)

		console.log(`Creating report for ${target_type}/${target_id} by user ${userId}`)

		const data = await insertOne<any>(c.env.DATABASE_URL, 'reports', {
			reporter_user_id: userId,
			reporter_email: userData?.email || null,
			target_type,
			target_id,
			reason,
			description: description || null,
			status: 'pending'
		})

		console.log(`Report created: ${data.id}`)

		return c.json({
			success: true,
			message: '신고가 접수되었습니다. 관리자가 확인 후 조치하겠습니다.',
			data
		})
	} catch (error) {
		console.error('Create report error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

/**
 * GET /reports/my/list
 * Get current user's reports
 */
app.get('/reports/my/list', authenticateToken(), async (c) => {
	try {
		const user = c.get('user')
		const userId = user?.userId

		if (!userId) {
			return c.json({ error: '인증이 필요합니다.' }, 401)
		}

		const data = await findMany<any>(
			c.env.DATABASE_URL,
			'SELECT * FROM reports WHERE reporter_user_id = $1 ORDER BY created_at DESC',
			[userId]
		)

		return c.json(data)
	} catch (error) {
		console.error('Get my reports error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: message }, 500)
	}
})

export default app
