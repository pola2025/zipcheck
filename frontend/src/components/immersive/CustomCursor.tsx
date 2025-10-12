import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const CustomCursor: React.FC = () => {
	const [isPointer, setIsPointer] = useState(false)
	const [trailPositions, setTrailPositions] = useState<{x: number, y: number}[]>([])

	const cursorX = useMotionValue(-100)
	const cursorY = useMotionValue(-100)

	const springConfig = { damping: 25, stiffness: 700 }
	const cursorXSpring = useSpring(cursorX, springConfig)
	const cursorYSpring = useSpring(cursorY, springConfig)

	useEffect(() => {
		const moveCursor = (e: MouseEvent) => {
			cursorX.set(e.clientX)
			cursorY.set(e.clientY)

			// Update trail
			setTrailPositions(prev => {
				const newTrail = [{x: e.clientX, y: e.clientY}, ...prev.slice(0, 10)]
				return newTrail
			})

			// Check if hovering over interactive element
			const target = e.target as HTMLElement
			const isInteractive =
				target.tagName === 'BUTTON' ||
				target.tagName === 'A' ||
				target.closest('button') ||
				target.closest('a') ||
				target.classList.contains('interactive')

			setIsPointer(!!isInteractive)
		}

		window.addEventListener('mousemove', moveCursor)
		return () => window.removeEventListener('mousemove', moveCursor)
	}, [cursorX, cursorY])

	return (
		<>
			{/* Trail effect */}
			{trailPositions.map((pos, i) => (
				<motion.div
					key={i}
					className="fixed w-1 h-1 rounded-full pointer-events-none z-[9999]"
					style={{
						left: pos.x - 2,
						top: pos.y - 2,
						background: `rgba(6, 182, 212, ${1 - i * 0.1})`,
						boxShadow: `0 0 ${20 - i * 2}px rgba(6, 182, 212, ${0.8 - i * 0.08})`
					}}
					initial={{ scale: 1, opacity: 1 }}
					animate={{ scale: 0, opacity: 0 }}
					transition={{ duration: 0.6 }}
				/>
			))}

			{/* Main cursor */}
			<motion.div
				className="fixed w-4 h-4 rounded-full pointer-events-none z-[9999] mix-blend-difference"
				style={{
					left: cursorXSpring,
					top: cursorYSpring,
					x: '-50%',
					y: '-50%'
				}}
			>
				<motion.div
					className="w-full h-full rounded-full border-2 border-cyan-400"
					animate={{
						scale: isPointer ? 1.5 : 1,
						borderWidth: isPointer ? 1 : 2
					}}
					style={{
						boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)'
					}}
				/>
			</motion.div>

			{/* Outer ring */}
			<motion.div
				className="fixed w-10 h-10 rounded-full pointer-events-none z-[9998] mix-blend-difference"
				style={{
					left: cursorXSpring,
					top: cursorYSpring,
					x: '-50%',
					y: '-50%'
				}}
			>
				<motion.div
					className="w-full h-full rounded-full border border-cyan-400/50"
					animate={{
						scale: isPointer ? 2 : 1,
						opacity: isPointer ? 0.5 : 0.3
					}}
					transition={{ type: 'spring', stiffness: 300, damping: 20 }}
				/>
			</motion.div>
		</>
	)
}

export default CustomCursor
