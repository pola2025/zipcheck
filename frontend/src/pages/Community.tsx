import React from 'react'
import { useSearchParams } from 'react-router-dom'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { Star, AlertTriangle } from 'lucide-react'
import CompanyReviewsTab from 'components/community/CompanyReviewsTab'
import DamageCasesTab from 'components/community/DamageCasesTab'

const Community: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const currentTab = searchParams.get('tab') || 'reviews'

	const handleTabChange = (tab: string) => {
		setSearchParams({ tab })
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="커뮤니티"
				description="인테리어 업체 후기와 피해 사례를 공유하세요. 실제 고객 경험을 바탕으로 현명한 선택을 도와드립니다."
				path="/community"
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">Community</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						커뮤니티
					</h1>
					<p className="text-sand-600 text-base md:text-lg max-w-md mx-auto">
						실제 사용자들의 경험을 공유하고 소통하는 공간입니다
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-5 md:px-8 pb-20">
				{/* Tab Navigation */}
				<div className="nordic-card rounded-2xl mb-8 overflow-hidden">
					<div className="flex">
						<button
							onClick={() => handleTabChange('reviews')}
							className={`flex-1 px-6 py-4 font-semibold text-base transition-all flex items-center justify-center gap-2.5 ${
								currentTab === 'reviews'
									? 'bg-forest-50 text-forest-600 border-b-2 border-forest-500'
									: 'text-sand-500 hover:text-forest-600 hover:bg-sand-50'
							}`}
						>
							<Star
								size={20}
								className={currentTab === 'reviews' ? 'fill-forest-500 text-forest-500' : ''}
							/>
							<span>업체 후기</span>
						</button>
						<button
							onClick={() => handleTabChange('damage-cases')}
							className={`flex-1 px-6 py-4 font-semibold text-base transition-all flex items-center justify-center gap-2.5 ${
								currentTab === 'damage-cases'
									? 'bg-red-50 text-red-600 border-b-2 border-red-500'
									: 'text-sand-500 hover:text-red-500 hover:bg-sand-50'
							}`}
						>
							<AlertTriangle size={20} />
							<span>피해사례</span>
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{currentTab === 'reviews' && <CompanyReviewsTab />}
				{currentTab === 'damage-cases' && <DamageCasesTab />}
			</div>

			<NordicFooter />
		</div>
	)
}

export default Community
