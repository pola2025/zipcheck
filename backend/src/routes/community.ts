import { Router } from 'express'
import { supabase } from '../lib/supabase'
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth'

const router = Router()

// ============================================
// Comments Endpoints
// ============================================

/**
 * GET /api/community/comments/:targetType/:targetId
 * Get all comments for a specific target
 */
router.get('/comments/:targetType/:targetId', optionalAuthenticateToken, async (req, res) => {
	try {
		const { targetType, targetId } = req.params

		if (!['review', 'damage_case'].includes(targetType)) {
			return res.status(400).json({ error: '유효하지 않은 대상 타입입니다.' })
		}

		console.log(`🔍 Fetching comments for ${targetType}/${targetId}`)

		const { data, error } = await supabase
			.from('comments')
			.select('*')
			.eq('target_type', targetType)
			.eq('target_id', targetId)
			.eq('is_deleted', false)
			.order('created_at', { ascending: true })

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		// Organize comments with replies
		const commentsMap = new Map()
		const rootComments: any[] = []

		data.forEach((comment) => {
			commentsMap.set(comment.id, { ...comment, replies: [] })
		})

		data.forEach((comment) => {
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

		console.log(`✅ Found ${rootComments.length} root comments`)

		res.json(rootComments)
	} catch (error) {
		console.error('Get comments error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * POST /api/community/comments
 * Create a new comment
 */
router.post('/comments', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		const { target_type, target_id, content, parent_comment_id } = req.body

		if (!target_type || !target_id || !content) {
			return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
		}

		if (!['review', 'damage_case'].includes(target_type)) {
			return res.status(400).json({ error: '유효하지 않은 대상 타입입니다.' })
		}

		// Get user info
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('name, email')
			.eq('id', userId)
			.single()

		if (userError || !userData) {
			return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
		}

		console.log(`💬 Creating comment on ${target_type}/${target_id} by ${userData.name}`)

		const { data, error } = await supabase
			.from('comments')
			.insert({
				user_id: userId,
				author_name: userData.name,
				author_email: userData.email,
				target_type,
				target_id,
				content,
				parent_comment_id: parent_comment_id || null,
				status: 'published'
			})
			.select()
			.single()

		if (error) {
			console.error('Database insert error:', error)
			throw error
		}

		console.log(`✅ Comment created: ${data.id}`)

		res.json({
			success: true,
			message: '댓글이 등록되었습니다.',
			data
		})
	} catch (error) {
		console.error('Create comment error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * PATCH /api/community/comments/:id
 * Update a comment (only by author)
 */
router.patch('/comments/:id', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { id } = req.params
		const { content } = req.body

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		if (!content) {
			return res.status(400).json({ error: '내용을 입력하세요.' })
		}

		console.log(`📝 Updating comment ${id} by user ${userId}`)

		const { data, error } = await supabase
			.from('comments')
			.update({ content, updated_at: new Date().toISOString() })
			.eq('id', id)
			.eq('user_id', userId)
			.select()
			.single()

		if (error || !data) {
			return res.status(404).json({ error: '댓글을 찾을 수 없거나 수정 권한이 없습니다.' })
		}

		console.log(`✅ Comment updated: ${id}`)

		res.json({
			success: true,
			message: '댓글이 수정되었습니다.',
			data
		})
	} catch (error) {
		console.error('Update comment error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * DELETE /api/community/comments/:id
 * Delete a comment (only by author)
 */
router.delete('/comments/:id', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { id } = req.params

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		console.log(`🗑️  Deleting comment ${id} by user ${userId}`)

		// Soft delete
		const { data, error } = await supabase
			.from('comments')
			.update({ is_deleted: true, content: '삭제된 댓글입니다.' })
			.eq('id', id)
			.eq('user_id', userId)
			.select()
			.single()

		if (error || !data) {
			return res.status(404).json({ error: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' })
		}

		console.log(`✅ Comment deleted: ${id}`)

		res.json({
			success: true,
			message: '댓글이 삭제되었습니다.'
		})
	} catch (error) {
		console.error('Delete comment error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

// ============================================
// Likes Endpoints
// ============================================

/**
 * POST /api/community/likes
 * Toggle like on a target (review, damage_case, comment)
 */
router.post('/likes', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		const { target_type, target_id } = req.body

		if (!target_type || !target_id) {
			return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
		}

		if (!['review', 'damage_case', 'comment'].includes(target_type)) {
			return res.status(400).json({ error: '유효하지 않은 대상 타입입니다.' })
		}

		console.log(`👍 Toggling like on ${target_type}/${target_id} by user ${userId}`)

		// Check if already liked
		const { data: existingLike, error: checkError } = await supabase
			.from('likes')
			.select('*')
			.eq('user_id', userId)
			.eq('target_type', target_type)
			.eq('target_id', target_id)
			.single()

		if (existingLike) {
			// Unlike - remove the like
			const { error: deleteError } = await supabase
				.from('likes')
				.delete()
				.eq('user_id', userId)
				.eq('target_type', target_type)
				.eq('target_id', target_id)

			if (deleteError) {
				console.error('Delete like error:', deleteError)
				throw deleteError
			}

			console.log(`✅ Like removed from ${target_type}/${target_id}`)

			res.json({
				success: true,
				message: '좋아요가 취소되었습니다.',
				liked: false
			})
		} else {
			// Like - add new like
			const { data, error } = await supabase
				.from('likes')
				.insert({
					user_id: userId,
					target_type,
					target_id
				})
				.select()
				.single()

			if (error) {
				console.error('Insert like error:', error)
				throw error
			}

			console.log(`✅ Like added to ${target_type}/${target_id}`)

			res.json({
				success: true,
				message: '좋아요를 눌렀습니다.',
				liked: true,
				data
			})
		}
	} catch (error) {
		console.error('Toggle like error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/community/likes/:targetType/:targetId/count
 * Get like count for a target
 */
router.get('/likes/:targetType/:targetId/count', async (req, res) => {
	try {
		const { targetType, targetId } = req.params

		const { count, error } = await supabase
			.from('likes')
			.select('*', { count: 'exact', head: true })
			.eq('target_type', targetType)
			.eq('target_id', targetId)

		if (error) {
			console.error('Count likes error:', error)
			throw error
		}

		res.json({ count: count || 0 })
	} catch (error) {
		console.error('Get like count error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/community/likes/:targetType/:targetId/check
 * Check if current user liked a target
 */
router.get('/likes/:targetType/:targetId/check', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId
		const { targetType, targetId } = req.params

		if (!userId) {
			return res.json({ liked: false })
		}

		const { data, error } = await supabase
			.from('likes')
			.select('*')
			.eq('user_id', userId)
			.eq('target_type', targetType)
			.eq('target_id', targetId)
			.single()

		res.json({ liked: !!data })
	} catch (error) {
		res.json({ liked: false })
	}
})

// ============================================
// Reports Endpoints
// ============================================

/**
 * POST /api/community/reports
 * Create a report
 */
router.post('/reports', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		const { target_type, target_id, reason, description } = req.body

		if (!target_type || !target_id || !reason) {
			return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
		}

		if (!['review', 'damage_case', 'comment'].includes(target_type)) {
			return res.status(400).json({ error: '유효하지 않은 대상 타입입니다.' })
		}

		// Get user email
		const { data: userData } = await supabase
			.from('users')
			.select('email')
			.eq('id', userId)
			.single()

		console.log(`🚨 Creating report for ${target_type}/${target_id} by user ${userId}`)

		const { data, error } = await supabase
			.from('reports')
			.insert({
				reporter_user_id: userId,
				reporter_email: userData?.email,
				target_type,
				target_id,
				reason,
				description,
				status: 'pending'
			})
			.select()
			.single()

		if (error) {
			console.error('Insert report error:', error)
			throw error
		}

		console.log(`✅ Report created: ${data.id}`)

		res.json({
			success: true,
			message: '신고가 접수되었습니다. 관리자가 확인 후 조치하겠습니다.',
			data
		})
	} catch (error) {
		console.error('Create report error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

/**
 * GET /api/community/reports/my/list
 * Get current user's reports
 */
router.get('/reports/my/list', authenticateToken, async (req, res) => {
	try {
		const userId = (req as any).user?.userId

		if (!userId) {
			return res.status(401).json({ error: '인증이 필요합니다.' })
		}

		const { data, error } = await supabase
			.from('reports')
			.select('*')
			.eq('reporter_user_id', userId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Database query error:', error)
			throw error
		}

		res.json(data)
	} catch (error) {
		console.error('Get my reports error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		res.status(500).json({ error: message })
	}
})

export default router
