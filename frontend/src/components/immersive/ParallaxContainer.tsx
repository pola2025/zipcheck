import React, { useRef, ReactNode } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { cn } from 'lib/utils'

interface ParallaxContainerProps {
	children: ReactNode
	speed?: number
	offset?: number
	className?: string
	direction?: 'vertical' | 'horizontal'
	reverse?: boolean
}

const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
	children,
	speed = 0.5,
	offset = 0,
	className,
	direction = 'vertical',
	reverse = false
}) => {
	const containerRef = useRef<HTMLDivElement>(null)

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start end', 'end start']
	})

	const calculateTransform = (progress: MotionValue<number>) => {
		const multiplier = reverse ? -speed : speed
		const range = [0, 1]
		const outputRange = [`${offset}%`, `${offset + 100 * multiplier}%`]

		return useTransform(progress, range, outputRange)
	}

	const transform =
		direction === 'vertical'
			? { y: calculateTransform(scrollYProgress) }
			: { x: calculateTransform(scrollYProgress) }

	return (
		<div ref={containerRef} className={cn('parallax-container relative', className)}>
			<motion.div style={transform} className="will-change-transform">
				{children}
			</motion.div>
		</div>
	)
}

export default ParallaxContainer
