import React from 'react'
import { motion } from 'framer-motion'

const AnimatedBackground: React.FC = () => {
	return (
		<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
			{/* Base gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

			{/* Animated orbs with neon glow - ZipCheck Cyan */}
			<motion.div
				className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full"
				style={{
					background:
						'radial-gradient(circle, rgba(17, 193, 213, 0.15) 0%, transparent 70%)',
					filter: 'blur(80px)'
				}}
				animate={{
					x: ['-20%', '20%', '-20%'],
					y: ['-10%', '30%', '-10%'],
					scale: [1, 1.2, 1]
				}}
				transition={{
					duration: 20,
					repeat: Infinity,
					ease: 'easeInOut'
				}}
			/>

			{/* ZipCheck Purple */}
			<motion.div
				className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full"
				style={{
					background:
						'radial-gradient(circle, rgba(225, 128, 255, 0.12) 0%, transparent 70%)',
					filter: 'blur(90px)'
				}}
				animate={{
					x: ['10%', '-10%', '10%'],
					y: ['20%', '-20%', '20%'],
					scale: [1, 1.3, 1]
				}}
				transition={{
					duration: 25,
					repeat: Infinity,
					ease: 'easeInOut'
				}}
			/>

			{/* ZipCheck Yellow/Gold */}
			<motion.div
				className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full"
				style={{
					background:
						'radial-gradient(circle, rgba(255, 207, 77, 0.1) 0%, transparent 70%)',
					filter: 'blur(100px)',
					transform: 'translate(-50%, -50%)'
				}}
				animate={{
					scale: [1, 1.4, 1],
					rotate: [0, 180, 360]
				}}
				transition={{
					duration: 30,
					repeat: Infinity,
					ease: 'linear'
				}}
			/>

			{/* Grid pattern with subtle glow */}
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage: `
						linear-gradient(rgba(17, 193, 213, 0.1) 1px, transparent 1px),
						linear-gradient(90deg, rgba(17, 193, 213, 0.1) 1px, transparent 1px)
					`,
					backgroundSize: '50px 50px',
					maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
				}}
			/>

			{/* Floating particles */}
			{[...Array(20)].map((_, i) => (
				<motion.div
					key={i}
					className="absolute w-1 h-1 rounded-full"
					style={{
						background: `rgba(17, 193, 213, ${0.3 + Math.random() * 0.4})`,
						boxShadow: '0 0 10px rgba(17, 193, 213, 0.8)',
						left: `${Math.random() * 100}%`,
						top: `${Math.random() * 100}%`
					}}
					animate={{
						y: [0, -30, 0],
						x: [0, Math.random() * 20 - 10, 0],
						opacity: [0.3, 1, 0.3],
						scale: [1, 1.5, 1]
					}}
					transition={{
						duration: 3 + Math.random() * 4,
						repeat: Infinity,
						delay: Math.random() * 5,
						ease: 'easeInOut'
					}}
				/>
			))}

			{/* Scan line effect */}
			<motion.div
				className="absolute inset-0 opacity-30"
				style={{
					background:
						'linear-gradient(0deg, transparent 0%, rgba(17, 193, 213, 0.05) 50%, transparent 100%)',
					height: '200px'
				}}
				animate={{
					y: ['-200px', '100vh']
				}}
				transition={{
					duration: 10,
					repeat: Infinity,
					ease: 'linear'
				}}
			/>
		</div>
	)
}

export default AnimatedBackground
