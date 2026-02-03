import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminPath } from '../../lib/admin-path'

interface ProtectedRouteProps {
	children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { isAuthenticated } = useAuth()

	if (!isAuthenticated) {
		return <Navigate to={adminPath('/login')} replace />
	}

	return <>{children}</>
}

export default ProtectedRoute
