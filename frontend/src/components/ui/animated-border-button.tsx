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
			{/* Animated rotating gradient border - only the gradient rotates */}
			<motion.div
				className="absolute inset-0 rounded-full opacity-60 pointer-events-none"
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

			{/* Sharper border layer - only the gradient rotates */}
			<motion.div
				className="absolute inset-0 rounded-full opacity-80 pointer-events-none"
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

			{/* Button content - stays fixed, never rotates */}
			<button
				onClick={onClick}
				className={`
					relative bg-black rounded-full font-semibold text-white z-10
					transition-transform duration-200
					hover:scale-105 active:scale-95
					${sizeConfig[size]}
					${className}
				`}
				style={{
					margin: '2px',
					transform: 'rotate(0deg)' // Explicitly prevent rotation
				}}
				{...props}
			>
				<span className="block">{children}</span>
			</button>
		</div>
	)
}
