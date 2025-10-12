import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface ReportModalProps {
	isOpen: boolean
	onClose: () => void
	targetType: 'review' | 'damage_case' | 'comment'
	targetId: string
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetType, targetId }) => {
	const [reason, setReason] = useState('')
	const [details, setDetails] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const reportReasons = [
		'스팸/광고',
		'욕설/비방',
		'허위 정보',
		'개인정보 노출',
		'저작권 침해',
		'기타'
	]

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!reason) {
			alert('신고 사유를 선택해주세요.')
			return
		}

		const token = localStorage.getItem('auth_token')
		if (!token) {
			alert('로그인이 필요합니다.')
			return
		}

		try {
			setSubmitting(true)

			const response = await fetch('http://localhost:3001/api/community/reports', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					target_type: targetType,
					target_id: targetId,
					reason,
					details
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || '신고 접수에 실패했습니다.')
			}

			alert('신고가 접수되었습니다. 관리자가 검토 후 조치하겠습니다.')
			handleClose()
		} catch (error) {
			console.error('Report error:', error)
			alert(error instanceof Error ? error.message : '신고 중 오류가 발생했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	const handleClose = () => {
		setReason('')
		setDetails('')
		onClose()
	}

	if (!isOpen) return null

	return (
		<>
			{/* Backdrop */}
			<div
				className='fixed inset-0 bg-black bg-opacity-50 z-40'
				onClick={handleClose}
			></div>

			{/* Modal */}
			<div className='fixed inset-0 flex items-center justify-center z-50 p-4'>
				<div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
					{/* Header */}
					<div className='flex items-center justify-between p-6 border-b border-gray-200'>
						<div className='flex items-center gap-2'>
							<AlertTriangle className='text-red-500' size={24} />
							<h2 className='text-xl font-bold text-gray-800'>게시물 신고</h2>
						</div>
						<button
							onClick={handleClose}
							className='text-gray-400 hover:text-gray-600 transition-colors'
							disabled={submitting}
						>
							<X size={24} />
						</button>
					</div>

					{/* Content */}
					<form onSubmit={handleSubmit} className='p-6'>
						{/* Warning Message */}
						<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
							<p className='text-sm text-yellow-800'>
								허위 신고 시 이용에 제한이 있을 수 있습니다. 신중하게 신고해주세요.
							</p>
						</div>

						{/* Reason Selection */}
						<div className='mb-6'>
							<label className='block text-sm font-medium text-gray-700 mb-3'>
								신고 사유 <span className='text-red-500'>*</span>
							</label>
							<div className='space-y-2'>
								{reportReasons.map((reportReason) => (
									<label
										key={reportReason}
										className='flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
									>
										<input
											type='radio'
											name='reason'
											value={reportReason}
											checked={reason === reportReason}
											onChange={(e) => setReason(e.target.value)}
											className='w-4 h-4 text-[#0A9DAA] focus:ring-[#0A9DAA]'
											disabled={submitting}
										/>
										<span className='ml-3 text-gray-700'>{reportReason}</span>
									</label>
								))}
							</div>
						</div>

						{/* Details */}
						<div className='mb-6'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								상세 내용 (선택사항)
							</label>
							<textarea
								value={details}
								onChange={(e) => setDetails(e.target.value)}
								placeholder='신고 사유에 대해 자세히 설명해주세요...'
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9DAA] focus:border-transparent resize-none'
								rows={4}
								disabled={submitting}
							/>
						</div>

						{/* Action Buttons */}
						<div className='flex gap-3'>
							<button
								type='button'
								onClick={handleClose}
								className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
								disabled={submitting}
							>
								취소
							</button>
							<button
								type='submit'
								className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
								disabled={submitting}
							>
								{submitting ? '신고 중...' : '신고하기'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}

export default ReportModal
