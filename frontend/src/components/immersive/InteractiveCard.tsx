import React, { useRef, ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useGesture } from '@use-gesture/react'

interface InteractiveCardProps {
	children: ReactNode
	className?: string
	intensity?: number
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({
	children,
	className = '',
	intensity = 20
}) => {
	const ref = useRef<HTMLDivElement>(null)

	const x = useMotionValue(0)
	const y = useMotionValue(0)

	const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
	const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

	const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`])
	const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`])

	const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
	const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])

	const bind = useGesture({
		onMove: ({ xy: [px, py] }) => {
			if (!ref.current) return
			const rect = ref.current.getBoundingClientRect()
			const centerX = rect.left + rect.width / 2
			const centerY = rect.top + rect.height / 2
			const newX = (px - centerX) / (rect.width / 2)
			const newY = (py - centerY) / (rect.height / 2)
			x.set(newX)
			y.set(newY)
		},
		onHover: ({ hovering }) => {
			if (!hovering) {
				x.set(0)
				y.set(0)
			}
		}
	})

	return (
		<motion.div
			ref={ref}
			{...bind()}
			className={`relative interactive ${className}`}
			style={{
				rotateX,
				rotateY,
				transformStyle: 'preserve-3d',
				perspective: 1000
			}}
			whileHover={{ scale: 1.05 }}
			transition={{ type: 'spring', stiffness: 300, damping: 20 }}
		>
			{/* Glow effect that follows mouse */}
			<motion.div
				className="absolute inset-0 rounded-inherit opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
				style={{
					background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
					zIndex: 1
				}}
			/>

			{/* Reflection effect */}
			<motion.div
				className="absolute inset-0 rounded-inherit opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
				style={{
					background: `linear-gradient(${glowX}, ${glowY}, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
					zIndex: 2
				}}
			/>

			<div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
				{children}
			</div>
		</motion.div>
	)
}

export default InteractiveCard
