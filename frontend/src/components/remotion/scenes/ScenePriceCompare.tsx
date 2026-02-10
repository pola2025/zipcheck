import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'

export function ScenePriceCompare({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.priceCompare
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const companies = [
		{ name: 'A 업체', price: '2,800만원', delay: 0 },
		{ name: 'B 업체', price: '1,900만원', delay: 10 },
		{ name: 'C 업체', price: '3,200만원', delay: 20 },
	]

	const questionOpacity = interpolate(frame, [50, 65], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const barSection = (
		<div className={`flex flex-col gap-3 w-full ${isDesktop ? 'max-w-xl' : 'max-w-md'}`}>
			{companies.map((c, i) => {
				const progress = spring({ frame: frame - c.delay, fps, config: SPRING_CONFIGS.snappy })
				const opacity = interpolate(frame, [c.delay, c.delay + 10], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
				const scaleX = interpolate(progress, [0, 1], [0, 1])

				return (
					<div key={i} style={{ opacity }} className="flex items-center gap-3">
						<span className={`text-sand-600 w-16 shrink-0 ${isDesktop ? 'text-lg' : 'text-sm'}`}>{c.name}</span>
						<div className={`flex-1 bg-sand-200 rounded-full overflow-hidden relative ${isDesktop ? 'h-14' : 'h-10'}`}>
							<div
								style={{ transform: `scaleX(${scaleX})`, transformOrigin: 'left' }}
								className={`h-full rounded-full ${i === 1 ? 'bg-amber-400' : i === 2 ? 'bg-red-400' : 'bg-forest-400'}`}
							/>
						</div>
						<span className={`text-sand-800 font-bold w-24 text-right ${isDesktop ? 'text-lg' : 'text-sm'}`}>{c.price}</span>
					</div>
				)
			})}
		</div>
	)

	const questionText = (
		<p style={{ opacity: questionOpacity }} className={`text-sand-700 ${isDesktop ? 'text-xl' : 'text-base'} ${isDesktop ? 'text-left' : 'text-center'}`}>
			같은 평수, 같은 공사인데<br />
			<span className="font-semibold text-sand-900">왜 이렇게 다를까?</span>
		</p>
	)

	// #29: Left text entrance animation for desktop 2-column
	const leftEntrance = isDesktop ? spring({ frame, fps, config: SPRING_CONFIGS.gentle }) : 1

	if (isDesktop) {
		return (
			<AbsoluteFill className="flex items-center justify-center bg-sand-50 px-16" style={{ opacity: crossfade }}>
				<div className="flex items-center gap-12 w-full max-w-5xl">
					{/* Left: text (40%) */}
					<div
						className="w-[40%] space-y-4"
						style={{ opacity: leftEntrance, transform: `translateX(${(1 - leftEntrance) * -20}px)` }}
					>
						<p className="text-sand-500 text-base tracking-wider">25평 아파트 전체 리모델링</p>
						{/* #31: Enriched left text with subtitle */}
						<p className="text-sand-800 font-bold text-3xl">같은 공사, 다른 견적</p>
						{questionText}
					</div>
					{/* Right: bars (60%) */}
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
