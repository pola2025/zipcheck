import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS, STATUS_COLORS, SCENE_TIMINGS } from '../constants'
import type { SceneProps, StatusType } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'

interface ResultItem {
	name: string
	status: StatusType
	label: string
	price: string
	range: string
}

// Mobile: 3 cards in vertical stack
// Desktop: 4 cards in 2x2 grid (#21)
const ITEMS_MOBILE: ResultItem[] = [
	{ name: '바닥재 (강마루)', status: 'danger', label: '과다', price: '450만', range: '280~350만' },
	{ name: '도배 (실크벽지)', status: 'warning', label: '점검', price: '85만', range: '120~160만' },
	{ name: '주방 (싱크대)', status: 'ok', label: '적정', price: '320만', range: '280~380만' },
]

const ITEMS_DESKTOP: ResultItem[] = [
	...ITEMS_MOBILE,
	{ name: '욕실 (타일)', status: 'ok', label: '적정', price: '190만', range: '150~220만' },
]

function ResultCard({ item, index, isDesktop }: { item: ResultItem; index: number; isDesktop: boolean }) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const delay = index * 10
	const progress = spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.snappy })
	const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})
	const colors = STATUS_COLORS[item.status]

	return (
		<div
			style={{ opacity, transform: `translateX(${(1 - progress) * 40}px)` }}
			className={`${colors.bg} border ${colors.border} rounded-xl ${isDesktop ? 'p-4' : 'p-3.5'} flex items-center justify-between`}
		>
			<div>
				<p className={`text-sand-800 font-medium ${isDesktop ? 'text-base' : 'text-sm'}`}>{item.name}</p>
				<p className={`text-sand-500 ${isDesktop ? 'text-sm' : 'text-xs'}`}>적정범위 {item.range}</p>
			</div>
			<div className="text-right flex items-center gap-2">
				<span className={`text-sand-800 font-bold ${isDesktop ? 'text-base' : 'text-sm'}`}>{item.price}</span>
				<span className={`${colors.text} ${colors.bg} border ${colors.border} font-bold px-2 py-0.5 rounded-full ${isDesktop ? 'text-sm' : 'text-xs'}`}>
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

	const bottomCopyOpacity = interpolate(frame, [35, 50], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const cardList = isDesktop ? (
		// Desktop: 2x2 grid (#21)
		<div className="w-full max-w-3xl grid grid-cols-2 gap-3">
			{items.map((item, i) => (
				<ResultCard key={i} item={item} index={i} isDesktop={isDesktop} />
			))}
		</div>
	) : (
		// Mobile: vertical stack
		<div className="w-full max-w-md space-y-3">
			{items.map((item, i) => (
				<ResultCard key={i} item={item} index={i} isDesktop={isDesktop} />
			))}
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
						<p className="text-sand-500 text-sm tracking-wider">ANALYSIS RESULT</p>
						<p className="text-sand-800 font-bold text-2xl">견적 분석 리포트 미리보기</p>
						<p style={{ opacity: bottomCopyOpacity }} className="text-sand-600 text-sm">
							비싸다고 나쁜 게 아닙니다. 싸다고 좋은 게 아닙니다.<br />
							<span className="font-semibold text-sand-800">자재 등급에 맞는 가격인지가 중요합니다.</span>
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
