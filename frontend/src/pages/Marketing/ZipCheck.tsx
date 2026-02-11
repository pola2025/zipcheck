import { lazy, Suspense } from 'react'
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
import { faqs, nordicProcessSteps } from '../../data/marketing'

const PriceAnalysisSection = lazy(() =>
	import('components/remotion/PriceAnalysisPlayer').then(m => ({
		default: () => (
			<section className="bg-sand-50 py-16 md:py-24">
				<div className="max-w-5xl mx-auto px-5 md:px-8">
					<div className="text-center mb-10">
						<span className="inline-block text-sm font-semibold tracking-widest text-forest-600 uppercase mb-2">Price Analysis</span>
						<h2 className="text-3xl md:text-4xl font-bold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
							왜 견적 분석이 필요할까요?
						</h2>
						<p className="text-sand-600 text-base mt-2">30초만 투자해보세요</p>
					</div>
					<div className="rounded-2xl overflow-hidden border border-sand-200 shadow-lg bg-white">
						<m.PriceAnalysisPlayer />
					</div>
				</div>
			</section>
		),
	}))
)

const faqJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: faqs.map((faq) => ({
		'@type': 'Question',
		name: faq.question,
		acceptedAnswer: {
			'@type': 'Answer',
			text: faq.answer
		}
	}))
}

const howToJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'HowTo',
	name: '인테리어 견적 분석 받는 방법',
	description: 'ZipCheck에서 인테리어 견적서를 분석받는 단계별 방법입니다.',
	step: nordicProcessSteps.map((step, i) => ({
		'@type': 'HowToStep',
		position: i + 1,
		name: step.title,
		text: step.description
	}))
}

const serviceJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Service',
	name: 'ZipCheck 인테리어 견적 분석',
	description: 'AI 기반 인테리어 견적 분석 서비스. 견적서를 업로드하면 항목별 적정 가격과 과다 청구 여부를 분석해드립니다.',
	provider: {
		'@type': 'Organization',
		name: 'ZipCheck',
		url: 'https://zcheck.co.kr'
	},
	serviceType: '인테리어 견적 분석',
	areaServed: { '@type': 'Country', name: 'KR' },
	hasOfferCatalog: {
		'@type': 'OfferCatalog',
		name: '견적 분석 요금제',
		itemListElement: [
			{
				'@type': 'Offer',
				name: '견적 분석',
				price: '0',
				priceCurrency: 'KRW',
				description: '선착순 50명 무료 - 48시간 내 AI 견적 분석 리포트 제공'
			}
		]
	}
}

export default function ZipCheckPage() {
	return (
		<div className="relative min-h-screen bg-sand-50 text-sand-900 font-noto">
			<PageSEO
				title="AI 인테리어 견적 분석"
				description="인테리어 견적비교, 인테리어 가격비교의 새로운 기준. 유통원가 기반으로 견적서를 항목별 분석해 자재등급별 적정 가격을 알려드립니다. 인테리어 리모델링 견적비교도 간편하게, 48시간 내 분석 리포트 제공."
				path="/"
				jsonLd={[faqJsonLd, howToJsonLd, serviceJsonLd]}
			/>
			<NordicNavigation />

			<NordicHero />
			<ConceptGallery />
			<WhyZipCheck />
			<Suspense fallback={null}>
				<PriceAnalysisSection />
			</Suspense>
			<QuoteExampleBanner />
			<ProcessSteps />
			<StyleStrip />
			<NordicPricing />
			<CtaBanner />

			<NordicFooter />
		</div>
	)
}
