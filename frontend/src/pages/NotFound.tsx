import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserAuthContext'

import { getApiUrl } from '../lib/api-config'

export default function NotFound() {
	const navigate = useNavigate()
	const { user } = useUser()

	const handleGoogleLogin = () => {
		const currentPath = window.location.pathname
		window.location.href = getApiUrl(`/api/auth/google?redirect_to=${encodeURIComponent(currentPath)}`)
	}

	return (
		<div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full text-center">
				{/* 404 숫자 */}
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: 'spring', stiffness: 200, damping: 20 }}
					className="mb-8"
				>
					<h1
						className="text-[140px] md:text-[180px] font-extrabold leading-none text-forest-800/10"
						style={{ fontFamily: 'Outfit, sans-serif' }}
					>
						404
					</h1>
				</motion.div>

				{/* 메시지 */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
					className="mb-10"
				>
					<h2
						className="text-2xl md:text-3xl font-bold mb-3 text-sand-900"
						style={{ fontFamily: 'Outfit, sans-serif' }}
					>
						페이지를 찾을 수 없습니다
					</h2>
					<p className="text-sand-700 text-base mb-1">
						요청하신 페이지가 존재하지 않거나 이동했을 수 있습니다.
					</p>
					<p className="text-sand-600 text-sm">
						URL을 다시 확인하시거나 아래 버튼을 이용해주세요.
					</p>
				</motion.div>

				{/* 버튼들 */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="flex flex-col sm:flex-row gap-3 justify-center items-center"
				>
					<button
						onClick={() => navigate(-1)}
						className="px-6 py-3 bg-white hover:bg-sand-100 border border-sand-300 rounded-2xl font-medium text-sand-800 transition-all flex items-center gap-2 min-w-[180px] justify-center hover:shadow-sm"
					>
						<ArrowLeft className="w-4 h-4" />
						이전 페이지
					</button>

					<button
						onClick={() => navigate('/')}
						className="px-6 py-3 bg-forest-800 hover:bg-forest-700 text-white rounded-2xl font-medium transition-all flex items-center gap-2 min-w-[180px] justify-center hover:shadow-md"
					>
						<Home className="w-4 h-4" />
						홈으로 가기
					</button>
				</motion.div>

				{/* Google 로그인 */}
				{!user && (
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.45 }}
						className="mt-6"
					>
						<button
							onClick={handleGoogleLogin}
							className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-sand-100 border border-sand-300 rounded-2xl font-medium text-sand-800 transition-all hover:shadow-sm"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
							</svg>
							<LogIn className="w-4 h-4 text-sand-500" />
							Google로 로그인
						</button>
					</motion.div>
				)}

				{/* 추천 링크 */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="mt-14 pt-6 border-t border-sand-300"
				>
					<h3 className="text-sm font-semibold text-sand-700 mb-4 flex items-center justify-center gap-2">
						<Search className="w-4 h-4" />
						이런 페이지는 어떠세요?
					</h3>
					<div className="flex flex-wrap gap-2 justify-center">
						<button
							onClick={() => navigate('/plan-selection')}
							className="px-4 py-2 bg-white hover:bg-sand-100 border border-sand-300 rounded-xl text-sm text-sand-700 transition-all hover:shadow-sm"
						>
							견적 플랜 선택
						</button>
						<button
							onClick={() => navigate('/community')}
							className="px-4 py-2 bg-white hover:bg-sand-100 border border-sand-300 rounded-xl text-sm text-sand-700 transition-all hover:shadow-sm"
						>
							커뮤니티
						</button>
						<button
							onClick={() => navigate('/quote-submission')}
							className="px-4 py-2 bg-white hover:bg-sand-100 border border-sand-300 rounded-xl text-sm text-sand-700 transition-all hover:shadow-sm"
						>
							견적 신청
						</button>
					</div>
				</motion.div>
			</div>
		</div>
	)
}
