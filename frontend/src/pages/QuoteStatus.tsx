import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Phone, FileText, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuoteRequest {
	id: string
	customer_name: string
	customer_phone: string
	property_type: string
	property_size: number
	region: string
	status: 'pending' | 'analyzing' | 'completed' | 'rejected'
	validation_status?: string
	validation_notes?: string
	created_at: string
	analyzed_at?: string
	items: any[]
}

const statusConfig = {
	pending: {
		label: '대기중',
		color: 'text-amber-400 bg-amber-500/20',
		icon: Clock,
		description: '관리자 검토 대기 중입니다.'
	},
	analyzing: {
		label: '분석중',
		color: 'text-blue-400 bg-blue-500/20',
		icon: Clock,
		description: 'AI가 견적을 분석하고 있습니다.'
	},
	completed: {
		label: '완료',
		color: 'text-green-400 bg-green-500/20',
		icon: CheckCircle2,
		description: '분석이 완료되었습니다!'
	},
	rejected: {
		label: '거부',
		color: 'text-red-400 bg-red-500/20',
		icon: AlertCircle,
		description: '검토 결과 거부되었습니다.'
	}
}

export default function QuoteStatus() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [phoneNumber, setPhoneNumber] = useState(searchParams.get('phone') || '')
	const [requests, setRequests] = useState<QuoteRequest[]>([])
	const [loading, setLoading] = useState(false)
	const [searched, setSearched] = useState(false)

	useEffect(() => {
		if (searchParams.get('phone')) {
			searchQuotes()
		}
	}, [])

	const searchQuotes = async () => {
		if (!phoneNumber.trim()) {
			alert('전화번호를 입력해주세요.')
			return
		}

		setLoading(true)
		setSearched(true)

		try {
			const response = await fetch(
				`http://localhost:3001/api/quote-requests/by-phone/${encodeURIComponent(phoneNumber)}`
			)

			if (!response.ok) {
				throw new Error('조회에 실패했습니다.')
			}

			const data = await response.json()
			setRequests(data)
		} catch (error) {
			console.error('Search error:', error)
			alert('견적 조회에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setLoading(false)
		}
	}

	const viewResult = async (request: QuoteRequest) => {
		if (request.status !== 'completed') {
			alert('분석이 아직 완료되지 않았습니다.')
			return
		}

		try {
			const response = await fetch(`http://localhost:3001/api/quote-requests/result/${request.id}`)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || '결과 조회에 실패했습니다.')
			}

			const data = await response.json()

			// Navigate to result page with analysis data
			navigate('/quote-result', { state: { analysis: data.analysis_result, request: data } })
		} catch (error) {
			console.error('Result fetch error:', error)
			alert('결과 조회에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)))
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
						견적 신청 조회
					</h1>
					<p className="text-gray-400">전화번호로 신청하신 견적의 진행 상황을 확인하세요</p>
				</div>

				{/* Search Box */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-8">
					<div className="flex items-center gap-4">
						<div className="flex-1 flex items-center gap-3 bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus-within:border-cyan-500 transition-all">
							<Phone className="w-5 h-5 text-gray-400" />
							<input
								type="tel"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && searchQuotes()}
								placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
								className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
							/>
						</div>
						<button
							onClick={searchQuotes}
							disabled={loading}
							className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all flex items-center gap-2"
						>
							<Search className="w-5 h-5" />
							{loading ? '조회 중...' : '조회'}
						</button>
					</div>
				</div>

				{/* Results */}
				{searched && (
					<>
						{requests.length === 0 ? (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-700 text-center"
							>
								<FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
								<h3 className="text-xl font-bold text-gray-300 mb-2">신청 내역이 없습니다</h3>
								<p className="text-gray-400 mb-6">
									입력하신 전화번호로 신청된 견적이 없습니다.<br />
									전화번호를 확인하시거나 새로운 견적을 신청해보세요.
								</p>
								<button
									onClick={() => navigate('/quote-submission')}
									className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all"
								>
									견적 신청하기
								</button>
							</motion.div>
						) : (
							<div className="space-y-4">
								<h2 className="text-xl font-bold mb-4">
									신청 내역 <span className="text-cyan-400">({requests.length}건)</span>
								</h2>

								{requests.map((request, index) => {
									const config = statusConfig[request.status]
									const StatusIcon = config.icon

									return (
										<motion.div
											key={request.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-all"
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-3">
														<h3 className="text-xl font-bold">
															{request.property_type} {request.property_size ? `${request.property_size}평` : ''} - {request.region}
														</h3>
														<span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.color} flex items-center gap-2`}>
															<StatusIcon className="w-4 h-4" />
															{config.label}
														</span>
													</div>

													<div className="grid grid-cols-2 gap-4 mb-4">
														<div>
															<div className="text-sm text-gray-400">신청 일시</div>
															<div className="text-sm font-semibold">
																{new Date(request.created_at).toLocaleString('ko-KR')}
															</div>
														</div>
														{request.analyzed_at && (
															<div>
																<div className="text-sm text-gray-400">분석 완료</div>
																<div className="text-sm font-semibold text-green-400">
																	{new Date(request.analyzed_at).toLocaleString('ko-KR')}
																</div>
															</div>
														)}
													</div>

													<div className="flex items-center gap-2 mb-4">
														<span className="text-sm text-gray-400">견적 항목:</span>
														<span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
															{request.items.length}개
														</span>
													</div>

													<div className="bg-gray-700/30 rounded-lg p-4">
														<div className="text-sm text-gray-300">
															{config.description}
															{request.validation_status === 'rejected_insufficient_detail' && (
																<div className="mt-2 text-red-400">
																	⚠️ {request.validation_notes}
																</div>
															)}
															{request.validation_status === 'pending' && request.validation_notes && (
																<div className="mt-2 text-amber-400">
																	💡 {request.validation_notes}
																</div>
															)}
														</div>
													</div>
												</div>

												{request.status === 'completed' && (
													<button
														onClick={() => viewResult(request)}
														className="ml-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all flex items-center gap-2"
													>
														<Eye className="w-5 h-5" />
														결과 보기
													</button>
												)}
											</div>
										</motion.div>
									)
								})}
							</div>
						)}
					</>
				)}

				{/* Help Section */}
				<div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
					<h3 className="text-lg font-bold text-blue-300 mb-3">💡 도움말</h3>
					<ul className="text-sm text-gray-300 space-y-2">
						<li>• 견적 신청 시 입력하신 전화번호로 조회할 수 있습니다.</li>
						<li>• 관리자가 검토 후 AI 분석을 진행하며, 완료 시 결과를 확인하실 수 있습니다.</li>
						<li>• 분석은 보통 1-2일 이내에 완료됩니다.</li>
						<li>• 문의사항이 있으시면 고객센터로 연락주세요.</li>
					</ul>
				</div>
			</div>
		</div>
	)
}
