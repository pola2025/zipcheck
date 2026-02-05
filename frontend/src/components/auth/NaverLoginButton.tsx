import { useUser } from '../../contexts/UserAuthContext'

interface NaverLoginButtonProps {
	className?: string
	size?: 'sm' | 'md' | 'lg'
	redirectTo?: string
}

export default function NaverLoginButton({ className = '', size = 'md', redirectTo }: NaverLoginButtonProps) {
	const { loginWithNaver } = useUser()

	const handleClick = () => {
		loginWithNaver(redirectTo)
	}

	const sizeClasses = {
		sm: 'py-2 px-4 text-sm gap-2',
		md: 'py-3 px-6 text-base gap-3',
		lg: 'py-3.5 px-8 text-lg gap-3'
	}

	return (
		<button
			onClick={handleClick}
			className={`inline-flex items-center justify-center ${sizeClasses[size]} bg-[#03C75A] border border-[#03C75A] rounded-xl font-medium text-white hover:bg-[#02b350] transition-all shadow-sm ${className}`}
		>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
				<path d="M13.333 10.833L6.667 0H0v20h6.667V9.167L13.333 20H20V0h-6.667v10.833z" fill="white" />
			</svg>
			<span>Naver로 로그인</span>
		</button>
	)
}
