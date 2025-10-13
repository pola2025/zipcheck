import { motion } from 'framer-motion'
import { AnimatedBackground } from 'components/immersive'
import NeonZ from 'components/NeonZ'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'

interface MaintenancePageProps {
	errorCode?: 404 | 403 | 500
	message?: string
}

export default function MaintenancePage({
	errorCode = 500,
	message = '집첵 서비스 점검중입니다. 점검 완료 후 서비스 예정입니다.'
}: MaintenancePageProps) {
	const errorMessages: Record<number, string> = {
		404: '페이지를 찾을 수 없습니다',
		403: '접근 권한이 없습니다',
		500: '서버 오류가 발생했습니다'
	}

	const defaultMessage = errorMessages[errorCode] || message

	return (
		<div className="relative min-h-screen bg-black text-white overflow-hidden">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-32">
				<div className="container mx-auto max-w-4xl text-center">
					{/* Large Sparkling Z */}
					<motion.div
						className="flex justify-center mb-8"
						initial={{ scale: 0.5, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
					>
						<NeonZ size={200} />
					</motion.div>

					{/* Error Code */}
					{errorCode && (
						<motion.h1
							className="text-9xl md:text-[200px] font-bold mb-6"
							style={{
								background: 'linear-gradient(135deg, #11998e, #38ef7d)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								filter: 'drop-shadow(0 0 40px rgba(6, 182, 212, 0.6))'
							}}
							initial={{ y: -50, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.6, delay: 0.2 }}
						>
							{errorCode}
						</motion.h1>
					)}

					{/* Main Message */}
					<motion.div
						initial={{ y: 30, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="glass-neon rounded-3xl p-12 border-2 border-[#11998e]/30"
						style={{
							boxShadow: '0 0 60px rgba(6, 182, 212, 0.3), inset 0 0 80px rgba(6, 182, 212, 0.05)'
						}}
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
							{defaultMessage}
						</h2>

						{/* Secondary Message */}
						<motion.p
							className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.6 }}
						>
							{message !== defaultMessage && message}
							{!message && errorCode === 404 && (
								<span>요청하신 페이지를 찾을 수 없습니다.<br />URL을 확인해주세요.</span>
							)}
							{!message && errorCode === 403 && (
								<span>이 페이지에 접근할 권한이 없습니다.<br />로그인이 필요하거나 권한이 제한되었습니다.</span>
							)}
							{!message && errorCode === 500 && (
								<span>현재 서비스 점검 중입니다.<br />빠른 시일 내에 정상화하겠습니다.</span>
							)}
						</motion.p>

						{/* Back Button */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.8, duration: 0.4 }}
						>
							<motion.button
								onClick={() => window.location.href = '/'}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="px-10 py-5 bg-gradient-to-r from-[#11998e] to-[#38ef7d] hover:from-[#0d7a73] hover:to-[#2dd169] rounded-2xl font-bold text-xl transition-all inline-flex items-center gap-3"
								style={{
									boxShadow: '0 0 40px rgba(17, 153, 142, 0.5), 0 4px 20px rgba(56, 239, 125, 0.3)'
								}}
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
									/>
								</svg>
								홈으로 돌아가기
							</motion.button>
						</motion.div>

						{/* Contact Info */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1, duration: 0.6 }}
							className="mt-12 pt-8 border-t border-[#11998e]/20"
						>
							<p className="text-sm text-gray-400 mb-4">
								문제가 지속되면 고객센터로 문의해주세요
							</p>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[#38ef7d]">
								<a
									href="mailto:zipcheck2025@gmail.com"
									className="hover:text-[#11998e] transition-colors flex items-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									zipcheck2025@gmail.com
								</a>
								<span className="hidden sm:inline text-gray-600">|</span>
								<a
									href="tel:032-345-9834"
									className="hover:text-[#11998e] transition-colors flex items-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									032-345-9834
								</a>
							</div>
						</motion.div>
					</motion.div>

					{/* Floating particles effect */}
					<div className="absolute inset-0 pointer-events-none">
						{[...Array(20)].map((_, i) => (
							<motion.div
								key={i}
								className="absolute w-1 h-1 bg-[#38ef7d] rounded-full"
								style={{
									left: `${Math.random() * 100}%`,
									top: `${Math.random() * 100}%`,
								}}
								animate={{
									y: [0, -30, 0],
									opacity: [0, 1, 0],
									scale: [0, 1.5, 0],
								}}
								transition={{
									duration: 3 + Math.random() * 2,
									repeat: Infinity,
									delay: Math.random() * 2,
								}}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
