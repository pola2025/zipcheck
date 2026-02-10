import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_CONFIGS } from '../constants'
import type { SceneProps } from '../constants'

export function SceneCTA({ variant = 'mobile' }: SceneProps) {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()
	const isDesktop = variant === 'desktop'

	// Last scene: fade-in only, no fade-out
	const fadeIn = interpolate(frame, [0, 15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const mainProgress = spring({ frame, fps, config: SPRING_CONFIGS.cta })
	const buttonPulse = interpolate(frame % 30, [0, 15, 30], [1, 1.06, 1])

	return (
		<AbsoluteFill
			className={`flex flex-col items-center justify-center bg-forest-600 ${isDesktop ? 'px-20' : 'px-8'}`}
			style={{ opacity: fadeIn }}
		>
			<div
				className="text-center"
				style={{ opacity: mainProgress, transform: `translateY(${(1 - mainProgress) * 30}px)` }}
			>
				<p className={`text-forest-200 mb-3 ${isDesktop ? 'text-lg' : 'text-sm'}`}>인테리어 유통망 원가 기반</p>
				<h2 className={`text-white font-bold mb-2 ${isDesktop ? 'text-5xl' : 'text-3xl'}`}>
					내 견적서, 적정가인지<br />확인해보세요
				</h2>
				<p className={`text-forest-200 mb-8 ${isDesktop ? 'text-lg' : 'text-sm'}`}>업로드만 하면 항목별 리스크를 분석해드립니다</p>

				<div style={{ transform: `scale(${buttonPulse})` }}>
					<div className={`inline-block bg-white text-forest-700 font-bold rounded-full shadow-lg ${isDesktop ? 'px-12 py-5 text-xl' : 'px-8 py-3.5 text-base'}`}>
						내 견적서 분석받기 &rarr;
					</div>
				</div>
			</div>
		</AbsoluteFill>
	)
}
