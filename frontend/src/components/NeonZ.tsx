import { motion } from 'framer-motion'

interface NeonZProps {
	size?: number
}

export default function NeonZ({ size = 40 }: NeonZProps) {
	return (
		<div className="relative inline-block" style={{ width: size, height: size }}>
			{/* Neon glow Z */}
			<motion.svg
				className="absolute inset-0"
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				animate={{
					opacity: [0.6, 1, 0.6],
					filter: [
						'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))',
						'drop-shadow(0 0 8px rgba(6, 182, 212, 1)) drop-shadow(0 0 16px rgba(6, 182, 212, 0.8))',
						'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
					]
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: 'easeInOut'
				}}
			>
				{/* Z shape with gradient */}
				<defs>
					<linearGradient id="neonGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#06b6d4" />
						<stop offset="50%" stopColor="#38ef7d" />
						<stop offset="100%" stopColor="#06b6d4" />
					</linearGradient>
				</defs>
				<path
					d="M20 20 L80 20 L80 35 L40 65 L80 65 L80 80 L20 80 L20 65 L60 35 L20 35 Z"
					fill="url(#neonGradientStatic)"
					strokeWidth="2"
					stroke="#06b6d4"
				/>
			</motion.svg>
		</div>
	)
}
