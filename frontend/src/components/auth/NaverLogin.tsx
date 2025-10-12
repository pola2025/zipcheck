import React from 'react'

/**
 * Naver Login Button Component
 * Redirects to backend OAuth endpoint for Naver authentication
 */
const NaverLogin: React.FC = () => {
	const handleNaverLogin = () => {
		// Redirect to backend Naver OAuth endpoint
		window.location.href = 'http://localhost:3001/api/auth/naver'
	}

	return (
		<button
			onClick={handleNaverLogin}
			className='flex items-center justify-center gap-3 w-full px-6 py-3 bg-[#03C75A] hover:bg-[#02b350] transition-colors text-white font-semibold rounded-lg shadow-md hover:shadow-lg'
		>
			<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<rect width='20' height='20' fill='white' />
				<path d='M13.3333 10.8333L6.66667 0H0V20H6.66667V9.16667L13.3333 20H20V0H13.3333V10.8333Z' fill='#03C75A' />
			</svg>
			<span>네이버로 로그인</span>
		</button>
	)
}

export default NaverLogin
