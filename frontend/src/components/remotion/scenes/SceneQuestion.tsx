import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { IconQuestion } from '../icons/AnimatedIcons'

export function SceneQuestion({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.question
	const isDesktop = variant === 'desktop'

	const fadeOut = interpolate(frame, [duration - 15, duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
	const titleY = spring({ frame, fps, config: SPRING_CONFIGS.elegant }) * 30 - 30
	const iconProgress = spring({ frame: frame - 2, fps, config: SPRING_CONFIGS.elegant })
	const lineWidth = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.elegant })

	// Slow gradient drift for living background feel
	const driftX = interpolate(frame, [0, duration], [0, 12], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	return (
		<AbsoluteFill
			className="flex items-center justify-center"
			style={{
				opacity: fadeOut,
				background: isDesktop
					? 'linear-gradient(135deg, #FEFCF9 0%, #F0F5EE 60%, #E1EBDD 100%)'
					: '#FEFCF9',
			}}
		>
			{/* Subtle warm radial glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(190,169,142,0.07) 0%, transparent 70%)',
				}}
			/>

			{/* Slow diagonal gradient drift (desktop only) */}
			{isDesktop && (
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						background: 'linear-gradient(135deg, rgba(190,169,142,0.05) 0%, transparent 50%)',
						transform: `translateX(${driftX}px)`,
					}}
				/>
			)}

			<div
				style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }}
				className={`text-center ${isDesktop ? 'px-24' : 'px-8'}`}
			>
				{/* SVG Icon */}
				<div className="flex justify-center mb-5">
					<IconQuestion
						progress={iconProgress}
						size={isDesktop ? 64 : 44}
						className="text-forest-400 opacity-80"
					/>
				</div>

				{/* Gold gradient accent line */}
				<div
					className="mx-auto mb-5 h-[2px] rounded-full"
					style={{
						width: `${lineWidth * (isDesktop ? 64 : 40)}px`,
						background: 'linear-gradient(90deg, transparent, #BEA98E, transparent)',
					}}
				/>

				<p className={`text-forest-600 font-semibold mb-4 tracking-[0.2em] ${isDesktop ? 'text-xl' : 'text-xs'}`}>
					QUESTION
				</p>
				<h2 className={`font-bold text-sand-900 leading-tight ${isDesktop ? 'text-7xl' : 'text-[22px]'}`}>
					견적서 받았는데...<br />
					<span className="text-forest-600">이게 적정 가격인지</span><br />어떻게 알죠?
				</h2>
			</div>
		</AbsoluteFill>
	)
}
