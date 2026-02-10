import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'
import { IconCompare } from '../icons/AnimatedIcons'
import { DotGrid, ScanLine } from '../backgrounds/Textures'
import { CountingNumber } from '../animations/CountUp'

export function ScenePriceCompare({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.priceCompare
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const iconProgress = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.elegant })

	const companies = [
		{ name: 'A 업체', value: 2800, suffix: '만원', width: 70, gradient: 'linear-gradient(90deg, #4A6741, #5C8A55)', delay: 0 },
		{ name: 'B 업체', value: 1900, suffix: '만원', width: 48, gradient: 'linear-gradient(90deg, #C4A850, #D4B860)', delay: 10 },
		{ name: 'C 업체', value: 3200, suffix: '만원', width: 85, gradient: 'linear-gradient(90deg, #C45C5C, #D47373)', delay: 20 },
	]

	const questionOpacity = interpolate(frame, [50, 65], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const barSection = (
		<div className={`flex flex-col w-full ${isDesktop ? 'gap-5 max-w-2xl' : 'gap-3 max-w-md'}`}>
			{companies.map((c, i) => {
				const progress = spring({ frame: frame - c.delay, fps, config: SPRING_CONFIGS.confident })
				const opacity = interpolate(frame, [c.delay, c.delay + 10], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
				const scaleX = interpolate(progress, [0, 1], [0, c.width / 100])

				return (
					<div key={i} style={{ opacity }} className="flex items-center gap-4">
						<span className={`text-sand-800 font-medium shrink-0 ${isDesktop ? 'text-xl w-20' : 'text-sm w-16'}`}>{c.name}</span>
						<div
							className={`flex-1 rounded-full overflow-hidden relative ${isDesktop ? 'h-14' : 'h-10'}`}
							style={{ background: 'rgba(0,0,0,0.04)' }}
						>
							<div
								style={{ transform: `scaleX(${scaleX})`, transformOrigin: 'left', background: c.gradient }}
								className="h-full rounded-full"
							/>
						</div>
						<span className={`text-sand-900 font-bold shrink-0 text-right ${isDesktop ? 'text-xl w-28' : 'text-sm w-24'}`}>
							<CountingNumber value={c.value} suffix={c.suffix} delay={c.delay} comma />
						</span>
					</div>
				)
			})}
		</div>
	)

	const questionText = (
		<p style={{ opacity: questionOpacity }} className={`text-sand-700 ${isDesktop ? 'text-2xl text-left' : 'text-base text-center'}`}>
			같은 평수, 같은 공사인데<br />
			<span className="font-semibold text-sand-900">왜 이렇게 다를까?</span>
		</p>
	)

	const leftEntrance = isDesktop ? spring({ frame, fps, config: SPRING_CONFIGS.elegant }) : 1

	if (isDesktop) {
		return (
			<AbsoluteFill className="flex items-center justify-center bg-sand-50 px-16" style={{ opacity: crossfade }}>
				{/* Subtle background glow */}
				<div className="absolute inset-0 pointer-events-none" style={{
					background: 'radial-gradient(ellipse 40% 50% at 65% 50%, rgba(74,103,65,0.04) 0%, transparent 70%)',
				}} />

				{/* Data grid texture + scan line */}
				<DotGrid color="#4A6741" dotSize={0.8} spacing={24} opacity={0.03} />
				<ScanLine duration={duration} />

				<div className="flex items-center gap-14 w-full max-w-5xl">
					<div
						className="w-[40%] space-y-5"
						style={{ opacity: leftEntrance, transform: `translateX(${(1 - leftEntrance) * -20}px)` }}
					>
						<div className="flex items-center gap-3">
							<IconCompare progress={iconProgress} size={32} className="text-forest-500 opacity-70" />
							<div className="flex items-center gap-3">
								<div className="w-[2px] h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #BEA98E, transparent)' }} />
								<p className="text-forest-600 text-lg font-medium tracking-wider">25평 아파트 전체 리모델링</p>
							</div>
						</div>
						<p className="text-sand-900 font-bold text-4xl leading-tight">같은 공사,<br />다른 견적</p>
						{questionText}
					</div>
					<div className="w-[60%]">{barSection}</div>
				</div>
			</AbsoluteFill>
		)
	}

	return (
		<AbsoluteFill className="flex flex-col items-center justify-center bg-sand-50 px-8" style={{ opacity: crossfade }}>
			<p className="text-sand-500 text-xs mb-6 tracking-wider">25평 아파트 전체 리모델링</p>
			{barSection}
			<div className="mt-8">{questionText}</div>
		</AbsoluteFill>
	)
}
