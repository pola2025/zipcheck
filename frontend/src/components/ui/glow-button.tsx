import { motion } from 'framer-motion'
import { useState, useRef, type MouseEvent } from 'react'

type GlowButtonProps = {
	children: React.ReactNode
	onClick?: () => void
	className?: string
	glowColor?: string
	size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
	sm: 'px-6 py-2 text-base',
	md: 'px-12 py-4 text-xl',
	lg: 'px-14 py-6 text-2xl'
}

export default function GlowButton({
	children,
	onClick,
	className = '',
	glowColor = '#0A9DAA',
	size = 'md'
}: GlowButtonProps) {
	return (
		<motion.button
			onClick={onClick}
			className={`
				relative overflow-hidden rounded-full font-bold text-white
				${sizeConfig[size]}
				${className}
			`}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
			style={{
				boxShadow: `0 0 40px ${glowColor}60, 0 0 60px ${glowColor}30`
			}}
		>
			{/* Base gradient background */}
			<div
				className="absolute inset-0"
				style={{
					background: `linear-gradient(90deg, ${glowColor}e0 0%, ${glowColor} 50%, ${glowColor}e0 100%)`,
					backgroundSize: '200% 100%'
				}}
			/>

			{/* Flowing shine effect - always animating */}
			<motion.div
				className="absolute inset-0"
				style={{
					background: `linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%, transparent 100%)`,
					backgroundSize: '200% 100%'
				}}
				animate={{
					backgroundPosition: ['0% 0%', '200% 0%']
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: 'linear'
				}}
			/>

			{/* Secondary shimmer for extra depth */}
			<motion.div
				className="absolute inset-0"
				style={{
					background: `linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)`,
					backgroundSize: '200% 100%'
				}}
				animate={{
					backgroundPosition: ['-100% 0%', '200% 0%']
				}}
				transition={{
					duration: 2.5,
					repeat: Infinity,
					ease: 'easeInOut',
					repeatDelay: 0.5
				}}
			/>

			{/* Content */}
			<span className="relative z-10 drop-shadow-lg">{children}</span>

			{/* Outer glow on hover */}
			<motion.div
				className="absolute -inset-2 rounded-full blur-2xl -z-10"
				style={{
					background: glowColor,
					opacity: 0.4
				}}
				whileHover={{ opacity: 0.8 }}
				transition={{ duration: 0.3 }}
			/>
		</motion.button>
	)
}
