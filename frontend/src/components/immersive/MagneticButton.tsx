import React, { useRef, ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useGesture } from '@use-gesture/react'

interface MagneticButtonProps {
	children: ReactNode
	className?: string
	intensity?: number
	onClick?: () => void
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
	children,
	className = '',
	intensity = 0.3,
	onClick
}) => {
	const ref = useRef<HTMLButtonElement>(null)

	const x = useMotionValue(0)
	const y = useMotionValue(0)

	const springConfig = { damping: 20, stiffness: 300 }
	const xSpring = useSpring(x, springConfig)
	const ySpring = useSpring(y, springConfig)

	const bind = useGesture({
		onMove: ({ xy: [px, py], hovering }) => {
			if (!ref.current || !hovering) return

			const rect = ref.current.getBoundingClientRect()
			const centerX = rect.left + rect.width / 2
			const centerY = rect.top + rect.height / 2

			const deltaX = (px - centerX) * intensity
			const deltaY = (py - centerY) * intensity

			x.set(deltaX)
			y.set(deltaY)
		},
		onHover: ({ hovering }) => {
			if (!hovering) {
				x.set(0)
				y.set(0)
			}
		}
	})

	return (
		<motion.button
			ref={ref}
			{...bind()}
			className={`interactive relative ${className}`}
			style={{
				x: xSpring,
				y: ySpring
			}}
			onClick={onClick}
			whileTap={{ scale: 0.95 }}
		>
			{/* Glow effect */}
			<motion.div
				className="absolute inset-0 rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
				animate={{
					boxShadow: [
						'0 0 20px rgba(6, 182, 212, 0.3)',
						'0 0 40px rgba(6, 182, 212, 0.5)',
						'0 0 20px rgba(6, 182, 212, 0.3)'
					]
				}}
				transition={{ duration: 2, repeat: Infinity }}
			/>

			{children}
		</motion.button>
	)
}

export default MagneticButton
