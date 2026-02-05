import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
	username: string
	role: string
}

interface LoginStep1Result {
	step: 'totp_required' | 'totp_setup'
	sessionToken: string
	secret?: string
	otpauthUri?: string
}

interface AuthContextType {
	user: User | null
	token: string | null
	isAuthenticated: boolean
	loginStep1: (email: string) => Promise<LoginStep1Result>
	loginStep2: (code: string, sessionToken: string, newSecret?: string) => Promise<void>
	logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(null)

	// Load auth state from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem('admin_token')
		const storedUser = localStorage.getItem('admin_user')

		if (storedToken && storedUser) {
			setToken(storedToken)
			setUser(JSON.parse(storedUser))
		}
	}, [])

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

	const loginStep1 = async (email: string): Promise<LoginStep1Result> => {
		const response = await fetch(`${API_URL}/api/auth/admin/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email }),
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error.error || '로그인에 실패했습니다.')
		}

		return response.json()
	}

	const loginStep2 = async (code: string, sessionToken: string, newSecret?: string) => {
		const response = await fetch(`${API_URL}/api/auth/admin/login/verify-totp`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, sessionToken, newSecret }),
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error.error || '인증에 실패했습니다.')
		}

		const data = await response.json()

		// Store token and user info
		localStorage.setItem('admin_token', data.token)
		localStorage.setItem('admin_user', JSON.stringify(data.user))

		setToken(data.token)
		setUser(data.user)
	}

	const logout = () => {
		localStorage.removeItem('admin_token')
		localStorage.removeItem('admin_user')
		setToken(null)
		setUser(null)
	}

	const value: AuthContextType = {
		user,
		token,
		isAuthenticated: !!token && !!user,
		loginStep1,
		loginStep2,
		logout,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
