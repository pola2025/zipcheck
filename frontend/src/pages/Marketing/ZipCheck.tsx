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
	areaServed: { '@type': 'Country', name: 'KR' },
	hasOfferCatalog: {
		'@type': 'OfferCatalog',
		name: '견적 분석 요금제',
		itemListElement: [
			{
				'@type': 'Offer',
				name: '기본 분석',
				price: '30000',
				priceCurrency: 'KRW',
				description: '48시간 내 AI 견적 분석 리포트 제공'
			},
			{
				'@type': 'Offer',
				name: '빠른 분석',
				price: '45000',
				priceCurrency: 'KRW',
				description: '24시간 내 AI 견적 분석 리포트 제공'
			}
		]
	}
}

export default function ZipCheckPage() {
	return (
		<div className="relative min-h-screen bg-sand-50 text-sand-900 font-noto">
			<PageSEO
				title="AI 인테리어 견적 분석"
				description="인테리어 견적서를 AI가 항목별로 분석해 적정 가격을 알려드립니다. 3,000건+ 데이터 기반, 48시간 내 분석 리포트 제공. 과다 청구 항목을 한눈에 확인하세요."
				path="/"
				jsonLd={[faqJsonLd, howToJsonLd, serviceJsonLd]}
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
