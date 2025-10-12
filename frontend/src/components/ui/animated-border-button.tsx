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
			{/* Rotating border glow - outer blur */}
			<motion.div
				className="absolute pointer-events-none"
				style={{
					inset: '-2px',
					borderRadius: '9999px',
					background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2] || colors[0]}, ${colors[0]})`,
					filter: 'blur(20px)',
					zIndex: -1
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

			{/* Rotating border - sharp edge */}
			<motion.div
				className="absolute pointer-events-none"
				style={{
					inset: '-1px',
					borderRadius: '9999px',
					background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2] || colors[0]}, ${colors[0]})`,
					filter: 'blur(8px)',
					opacity: 0.9,
					zIndex: -1
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

			{/* Button content - stays fixed */}
			<button
				onClick={onClick}
				className={`
					relative bg-black rounded-full font-semibold text-white
					transition-transform duration-200
					active:scale-95
					${sizeConfig[size]}
					${className}
				`}
				style={{
					border: `1px solid ${colors[0]}40`
				}}
				{...props}
			>
				<span className="block">{children}</span>
			</button>
		</div>
	)
}
