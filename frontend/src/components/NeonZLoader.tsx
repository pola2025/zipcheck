import { motion } from 'framer-motion'

interface NeonZLoaderProps {
	size?: number
}

export default function NeonZLoader({ size = 64 }: NeonZLoaderProps) {
	return (
		<div className="relative inline-block" style={{ width: size, height: size }}>
			{/* Neon glow layers */}
			<motion.svg
				className="absolute inset-0"
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				animate={{
					opacity: [0.3, 1, 0.3],
					filter: [
						'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 16px rgba(6, 182, 212, 0.6))',
						'drop-shadow(0 0 16px rgba(6, 182, 212, 1)) drop-shadow(0 0 32px rgba(6, 182, 212, 0.8))',
						'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 16px rgba(6, 182, 212, 0.6))'
					]
				}}
				transition={{
					duration: 1.5,
					repeat: Infinity,
					ease: 'easeInOut'
				}}
			>
				{/* Z shape with gradient */}
				<defs>
					<linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#06b6d4" />
						<stop offset="50%" stopColor="#38ef7d" />
						<stop offset="100%" stopColor="#06b6d4" />
					</linearGradient>
				</defs>
				<path
					d="M20 20 L80 20 L80 35 L40 65 L80 65 L80 80 L20 80 L20 65 L60 35 L20 35 Z"
					fill="url(#neonGradient)"
					strokeWidth="2"
					stroke="#06b6d4"
				/>
			</motion.svg>

			{/* Rotating ring effect */}
			<motion.div
				className="absolute inset-0"
				animate={{ rotate: 360 }}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: 'linear'
				}}
			>
				<svg
					className="w-full h-full"
					viewBox="0 0 100 100"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<circle
						cx="50"
						cy="50"
						r="45"
						stroke="url(#ringGradient)"
						strokeWidth="2"
						strokeDasharray="10 20"
						fill="none"
						opacity="0.6"
					/>
					<defs>
						<linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
							<stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
							<stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
						</linearGradient>
					</defs>
				</svg>
			</motion.div>
		</div>
	)
}
