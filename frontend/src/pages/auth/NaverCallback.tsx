import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Naver OAuth Callback Page
 * Handles the redirect from Naver OAuth and stores the JWT token
 */
const NaverCallback: React.FC = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
	const [errorMessage, setErrorMessage] = useState<string>('')

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Get token from URL query parameter
				const token = searchParams.get('token')
				const error = searchParams.get('error')

				// Check for errors
				if (error) {
					console.error('OAuth error:', error)
					setErrorMessage(getErrorMessage(error))
					setStatus('error')
					setTimeout(() => navigate('/'), 3000)
					return
				}

				if (!token) {
					console.error('No token found in callback URL')
					setErrorMessage('인증 토큰을 찾을 수 없습니다.')
					setStatus('error')
					setTimeout(() => navigate('/'), 3000)
					return
				}

				// Store token in localStorage
				localStorage.setItem('auth_token', token)

				// Fetch user info
				const response = await fetch('http://localhost:3001/api/auth/me', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				})

				if (!response.ok) {
					throw new Error('사용자 정보를 가져올 수 없습니다.')
				}

				const user = await response.json()

				// Store user info
				localStorage.setItem('user', JSON.stringify(user))

				console.log('✅ Naver login successful:', user.email)
				setStatus('success')

				// Redirect to main page after 1 second
				setTimeout(() => {
					navigate('/')
				}, 1000)
			} catch (error) {
				console.error('Callback processing error:', error)
				setErrorMessage('로그인 처리 중 오류가 발생했습니다.')
				setStatus('error')
				setTimeout(() => navigate('/'), 3000)
			}
		}

		handleCallback()
	}, [searchParams, navigate])

	const getErrorMessage = (errorCode: string): string => {
		const errorMessages: Record<string, string> = {
			oauth_failed: '네이버 로그인에 실패했습니다.',
			invalid_request: '잘못된 요청입니다.',
			session_expired: '세션이 만료되었습니다. 다시 시도해주세요.',
			invalid_state: '보안 검증에 실패했습니다. 다시 시도해주세요.'
		}
		return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.'
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50'>
			<div className='bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center'>
				{status === 'processing' && (
					<>
						<div className='mb-6'>
							<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-[#03C75A] mx-auto'></div>
						</div>
						<h2 className='text-2xl font-bold text-gray-800 mb-2'>로그인 처리 중</h2>
						<p className='text-gray-600'>잠시만 기다려주세요...</p>
					</>
				)}

				{status === 'success' && (
					<>
						<div className='mb-6'>
							<svg
								className='mx-auto h-16 w-16 text-green-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M5 13l4 4L19 7'
								/>
							</svg>
						</div>
						<h2 className='text-2xl font-bold text-gray-800 mb-2'>로그인 성공!</h2>
						<p className='text-gray-600'>메인 페이지로 이동합니다...</p>
					</>
				)}

				{status === 'error' && (
					<>
						<div className='mb-6'>
							<svg
								className='mx-auto h-16 w-16 text-red-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</div>
						<h2 className='text-2xl font-bold text-gray-800 mb-2'>로그인 실패</h2>
						<p className='text-gray-600 mb-4'>{errorMessage}</p>
						<p className='text-sm text-gray-500'>메인 페이지로 이동합니다...</p>
					</>
				)}
			</div>
		</div>
	)
}

export default NaverCallback
