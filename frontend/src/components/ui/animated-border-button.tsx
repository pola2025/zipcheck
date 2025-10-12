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
		<div
			className="animated-border-wrapper relative inline-block overflow-visible"
			style={{ isolation: 'isolate' }}
		>
			{/* Rotating outline-only glow using padding-box mask */}
			<motion.div
				aria-hidden
				className="absolute pointer-events-none -z-10"
				style={{
					inset: '-3px',
					borderRadius: '9999px',
					background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2] || colors[0]}, ${colors[0]})`,
					// Padding-box mask for consistent ring thickness
					WebkitMask:
						'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
					mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
					WebkitMaskComposite: 'xor',
					maskComposite: 'exclude',
					padding: '3px',
					filter: 'blur(12px)',
					opacity: 0.7
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

				/* Safari blur optimization */
				@supports (-webkit-touch-callout: none) {
					.animated-border-wrapper div[aria-hidden='true'] {
						filter: blur(9px);
					}
				}
			`}</style>
		</div>
	)
}
