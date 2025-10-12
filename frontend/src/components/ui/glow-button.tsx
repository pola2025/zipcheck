import { motion } from 'framer-motion'
import { useRef, useEffect, type PointerEvent } from 'react'

type GlowButtonProps = {
	children: React.ReactNode
	onClick?: () => void
	className?: string
	glowColor?: string
	size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
	sm: 'px-6 py-2 text-base',
	md: 'px-12 py-4 text-xl',
	lg: 'px-14 py-6 text-2xl'
}

export default function GlowButton({
	children,
	onClick,
	className = '',
	glowColor = '#0A9DAA',
	size = 'md'
}: GlowButtonProps) {
	const buttonRef = useRef<HTMLButtonElement>(null)
	const rafRef = useRef<number>(0)

	useEffect(() => {
		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current)
			}
		}
	}, [])

	const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
		if (!buttonRef.current) return

		const rect = buttonRef.current.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		if (!rafRef.current) {
			rafRef.current = requestAnimationFrame(() => {
				rafRef.current = 0
				if (buttonRef.current) {
					buttonRef.current.style.setProperty('--mx', `${x}px`)
					buttonRef.current.style.setProperty('--my', `${y}px`)
				}
			})
		}
	}

	return (
		<motion.button
			ref={buttonRef}
			onClick={onClick}
			onPointerMove={handlePointerMove}
			className={`
				glow-button
				relative overflow-hidden rounded-full font-bold text-white
				${sizeConfig[size]}
				${className}
			`}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
			style={{
				// @ts-ignore - CSS variables
				'--mx': '50%',
				'--my': '50%',
				isolation: 'isolate',
				boxShadow: `0 0 40px ${glowColor}60, 0 0 60px ${glowColor}30`,
				background: glowColor
			}}
		>
			{/* Mouse-following bright spotlight effect */}
			<div
				className="flash absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200"
				style={{
					zIndex: 0,
					// @ts-ignore - CSS variables
					background: `radial-gradient(120px 120px at var(--mx) var(--my),
						rgba(255, 196, 120, 0.95) 0%,
						rgba(255, 166, 90, 0.65) 35%,
						rgba(255, 140, 60, 0.28) 55%,
						rgba(255, 120, 40, 0) 70%)`,
					mixBlendMode: 'screen'
				}}
			/>

			{/* Secondary glow layer for depth */}
			<div
				className="flash absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200"
				style={{
					zIndex: 0,
					// @ts-ignore - CSS variables
					background: `radial-gradient(180px 180px at var(--mx) var(--my),
						rgba(255, 255, 255, 0.4) 0%,
						transparent 60%)`,
					mixBlendMode: 'screen'
				}}
			/>

			{/* Content */}
			<span className="relative z-10 drop-shadow-lg">{children}</span>

			{/* Outer glow on hover */}
			<motion.div
				className="absolute -inset-2 rounded-full blur-2xl -z-10"
				style={{
					background: glowColor,
					opacity: 0.4
				}}
				whileHover={{ opacity: 0.8 }}
				transition={{ duration: 0.3 }}
			/>

			<style jsx>{`
				.glow-button:hover .flash,
				.glow-button:focus-visible .flash {
					opacity: 1;
				}

				@media (prefers-reduced-motion: reduce) {
					.flash {
						transition: none !important;
					}
				}

				/* 모바일 터치: 중앙 고정 */
				@media (hover: none) {
					.glow-button {
						--mx: 50%;
						--my: 50%;
					}
				}
			`}</style>
		</motion.button>
	)
}
