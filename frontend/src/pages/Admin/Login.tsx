import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Login: React.FC = () => {
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()
	const { login } = useAuth()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!password) {
			setError('비밀번호를 입력해주세요.')
			return
		}

		setLoading(true)

		try {
			await login(password)
			// Redirect to admin dashboard after successful login
			navigate('/admin')
		} catch (err) {
			setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				{/* Logo/Header */}
				<div className="text-center mb-8">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
						className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl"
					>
						<Lock className="w-10 h-10 text-white" />
					</motion.div>
					<h1 className="text-3xl font-bold text-white mb-2">관리자 로그인</h1>
					<p className="text-gray-400">ZipCheck 관리자 페이지에 접속합니다</p>
				</div>

				{/* Login Form */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8"
				>
					<form onSubmit={handleSubmit}>
						<div className="mb-6">
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								관리자 비밀번호
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
								<input
									type="password"
									id="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
									placeholder="비밀번호를 입력하세요"
									disabled={loading}
								/>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start"
							>
								<AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
								<p className="text-red-400 text-sm">{error}</p>
							</motion.div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
						>
							{loading ? (
								<>
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
									로그인 중...
								</>
							) : (
								<>
									<LogIn className="w-5 h-5 mr-2" />
									로그인
								</>
							)}
						</button>
					</form>
				</motion.div>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="text-center mt-6 text-gray-500 text-sm"
				>
					<p>© 2024 ZipCheck. All rights reserved.</p>
				</motion.div>
			</motion.div>
		</div>
	)
}

export default Login
