import QuoteRequests from './QuoteRequests'

export default function QuoteManagement() {
	return (
		<div className="space-y-6">
			{/* Page Title */}
			<div>
				<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
					견적 관리
				</h2>
				<p className="text-sand-700 text-sm mt-1">견적 요청 목록 · 자동 분석 · 결과 조회</p>
			</div>

			{/* Single list view (no tabs) */}
			<QuoteRequests />
		</div>
	)
}
