import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'

export function SceneQuestion({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.question
	const isDesktop = variant === 'desktop'

	// Fade-out only (first scene, no fade-in needed)
	const fadeOut = interpolate(frame, [duration - 15, duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
	const titleY = spring({ frame, fps, config: SPRING_CONFIGS.bouncy }) * 30 - 30

	return (
		<AbsoluteFill className="flex items-center justify-center bg-sand-50" style={{ opacity: fadeOut }}>
			<div
				style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }}
				className={`text-center ${isDesktop ? 'px-20' : 'px-8'}`}
			>
				<p className={`text-sand-500 font-medium mb-3 tracking-wider ${isDesktop ? 'text-base' : 'text-sm'}`}>
					QUESTION
				</p>
				<h2 className={`font-bold text-sand-900 leading-tight ${isDesktop ? 'text-5xl' : 'text-3xl'}`}>
					견적서 받았는데...<br />
					<span className="text-forest-600">이게 적정 가격인지</span> 어떻게 알죠?
				</h2>
			</div>
		</AbsoluteFill>
	)
}
