import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
	const navigate = useNavigate()

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-4">
			<div className="max-w-2xl w-full text-center">
				{/* 404 숫자 */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 200, damping: 15 }}
					className="mb-8"
				>
					<h1 className="text-[150px] md:text-[200px] font-black leading-none bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
						404
					</h1>
				</motion.div>

				{/* 메시지 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="mb-12"
				>
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
						페이지를 찾을 수 없습니다
					</h2>
					<p className="text-gray-400 text-lg mb-2">
						요청하신 페이지가 존재하지 않거나 이동했을 수 있습니다.
					</p>
					<p className="text-gray-500 text-sm">
						URL을 다시 확인하시거나 아래 버튼을 이용해 홈으로 돌아가세요.
					</p>
				</motion.div>

				{/* 버튼들 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="flex flex-col sm:flex-row gap-4 justify-center items-center"
				>
					<button
						onClick={() => navigate(-1)}
						className="group relative px-8 py-4 bg-gray-700/50 hover:bg-gray-700/80 border border-gray-600 rounded-xl font-semibold transition-all flex items-center gap-2 min-w-[200px] justify-center"
					>
						<ArrowLeft className="w-5 h-5" />
						이전 페이지
					</button>

					<button
						onClick={() => navigate('/')}
						className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/50 flex items-center gap-2 min-w-[200px] justify-center"
					>
						<Home className="w-5 h-5" />
						홈으로 가기
					</button>
				</motion.div>

				{/* 추천 링크 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="mt-16 pt-8 border-t border-gray-700"
				>
					<h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center justify-center gap-2">
						<Search className="w-5 h-5" />
						이런 페이지는 어떠세요?
					</h3>
					<div className="flex flex-wrap gap-3 justify-center">
						<button
							onClick={() => navigate('/plan-selection')}
							className="px-4 py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 rounded-lg text-sm transition-all"
						>
							견적 플랜 선택
						</button>
						<button
							onClick={() => navigate('/community')}
							className="px-4 py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 rounded-lg text-sm transition-all"
						>
							커뮤니티
						</button>
						<button
							onClick={() => navigate('/quote-submission')}
							className="px-4 py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 rounded-lg text-sm transition-all"
						>
							견적 신청
						</button>
					</div>
				</motion.div>

				{/* 애니메이션 배경 요소 */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
					<motion.div
						animate={{
							scale: [1, 1.2, 1],
							rotate: [0, 90, 0],
							opacity: [0.1, 0.2, 0.1]
						}}
						transition={{
							duration: 8,
							repeat: Infinity,
							ease: 'easeInOut'
						}}
						className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
					/>
					<motion.div
						animate={{
							scale: [1.2, 1, 1.2],
							rotate: [90, 0, 90],
							opacity: [0.1, 0.2, 0.1]
						}}
						transition={{
							duration: 10,
							repeat: Infinity,
							ease: 'easeInOut'
						}}
						className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
					/>
				</div>
			</div>
		</div>
	)
}
