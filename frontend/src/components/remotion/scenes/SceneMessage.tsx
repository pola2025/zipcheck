import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { SPRING_CONFIGS, SCENE_TIMINGS } from '../constants'
import type { SceneProps } from '../constants'
import { useCrossfade } from '../hooks/useCrossfade'

export function SceneMessage({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const { duration } = SCENE_TIMINGS.message
	const crossfade = useCrossfade(duration)
	const isDesktop = variant === 'desktop'

	const line1 = spring({ frame: frame - 5, fps, config: SPRING_CONFIGS.gentle })
	const line2 = spring({ frame: frame - 30, fps, config: SPRING_CONFIGS.gentle })
	const line3 = spring({ frame: frame - 60, fps, config: SPRING_CONFIGS.bouncy })

	// Bridge text for Scene5 -> Scene6 transition
	const bridgeOpacity = spring({ frame: frame - (duration - 40), fps, config: SPRING_CONFIGS.gentle })

	return (
		<AbsoluteFill
			className={`flex flex-col items-center justify-center bg-forest-50 ${isDesktop ? 'px-20' : 'px-8'}`}
			style={{ opacity: crossfade }}
		>
			<div className={`text-center space-y-6 ${isDesktop ? 'max-w-2xl' : 'max-w-lg'}`}>
				<p
					style={{ opacity: line1, transform: `translateY(${(1 - line1) * 20}px)` }}
					className={`text-sand-600 ${isDesktop ? 'text-xl' : 'text-lg'}`}
				>
					저희는 인테리어 업체가 아닙니다
				</p>
				<div className="w-12 h-px bg-forest-300 mx-auto" style={{ opacity: line2 }} />
				<p
					style={{ opacity: line2, transform: `translateY(${(1 - line2) * 15}px)` }}
					className={`text-sand-800 font-medium ${isDesktop ? 'text-2xl' : 'text-xl'}`}
				>
					소비자가 적정 가격에<br />공사받을 수 있도록
				</p>
				<p
					style={{ opacity: line3, transform: `scale(${0.9 + line3 * 0.1})` }}
					className={`text-forest-700 font-bold ${isDesktop ? 'text-3xl' : 'text-2xl'}`}
				>
					실제 인테리어 유통망 가격 기반<br />원가분석
				</p>
			</div>

			<p
				style={{ opacity: bridgeOpacity }}
				className={`mt-10 text-forest-500 ${isDesktop ? 'text-base' : 'text-sm'}`}
			>
				어떻게 분석할까요?
			</p>
		</AbsoluteFill>
	)
}
