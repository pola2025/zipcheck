import { AbsoluteFill, Sequence } from 'remotion'
import {
	SceneQuestion,
	ScenePriceCompare,
	SceneOverpriced,
	SceneUnderpriced,
	SceneMessage,
	SceneResult,
	SceneCTA,
} from './scenes'
import { SCENE_TIMINGS, VIEWPORTS, VIDEO_FPS, VIDEO_DURATION_IN_FRAMES } from './constants'
import type { Variant } from './constants'

// ─── Shared Composition (renders both mobile and desktop via variant prop) ───
function PriceAnalysisBase({ variant }: { variant: Variant }) {
	const t = SCENE_TIMINGS

	return (
		<AbsoluteFill style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
			<Sequence from={t.question.from} durationInFrames={t.question.duration}>
				<SceneQuestion variant={variant} />
			</Sequence>

			<Sequence from={t.priceCompare.from} durationInFrames={t.priceCompare.duration}>
				<ScenePriceCompare variant={variant} />
			</Sequence>

			<Sequence from={t.overpriced.from} durationInFrames={t.overpriced.duration}>
				<SceneOverpriced variant={variant} />
			</Sequence>

			<Sequence from={t.underpriced.from} durationInFrames={t.underpriced.duration}>
				<SceneUnderpriced variant={variant} />
			</Sequence>

			<Sequence from={t.message.from} durationInFrames={t.message.duration}>
				<SceneMessage variant={variant} />
			</Sequence>

			<Sequence from={t.result.from} durationInFrames={t.result.duration}>
				<SceneResult variant={variant} />
			</Sequence>

			<Sequence from={t.cta.from} durationInFrames={t.cta.duration}>
				<SceneCTA variant={variant} />
			</Sequence>
		</AbsoluteFill>
	)
}

// ─── Desktop Composition (1280x720, 16:9) ───
export const PriceAnalysisDesktop: React.FC = () => <PriceAnalysisBase variant="desktop" />

// ─── Mobile Composition (640x640, 1:1) ───
export const PriceAnalysisMobile: React.FC = () => <PriceAnalysisBase variant="mobile" />

// Default export = Desktop (PC first per project spec)
export const PriceAnalysisComposition = PriceAnalysisDesktop

// Re-export config
export const VIDEO_WIDTH = VIEWPORTS.desktop.width
export const VIDEO_HEIGHT = VIEWPORTS.desktop.height
export { VIDEO_FPS, VIDEO_DURATION_IN_FRAMES, VIEWPORTS }
