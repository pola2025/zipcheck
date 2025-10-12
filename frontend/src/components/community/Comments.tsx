import React, { useState, useEffect } from 'react'
import { MessageCircle, Edit, Trash2, Reply } from 'lucide-react'
import LikeButton from './LikeButton'

interface Comment {
	id: string
	user_id: string
	author_name: string
	content: string
	created_at: string
	updated_at: string
	like_count: number
	is_deleted: boolean
	parent_comment_id: string | null
	replies: Comment[]
}

interface CommentsProps {
	targetType: 'review' | 'damage_case'
	targetId: string
}

const Comments: React.FC<CommentsProps> = ({ targetType, targetId }) => {
	const [comments, setComments] = useState<Comment[]>([])
	const [loading, setLoading] = useState(true)
	const [newComment, setNewComment] = useState('')
	const [replyTo, setReplyTo] = useState<string | null>(null)
	const [replyContent, setReplyContent] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editContent, setEditContent] = useState('')

	const token = localStorage.getItem('auth_token')
	const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null

	useEffect(() => {
		loadComments()
	}, [targetId])

	const loadComments = async () => {
		try {
			setLoading(true)

			const response = await fetch(
				`http://localhost:3001/api/community/comments/${targetType}/${targetId}`
			)

			if (!response.ok) {
				throw new Error('댓글을 불러올 수 없습니다.')
			}

			const data = await response.json()
			setComments(data)
			setLoading(false)
		} catch (error) {
			console.error('Load comments error:', error)
			setLoading(false)
		}
	}

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!token) {
			alert('로그인이 필요합니다.')
			return
		}

		if (!newComment.trim()) {
			alert('댓글 내용을 입력하세요.')
			return
		}

		try {
			const response = await fetch('http://localhost:3001/api/community/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					target_type: targetType,
					target_id: targetId,
					content: newComment
				})
			})

			if (!response.ok) {
				throw new Error('댓글 작성에 실패했습니다.')
			}

			setNewComment('')
			loadComments()
		} catch (error) {
			console.error('Submit comment error:', error)
			alert('댓글 작성 중 오류가 발생했습니다.')
		}
	}

	const handleSubmitReply = async (parentId: string) => {
		if (!token) {
			alert('로그인이 필요합니다.')
			return
		}

		if (!replyContent.trim()) {
			alert('답글 내용을 입력하세요.')
			return
		}

		try {
			const response = await fetch('http://localhost:3001/api/community/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					target_type: targetType,
					target_id: targetId,
					content: replyContent,
					parent_comment_id: parentId
				})
			})

			if (!response.ok) {
				throw new Error('답글 작성에 실패했습니다.')
			}

			setReplyTo(null)
			setReplyContent('')
			loadComments()
		} catch (error) {
			console.error('Submit reply error:', error)
			alert('답글 작성 중 오류가 발생했습니다.')
		}
	}

	const handleEdit = async (commentId: string) => {
		if (!editContent.trim()) {
			alert('댓글 내용을 입력하세요.')
			return
		}

		try {
			const response = await fetch(`http://localhost:3001/api/community/comments/${commentId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ content: editContent })
			})

			if (!response.ok) {
				throw new Error('댓글 수정에 실패했습니다.')
			}

			setEditingId(null)
			setEditContent('')
			loadComments()
		} catch (error) {
			console.error('Edit comment error:', error)
			alert('댓글 수정 중 오류가 발생했습니다.')
		}
	}

	const handleDelete = async (commentId: string) => {
		if (!confirm('정말 삭제하시겠습니까?')) return

		try {
			const response = await fetch(`http://localhost:3001/api/community/comments/${commentId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			})

			if (!response.ok) {
				throw new Error('댓글 삭제에 실패했습니다.')
			}

			loadComments()
		} catch (error) {
			console.error('Delete comment error:', error)
			alert('댓글 삭제 중 오류가 발생했습니다.')
		}
	}

	const renderComment = (comment: Comment, isReply = false) => {
		const isEditing = editingId === comment.id
		const isReplying = replyTo === comment.id
		const isAuthor = currentUser && currentUser.id === comment.user_id

		return (
			<div
				key={comment.id}
				className={`${isReply ? 'ml-12 mt-3' : 'mt-4'} ${comment.is_deleted ? 'opacity-60' : ''}`}
			>
				<div className='bg-gray-50 rounded-lg p-4'>
					{/* Comment Header */}
					<div className='flex items-center justify-between mb-2'>
						<div className='flex items-center gap-2'>
							<span className='font-semibold text-gray-800'>{comment.author_name}</span>
							<span className='text-sm text-gray-500'>
								{new Date(comment.created_at).toLocaleString()}
							</span>
							{comment.updated_at !== comment.created_at && (
								<span className='text-xs text-gray-400'>(수정됨)</span>
							)}
						</div>

						{/* Action Buttons */}
						{!comment.is_deleted && isAuthor && (
							<div className='flex items-center gap-2'>
								<button
									onClick={() => {
										setEditingId(comment.id)
										setEditContent(comment.content)
									}}
									className='text-gray-600 hover:text-blue-600 transition-colors'
									title='수정'
								>
									<Edit size={16} />
								</button>
								<button
									onClick={() => handleDelete(comment.id)}
									className='text-gray-600 hover:text-red-600 transition-colors'
									title='삭제'
								>
									<Trash2 size={16} />
								</button>
							</div>
						)}
					</div>

					{/* Comment Content */}
					{isEditing ? (
						<div className='space-y-2'>
							<textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9DAA] focus:border-transparent resize-none'
								rows={3}
							/>
							<div className='flex gap-2'>
								<button
									onClick={() => handleEdit(comment.id)}
									className='px-4 py-2 bg-[#0A9DAA] text-white rounded-lg hover:bg-[#088997] transition-colors'
								>
									수정
								</button>
								<button
									onClick={() => {
										setEditingId(null)
										setEditContent('')
									}}
									className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
								>
									취소
								</button>
							</div>
						</div>
					) : (
						<p className='text-gray-700 whitespace-pre-wrap'>{comment.content}</p>
					)}

					{/* Comment Actions */}
					{!comment.is_deleted && !isEditing && (
						<div className='flex items-center gap-4 mt-3'>
							<LikeButton
								targetType='comment'
								targetId={comment.id}
								initialLikeCount={comment.like_count}
								size='sm'
							/>
							{!isReply && token && (
								<button
									onClick={() => setReplyTo(comment.id)}
									className='flex items-center gap-1 text-sm text-gray-600 hover:text-[#0A9DAA] transition-colors'
								>
									<Reply size={14} />
									<span>답글</span>
								</button>
							)}
						</div>
					)}
				</div>

				{/* Reply Form */}
				{isReplying && (
					<div className='ml-12 mt-3'>
						<textarea
							value={replyContent}
							onChange={(e) => setReplyContent(e.target.value)}
							placeholder='답글을 입력하세요...'
							className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9DAA] focus:border-transparent resize-none'
							rows={3}
						/>
						<div className='flex gap-2 mt-2'>
							<button
								onClick={() => handleSubmitReply(comment.id)}
								className='px-4 py-2 bg-[#0A9DAA] text-white rounded-lg hover:bg-[#088997] transition-colors'
							>
								답글 작성
							</button>
							<button
								onClick={() => {
									setReplyTo(null)
									setReplyContent('')
								}}
								className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
							>
								취소
							</button>
						</div>
					</div>
				)}

				{/* Replies */}
				{comment.replies && comment.replies.length > 0 && (
					<div>
						{comment.replies.map((reply) => renderComment(reply, true))}
					</div>
				)}
			</div>
		)
	}

	if (loading) {
		return (
			<div className='flex justify-center py-8'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A9DAA]'></div>
			</div>
		)
	}

	return (
		<div className='bg-white rounded-lg shadow-sm p-6'>
			{/* Header */}
			<div className='flex items-center gap-2 mb-6'>
				<MessageCircle size={24} className='text-[#0A9DAA]' />
				<h3 className='text-xl font-bold text-gray-800'>
					댓글 {comments.length}개
				</h3>
			</div>

			{/* New Comment Form */}
			{token ? (
				<form onSubmit={handleSubmitComment} className='mb-6'>
					<textarea
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder='댓글을 입력하세요...'
						className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9DAA] focus:border-transparent resize-none'
						rows={4}
					/>
					<div className='flex justify-end mt-2'>
						<button
							type='submit'
							className='px-6 py-2 bg-gradient-to-r from-[#0A9DAA] to-[#0D7C87] text-white rounded-lg hover:shadow-lg transition-all'
						>
							댓글 작성
						</button>
					</div>
				</form>
			) : (
				<div className='mb-6 p-4 bg-gray-100 rounded-lg text-center text-gray-600'>
					댓글을 작성하려면 로그인이 필요합니다.
				</div>
			)}

			{/* Comments List */}
			{comments.length === 0 ? (
				<div className='text-center py-8 text-gray-500'>
					아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
				</div>
			) : (
				<div className='space-y-2'>
					{comments.map((comment) => renderComment(comment))}
				</div>
			)}
		</div>
	)
}

export default Comments
