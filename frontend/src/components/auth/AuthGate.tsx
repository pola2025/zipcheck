import type { ReactNode } from 'react'
import { useUser } from '../../contexts/UserAuthContext'
import GoogleLoginButton from './GoogleLoginButton'

interface AuthGateProps {
	/** Content to render when authenticated */
	children: ReactNode
	/** Icon element shown above the title */
	icon?: ReactNode
	/** Heading text */
	title?: string
	/** Description text below the heading */
	description?: string
	/** Path to redirect after login */
	redirectTo: string
	/** Additional class for the outer wrapper */
	className?: string
}

/**
 * Unified login gate component.
 * Wraps content that requires authentication.
 * Shows Google login when not logged in, renders children when logged in.
 */
export default function AuthGate({
	children,
	icon,
	title = '로그인이 필요합니다',
	description = '계정으로 로그인해주세요.',
	redirectTo,
	className = '',
}: AuthGateProps) {
	const { isLoggedIn, loading } = useUser()

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
			</div>
		)
	}

	if (isLoggedIn) {
		return <>{children}</>
	}

	return (
		<div className={`max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
			{icon && (
				<div className="mb-5 flex items-center justify-center">
					{icon}
				</div>
			)}
			<h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
			<p className="text-sm text-gray-500 mb-6">{description}</p>
			<div className="flex flex-col gap-3">
				<GoogleLoginButton size="lg" redirectTo={redirectTo} className="w-full" />
			</div>
		</div>
	)
}
