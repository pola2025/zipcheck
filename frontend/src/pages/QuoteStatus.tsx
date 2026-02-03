import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Clock, CheckCircle2, AlertCircle, FileText, ArrowRight, RefreshCw } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { getApiUrl } from '../lib/api-config'

interface QuoteRequest {
	id: string
	request_id: string
	created_at: string
	status: 'pending' | 'analyzing' | 'completed' | 'failed'
	plan_name: string
	quantity: number
	property_type: string
	property_size?: number
	region: string
	analysis_progress?: number
}

export default function QuoteStatus() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const phoneFromUrl = searchParams.get('phone') || ''

	const [phone, setPhone] = useState(phoneFromUrl)
	const [searchPhone, setSearchPhone] = useState(phoneFromUrl)
	const [quotes, setQuotes] = useState<QuoteRequest[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (phoneFromUrl) {
			fetchQuotes(phoneFromUrl)
		}
	}, [phoneFromUrl])

	const fetchQuotes = async (phoneNumber: string) => {
		if (!phoneNumber.trim()) {
			setError('전화번호를 입력해주세요.')
			return
		}

		setLoading(true)
		setError('')

		try {
			const response = await fetch(
				getApiUrl(`/api/quote-requests/status?phone=${encodeURIComponent(phoneNumber)}`)
			)

			if (!response.ok) {
				throw new Error('견적 정보를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setQuotes(data.requests || [])

			if (data.requests.length === 0) {
				setError('해당 전화번호로 신청된 견적이 없습니다.')
			}
		} catch (err) {
			console.error('Failed to fetch quotes:', err)
			setError(err instanceof Error ? err.message : '견적 정보를 불러오는 중 오류가 발생했습니다.')
			setQuotes([])
		} finally {
			setLoading(false)
		}
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setSearchParams({ phone: searchPhone })
		setPhone(searchPhone)
		fetchQuotes(searchPhone)
	}

	const getStatusInfo = (status: string) => {
		switch (status) {
			case 'pending':
				return { label: '대기중', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: Clock }
			case 'analyzing':
				return { label: '분석중', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: RefreshCw }
			case 'completed':
				return { label: '완료', color: 'text-forest-600', bgColor: 'bg-forest-50', borderColor: 'border-forest-200', icon: CheckCircle2 }
			case 'failed':
				return { label: '실패', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: AlertCircle }
			default:
				return { label: '알 수 없음', color: 'text-sand-500', bgColor: 'bg-sand-100', borderColor: 'border-sand-200', icon: AlertCircle }
		}
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="분석 현황 조회"
				description="신청하신 인테리어 견적 분석의 진행 상태를 확인하세요."
				path="/quote-status"
				noindex
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">Status</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						견적 신청 현황
					</h1>
					<p className="text-sand-600 text-base md:text-lg max-w-md mx-auto">
						전화번호로 견적 분석 진행 상황을 확인하세요
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-5 md:px-8 pb-20">
				{/* Search Form */}
				<div className="nordic-card rounded-2xl p-6 md:p-8 mb-8">
					<form onSubmit={handleSearch} className="flex gap-3">
						<div className="flex-1 relative">
							<input
								type="tel"
								value={searchPhone}
								onChange={(e) => setSearchPhone(e.target.value)}
								placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
								className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all pr-10"
								required
							/>
							<Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
						</div>
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-3 bg-forest-600 text-white hover:bg-forest-700 disabled:bg-sand-300 disabled:text-sand-500 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-forest-600/15"
						>
							{loading ? (
								<><RefreshCw className="w-5 h-5 animate-spin" /> 조회 중...</>
							) : (
								<><Search className="w-5 h-5" /> 조회</>
							)}
						</button>
					</form>
				</div>

				{/* Error Message */}
				{error && (
					<div className="rounded-2xl p-5 border border-red-200 bg-red-50 mb-8">
						<div className="flex items-center gap-3">
							<AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
							<p className="text-red-600">{error}</p>
						</div>
					</div>
				)}

				{/* Quotes List */}
				{!loading && quotes.length > 0 && (
					<div className="space-y-5">
						<h2 className="text-xl font-bold text-sand-900 mb-4">
							신청 내역 ({quotes.length}건)
						</h2>

						{quotes.map((quote) => {
							const statusInfo = getStatusInfo(quote.status)
							const StatusIcon = statusInfo.icon

							return (
								<div
									key={quote.id}
									className={`nordic-card rounded-2xl p-6 border ${statusInfo.borderColor}`}
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center gap-3">
											<div className={`p-2.5 ${statusInfo.bgColor} rounded-xl`}>
												<FileText className={`w-5 h-5 ${statusInfo.color}`} />
											</div>
											<div>
												<h3 className="text-lg font-bold text-sand-900">
													{quote.plan_name} ({quote.quantity}건)
												</h3>
												<p className="text-sm text-sand-500 mt-0.5">
													신청 ID: {quote.request_id}
												</p>
											</div>
										</div>

										<div className={`flex items-center gap-1.5 px-3 py-1.5 ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-full`}>
											<StatusIcon className={`w-4 h-4 ${statusInfo.color} ${quote.status === 'analyzing' ? 'animate-spin' : ''}`} />
											<span className={`text-sm font-semibold ${statusInfo.color}`}>
												{statusInfo.label}
											</span>
										</div>
									</div>

									<div className="grid md:grid-cols-2 gap-3 mb-4">
										<div>
											<p className="text-xs text-sand-400 mb-0.5">건물 유형</p>
											<p className="text-sand-900 font-medium">{quote.property_type}</p>
										</div>
										<div>
											<p className="text-xs text-sand-400 mb-0.5">지역</p>
											<p className="text-sand-900 font-medium">{quote.region}</p>
										</div>
										{quote.property_size && (
											<div>
												<p className="text-xs text-sand-400 mb-0.5">평수</p>
												<p className="text-sand-900 font-medium">{quote.property_size}평</p>
											</div>
										)}
										<div>
											<p className="text-xs text-sand-400 mb-0.5">신청일</p>
											<p className="text-sand-900 font-medium">
												{new Date(quote.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
											</p>
										</div>
									</div>

									{/* Progress Bar */}
									{quote.status === 'analyzing' && quote.analysis_progress !== undefined && (
										<div className="mb-4">
											<div className="flex justify-between text-sm mb-1.5">
												<span className="text-sand-500">분석 진행률</span>
												<span className="text-blue-600 font-semibold">{quote.analysis_progress}%</span>
											</div>
											<div className="h-2 bg-sand-200 rounded-full overflow-hidden">
												<div
													className="h-full bg-blue-500 rounded-full transition-all duration-500"
													style={{ width: `${quote.analysis_progress}%` }}
												/>
											</div>
										</div>
									)}

									{/* Action */}
									<div className="flex gap-3">
										{quote.status === 'completed' && (
											<button
												onClick={() => navigate(`/admin/quote-requests/${quote.id}`)}
												className="flex-1 py-3 bg-forest-600 text-white hover:bg-forest-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-forest-600/15"
											>
												<FileText className="w-5 h-5" />
												분석 결과 보기
												<ArrowRight className="w-5 h-5" />
											</button>
										)}
										{quote.status === 'pending' && (
											<div className="flex-1 text-center py-3 text-amber-600 text-sm">
												관리자가 검토 중입니다. 잠시만 기다려주세요.
											</div>
										)}
										{quote.status === 'analyzing' && (
											<div className="flex-1 text-center py-3 text-blue-600 text-sm flex items-center justify-center gap-2">
												<RefreshCw className="w-4 h-4 animate-spin" />
												AI가 견적을 분석하고 있습니다...
											</div>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}

				{/* Empty State */}
				{!loading && !error && quotes.length === 0 && phone && (
					<div className="nordic-card rounded-2xl p-12 text-center">
						<FileText className="w-14 h-14 mx-auto mb-4 text-sand-300" />
						<p className="text-lg text-sand-500 mb-6">
							해당 전화번호로 신청된 견적이 없습니다.
						</p>
						<button
							onClick={() => navigate('/plan-selection')}
							className="px-8 py-3 bg-forest-600 text-white hover:bg-forest-700 rounded-xl font-semibold transition-all shadow-lg shadow-forest-600/15"
						>
							견적 신청하기
						</button>
					</div>
				)}
			</div>

			<NordicFooter />
		</div>
	)
}
