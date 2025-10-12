import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'

interface User {
	id: string
	email: string
	name: string
	phone?: string
	profile_image?: string
	oauth_provider: string
	joined_at: string
}

interface QuoteRequest {
	id: string
	customer_name: string
	customer_email: string
	customer_phone: string
	plan_type: string
	amount_paid: number
	status: string
	created_at: string
	items: any[]
}

const MyPage: React.FC = () => {
	const navigate = useNavigate()
	const [user, setUser] = useState<User | null>(null)
	const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	useEffect(() => {
		loadUserData()
	}, [])

	const loadUserData = async () => {
		try {
			const token = localStorage.getItem('auth_token')
			if (!token) {
				navigate('/') // Redirect to home if not logged in
				return
			}

			// Fetch user info
			const userResponse = await fetch('http://localhost:3001/api/auth/me', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})

			if (!userResponse.ok) {
				throw new Error('사용자 정보를 불러올 수 없습니다.')
			}

			const userData = await userResponse.json()
			setUser(userData)

			// Fetch quote requests for this user
			const quotesResponse = await fetch(
				`http://localhost:3001/api/quote-requests/user/${userData.id}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			)

			if (quotesResponse.ok) {
				const quotesData = await quotesResponse.json()
				setQuoteRequests(quotesData)
			}

			setLoading(false)
		} catch (err) {
			console.error('Error loading user data:', err)
			setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const handleLogout = () => {
		localStorage.removeItem('auth_token')
		localStorage.removeItem('user')
		navigate('/')
	}

	const getStatusBadgeColor = (status: string) => {
		const colors: Record<string, string> = {
			pending: 'bg-yellow-100 text-yellow-800',
			analyzing: 'bg-blue-100 text-blue-800',
			completed: 'bg-green-100 text-green-800',
			rejected: 'bg-red-100 text-red-800'
		}
		return colors[status] || 'bg-gray-100 text-gray-800'
	}

	const getStatusText = (status: string) => {
		const texts: Record<string, string> = {
			pending: '대기중',
			analyzing: '분석중',
			completed: '완료',
			rejected: '거절됨'
		}
		return texts[status] || status
	}

	const getPlanName = (planType: string) => {
		const plans: Record<string, string> = {
			basic: '베이직',
			standard: '스탠다드',
			premium: '프리미엄',
			enterprise: '엔터프라이즈'
		}
		return plans[planType] || planType
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-[#0A9DAA]'></div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-red-600 text-lg mb-4'>{error}</p>
					<button
						onClick={() => navigate('/')}
						className='px-6 py-2 bg-[#0A9DAA] text-white rounded-lg hover:bg-[#088997]'
					>
						홈으로 돌아가기
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<ZipCheckHeader />

			<main className='container mx-auto px-4 py-12 mt-20'>
				{/* User Profile Section */}
				<div className='bg-white rounded-2xl shadow-lg p-8 mb-8'>
					<div className='flex items-center gap-6'>
						{user?.profile_image ? (
							<img
								src={user.profile_image}
								alt={user.name}
								className='w-24 h-24 rounded-full object-cover'
							/>
						) : (
							<div className='w-24 h-24 rounded-full bg-gradient-to-br from-[#0A9DAA] to-[#0D7C87] flex items-center justify-center text-white text-3xl font-bold'>
								{user?.name.charAt(0)}
							</div>
						)}

						<div className='flex-1'>
							<h1 className='text-3xl font-bold text-gray-800 mb-2'>{user?.name}</h1>
							<p className='text-gray-600 mb-1'>{user?.email}</p>
							{user?.phone && <p className='text-gray-600'>{user.phone}</p>}
							<div className='flex items-center gap-2 mt-3'>
								<span className='px-3 py-1 bg-[#03C75A] text-white text-sm rounded-full'>
									네이버 로그인
								</span>
								<span className='text-sm text-gray-500'>
									가입일: {user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : '-'}
								</span>
							</div>
						</div>

						<button
							onClick={handleLogout}
							className='px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
						>
							로그아웃
						</button>
					</div>
				</div>

				{/* Quote Requests Section */}
				<div className='bg-white rounded-2xl shadow-lg p-8'>
					<h2 className='text-2xl font-bold text-gray-800 mb-6'>견적 분석 내역</h2>

					{quoteRequests.length === 0 ? (
						<div className='text-center py-12'>
							<p className='text-gray-500 mb-6'>아직 견적 분석 요청이 없습니다.</p>
							<button
								onClick={() => navigate('/plan-selection')}
								className='px-8 py-3 bg-gradient-to-r from-[#0A9DAA] to-[#0D7C87] text-white rounded-lg hover:shadow-lg transition-all'
							>
								견적 분석 시작하기
							</button>
						</div>
					) : (
						<div className='space-y-4'>
							{quoteRequests.map((request) => (
								<div
									key={request.id}
									className='border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer'
									onClick={() => navigate(`/quote-result?id=${request.id}`)}
								>
									<div className='flex items-center justify-between mb-4'>
										<div>
											<h3 className='text-lg font-semibold text-gray-800'>
												{getPlanName(request.plan_type)} 플랜
											</h3>
											<p className='text-sm text-gray-500'>
												{new Date(request.created_at).toLocaleString()}
											</p>
										</div>
										<span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(request.status)}`}>
											{getStatusText(request.status)}
										</span>
									</div>

									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='text-gray-600'>신청자:</span>
											<span className='ml-2 font-medium'>{request.customer_name}</span>
										</div>
										<div>
											<span className='text-gray-600'>항목 수:</span>
											<span className='ml-2 font-medium'>{request.items?.length || 0}개</span>
										</div>
										<div>
											<span className='text-gray-600'>결제 금액:</span>
											<span className='ml-2 font-medium text-[#0A9DAA]'>
												{request.amount_paid?.toLocaleString()}원
											</span>
										</div>
									</div>

									{request.status === 'completed' && (
										<div className='mt-4 pt-4 border-t border-gray-200'>
											<button className='text-[#0A9DAA] hover:text-[#088997] font-medium text-sm'>
												분석 결과 보기 →
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</main>

			<ZipCheckFooter />
		</div>
	)
}

export default MyPage
