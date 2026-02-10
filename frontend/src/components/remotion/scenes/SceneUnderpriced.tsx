import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'

export function SceneUnderpriced({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.underpriced
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const barProgress = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.bouncy })
	const alertOpacity = interpolate(frame, [40, 55], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})
	const alertScale = spring({ frame: frame - 40, fps, config: SPRING_CONFIGS.alert })

	const rangeLeft = 30
	const rangeWidth = 40
	const pricePosition = 12

	const rangeBar = (
		<div className={`w-full ${isDesktop ? 'max-w-xl' : 'max-w-md'}`}>
			<div className="relative bg-sand-100 rounded-xl overflow-visible" style={{ height: isDesktop ? 72 : 56 }}>
				<div
					style={{ left: `${rangeLeft}%`, width: `${rangeWidth * barProgress}%` }}
					className="absolute top-0 h-full bg-forest-100 border-2 border-forest-300 border-dashed rounded-xl"
				/>
				<div
					style={{ left: `${rangeLeft + rangeWidth / 2}%`, opacity: barProgress }}
					className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-forest-600 font-semibold ${isDesktop ? 'text-sm' : 'text-xs'}`}
				>
					적정 범위
				</div>
				<div
					style={{ left: `${pricePosition * barProgress}%`, opacity: barProgress }}
					className="absolute -top-8 -translate-x-1/2"
				>
					<div className="flex flex-col items-center">
						<span className={`text-amber-600 font-bold mb-1 whitespace-nowrap ${isDesktop ? 'text-sm' : 'text-xs'}`}>85만원</span>
						<div className="w-1 h-[72px] bg-amber-500 rounded-full" />
						<div className="w-4 h-4 rounded-full bg-amber-500 -mt-1 border-2 border-white shadow" />
					</div>
				</div>
			</div>
			<div className="flex justify-between mt-2 text-xs text-sand-400">
				<span>낮음</span>
				<span>높음</span>
			</div>
		</div>
	)

	const alertCard = (
		<div
			style={{ opacity: alertOpacity, transform: `scale(${0.8 + alertScale * 0.2})` }}
			className={`bg-amber-50 border-2 border-amber-300 rounded-xl p-4 ${isDesktop ? 'max-w-xl text-left' : 'max-w-md text-center'} w-full mt-6`}
		>
			<span className={`text-amber-700 font-bold ${isDesktop ? 'text-base' : 'text-sm'}`}>
				이 가격이면 자재 등급을 확인하세요
			</span>
			<p className={`text-amber-500 mt-1 ${isDesktop ? 'text-sm' : 'text-xs'}`}>자재 하향 또는 부실시공 리스크</p>
		</div>
	)

	// #29: Left text entrance animation
	const leftEntrance = isDesktop ? spring({ frame, fps, config: SPRING_CONFIGS.gentle }) : 1

	if (isDesktop) {
		return (
			<AbsoluteFill className="flex items-center justify-center bg-sand-50 px-16" style={{ opacity: crossfade }}>
				<div className="flex items-center gap-12 w-full max-w-5xl">
					<div
						className="w-[40%] space-y-4"
						style={{ opacity: leftEntrance, transform: `translateX(${(1 - leftEntrance) * -20}px)` }}
					>
						<p className="text-sand-500 text-sm tracking-wider">도배 (실크벽지)</p>
						<p className="text-sand-800 font-bold text-2xl">항목별 적정가격 범위</p>
						{alertCard}
					</div>
					<div className="w-[60%] flex flex-col items-center">{rangeBar}</div>
				</div>
			</AbsoluteFill>
		)
	}

	return (
		<AbsoluteFill className="flex flex-col items-center justify-center bg-sand-50 px-8" style={{ opacity: crossfade }}>
			<p className="text-sand-500 text-xs mb-2 tracking-wider">도배 (실크벽지)</p>
			<p className="text-sand-800 font-bold text-xl mb-8">항목별 적정가격 범위</p>
			{rangeBar}
			{alertCard}
		</AbsoluteFill>
	)
}
