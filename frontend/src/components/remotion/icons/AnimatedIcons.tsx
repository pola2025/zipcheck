interface IconProps {
	progress: number
	size?: number
	className?: string
}

/** Compute strokeDashoffset for draw-in with optional stagger delay (0-1) */
function d(progress: number, delay = 0) {
	const p = delay >= 1 ? 0 : Math.max(0, Math.min(1, (progress - delay) / (1 - delay)))
	return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p }
}

/** Base stroke attributes for premium thin line art */
const S = {
	fill: 'none' as const,
	stroke: 'currentColor',
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
}

/** Fade-in for filled elements */
function fade(progress: number, delay: number) {
	return Math.max(0, Math.min(1, (progress - delay) / (1 - delay)))
}

// ─── Scene 1: Elegant question mark with orbit ring ───
export function IconQuestion({ progress, size = 80, className }: IconProps) {
	return (
		<svg viewBox="0 0 48 64" width={size} height={size * 64 / 48} className={className} style={{ overflow: 'visible' }}>
			<circle cx={24} cy={28} r={22} {...S} strokeWidth={0.75} opacity={0.2} {...d(progress, 0.05)} />
			<path d="M16 18 C16 9 32 9 32 18 C32 25 24 26 24 34" {...S} strokeWidth={2} {...d(progress)} />
			<circle cx={24} cy={42} r={2} fill="currentColor" stroke="none" opacity={fade(progress, 0.65)} />
		</svg>
	)
}

// ─── Scene 2: Abstract comparison bars with dots ───
export function IconCompare({ progress, size = 80, className }: IconProps) {
	return (
		<svg viewBox="0 0 52 44" width={size} height={size * 44 / 52} className={className}>
			<path d="M4 4 L4 40" {...S} strokeWidth={2} {...d(progress)} />
			<path d="M12 12 L36 12" {...S} strokeWidth={1.5} {...d(progress, 0.15)} />
			<path d="M12 22 L26 22" {...S} strokeWidth={1.5} {...d(progress, 0.3)} />
			<path d="M12 32 L46 32" {...S} strokeWidth={1.5} {...d(progress, 0.45)} />
			<circle cx={36} cy={12} r={2.5} fill="currentColor" stroke="none" opacity={fade(progress, 0.4)} />
			<circle cx={26} cy={22} r={2.5} fill="currentColor" stroke="none" opacity={fade(progress, 0.55)} />
			<circle cx={46} cy={32} r={2.5} fill="currentColor" stroke="none" opacity={fade(progress, 0.7)} />
		</svg>
	)
}

// ─── Scene 3: Trend up arrow (overpriced) ───
export function IconTrendUp({ progress, size = 64, className }: IconProps) {
	return (
		<svg viewBox="0 0 48 48" width={size} height={size} className={className}>
			<circle cx={24} cy={24} r={22} {...S} strokeWidth={0.75} opacity={0.2} {...d(progress, 0.05)} />
			<path d="M10 34 L20 22 L28 26 L38 14" {...S} strokeWidth={2} {...d(progress, 0.15)} />
			<path d="M32 14 L38 14 L38 20" {...S} strokeWidth={2} {...d(progress, 0.5)} />
		</svg>
	)
}

// ─── Scene 4: Trend down arrow (underpriced) ───
export function IconTrendDown({ progress, size = 64, className }: IconProps) {
	return (
		<svg viewBox="0 0 48 48" width={size} height={size} className={className}>
			<circle cx={24} cy={24} r={22} {...S} strokeWidth={0.75} opacity={0.2} {...d(progress, 0.05)} />
			<path d="M10 14 L20 26 L28 22 L38 34" {...S} strokeWidth={2} {...d(progress, 0.15)} />
			<path d="M32 34 L38 34 L38 28" {...S} strokeWidth={2} {...d(progress, 0.5)} />
		</svg>
	)
}

// ─── Scene 5: Shield with checkmark ───
export function IconShield({ progress, size = 72, className }: IconProps) {
	return (
		<svg viewBox="0 0 40 48" width={size} height={size * 48 / 40} className={className} style={{ overflow: 'visible' }}>
			<path d="M20 4 L36 12 L36 26 C36 38 20 46 20 46 C20 46 4 38 4 26 L4 12 Z" {...S} strokeWidth={1.5} {...d(progress)} />
			<path d="M13 24 L18 30 L28 18" {...S} strokeWidth={2} {...d(progress, 0.4)} />
		</svg>
	)
}

// ─── Scene 6: Bar chart with checkmark ───
export function IconChart({ progress, size = 64, className }: IconProps) {
	return (
		<svg viewBox="0 0 48 48" width={size} height={size} className={className}>
			<path d="M6 42 L42 42" {...S} strokeWidth={1.5} {...d(progress)} />
			<path d="M14 42 L14 28" {...S} strokeWidth={5} {...d(progress, 0.15)} />
			<path d="M24 42 L24 16" {...S} strokeWidth={5} {...d(progress, 0.3)} />
			<path d="M34 42 L34 22" {...S} strokeWidth={5} {...d(progress, 0.45)} />
			<path d="M30 8 L34 12 L42 4" {...S} strokeWidth={2} {...d(progress, 0.6)} />
		</svg>
	)
}

// ─── Scene 7: Forward arrow with orbit ───
export function IconArrowForward({ progress, size = 64, className }: IconProps) {
	return (
		<svg viewBox="0 0 48 40" width={size} height={size * 40 / 48} className={className} style={{ overflow: 'visible' }}>
			<circle cx={24} cy={20} r={18} {...S} strokeWidth={0.75} opacity={0.2} {...d(progress, 0.05)} />
			<path d="M12 20 L36 20" {...S} strokeWidth={2} {...d(progress, 0.2)} />
			<path d="M28 12 L36 20 L28 28" {...S} strokeWidth={2} {...d(progress, 0.4)} />
		</svg>
	)
}
