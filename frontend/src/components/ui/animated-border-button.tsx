import { motion } from 'framer-motion'
import { type ComponentProps } from 'react'

type AnimatedBorderButtonProps = {
	children: React.ReactNode
	onClick?: () => void
	className?: string
	colors?: [string, string, string?]
	size?: 'sm' | 'md' | 'lg'
} & Omit<ComponentProps<'button'>, 'onClick' | 'className'>

const sizeConfig = {
	sm: 'px-6 py-2 text-sm',
	md: 'px-8 py-3 text-base',
	lg: 'px-10 py-4 text-lg'
}

export default function AnimatedBorderButton({
	children,
	onClick,
	className = '',
	colors = ['#0DD4E4', '#C798D4', '#F4D89C'],
	size = 'md',
	...props
}: AnimatedBorderButtonProps) {
	return (
		<div className="relative inline-block rounded-full group">
			{/* Animated rotating gradient border - always on */}
			<motion.div
				className="absolute inset-0 rounded-full opacity-60"
				style={{
					background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2] || colors[0]}, ${colors[0]})`,
					padding: '2px',
					filter: 'blur(8px)'
				}}
				animate={{
					rotate: 360
				}}
				transition={{
					duration: 4,
					repeat: Infinity,
					ease: 'linear'
				}}
			/>

			{/* Sharper border layer */}
			<motion.div
				className="absolute inset-0 rounded-full opacity-80"
				style={{
					background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2] || colors[0]}, ${colors[0]})`,
					padding: '2px'
				}}
				animate={{
					rotate: 360
				}}
				transition={{
					duration: 4,
					repeat: Infinity,
					ease: 'linear'
				}}
			/>

			{/* Button content with mask */}
			<motion.button
				onClick={onClick}
				className={`
					relative bg-black rounded-full font-semibold text-white z-10
					transition-all duration-300
					${sizeConfig[size]}
					${className}
				`}
				style={{
					margin: '2px'
				}}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				{...props}
			>
				<span className="relative z-10">{children}</span>
			</motion.button>
		</div>
	)
}
