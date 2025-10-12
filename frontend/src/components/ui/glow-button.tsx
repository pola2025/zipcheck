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
	const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
	const buttonRef = useRef<HTMLButtonElement>(null)

	const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
		if (!buttonRef.current) return

		const rect = buttonRef.current.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100

		setMousePosition({ x, y })
	}

	const handleMouseLeave = () => {
		setMousePosition({ x: 50, y: 50 })
	}

	return (
		<motion.button
			ref={buttonRef}
			onClick={onClick}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className={`
				relative overflow-hidden rounded-full font-bold text-white
				${sizeConfig[size]}
				${className}
			`}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
			style={{
				boxShadow: `0 0 40px ${glowColor}40, 0 0 80px ${glowColor}20`
			}}
		>
			{/* Animated gradient background */}
			<motion.div
				className="absolute inset-0"
				style={{
					background: `linear-gradient(135deg, ${glowColor} 0%, ${glowColor}dd 50%, ${glowColor} 100%)`
				}}
				animate={{
					backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
				}}
				transition={{
					duration: 3,
					repeat: Infinity,
					ease: 'linear'
				}}
			/>

			{/* Shimmer effect */}
			<motion.div
				className="absolute inset-0"
				style={{
					background: `linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.3) 50%, transparent 80%)`
				}}
				animate={{
					x: ['-100%', '200%']
				}}
				transition={{
					duration: 2.5,
					repeat: Infinity,
					ease: 'easeInOut',
					repeatDelay: 1
				}}
			/>

			{/* Cursor glow that follows mouse */}
			<div
				className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
				style={{
					background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 255, 255, 0.25), transparent 40%)`
				}}
			/>

			{/* Border glow */}
			<div
				className="absolute inset-0 rounded-full opacity-75"
				style={{
					boxShadow: `inset 0 0 20px ${glowColor}60, inset 0 0 40px ${glowColor}40`
				}}
			/>

			{/* Content */}
			<span className="relative z-10 drop-shadow-lg">{children}</span>

			{/* Outer glow on hover */}
			<motion.div
				className="absolute -inset-2 rounded-full opacity-0 blur-2xl -z-10"
				style={{
					background: glowColor
				}}
				whileHover={{ opacity: 0.6 }}
				transition={{ duration: 0.3 }}
			/>
		</motion.button>
	)
}
