import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { Star, AlertTriangle } from 'lucide-react'
import CompanyReviewsTab from 'components/community/CompanyReviewsTab'
import DamageCasesTab from 'components/community/DamageCasesTab'
import { AnimatedBackground } from 'components/immersive'
import { motion } from 'framer-motion'

const Community: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams()

	// Get tab from URL params, default to 'reviews'
	const currentTab = searchParams.get('tab') || 'reviews'

	const handleTabChange = (tab: string) => {
		setSearchParams({ tab })
	}

	return (
		<div className='relative min-h-screen bg-black text-white'>
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated neon background */}
			<AnimatedBackground />

			{/* Content */}
			<div className='relative z-10'>
				<main className='container mx-auto px-4 py-12 mt-20'>
					{/* Header */}
					<motion.div
						className='mb-12 text-center'
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1
							className='text-5xl md:text-7xl font-bold mb-4 text-glow-cyan'
							style={{
								background: 'linear-gradient(135deg, #0A9DAA, #9B6BA8, #C9A86A)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							커뮤니티
						</h1>
						<p className='text-xl md:text-2xl text-gray-300'>
							실제 사용자들의 경험을 공유하고 소통하는 공간입니다
						</p>
					</motion.div>

					{/* Tab Navigation */}
					<motion.div
						className='glass-neon rounded-2xl mb-8 border border-cyan-500/30'
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<div className='flex'>
							<button
								onClick={() => handleTabChange('reviews')}
								className={`flex-1 px-6 py-5 font-semibold text-lg transition-all flex items-center justify-center gap-3 rounded-l-2xl ${
									currentTab === 'reviews'
										? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 border-b-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
										: 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/5'
								}`}
							>
								<Star
									size={24}
									className={currentTab === 'reviews' ? 'fill-cyan-400 text-cyan-400' : ''}
								/>
								<span>업체 후기</span>
							</button>
							<button
								onClick={() => handleTabChange('damage-cases')}
								className={`flex-1 px-6 py-5 font-semibold text-lg transition-all flex items-center justify-center gap-3 rounded-r-2xl ${
									currentTab === 'damage-cases'
										? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border-b-4 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
										: 'text-gray-400 hover:text-red-300 hover:bg-red-500/5'
								}`}
							>
								<AlertTriangle size={24} />
								<span>피해사례</span>
							</button>
						</div>
					</motion.div>

					{/* Tab Description */}
					<motion.div
						className='mb-8'
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						{currentTab === 'reviews' && (
							<div className='glass-neon rounded-2xl p-6 border border-cyan-500/30'>
								<div className='flex items-start gap-4'>
									<Star size={24} className='text-cyan-400 flex-shrink-0 mt-1' />
									<div>
										<h3 className='text-lg font-bold text-cyan-300 mb-2'>커뮤니티</h3>
										<p className='text-gray-300 leading-relaxed'>
											만족스러웠던 인테리어 후기를 올려주세요.
											<br />
											실제 사용자들의 경험을 자유롭게 소통할 수 있습니다.
										</p>
									</div>
								</div>
							</div>
						)}
						{currentTab === 'damage-cases' && (
							<div className='glass-neon rounded-2xl p-6 border-2 border-red-500/50 bg-red-900/10'>
								<div className='flex items-start gap-4'>
									<AlertTriangle size={24} className='text-red-400 flex-shrink-0 mt-1' />
									<div>
										<h3 className='text-lg font-bold text-red-300 mb-3'>⚠️ 주의사항 (필독)</h3>
										<div className='text-gray-300 leading-relaxed space-y-2'>
											<p className='font-semibold text-red-200'>
												본 게시판은 업체 비방을 하는 곳이 아닙니다.
											</p>
											<p>
												실제 인테리어 진행 시 피해를 본 내용과 사례를 공유하여
												동일한 피해사례가 늘어나지 않기 위함입니다.
											</p>
											<p className='text-sm text-red-300 font-semibold pt-2 border-t border-red-500/30'>
												※ 게시판 등록 내용으로 인한 법적 분쟁은 게시글 작성자에게 있음을 안내드립니다.
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</motion.div>

					{/* Tab Content */}
					{currentTab === 'reviews' && <CompanyReviewsTab />}
					{currentTab === 'damage-cases' && <DamageCasesTab />}
				</main>

				<ZipCheckFooter />
			</div>
		</div>
	)
}

export default Community
