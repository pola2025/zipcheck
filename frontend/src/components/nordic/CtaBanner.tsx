import { Link } from 'react-router-dom'

export default function CtaBanner() {
	return (
		<section className="relative overflow-hidden" style={{ minHeight: '50vh' }}>
			<div className="ph-green absolute inset-0 flex items-center justify-center">
				<span className="text-forest-300/20 text-[100px]">🌿</span>
			</div>
			<div className="absolute inset-0 bg-forest-800/50" />

			<div className="relative z-10 flex items-center justify-center min-h-[50vh] text-center px-8">
				<div>
					<h2 className="font-outfit text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
						우리 집 인테리어,
						<br />
						제대로 시작하세요
					</h2>
					<p className="text-forest-200 text-lg mb-10">
						실제 데이터로 꼼꼼하게 확인해 드립니다.
					</p>
					<Link
						to="/quote-submission"
						className="inline-block px-10 py-4 bg-white text-forest-700 rounded-2xl font-bold text-lg hover:bg-sand-100 transition shadow-xl"
					>
						무료 견적 분석 받기 &rarr;
					</Link>
				</div>
			</div>
		</section>
	)
}
