import { motion } from 'framer-motion'
import { useState, type MouseEvent } from 'react'

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

	const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100
		setMousePosition({ x, y })
	}

	return (
		<motion.button
			onClick={onClick}
			onMouseMove={handleMouseMove}
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
					background: glowColor
				}}
			/>

			{/* Mouse-following bright spotlight effect */}
			<div
				className="absolute inset-0 transition-opacity duration-300 opacity-0 hover:opacity-100"
				style={{
					background: `radial-gradient(circle 200px at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 20%, transparent 70%)`,
					pointerEvents: 'none'
				}}
			/>

			{/* Secondary glow layer for depth */}
			<div
				className="absolute inset-0 transition-opacity duration-300 opacity-0 hover:opacity-100"
				style={{
					background: `radial-gradient(circle 300px at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)`,
					pointerEvents: 'none'
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
