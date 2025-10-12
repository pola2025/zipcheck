import React, { useEffect, useState, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

interface StatCounterProps {
	end: number
	duration?: number
	suffix?: string
	prefix?: string
	label: string
	icon?: React.ReactNode
	decimals?: number
	className?: string
}

const StatCounter: React.FC<StatCounterProps> = ({
	end,
	duration = 2,
	suffix = '',
	prefix = '',
	label,
	icon,
	decimals = 0,
	className = ''
}) => {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, amount: 0.5 })
	const motionValue = useMotionValue(0)
	const springValue = useSpring(motionValue, {
		duration: duration * 1000,
		bounce: 0
	})
	const [displayValue, setDisplayValue] = useState('0')

	useEffect(() => {
		if (isInView) {
			motionValue.set(end)
		}
	}, [isInView, end, motionValue])

	useEffect(() => {
		const unsubscribe = springValue.on('change', (latest) => {
			setDisplayValue(latest.toFixed(decimals))
		})

		return () => unsubscribe()
	}, [springValue, decimals])

	return (
		<motion.div
			ref={ref}
			className={`stat-counter glass-neon rounded-2xl p-8 ${className}`}
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.6 }}
			whileHover={{ scale: 1.05 }}
		>
			{icon && (
				<motion.div
					className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400"
					animate={{
						boxShadow: [
							'0 0 20px rgba(6, 182, 212, 0.3)',
							'0 0 40px rgba(6, 182, 212, 0.5)',
							'0 0 20px rgba(6, 182, 212, 0.3)'
						]
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut'
					}}
				>
					{icon}
				</motion.div>
			)}

			<div className="relative">
				<motion.div
					className="text-5xl md:text-6xl font-bold mb-2 text-glow-cyan"
					style={{
						background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text'
					}}
				>
					{prefix}
					{displayValue}
					{suffix}
				</motion.div>

				<motion.div
					className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-cyan-400"
					animate={{
						opacity: [0.5, 1, 0.5],
						scale: [1, 1.3, 1]
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut'
					}}
					style={{
						boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)'
					}}
				/>
			</div>

			<p className="text-gray-400 text-sm md:text-base font-medium">{label}</p>
		</motion.div>
	)
}

export default StatCounter
