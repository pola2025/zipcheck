import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
	username: string
	role: string
}

interface AuthContextType {
	user: User | null
	token: string | null
	isAuthenticated: boolean
	login: (password: string) => Promise<void>
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

	const login = async (password: string) => {
		try {
			const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
			const response = await fetch(`${API_URL}/api/auth/admin/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ password })
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || '로그인에 실패했습니다.')
			}

			const data = await response.json()

			// Store token and user info
			localStorage.setItem('admin_token', data.token)
			localStorage.setItem('admin_user', JSON.stringify(data.user))

			setToken(data.token)
			setUser(data.user)
		} catch (error) {
			console.error('Login error:', error)
			throw error
		}
	}

	const logout = () => {
		// Clear localStorage
		localStorage.removeItem('admin_token')
		localStorage.removeItem('admin_user')

		// Clear state
		setToken(null)
		setUser(null)
	}

	const value: AuthContextType = {
		user,
		token,
		isAuthenticated: !!token && !!user,
		login,
		logout
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
