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

	const handlePointerLeave = () => {
		if (buttonRef.current) {
			buttonRef.current.style.setProperty('--mx', '50%')
			buttonRef.current.style.setProperty('--my', '50%')
		}
	}

	return (
		<div
			className={`relative ${className.includes('w-full') ? 'block' : 'inline-block'} overflow-visible ${className}`}
			style={{ isolation: 'isolate' }}
		>
			{/* Outer glow - outside button to prevent clipping */}
			<motion.div
				aria-hidden
				className="absolute -inset-3 rounded-full -z-10 pointer-events-none"
				style={{
					background: glowColor,
					opacity: 0.35,
					filter: 'blur(20px)'
				}}
				whileHover={{ opacity: 0.7 }}
				transition={{ duration: 0.25 }}
			/>

			{/* Button with internal spotlight effects */}
			<motion.button
				ref={buttonRef}
				onClick={onClick}
				onPointerMove={handlePointerMove}
				onPointerLeave={handlePointerLeave}
				className={`
					glow-button
					relative overflow-hidden rounded-full font-bold text-white transform-gpu
					${sizeConfig[size]}
					${className.includes('w-full') ? 'w-full' : ''}
				`}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				transition={{ type: 'spring', stiffness: 400, damping: 17 }}
				style={{
					// @ts-ignore - CSS variables
					'--mx': '50%',
					'--my': '50%',
					background: glowColor,
					boxShadow: `0 2px 10px ${glowColor}55, inset 0 0 0 1px #00000010`,
					willChange: 'transform'
				}}
			>
				{/* Spotlight layer 1 - warm core */}
				<div
					aria-hidden
					className="flash absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200"
					style={{
						// @ts-ignore - CSS variables
						background: `radial-gradient(110px 110px at var(--mx) var(--my),
							rgba(255, 196, 120, 0.95) 0%,
							rgba(255, 166, 90, 0.65) 35%,
							rgba(255, 140, 60, 0.25) 55%,
							rgba(255, 120, 40, 0) 70%)`,
						mixBlendMode: 'screen'
					}}
				/>

				{/* Spotlight layer 2 - soft ring */}
				<div
					aria-hidden
					className="flash absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200"
					style={{
						// @ts-ignore - CSS variables
						background: `radial-gradient(160px 160px at var(--mx) var(--my),
							rgba(255, 255, 255, 0.35) 0%,
							transparent 60%)`,
						mixBlendMode: 'screen'
					}}
				/>

				{/* Label */}
				<span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]">
					{children}
				</span>

				<style jsx>{`
					.glow-button:hover .flash,
					.glow-button:focus-visible .flash {
						opacity: 1;
					}

					.glow-button:focus-visible {
						outline: 2px solid #fff;
						outline-offset: 2px;
					}

					/* 모바일 터치: 기본적으로 약한 섬광 보이기 */
					@media (hover: none) {
						.glow-button {
							--mx: 50%;
							--my: 50%;
						}
						.glow-button .flash {
							opacity: 0.7;
						}
					}

					@media (prefers-reduced-motion: reduce) {
						.glow-button,
						.glow-button .flash {
							transition: none !important;
						}
					}
				`}</style>
			</motion.button>
		</div>
	)
}
