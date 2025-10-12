import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from 'lib/utils'

interface GlassCardProps {
	children: ReactNode
	blur?: number
	opacity?: number
	border?: boolean
	glow?: boolean
	className?: string
	hover?: boolean
	padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const paddingClasses = {
	none: '',
	sm: 'p-4',
	md: 'p-6',
	lg: 'p-8',
	xl: 'p-10'
}

const GlassCard: React.FC<GlassCardProps> = ({
	children,
	blur = 20,
	opacity = 0.1,
	border = true,
	glow = false,
	className,
	hover = true,
	padding = 'md'
}) => {
	return (
		<motion.div
			className={cn(
				'relative rounded-2xl overflow-hidden',
				paddingClasses[padding],
				border && 'border border-white/10',
				glow && 'shadow-[0_0_30px_rgba(0,217,255,0.3)]',
				className
			)}
			style={{
				background: `rgba(255, 255, 255, ${opacity})`,
				backdropFilter: `blur(${blur}px)`,
				WebkitBackdropFilter: `blur(${blur}px)`
			}}
			whileHover={
				hover
					? {
							scale: 1.02,
							boxShadow: glow
								? '0 0 40px rgba(0, 217, 255, 0.5)'
								: '0 10px 30px rgba(0, 0, 0, 0.3)'
						}
					: {}
			}
			whileTap={hover ? { scale: 0.98 } : {}}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
		>
			{/* Inner glow effect */}
			{glow && (
				<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
			)}

			{/* Content */}
			<div className="relative z-10">{children}</div>
		</motion.div>
	)
}

export default GlassCard
