import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'
import { IconTrendDown } from '../icons/AnimatedIcons'
import { HorizontalLines } from '../backgrounds/Textures'
import { CountingNumber } from '../animations/CountUp'

export function SceneUnderpriced({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.underpriced
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const iconProgress = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.elegant })
	const barProgress = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.confident })
	const alertOpacity = interpolate(frame, [40, 55], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})
	const alertScale = spring({ frame: frame - 40, fps, config: SPRING_CONFIGS.elegant })

	const rangeLeft = 30
	const rangeWidth = 40
	const pricePosition = 12

	const rangeBar = (
		<div className={`w-full ${isDesktop ? 'max-w-2xl' : 'max-w-md'}`}>
			<div className="relative rounded-xl overflow-visible" style={{ height: isDesktop ? 80 : 56, background: 'rgba(0,0,0,0.03)' }}>
				<div
					style={{ left: `${rangeLeft}%`, width: `${rangeWidth * barProgress}%` }}
					className="absolute top-0 h-full bg-forest-50 border-2 border-forest-200 border-dashed rounded-xl"
				/>
				<div
					style={{ left: `${rangeLeft + rangeWidth / 2}%`, opacity: barProgress }}
					className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-forest-700 font-semibold ${isDesktop ? 'text-lg' : 'text-xs'}`}
				>
					적정 범위
				</div>
				<div
					style={{ left: `${pricePosition * barProgress}%`, opacity: barProgress }}
					className="absolute -top-8 -translate-x-1/2"
				>
					<div className="flex flex-col items-center">
						<span className={`text-amber-600 font-bold mb-1 whitespace-nowrap ${isDesktop ? 'text-lg' : 'text-xs'}`}>
							<CountingNumber value={85} suffix="만원" delay={5} />
						</span>
						<div className="w-[2px] rounded-full" style={{ height: isDesktop ? 80 : 72, background: 'linear-gradient(180deg, #C4A850, transparent)' }} />
						<div className="w-4 h-4 rounded-full bg-amber-500 -mt-1 border-2 border-white shadow-md" />
					</div>
				</div>
			</div>
			<div className={`flex justify-between mt-3 text-sand-400 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
				<span>낮음</span>
				<span>높음</span>
			</div>
		</div>
	)

	const alertCard = (
		<div
			style={{
				opacity: alertOpacity,
				transform: `scale(${0.85 + alertScale * 0.15})`,
				borderLeft: '3px solid #C4A850',
				background: 'rgba(196, 168, 80, 0.06)',
			}}
			className={`rounded-xl ${isDesktop ? 'max-w-2xl text-left p-5' : 'max-w-md text-center p-4'} w-full mt-6`}
		>
			<span className={`text-amber-700 font-bold ${isDesktop ? 'text-xl' : 'text-sm'}`}>
				이 가격이면 자재 등급을 확인하세요
			</span>
			<p className={`text-amber-600 mt-1 ${isDesktop ? 'text-lg' : 'text-xs'}`}>자재 하향 또는 부실시공 리스크</p>
		</div>
	)

	const leftEntrance = isDesktop ? spring({ frame, fps, config: SPRING_CONFIGS.elegant }) : 1

	if (isDesktop) {
		return (
			<AbsoluteFill className="flex items-center justify-center bg-white px-16" style={{ opacity: crossfade }}>
				{/* Drifting amber radial glow (downward motion) */}
				<div className="absolute inset-0 pointer-events-none" style={{
					background: 'radial-gradient(ellipse 40% 40% at 70% 50%, rgba(196,168,80,0.05) 0%, transparent 70%)',
					transform: `translateY(${interpolate(frame, [0, duration], [-5, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%)`,
				}} />

				{/* Horizontal caution lines */}
				<HorizontalLines color="#C4A850" opacity={0.02} spacing={24} />

				<div className="flex items-center gap-14 w-full max-w-5xl">
					<div
						className="w-[40%] space-y-5"
						style={{ opacity: leftEntrance, transform: `translateX(${(1 - leftEntrance) * -20}px)` }}
					>
						<div className="flex items-center gap-3">
							<IconTrendDown progress={iconProgress} size={32} className="text-amber-500 opacity-70" />
							<div className="flex items-center gap-3">
								<div className="w-[2px] h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #C4A850, transparent)' }} />
								<p className="text-sand-700 text-lg font-medium tracking-wider">도배 (실크벽지)</p>
							</div>
						</div>
						<p className="text-sand-900 font-bold text-4xl leading-tight">항목별<br />적정가격 범위</p>
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
