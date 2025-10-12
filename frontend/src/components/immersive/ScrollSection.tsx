import React, { useRef, ReactNode } from 'react'
import { motion, useInView, Variants } from 'framer-motion'
import { cn } from 'lib/utils'

interface ScrollSectionProps {
	children: ReactNode
	className?: string
	delay?: number
	duration?: number
	animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'blur'
	threshold?: number
	once?: boolean
	stagger?: number
}

const animationVariants: Record<string, Variants> = {
	fade: {
		hidden: { opacity: 0 },
		visible: { opacity: 1 }
	},
	'slide-up': {
		hidden: { opacity: 0, y: 60 },
		visible: { opacity: 1, y: 0 }
	},
	'slide-down': {
		hidden: { opacity: 0, y: -60 },
		visible: { opacity: 1, y: 0 }
	},
	'slide-left': {
		hidden: { opacity: 0, x: 60 },
		visible: { opacity: 1, x: 0 }
	},
	'slide-right': {
		hidden: { opacity: 0, x: -60 },
		visible: { opacity: 1, x: 0 }
	},
	scale: {
		hidden: { opacity: 0, scale: 0.8 },
		visible: { opacity: 1, scale: 1 }
	},
	blur: {
		hidden: { opacity: 0, filter: 'blur(10px)' },
		visible: { opacity: 1, filter: 'blur(0px)' }
	}
}

const ScrollSection: React.FC<ScrollSectionProps> = ({
	children,
	className,
	delay = 0,
	duration = 0.8,
	animation = 'slide-up',
	threshold = 0.2,
	once = false,
	stagger = 0.1
}) => {
	const ref = useRef(null)
	const isInView = useInView(ref, {
		once,
		amount: threshold
	})

	return (
		<motion.div
			ref={ref}
			className={cn('scroll-section', className)}
			initial="hidden"
			animate={isInView ? 'visible' : 'hidden'}
			variants={animationVariants[animation]}
			transition={{
				delay,
				duration,
				ease: [0.4, 0, 0.2, 1],
				staggerChildren: stagger
			}}
		>
			{children}
		</motion.div>
	)
}

export default ScrollSection
