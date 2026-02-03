import {
	NordicNavigation,
	NordicHero,
	ConceptGallery,
	WhyZipCheck,
	QuoteExampleBanner,
	ProcessSteps,
	StyleStrip,
	NordicPricing,
	CtaBanner,
	NordicFooter
} from 'components/nordic'
import PageSEO from 'components/PageSEO'

export default function ZipCheckPage() {
	return (
		<div className="relative min-h-screen bg-sand-50 text-sand-900 font-noto">
			<PageSEO
				title="AI 인테리어 견적 분석"
				description="인테리어 견적서를 AI가 항목별로 분석해 적정 가격을 알려드립니다. 과다 청구 항목을 한눈에 확인하세요."
				path="/"
			/>
			<NordicNavigation />

			<NordicHero />
			<ConceptGallery />
			<WhyZipCheck />
			<QuoteExampleBanner />
			<ProcessSteps />
			<StyleStrip />
			<NordicPricing />
			<CtaBanner />

			<NordicFooter />
		</div>
	)
}
