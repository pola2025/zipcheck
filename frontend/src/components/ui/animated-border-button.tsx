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
		<div className="relative inline-block" style={{ zIndex: 0 }}>
			{/* Rotating outline-only glow using mask */}
			<motion.div
				className="absolute pointer-events-none"
				style={{
					inset: '-3px',
					borderRadius: '9999px',
					background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2] || colors[0]}, ${colors[0]})`,
					WebkitMask: 'radial-gradient(circle, transparent calc(100% - 3px), #000 calc(100% - 2px))',
					mask: 'radial-gradient(circle, transparent calc(100% - 3px), #000 calc(100% - 2px))',
					filter: 'blur(14px)',
					opacity: 0.7,
					zIndex: -1
				}}
				animate={{
					rotate: 360
				}}
				transition={{
					duration: 8,
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
					motion-reduce:transition-none
					${sizeConfig[size]}
					${className}
				`}
				style={{
					border: `1px solid ${colors[0]}40`,
					zIndex: 1
				}}
				{...props}
			>
				<span className="block">{children}</span>
			</button>

			<style jsx>{`
				@media (prefers-reduced-motion: reduce) {
					.motion-reduce\\:transition-none {
						transition: none !important;
					}
				}
			`}</style>
		</div>
	)
}
