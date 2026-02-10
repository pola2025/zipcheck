import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'
import { IconTrendUp } from '../icons/AnimatedIcons'
import { DiagonalLines } from '../backgrounds/Textures'
import { CountingNumber } from '../animations/CountUp'

export function SceneOverpriced({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.overpriced
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const iconProgress = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.elegant })
	const barProgress = spring({ frame: frame - 10, fps, config: SPRING_CONFIGS.confident })
	const alertOpacity = interpolate(frame, [45, 60], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})
	const alertScale = spring({ frame: frame - 45, fps, config: SPRING_CONFIGS.elegant })

	const rangeLeft = 25
	const rangeWidth = 45
	const pricePosition = 82

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
						<span className={`text-red-500 font-bold mb-1 whitespace-nowrap ${isDesktop ? 'text-lg' : 'text-xs'}`}>
							<CountingNumber value={450} suffix="만원" delay={10} />
						</span>
						<div className="w-[2px] rounded-full" style={{ height: isDesktop ? 80 : 72, background: 'linear-gradient(180deg, #C45C5C, transparent)' }} />
						<div className="w-4 h-4 rounded-full bg-red-500 -mt-1 border-2 border-white shadow-md" />
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
				borderLeft: '3px solid #C45C5C',
				background: 'rgba(196, 92, 92, 0.06)',
			}}
			className={`rounded-xl ${isDesktop ? 'max-w-2xl text-left p-5' : 'max-w-md text-center p-4'} w-full mt-6`}
		>
			<span className={`text-red-600 font-bold ${isDesktop ? 'text-xl' : 'text-sm'}`}>
				이 자재 기준, 가격이 과다합니다
			</span>
			<p className={`text-red-400 mt-1 ${isDesktop ? 'text-lg' : 'text-xs'}`}>유통망 원가 대비 <CountingNumber value={42} suffix="%" delay={50} comma={false} /> 초과</p>
		</div>
	)

	const leftEntrance = isDesktop ? spring({ frame, fps, config: SPRING_CONFIGS.elegant }) : 1

	if (isDesktop) {
		return (
			<AbsoluteFill className="flex items-center justify-center bg-white px-16" style={{ opacity: crossfade }}>
				{/* Subtle red radial glow (static) */}
				<div className="absolute inset-0 pointer-events-none" style={{
					background: 'radial-gradient(ellipse 40% 40% at 70% 50%, rgba(196,92,92,0.04) 0%, transparent 70%)',
				}} />

				{/* Diagonal warning lines */}
				<DiagonalLines color="#C45C5C" opacity={0.02} spacing={20} />

				<div className="flex items-center gap-14 w-full max-w-5xl">
					<div
						className="w-[40%] space-y-5"
						style={{ opacity: leftEntrance, transform: `translateX(${(1 - leftEntrance) * -20}px)` }}
					>
						<div className="flex items-center gap-3">
							<IconTrendUp progress={iconProgress} size={32} className="text-red-400 opacity-70" />
							<div className="flex items-center gap-3">
								<div className="w-[2px] h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #C45C5C, transparent)' }} />
								<p className="text-sand-700 text-lg font-medium tracking-wider">바닥재 (강마루)</p>
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
			<p className="text-sand-500 text-xs mb-2 tracking-wider">바닥재 (강마루)</p>
			<p className="text-sand-800 font-bold text-xl mb-8">항목별 적정가격 범위</p>
			{rangeBar}
			{alertCard}
		</AbsoluteFill>
	)
}
