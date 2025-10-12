import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import QuoteAnalysisVisual from '../components/QuoteAnalysis/QuoteAnalysisVisual'

export default function QuoteResult() {
	const location = useLocation()
	const navigate = useNavigate()

	const { analysis, request } = location.state || {}

	if (!analysis || !request) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-3xl font-bold mb-4">데이터를 찾을 수 없습니다</h1>
					<p className="text-gray-400 mb-6">
						분석 결과 데이터가 없습니다. 견적 조회 페이지에서 다시 시도해주세요.
					</p>
					<button
						onClick={() => navigate('/quote-status')}
						className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all"
					>
						견적 조회 페이지로
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header with Back Button */}
				<div className="mb-8">
					<button
						onClick={() => navigate('/quote-status?phone=' + encodeURIComponent(request.customer_phone))}
						className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all flex items-center gap-2"
					>
						<ArrowLeft className="w-5 h-5" />
						견적 목록으로
					</button>

					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
						견적 분석 결과
					</h1>
					<div className="text-gray-400 space-y-1">
						<p>
							{request.property_type} {request.property_size ? `${request.property_size}평` : ''} - {request.region}
						</p>
						<p className="text-sm">
							신청일: {new Date(request.created_at).toLocaleString('ko-KR')} |
							분석 완료: {new Date(request.analyzed_at).toLocaleString('ko-KR')}
						</p>
					</div>
				</div>

				{/* Analysis Visual Component */}
				<QuoteAnalysisVisual analysis={analysis} />
			</div>
		</div>
	)
}
