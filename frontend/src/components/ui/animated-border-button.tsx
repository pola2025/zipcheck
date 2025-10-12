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
	const gradient = colors.length === 2
		? `${colors[0]}, ${colors[1]}, ${colors[0]}`
		: `${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]}`

	return (
		<div className="relative inline-block p-[2px] rounded-full group">
			{/* Animated rotating gradient border */}
			<div
				className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
				style={{
					background: `conic-gradient(from 0deg, ${gradient})`,
					animation: 'rotate 3s linear infinite'
				}}
			/>

			{/* Static gradient border (visible when not hovering) */}
			<div
				className="absolute inset-0 rounded-full opacity-100 group-hover:opacity-0 transition-opacity duration-500"
				style={{
					background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
				}}
			/>

			{/* Button content */}
			<motion.button
				onClick={onClick}
				className={`
					relative bg-black rounded-full font-semibold text-white
					transition-all duration-300
					${sizeConfig[size]}
					${className}
				`}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				{...props}
			>
				<span className="relative z-10">{children}</span>
			</motion.button>

			<style>{`
				@keyframes rotate {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}
			`}</style>
		</div>
	)
}
