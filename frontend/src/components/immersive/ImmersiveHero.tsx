import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from 'lib/utils'
import { ArrowDown } from 'lucide-react'

interface ImmersiveHeroProps {
	title: string
	subtitle?: string
	backgroundImage?: string
	backgroundVideo?: string
	className?: string
	ctaPrimary?: {
		label: string
		onClick?: () => void
		href?: string
	}
	ctaSecondary?: {
		label: string
		onClick?: () => void
		href?: string
	}
	showScrollHint?: boolean
}

const ImmersiveHero: React.FC<ImmersiveHeroProps> = ({
	title,
	subtitle,
	backgroundImage,
	backgroundVideo,
	className,
	ctaPrimary,
	ctaSecondary,
	showScrollHint = true
}) => {
	const containerRef = useRef<HTMLElement>(null)
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start start', 'end start']
	})

	const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
	const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0])
	const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15])

	return (
		<section
			ref={containerRef}
			className={cn(
				'relative h-screen w-full overflow-hidden flex items-center justify-center',
				className
			)}
		>
			{/* Background Media */}
			<motion.div className="absolute inset-0 z-0" style={{ y, scale }}>
				{backgroundVideo ? (
					<video
						autoPlay
						loop
						muted
						playsInline
						className="w-full h-full object-cover"
					>
						<source src={backgroundVideo} type="video/mp4" />
					</video>
				) : backgroundImage ? (
					<div
						className="w-full h-full bg-cover bg-center bg-no-repeat"
						style={{
							backgroundImage: `url(${backgroundImage})`
						}}
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-b from-gray-900 via-black to-gray-900" />
				)}
				<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
			</motion.div>

			{/* Content */}
			<motion.div
				className="relative z-10 text-center px-6 max-w-6xl mx-auto"
				style={{ opacity }}
			>
				<motion.h1
					className="text-3xl md:text-5xl lg:text-6xl font-black mb-12 leading-tight"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
					style={{
						background: 'linear-gradient(135deg, #0A9DAA 0%, #ffffff 50%, #C9A86A 100%)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						filter: 'drop-shadow(0 0 40px rgba(10, 157, 170, 0.6)) drop-shadow(0 8px 32px rgba(0, 0, 0, 0.9))'
					}}
				>
					{title}
				</motion.h1>

				{subtitle && (
					<motion.p
						className="text-sm md:text-base lg:text-lg text-white font-normal max-w-lg mx-auto mb-8 leading-relaxed px-6 py-3 rounded-2xl"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
						style={{
							background: 'linear-gradient(135deg, rgba(10, 157, 170, 0.25), rgba(155, 107, 168, 0.2))',
							backdropFilter: 'blur(20px) saturate(150%)',
							border: '2px solid rgba(10, 157, 170, 0.3)',
							boxShadow: '0 0 40px rgba(10, 157, 170, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
							textShadow: '0 0 30px rgba(10, 157, 170, 0.8), 0 4px 20px rgba(0, 0, 0, 1), 0 0 60px rgba(10, 157, 170, 0.4)'
						}}
					>
						{subtitle}
					</motion.p>
				)}

				{(ctaPrimary || ctaSecondary) && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
						className="flex flex-col sm:flex-row gap-4 justify-center items-center"
					>
						{ctaPrimary && (
							<button
								onClick={ctaPrimary.onClick}
								className="px-8 py-3 bg-[#0A9DAA] rounded-full font-semibold text-base text-white transition-all duration-400 hover:bg-[#0db5c4] hover:shadow-xl hover:shadow-[#0A9DAA]/30 hover:translate-y-[-2px]"
							>
								{ctaPrimary.label}
							</button>
						)}
						{ctaSecondary && (
							<button
								onClick={ctaSecondary.onClick}
								className="px-8 py-3 bg-white/10 backdrop-blur-md rounded-full font-semibold text-base text-white border-2 border-white/30 hover:bg-white/15 hover:border-[#0A9DAA]/50 transition-all duration-400 hover:scale-102"
							>
								{ctaSecondary.label}
							</button>
						)}
					</motion.div>
				)}
			</motion.div>

			{/* Scroll Indicator */}
			{showScrollHint && (
				<motion.div
					className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1, y: [0, 10, 0] }}
					transition={{
						opacity: { delay: 1.2, duration: 0.5 },
						y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
					}}
					onClick={() => {
						window.scrollTo({
							top: window.innerHeight,
							behavior: 'smooth'
						})
					}}
				>
					<div className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
						<div className="w-6 h-10 border-2 border-current rounded-full flex justify-center p-1">
							<motion.div
								className="w-1.5 h-3 bg-current rounded-full"
								animate={{ y: [0, 12, 0] }}
								transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
							/>
						</div>
						<ArrowDown className="w-4 h-4" />
					</div>
				</motion.div>
			)}
		</section>
	)
}

export default ImmersiveHero
