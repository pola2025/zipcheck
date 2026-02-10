import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { IconArrowForward } from '../icons/AnimatedIcons'
import { FilmGrain } from '../backgrounds/Textures'

export function SceneCTA({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const isDesktop = variant === 'desktop'

	const fadeIn = interpolate(frame, [0, 15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const mainProgress = spring({ frame, fps, config: SPRING_CONFIGS.elegant })
	const iconProgress = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.elegant })
	const buttonPulse = interpolate(frame % 45, [0, 22, 45], [1, 1.04, 1])

	const { duration } = SCENE_TIMINGS.cta

	// Mesh gradient drift values
	const meshDriftA = interpolate(frame, [0, duration], [0, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
	const meshDriftB = interpolate(frame, [0, duration], [0, 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

	// Decorative floating dots (enhanced: 8 dots, higher opacity)
	const dots = [
		{ x: '15%', y: '22%', size: 3, delay: 8 },
		{ x: '82%', y: '28%', size: 2, delay: 16 },
		{ x: '22%', y: '78%', size: 2, delay: 24 },
		{ x: '80%', y: '72%', size: 3, delay: 12 },
		{ x: '50%', y: '12%', size: 2, delay: 20 },
		{ x: '10%', y: '50%', size: 2, delay: 6 },
		{ x: '90%', y: '48%', size: 2, delay: 14 },
		{ x: '40%', y: '85%', size: 3, delay: 22 },
	]

	return (
		<AbsoluteFill
			className={`flex flex-col items-center justify-center ${isDesktop ? 'px-24' : 'px-8'}`}
			style={{
				opacity: fadeIn,
				background: 'linear-gradient(160deg, #2E4628 0%, #3D5A35 40%, #4A6741 100%)',
			}}
		>
			{/* Radial glow behind CTA */}
			<div className="absolute inset-0 pointer-events-none" style={{
				background: 'radial-gradient(ellipse 40% 35% at 50% 55%, rgba(255,255,255,0.06) 0%, transparent 70%)',
			}} />

			{/* Mesh gradient (two overlapping radials with drift) */}
			{isDesktop && (
				<>
					<div className="absolute inset-0 pointer-events-none" style={{
						background: `radial-gradient(ellipse 35% 45% at ${35 + meshDriftA}% 40%, rgba(190,169,142,0.06) 0%, transparent 70%), radial-gradient(ellipse 30% 35% at ${65 - meshDriftB}% 65%, rgba(74,103,65,0.08) 0%, transparent 70%)`,
					}} />
					<FilmGrain opacity={0.03} />
				</>
			)}

			{/* Floating decorative dots (enhanced) */}
			{isDesktop && dots.map((dot, i) => {
				const dotOpacity = interpolate(frame, [dot.delay, dot.delay + 15], [0, 0.15], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
				return (
					<div
						key={i}
						className="absolute rounded-full bg-white pointer-events-none"
						style={{
							left: dot.x,
							top: dot.y,
							width: dot.size,
							height: dot.size,
							opacity: dotOpacity,
						}}
					/>
				)
			})}

			<div
				className="text-center relative z-10"
				style={{ opacity: mainProgress, transform: `translateY(${(1 - mainProgress) * 30}px)` }}
			>
				{/* Icon */}
				<div className="flex justify-center mb-5">
					<IconArrowForward
						progress={iconProgress}
						size={isDesktop ? 48 : 36}
						className="text-forest-200 opacity-60"
					/>
				</div>

				<p className={`text-forest-200 mb-3 ${isDesktop ? 'text-xl' : 'text-[10px]'}`}>인테리어 유통망 원가 기반</p>

				{/* Gold accent line */}
				<div
					className="mx-auto mb-5 h-[1px]"
					style={{
						width: `${mainProgress * 48}px`,
						background: 'linear-gradient(90deg, transparent, #BEA98E, transparent)',
					}}
				/>

				<h2 className={`text-white font-bold mb-2 ${isDesktop ? 'text-6xl' : 'text-xl'}`}>
					내 견적서, 적정가인지<br />확인해보세요
				</h2>
				<p className={`text-forest-200 mb-8 ${isDesktop ? 'text-xl' : 'text-[10px]'}`}>업로드만 하면 항목별 리스크를 분석해드립니다</p>

				{/* CTA Button with glow */}
				<div className="relative inline-block" style={{ transform: `scale(${buttonPulse})` }}>
					{/* Button glow halo */}
					<div
						className="absolute inset-0 rounded-full pointer-events-none"
						style={{
							background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
							transform: 'scale(1.8)',
						}}
					/>
					<div className={`relative inline-block bg-white text-forest-700 font-bold rounded-full shadow-lg ${isDesktop ? 'px-14 py-5 text-2xl' : 'px-6 py-2.5 text-sm'}`}>
						내 견적서 분석받기 &rarr;
					</div>
				</div>
			</div>
		</AbsoluteFill>
	)
}
