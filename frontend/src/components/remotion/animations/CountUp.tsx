import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS } from '../constants'
import type { ReactNode } from 'react'

// ─── Counting Number ───

interface CountingNumberProps {
	value: number
	suffix?: string
	prefix?: string
	delay?: number
	className?: string
	/** Number of decimal places (default 0) */
	decimals?: number
	/** Use comma formatting (default true) */
	comma?: boolean
}

/** Animates a number from 0 to target value with eased counting */
export function CountingNumber({
	value,
	suffix = '',
	prefix = '',
	delay = 0,
	className,
	decimals = 0,
	comma = true,
}: CountingNumberProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const duration = 25 // frames to count up
	const progress = interpolate(frame - delay, [0, duration], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	// ease-out curve for natural deceleration
	const eased = 1 - Math.pow(1 - progress, 3)
	const current = eased * value
	const display = decimals > 0
		? current.toFixed(decimals)
		: Math.round(current).toString()

	const formatted = comma
		? display.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		: display

	return <span className={className}>{prefix}{formatted}{suffix}</span>
}

// ─── Bounce Text ───

interface BounceTextProps {
	children: ReactNode
	delay?: number
	className?: string
	/** Scale overshoot amount (default 1.18) */
	peak?: number
}

/** Text that pops in with a bouncy overshoot scale animation */
export function BounceText({ children, delay = 0, className, peak = 1.18 }: BounceTextProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const raw = spring({
		frame: frame - delay,
		fps,
		config: SPRING_CONFIGS.bouncy,
	})

	// Overshoot: scale goes 0 → peak → settle at 1
	const scale = raw <= 0 ? 0 : interpolate(
		raw,
		[0, 0.5, 0.75, 1],
		[0, peak, 0.96, 1],
		{ extrapolateRight: 'clamp' },
	)

	const opacity = interpolate(raw, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

	return (
		<span
			className={className}
			style={{
				display: 'inline-block',
				transform: `scale(${scale})`,
				opacity,
			}}
		>
			{children}
		</span>
	)
}
