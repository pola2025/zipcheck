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

				{/* Tab Description */}
				<div className="mb-8">
					{currentTab === 'reviews' && (
						<div className="nordic-card rounded-2xl p-5 border border-forest-200 bg-forest-50/30">
							<div className="flex items-start gap-4">
								<Star size={20} className="text-forest-500 flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="text-base font-bold text-sand-900 mb-1">커뮤니티</h3>
									<p className="text-sm text-sand-600 leading-relaxed">
										만족스러웠던 인테리어 후기를 올려주세요.
										<br />
										실제 사용자들의 경험을 자유롭게 소통할 수 있습니다.
									</p>
								</div>
							</div>
						</div>
					)}
					{currentTab === 'damage-cases' && (
						<div className="nordic-card rounded-2xl p-5 border-2 border-red-200 bg-red-50/50">
							<div className="flex items-start gap-4">
								<AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="text-base font-bold text-red-600 mb-2">주의사항 (필독)</h3>
									<div className="text-sm text-sand-600 leading-relaxed space-y-1.5">
										<p className="font-semibold text-red-500">
											본 게시판은 업체 비방을 하는 곳이 아닙니다.
										</p>
										<p>
											실제 인테리어 진행 시 피해를 본 내용과 사례를 공유하여
											동일한 피해사례가 늘어나지 않기 위함입니다.
										</p>
										<p className="text-xs text-red-500 font-medium pt-2 border-t border-red-200">
											※ 게시판 등록 내용으로 인한 법적 분쟁은 게시글 작성자에게 있음을 안내드립니다.
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
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
