import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'
import { IconShield } from '../icons/AnimatedIcons'
import { FilmGrain, Vignette } from '../backgrounds/Textures'

export function SceneMessage({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.message
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const iconProgress = spring({ frame: frame - 10, fps, config: SPRING_CONFIGS.elegant })
	const line1 = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.elegant })
	const line2 = spring({ frame: frame - 30, fps, config: SPRING_CONFIGS.elegant })
	const line3 = spring({ frame: frame - 60, fps, config: SPRING_CONFIGS.confident })
	const bridgeOpacity = spring({ frame: frame - (duration - 40), fps, config: SPRING_CONFIGS.elegant })

	return (
		<AbsoluteFill
			className={`flex flex-col items-center justify-center ${isDesktop ? 'px-24' : 'px-8'}`}
			style={{
				opacity: crossfade,
				background: isDesktop
					? 'linear-gradient(160deg, #2E4628 0%, #3D5A35 50%, #4A6741 100%)'
					: '#3D5A35',
			}}
		>
			{/* Radial light from center */}
			<div className="absolute inset-0 pointer-events-none" style={{
				background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(255,255,255,0.05) 0%, transparent 70%)',
			}} />

			{/* Film grain + mesh gradient + vignette (desktop only) */}
			{isDesktop && (
				<>
					<FilmGrain opacity={0.03} />
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							background: `radial-gradient(ellipse 30% 40% at ${30 + interpolate(frame, [0, duration], [0, 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}% 30%, rgba(190,169,142,0.06) 0%, transparent 70%)`,
						}}
					/>
					<Vignette />
				</>
			)}

			{/* Large subtle shield icon in background */}
			{isDesktop && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.04 }}>
					<IconShield progress={iconProgress} size={320} className="text-white" />
				</div>
			)}

			<div className={`text-center space-y-7 ${isDesktop ? 'max-w-3xl' : 'max-w-lg'} relative z-10`}>
				<p
					style={{ opacity: line1, transform: `translateY(${(1 - line1) * 20}px)` }}
					className={`text-forest-200 ${isDesktop ? 'text-3xl' : 'text-lg'}`}
				>
					저희는 인테리어 업체가 아닙니다
				</p>

				{/* Gold decorative line */}
				<div
					className="mx-auto h-[1px]"
					style={{
						width: `${line2 * 80}px`,
						background: 'linear-gradient(90deg, transparent, #BEA98E, transparent)',
						opacity: line2,
					}}
				/>

				<p
					style={{ opacity: line2, transform: `translateY(${(1 - line2) * 15}px)` }}
					className={`text-white font-medium ${isDesktop ? 'text-4xl' : 'text-xl'}`}
				>
					소비자가 적정 가격에<br />공사받을 수 있도록
				</p>
				<div style={{ opacity: line3, transform: `scale(${0.9 + line3 * 0.1})` }}>
					<p className={`text-forest-200 ${isDesktop ? 'text-3xl' : 'text-lg'}`}>
						유통망 가격 기반
					</p>
					<p className={`text-white font-bold mt-1 ${isDesktop ? 'text-5xl' : 'text-2xl'}`}>
						인테리어 견적 분석
					</p>
				</div>
			</div>

			<p
				style={{ opacity: bridgeOpacity }}
				className={`mt-12 text-forest-300 ${isDesktop ? 'text-xl' : 'text-sm'} relative z-10`}
			>
				어떻게 분석할까요?
			</p>
		</AbsoluteFill>
	)
}
