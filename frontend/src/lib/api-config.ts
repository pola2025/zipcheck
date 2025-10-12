/**
 * API Configuration
 * Centralized API URL management using environment variables
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const getApiUrl = (path: string): string => {
	// Remove leading slash if present to avoid double slashes
	const cleanPath = path.startsWith('/') ? path : `/${path}`
	return `${API_URL}${cleanPath}`
}

export default API_URL
