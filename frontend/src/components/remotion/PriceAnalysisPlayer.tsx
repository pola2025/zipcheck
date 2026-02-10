import { Player } from '@remotion/player'
import { PriceAnalysisDesktop, PriceAnalysisMobile } from './PriceAnalysisVideo'
import { VIEWPORTS, VIDEO_FPS, VIDEO_DURATION_IN_FRAMES } from './constants'

interface PriceAnalysisPlayerProps {
	className?: string
	style?: React.CSSProperties
}

// PC 1280x720 Player (16:9)
export function PriceAnalysisPlayer({ className, style }: PriceAnalysisPlayerProps) {
	const vp = VIEWPORTS.desktop

	return (
		<Player
			component={PriceAnalysisDesktop}
			compositionWidth={vp.width}
			compositionHeight={vp.height}
			fps={VIDEO_FPS}
			durationInFrames={VIDEO_DURATION_IN_FRAMES}
			autoPlay
			loop
			className={className}
			style={{
				width: '100%',
				maxWidth: 960,
				aspectRatio: '16/9',
				...style,
			}}
		/>
	)
}

// Mobile 360x640 Player (9:16)
export function PriceAnalysisMobilePlayer({ className, style }: PriceAnalysisPlayerProps) {
	const vp = VIEWPORTS.mobile

	return (
		<Player
			component={PriceAnalysisMobile}
			compositionWidth={vp.width}
			compositionHeight={vp.height}
			fps={VIDEO_FPS}
			durationInFrames={VIDEO_DURATION_IN_FRAMES}
			autoPlay
			loop
			className={className}
			style={{
				width: '100%',
				maxWidth: 360,
				aspectRatio: '9/16',
				...style,
			}}
		/>
	)
}
