import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps, StatusType } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'
import { IconChart } from '../icons/AnimatedIcons'
import { CountingNumber } from '../animations/CountUp'
import { DotGrid } from '../backgrounds/Textures'

interface ResultItem {
	name: string
	status: StatusType
	label: string
	price: string
	range: string
}

const ITEMS_MOBILE: ResultItem[] = [
	{ name: '바닥재 (강마루)', status: 'danger', label: '과다', price: '450만', range: '280~350만' },
	{ name: '도배 (실크벽지)', status: 'warning', label: '점검', price: '85만', range: '120~160만' },
	{ name: '주방 (싱크대)', status: 'ok', label: '적정', price: '320만', range: '280~380만' },
]

const ITEMS_DESKTOP: ResultItem[] = [
	...ITEMS_MOBILE,
	{ name: '욕실 (타일)', status: 'ok', label: '적정', price: '190만', range: '150~220만' },
]

const ACCENT: Record<StatusType, { solid: string; bg: string; border: string; text: string }> = {
	danger: { solid: '#C45C5C', bg: 'rgba(196,92,92,0.06)', border: 'rgba(196,92,92,0.15)', text: 'text-red-500' },
	warning: { solid: '#C4A850', bg: 'rgba(196,168,80,0.06)', border: 'rgba(196,168,80,0.15)', text: 'text-amber-600' },
	ok: { solid: '#4A6741', bg: 'rgba(74,103,65,0.06)', border: 'rgba(74,103,65,0.15)', text: 'text-forest-600' },
}

function ResultCard({ item, index, isDesktop }: { item: ResultItem; index: number; isDesktop: boolean }) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const delay = index * 8
	const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})
	const accent = ACCENT[item.status]

	return (
		<div
			style={{
				opacity,
				borderLeft: `3px solid ${accent.solid}`,
				boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
			}}
			className={`bg-white rounded-xl ${isDesktop ? 'p-5' : 'p-3.5'} flex items-center justify-between`}
		>
			<div>
				<p className={`text-sand-900 font-medium ${isDesktop ? 'text-xl' : 'text-sm'}`}>{item.name}</p>
				<p className={`text-sand-500 ${isDesktop ? 'text-lg' : 'text-xs'}`}>적정범위 {item.range}</p>
			</div>
			<div className="text-right flex items-center gap-2">
				<span
					className={`text-sand-900 font-bold ${isDesktop ? 'text-xl' : 'text-sm'} text-right`}
					style={{ minWidth: isDesktop ? '4.5rem' : '3.5rem', fontVariantNumeric: 'tabular-nums', display: 'inline-block' }}
				>
					<CountingNumber value={parseInt(item.price)} suffix="만" delay={delay} />
				</span>
				<span
					className={`${accent.text} font-bold px-3 py-1 rounded-full ${isDesktop ? 'text-lg' : 'text-xs'}`}
					style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
				>
					{item.label}
				</span>
			</div>
		</div>
	)
}

export function SceneResult({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.result
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'
	const items = isDesktop ? ITEMS_DESKTOP : ITEMS_MOBILE

	const iconProgress = spring({ frame: frame - 3, fps, config: SPRING_CONFIGS.elegant })
	const bottomCopyOpacity = interpolate(frame, [35, 50], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const cardList = isDesktop ? (
		<div className="w-full max-w-3xl grid grid-cols-2 gap-3">
			{items.map((item, i) => (
				<ResultCard key={i} item={item} index={i} isDesktop={isDesktop} />
			))}
		</div>
	) : (
		<div className="w-full max-w-md space-y-3">
			{items.map((item, i) => (
				<ResultCard key={i} item={item} index={i} isDesktop={isDesktop} />
			))}
		</div>
	)

	const leftEntrance = isDesktop ? spring({ frame, fps, config: SPRING_CONFIGS.elegant }) : 1

	if (isDesktop) {
		return (
			<AbsoluteFill className="flex items-center justify-center bg-sand-50 px-16" style={{ opacity: crossfade }}>
				{/* Subtle background glow */}
				<div className="absolute inset-0 pointer-events-none" style={{
					background: 'radial-gradient(ellipse 40% 50% at 60% 50%, rgba(74,103,65,0.03) 0%, transparent 70%)',
				}} />

				{/* Dot grid (neutral, callback to Scene 2) + wash gradient */}
				<DotGrid color="#9CA3AF" dotSize={0.6} spacing={28} opacity={0.025} />
				<div className="absolute inset-0 pointer-events-none" style={{
					background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.015) 100%)',
				}} />

				<div className="flex items-center gap-14 w-full max-w-5xl">
					<div
						className="w-[40%] space-y-5"
						style={{ opacity: leftEntrance, transform: `translateX(${(1 - leftEntrance) * -20}px)` }}
					>
						<div className="flex items-center gap-3">
							<IconChart progress={iconProgress} size={32} className="text-forest-500 opacity-70" />
							<div className="flex items-center gap-3">
								<div className="w-[2px] h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #BEA98E, transparent)' }} />
								<p className="text-forest-600 text-lg font-semibold tracking-wider">ANALYSIS RESULT</p>
							</div>
						</div>
						<p className="text-sand-900 font-bold text-4xl leading-tight">견적 분석<br />리포트 미리보기</p>
						<p style={{ opacity: bottomCopyOpacity }} className="text-sand-700 text-lg">
							비싸다고 나쁜 게 아닙니다.<br />싸다고 좋은 게 아닙니다.<br />
							<span className="font-semibold text-sand-900">자재 등급에 맞는 가격인지가 중요합니다.</span>
						</p>
					</div>
					<div className="w-[60%]">{cardList}</div>
				</div>
			</AbsoluteFill>
		)
	}

	return (
		<AbsoluteFill className="flex flex-col items-center justify-center bg-sand-50 px-6" style={{ opacity: crossfade }}>
			<p className="text-sand-500 text-xs mb-1 tracking-wider">ANALYSIS RESULT</p>
			<p className="text-sand-800 font-bold text-lg mb-5">견적 분석 리포트 미리보기</p>
			{cardList}
			<p style={{ opacity: bottomCopyOpacity }} className="mt-6 text-sand-600 text-xs text-center">
				비싸다고 나쁜 게 아닙니다. 싸다고 좋은 게 아닙니다.<br />
				<span className="font-semibold text-sand-800">자재 등급에 맞는 가격인지가 중요합니다.</span>
			</p>
		</AbsoluteFill>
	)
}
