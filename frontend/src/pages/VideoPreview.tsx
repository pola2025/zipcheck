import { lazy, Suspense, useState } from 'react'

const PriceAnalysisPlayer = lazy(() =>
	import('components/remotion/PriceAnalysisPlayer').then(m => ({ default: m.PriceAnalysisPlayer }))
)
const PriceAnalysisMobilePlayer = lazy(() =>
	import('components/remotion/PriceAnalysisPlayer').then(m => ({ default: m.PriceAnalysisMobilePlayer }))
)

const SCENE_INFO = [
	{ name: '씬1: 질문', time: '0~3s' },
	{ name: '씬2: 가격비교', time: '2.7~8s' },
	{ name: '씬3: 과다청구', time: '7.5~12.7s' },
	{ name: '씬4: 부실시공', time: '12.2~17.3s' },
	{ name: '씬5: 메시지', time: '16.8~22.2s' },
	{ name: '씬6: 리포트', time: '21.7~25.8s' },
	{ name: '씬7: CTA', time: '25.2~30s' },
]

type Mode = 'desktop' | 'mobile'

export default function VideoPreview() {
	const [mode, setMode] = useState<Mode>('desktop')
	const [maxWidth, setMaxWidth] = useState(960)

	return (
		<div className="min-h-screen bg-neutral-900 text-white p-8">
			<h1 className="text-2xl font-bold mb-2">Remotion 영상 프리뷰</h1>
			<p className="text-neutral-400 mb-6">PC / 모바일 비교 확인용 (개발 전용)</p>

			{/* Mode toggle */}
			<div className="flex items-center gap-3 mb-4">
				{(['desktop', 'mobile'] as Mode[]).map(m => (
					<button
						key={m}
						onClick={() => setMode(m)}
						className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
							mode === m
								? 'bg-forest-600 text-white'
								: 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
						}`}
					>
						{m === 'desktop' ? 'PC (1280x720)' : 'Mobile (360x640)'}
					</button>
				))}
			</div>

			{/* Size controls (desktop only) */}
			{mode === 'desktop' && (
				<div className="flex items-center gap-4 mb-6">
					<span className="text-sm text-neutral-400">Player 크기:</span>
					{[640, 800, 960, 1120, 1280].map(w => (
						<button
							key={w}
							onClick={() => setMaxWidth(w)}
							className={`px-3 py-1.5 rounded text-sm font-medium transition ${
								maxWidth === w
									? 'bg-forest-600 text-white'
									: 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
							}`}
						>
							{w}px
						</button>
					))}
				</div>
			)}

			{/* Player */}
			<div className="bg-neutral-800 rounded-xl p-6 mb-6">
				<Suspense fallback={<div className="text-neutral-500">로딩 중...</div>}>
					{mode === 'desktop' ? (
						<PriceAnalysisPlayer style={{ maxWidth, margin: '0 auto' }} />
					) : (
						<div className="flex justify-center">
							<PriceAnalysisMobilePlayer style={{ maxWidth: 360 }} />
						</div>
					)}
				</Suspense>
			</div>

			{/* Scene timeline reference */}
			<div className="bg-neutral-800 rounded-xl p-6">
				<h2 className="text-lg font-semibold mb-3">씬 타임라인</h2>
				<div className="grid grid-cols-7 gap-2">
					{SCENE_INFO.map((s, i) => (
						<div key={i} className="bg-neutral-700 rounded-lg p-3 text-center">
							<p className="text-sm font-medium">{s.name}</p>
							<p className="text-xs text-neutral-400 mt-1">{s.time}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
