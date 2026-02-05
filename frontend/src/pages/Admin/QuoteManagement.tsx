import { useSearchParams } from 'react-router-dom'
import QuoteRequests from './QuoteRequests'
import AnalysisList from './AnalysisList'

type Tab = 'requests' | 'analyses'

const tabs: { key: Tab; label: string }[] = [
	{ key: 'requests', label: '견적 요청' },
	{ key: 'analyses', label: '견적 분석' },
]

export default function QuoteManagement() {
	const [searchParams, setSearchParams] = useSearchParams()
	const currentTab: Tab = searchParams.get('tab') === 'analyses' ? 'analyses' : 'requests'

	const switchTab = (tab: Tab) => {
		if (tab === 'requests') {
			setSearchParams({})
		} else {
			setSearchParams({ tab })
		}
	}

	return (
		<div className="space-y-6">
			{/* Page Title */}
			<div>
				<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
					견적 관리
				</h2>
				<p className="text-sand-700 text-sm mt-1">견적 요청 및 분석 관리</p>
			</div>

			{/* Tab Bar */}
			<div className="flex gap-1 bg-sand-100 rounded-xl p-1 w-fit">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => switchTab(tab.key)}
						className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
							currentTab === tab.key
								? 'bg-white text-forest-700 shadow-sm'
								: 'text-sand-600 hover:text-sand-800'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			{currentTab === 'requests' ? <QuoteRequests /> : <AnalysisList />}
		</div>
	)
}
