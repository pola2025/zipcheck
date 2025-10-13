import { motion } from 'framer-motion'
import GlowButton from 'components/ui/glow-button'
import ZipCheckLogo from 'components/ZipCheckLogo'

export default function ZipCheckHeader() {
	return (
		<motion.header
			className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-cyan-500/20"
			initial={{ y: -100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
		>
			<div className="container mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<motion.a
					href="/"
					className="flex items-center gap-3"
						whileHover={{ scale: 1.05 }}
						transition={{ type: 'spring', stiffness: 400 }}
					>
						<ZipCheckLogo className="h-8" />
						<span className="text-2xl font-bold gradient-text-cyan-purple">
							집첵
						</span>
					</motion.a>

					{/* Navigation */}
					<nav className="hidden md:flex items-center gap-8">
						<a
							href="/"
							className="text-gray-300 hover:text-[#38ef7d] transition-colors font-semibold"
						>
							홈
						</a>
						<a
							href="/community"
							className="text-gray-300 hover:text-[#38ef7d] transition-colors font-semibold"
						>
							커뮤니티
						</a>
						<GlowButton
							onClick={() => window.location.href = '/plan-selection'}
							size="sm"
							glowColor="#FF6B35"
						>
							견적 분석 신청
						</GlowButton>
					</nav>

					{/* Mobile Menu Button */}
					<button className="md:hidden text-cyan-400">
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
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		</motion.header>
	)
}
