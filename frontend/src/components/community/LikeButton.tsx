import React, { useState, useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'

interface LikeButtonProps {
	targetType: 'review' | 'damage_case' | 'comment'
	targetId: string
	initialLikeCount?: number
	size?: 'sm' | 'md' | 'lg'
	showCount?: boolean
}

const LikeButton: React.FC<LikeButtonProps> = ({
	targetType,
	targetId,
	initialLikeCount = 0,
	size = 'md',
	showCount = true
}) => {
	const [liked, setLiked] = useState(false)
	const [likeCount, setLikeCount] = useState(initialLikeCount)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		checkIfLiked()
	}, [targetId])

	const checkIfLiked = async () => {
		try {
			const token = localStorage.getItem('auth_token')
			if (!token) return

			const response = await fetch(
				`http://localhost:3001/api/community/likes/${targetType}/${targetId}/check`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			)

			if (response.ok) {
				const data = await response.json()
				setLiked(data.liked)
			}
		} catch (error) {
			console.error('Check like error:', error)
		}
	}

	const handleLike = async (e: React.MouseEvent) => {
		e.stopPropagation() // 부모 요소 클릭 이벤트 방지

		const token = localStorage.getItem('auth_token')
		if (!token) {
			alert('로그인이 필요합니다.')
			return
		}

		if (loading) return

		try {
			setLoading(true)

			const response = await fetch('http://localhost:3001/api/community/likes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					target_type: targetType,
					target_id: targetId
				})
			})

			if (!response.ok) {
				throw new Error('좋아요 처리에 실패했습니다.')
			}

			const data = await response.json()

			// Toggle liked state
			const newLikedState = data.liked
			setLiked(newLikedState)

			// Update like count
			setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1))
		} catch (error) {
			console.error('Like error:', error)
			alert('좋아요 처리 중 오류가 발생했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const sizeClasses = {
		sm: 'p-1.5',
		md: 'p-2',
		lg: 'p-3'
	}

	const iconSizes = {
		sm: 14,
		md: 18,
		lg: 22
	}

	const textSizes = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	}

	return (
		<button
			onClick={handleLike}
			disabled={loading}
			className={`flex items-center gap-2 ${sizeClasses[size]} rounded-lg transition-all ${
				liked
					? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
			} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
			title={liked ? '좋아요 취소' : '좋아요'}
		>
			<ThumbsUp
				size={iconSizes[size]}
				className={liked ? 'fill-current' : ''}
			/>
			{showCount && (
				<span className={`${textSizes[size]} font-medium`}>
					{likeCount}
				</span>
			)}
		</button>
	)
}

export default LikeButton
