import { useState } from 'react'
import { Search, AlertTriangle, Building, Phone, FileText, User, Shield, Loader2 } from 'lucide-react'
import SubdomainNavigation from 'components/SubdomainNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { getApiUrl } from '../../lib/api-config'

interface MatchedCase {
	id: string
	slug?: string
	title: string
	description: string
	category?: string
	severity?: string
	status: string
	company_name?: string
	company_phone?: string
	business_number?: string
	representative_name?: string
	region?: string
	damage_type?: string
	damage_amount?: number
	match_count: number
	created_at: string
}

const severityColors: Record<string, string> = {
	low: 'bg-blue-100 text-blue-700',
	medium: 'bg-yellow-100 text-yellow-700',
	high: 'bg-orange-100 text-orange-700',
	critical: 'bg-red-100 text-red-700',
}

const severityLabels: Record<string, string> = {
	low: '경미',
	medium: '보통',
	high: '심각',
	critical: '매우 심각',
}

export default function BlacklistCheck() {
	const [representativeName, setRepresentativeName] = useState('')
	const [companyPhone, setCompanyPhone] = useState('')
	const [companyName, setCompanyName] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')

	const [results, setResults] = useState<MatchedCase[] | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const filledCount = [representativeName, companyPhone, companyName, businessNumber].filter(v => v.trim()).length

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setResults(null)

		if (filledCount < 2) {
			setError('최소 2개 이상의 업체 정보를 입력해주세요.')
			return
		}

		setLoading(true)

		try {
			const body: Record<string, string> = {}
			if (representativeName.trim()) body.representative_name = representativeName.trim()
			if (companyPhone.trim()) body.company_phone = companyPhone.trim()
			if (companyName.trim()) body.company_name = companyName.trim()
			if (businessNumber.trim()) body.business_number = businessNumber.trim()

			const response = await fetch(getApiUrl('/api/damage-cases/match'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			})

			if (response.status === 429) {
				setError('요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.')
				return
			}

			if (!response.ok) {
				const data = await response.json().catch(() => null)
				throw new Error(data?.error || '조회에 실패했습니다.')
			}

			const data = await response.json()
			setResults(data.data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : '조회에 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const inputClass = "w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all"

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="블랙리스트 조회 | 인테리어 업체 피해 이력 확인"
				description="업체 정보를 입력하여 피해사례 이력을 확인하세요. 계약 전 업체 검증에 활용할 수 있습니다."
				path="/blacklist-check"
			/>
			<SubdomainNavigation subdomain="report" />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-red-400" />
						<span className="text-red-500 font-medium text-xs tracking-widest uppercase">Blacklist Check</span>
						<div className="w-8 h-[2px] bg-red-400" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						블랙리스트 조회
					</h1>
					<p className="text-sand-700 text-base md:text-lg max-w-lg mx-auto">
						업체 정보를 입력하여 피해사례 이력을 확인하세요
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-2xl mx-auto px-5 md:px-8 pb-20">
				{/* Search Form */}
				<form onSubmit={handleSearch} className="bg-white rounded-2xl p-6 md:p-8 border border-sand-200 mb-8">
					<div className="flex items-center gap-2 mb-6">
						<Shield className="w-5 h-5 text-red-500" />
						<h2 className="text-lg font-bold text-sand-900">업체 정보 입력</h2>
					</div>

					<p className="text-sm text-sand-500 mb-6">
						아래 항목 중 <strong className="text-red-500">2개 이상</strong>을 입력하면 매칭된 피해사례를 조회할 수 있습니다.
					</p>

					<div className="space-y-4">
						<div>
							<label htmlFor="bl-name" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<User className="w-4 h-4 text-sand-400" />
								대표자/담당자 이름
							</label>
							<input
								id="bl-name"
								type="text"
								value={representativeName}
								onChange={(e) => setRepresentativeName(e.target.value)}
								placeholder="예: 홍길동"
								className={inputClass}
							/>
						</div>

						<div>
							<label htmlFor="bl-phone" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Phone className="w-4 h-4 text-sand-400" />
								업체 전화번호
							</label>
							<input
								id="bl-phone"
								type="tel"
								value={companyPhone}
								onChange={(e) => setCompanyPhone(e.target.value)}
								placeholder="예: 02-1234-5678"
								className={inputClass}
							/>
						</div>

						<div>
							<label htmlFor="bl-company" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<Building className="w-4 h-4 text-sand-400" />
								상호명
							</label>
							<input
								id="bl-company"
								type="text"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder="예: OO인테리어"
								className={inputClass}
							/>
						</div>

						<div>
							<label htmlFor="bl-biz" className="block text-sm font-semibold mb-2 text-sand-700 flex items-center gap-2">
								<FileText className="w-4 h-4 text-sand-400" />
								사업자등록번호
							</label>
							<input
								id="bl-biz"
								type="text"
								value={businessNumber}
								onChange={(e) => setBusinessNumber(e.target.value)}
								placeholder="예: 123-45-67890"
								className={inputClass}
							/>
						</div>
					</div>

					{error && (
						<div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
							{error}
						</div>
					)}

					<div className="mt-6 flex items-center justify-between">
						<p className="text-sm text-sand-400">
							입력됨: <span className={filledCount >= 2 ? 'text-forest-600 font-semibold' : 'text-sand-500'}>{filledCount}</span>/4
						</p>
						<button
							type="submit"
							disabled={filledCount < 2 || loading}
							className="px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-sand-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
						>
							{loading ? (
								<><Loader2 className="w-5 h-5 animate-spin" /> 조회 중...</>
							) : (
								<><Search className="w-5 h-5" /> 조회하기</>
							)}
						</button>
					</div>
				</form>

				{/* Results */}
				{results !== null && (
					<div>
						{results.length === 0 ? (
							<div className="bg-white rounded-2xl p-12 text-center border border-sand-200">
								<Shield className="mx-auto mb-4 text-forest-400" size={48} />
								<p className="text-lg font-semibold text-sand-800 mb-2">매칭된 피해사례가 없습니다</p>
								<p className="text-sand-500 text-sm">입력하신 업체 정보와 일치하는 피해사례가 없습니다.</p>
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-center gap-2 mb-2">
									<AlertTriangle className="w-5 h-5 text-red-500" />
									<h3 className="text-lg font-bold text-sand-900">
										매칭된 피해사례 <span className="text-red-500">{results.length}</span>건
									</h3>
								</div>

								{results.map((item) => (
									<a
										key={item.id}
										href={item.slug ? `/damage-cases/${item.slug}` : `/damage-cases`}
										className="block bg-white rounded-2xl p-5 border border-sand-200 hover:border-red-300 hover:shadow-md transition-all"
									>
										<div className="flex items-start justify-between gap-3 mb-3">
											<h4 className="text-base font-bold text-sand-900 line-clamp-2">{item.title}</h4>
											<div className="flex items-center gap-2 shrink-0">
												<span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
													{item.match_count}건 일치
												</span>
												{item.severity && (
													<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${severityColors[item.severity] || 'bg-gray-100 text-gray-600'}`}>
														{severityLabels[item.severity] || item.severity}
													</span>
												)}
											</div>
										</div>
										<p className="text-sm text-sand-600 line-clamp-2 mb-3">{item.description}</p>
										<div className="flex flex-wrap gap-3 text-xs text-sand-500">
											{item.company_name && <span>업체: {item.company_name}</span>}
											{item.region && <span>지역: {item.region}</span>}
											{item.damage_type && <span>유형: {item.damage_type}</span>}
											<span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
										</div>
									</a>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			<NordicFooter />
		</div>
	)
}
