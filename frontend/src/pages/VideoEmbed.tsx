import { lazy, Suspense } from 'react'

const PriceAnalysisMobilePlayer = lazy(() =>
	import('components/remotion/PriceAnalysisPlayer').then(m => ({ default: m.PriceAnalysisMobilePlayer }))
)

/** Minimal embed page — no chrome, transparent bg, for iframe use */
export default function VideoEmbed() {
	return (
		<div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
			<Suspense fallback={null}>
				<PriceAnalysisMobilePlayer
					style={{ width: '100%', maxWidth: 360, height: 'auto' }}
				/>
			</Suspense>
		</div>
	)
}
