import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getApiUrl } from '../lib/api-config'

interface UserProfile {
	id: string
	email: string
	name: string
	avatar_url?: string
	profile_image?: string
	auth_provider?: string
	provider?: 'google' | 'naver'
	created_at?: string
}

interface UserAuthContextType {
	user: UserProfile | null
	token: string | null
	isLoggedIn: boolean
	loading: boolean
	loginWithGoogle: (redirectTo?: string) => void
	logout: () => void
	refreshUser: () => Promise<void>
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined)

const STORAGE_KEYS = {
	token: 'auth_token',
	user: 'user'
} as const

export function UserAuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserProfile | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	const refreshUser = useCallback(async () => {
		const storedToken = localStorage.getItem(STORAGE_KEYS.token)
		if (!storedToken) {
			setUser(null)
			setToken(null)
			setLoading(false)
			return
		}

		try {
			const response = await fetch(getApiUrl('/api/auth/me'), {
				headers: { Authorization: `Bearer ${storedToken}` },
			})

			if (response.ok) {
				const userData = await response.json()
				setUser(userData)
				setToken(storedToken)
				localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData))
			} else {
				localStorage.removeItem(STORAGE_KEYS.token)
				localStorage.removeItem(STORAGE_KEYS.user)
				setUser(null)
				setToken(null)
			}
		} catch {
			// Network error - use cached data
			const cachedUser = localStorage.getItem(STORAGE_KEYS.user)
			if (cachedUser) {
				try {
					setUser(JSON.parse(cachedUser))
					setToken(storedToken)
				} catch {
					// Invalid cached data
				}
			}
		} finally {
			setLoading(false)
		}
	}, [])

	// Restore auth state from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem(STORAGE_KEYS.token)
		const storedUser = localStorage.getItem(STORAGE_KEYS.user)

		if (storedToken && storedUser) {
			try {
				setToken(storedToken)
				setUser(JSON.parse(storedUser))
				setLoading(false)
				// Refresh in background
				refreshUser()
			} catch {
				localStorage.removeItem(STORAGE_KEYS.token)
				localStorage.removeItem(STORAGE_KEYS.user)
				setLoading(false)
			}
		} else if (storedToken) {
			refreshUser()
		} else {
			setLoading(false)
		}
	}, [refreshUser])

	const loginWithGoogle = useCallback((redirectTo?: string) => {
		// Save redirect destination to localStorage as fallback
		// (in case backend cookie/KV flow loses it)
		if (redirectTo) {
			localStorage.setItem('auth_redirect_to', redirectTo)
		}
		// For subdomain support: pass full URL so backend can redirect back correctly
		const fullRedirect = redirectTo ? `${window.location.origin}${redirectTo}` : window.location.origin
		const params = `?redirect_to=${encodeURIComponent(fullRedirect)}`
		window.location.href = getApiUrl(`/api/auth/google${params}`)
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem(STORAGE_KEYS.token)
		localStorage.removeItem(STORAGE_KEYS.user)
		setToken(null)
		setUser(null)
	}, [])

	const value: UserAuthContextType = {
		user,
		token,
		isLoggedIn: !!token && !!user,
		loading,
		loginWithGoogle,
		logout,
		refreshUser
	}

	return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
	const context = useContext(UserAuthContext)
	if (context === undefined) {
		throw new Error('useUser must be used within a UserAuthProvider')
	}
	return context
}
