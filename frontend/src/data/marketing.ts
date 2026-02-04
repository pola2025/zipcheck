export type CTA = {
	label: string
	href: string
	target?: '_blank'
}

export type Benefit = {
	icon: string
	label: string
}

export type ProblemSolutionItem = {
	type: 'problem' | 'solution'
	title: string
	body: string
	bullets: string[]
}

export type FeatureItem = {
	icon: string
	title: string
	description: string
}

export type Testimonial = {
	quote: string
	author: string
	role: string
	rating: number
}

export type TrustLogo = {
	name: string
	href?: string
}

export type Plan = {
	name: string
	price: string
	period: string
	description: string
	features: string[]
	highlighted?: boolean
}

export type FAQItem = {
	question: string
	answer: string
}

export type ProcessStep = {
	title: string
	description: string
}

export type ContactCopy = {
	title: string
	subtitle: string
	supportEmail: string
	privacyUrl: string
}

export type HeroStat = {
	value: string
	suffix: string
	label: string
}

export type ConceptCard = {
	style: string
	title: string
	description: string
	placeholder: string
	image?: string
	colSpan?: number
	rowSpan?: number
}

export type StyleCard = {
	name: string
	subtitle: string
	placeholder: string
	image?: string
}

export type QuoteExampleItem = {
	category: string
	detail: string
	originalPrice?: string
	adjustedPrice?: string
	status: 'overcharged' | 'fair'
}

export const heroCopy = {
	title: '인테리어 견적, 오늘 안에 편하게 확인해 보세요',
	subtitle:
		'3천 건 이상의 실제 유통·시공 데이터를 바탕으로 48시간 안에 친절하게 정리해 드려요.',
	primaryCta: { label: '견적 분석 신청하기', href: '/plan-selection' } satisfies CTA,
	secondaryCta: {
		label: '분석 예시 보기',
		href: 'mailto:contact@zipcheck.kr',
		target: '_blank'
	} satisfies CTA,
	benefits: [
		{ icon: 'Sparkle', label: '실제 시공 데이터를 비교해 합리적인 범위를 알려드려요' },
		{ icon: 'ShieldCheck', label: '가격, 공정, 위험 요소를 따뜻한 말투로 정리해 드려요' },
		{ icon: 'Timer', label: '48시간 안에 상세 분석 리포트를 받아보실 수 있어요' }
	] satisfies Benefit[]
}

export const problemSolutionItems: ProblemSolutionItem[] = [
	{
		type: 'problem',
		title: '받은 견적이 적당한지 혼자 판단하기 어렵죠?',
		body: '',
		bullets: [
			'업체마다 금액과 조건이 달라서 어디까지가 적정선인지 헷갈려요.',
			'예산과 일정 안에서 믿을 만한 선택인지 확인하고 싶어요.'
		]
	},
	{
		type: 'solution',
		title: 'ZipCheck가 실제 데이터를 바탕으로 마음 편히 설명해 드려요',
		body: '',
		bullets: [
			'3천 건 이상 누적된 시공 데이터를 비교해 합리적인 금액을 알려드려요.',
			'실제 유통망 가격을 기반으로 항목별 적정가를 꼼꼼히 비교해 드려요.',
			'현장 조건과 계약 항목까지 한눈에 볼 수 있도록 정리해 드려요.'
		]
	}
]

export const featureItems: FeatureItem[] = [
	{
		icon: 'BarChart3',
		title: '3만 원 투자로 큰 비용을 지켜요',
		description:
			'소액의 분석 비용만으로 수백만 원의 공사 비용을 예방할 수 있어요. 3천 건 이상의 실제 데이터를 비교해 합리적인 가격대를 짚어 드려요.'
	},
	{
		icon: 'FileSearch',
		title: '놓치기 쉬운 위험을 미리 찾아요',
		description:
			'견적서 곳곳의 누락이나 과한 공정이 없는지 차분히 살펴봐요. 현장에서 자주 생기는 문제를 미리 알려드려요.'
	},
	{
		icon: 'ShieldQuestion',
		title: '브랜드 프리미엄도 분리해서 설명해요',
		description:
			'브랜드 선택에 따라 붙는 추가 비용이 있다면 이유와 대안을 함께 안내해 드려요. 꼭 필요한 항목인지 쉽게 판단할 수 있어요.'
	},
	{
		icon: 'Wand2',
		title: '실시간 거래 데이터를 반영해요',
		description:
			'최근 시세와 자재 단가를 기반으로 현재 조건에 맞는 금액을 알려드려요. 현장 상황까지 고려한 설명을 받아보세요.'
	},
	{
		icon: 'Clock',
		title: '48시간 안에 결과를 받아보세요',
		description:
			'접수 후 모든 항목을 하나하나 확인하고 이해하기 쉬운 언어로 정리해 드려요. 기본 분석은 48시간 안에 완료됩니다.'
	},
	{
		icon: 'Database',
		title: '핵심 데이터만 쏙 뽑아드려요',
		description:
			'총 비용, 추가 예상 금액, 위험 요소까지 핵심만 모아 정리해요. 중요한 선택을 빠르게 하실 수 있도록 돕는 요약을 드려요.'
	}
]

export const testimonials: Testimonial[] = [
	{
		quote:
			'처음 받은 견적서가 너무 복잡했는데 ZipCheck가 항목마다 이유를 짚어 줘서 마음이 한결 가벼워졌어요.',
		author: '김소연',
		role: '서울 강동구 아파트',
		rating: 4.9
	},
	{
		quote:
			'야근 중에 급하게 상담을 요청했는데도 SLA를 지켜서 결과를 보내 주셔서 믿음이 갔어요. 설명도 따뜻했어요.',
		author: '이도윤',
		role: '부천 카페 창업',
		rating: 4.7
	},
	{
		quote:
			'여러 견적을 비교하느라 막막했는데, ZipCheck 덕분에 팀원들과 바로 의사결정할 수 있었어요. 보고서가 이해하기 쉬웠습니다.',
		author: '박지훈',
		role: '수원 오피스 리모델링 PM',
		rating: 4.8
	}
]

export const trustLogos: TrustLogo[] = [
	{ name: '한빛건설' },
	{ name: '미라클하우징' },
	{ name: 'GS 네트웍스' },
	{ name: '브라이트스페이스' },
	{ name: '위마블디자인' }
]

export const plans: Plan[] = [
	{
		name: '기본 분석',
		price: '30,000원',
		period: 'VAT 별도',
		description: '48시간 안에 결과를 전달해 드려요.',
		features: [
			'주문은 하루 24시간 언제든 받아요.',
			'분석 결과는 접수 후 48시간 안에 도착해요.',
			'업무 시간 기준으로 순차 배정해 드려요.',
			'실제 유통 데이터 기반으로 분석해요.'
		],
		highlighted: true
	},
	{
		name: '빠른 분석',
		price: '45,000원',
		period: 'VAT 별도 (+50%)',
		description: '24시간 안에 먼저 처리해 드려요.',
		features: [
			'주문은 하루 24시간 언제든 받아요.',
			'분석 결과는 접수 후 24시간 안에 전달해요.',
			'긴급 건은 전담 분석팀이 우선 배정돼요.',
			'세부 코멘트와 후속 질문까지 빠르게 도와드려요.'
		],
		highlighted: true
	}
]

export const urgentPlans: Plan[] = [
	{
		name: '주간 긴급',
		price: '60,000원',
		period: '평일 09:00~18:00 (+100%)',
		description: '평일 업무 시간에 3시간 이내로 완료해 드려요.',
		features: [
			'접수 시간: 평일 09:00~18:00',
			'분석 결과: 접수 후 3시간 이내',
			'담당 컨설턴트가 즉시 연락드려요.',
			'가장 빠른 일정으로 바로 착수해요.'
		]
	},
	{
		name: '야간 긴급',
		price: '120,000원',
		period: '평일 21:00~24:00 (+300%)',
		description: '밤에도 바로 확인하고 다음 날 새벽 전에 전달해 드려요.',
		features: [
			'접수 시간: 평일 21:00~24:00',
			'분석 결과: 다음 날 0시 이전 전달',
			'야간 전담 컨설턴트가 함께해요.',
			'요청 즉시 분석을 시작해요.'
		]
	},
	{
		name: '주말 긴급',
		price: '120,000원',
		period: '주말·공휴일 09:00~18:00 (+300%)',
		description: '주말과 공휴일에도 3시간 안에 도와드려요.',
		features: [
			'접수 시간: 주말·공휴일 09:00~18:00',
			'분석 결과: 접수 후 3시간 이내',
			'주말 긴급 전담 셀을 운영해요.',
			'요청과 동시에 바로 착수해요.'
		]
	}
]

export const faqs: FAQItem[] = [
	{
		question: 'ZipCheck는 어떤 서비스인가요?',
		answer:
			'ZipCheck(집첵)은 AI 기반 인테리어 견적 분석 서비스입니다. 인테리어 견적서를 업로드하면 3,000건 이상의 실제 시공·유통 데이터를 기반으로 항목별 적정 가격을 분석하고, 과다 청구 여부를 리포트로 알려드립니다.'
	},
	{
		question: '인테리어 견적서 분석 비용은 얼마인가요?',
		answer:
			'기본 분석은 3만원(VAT 별도)이며 48시간 내에 결과를 받아보실 수 있어요. 빠른 분석은 4.5만원으로 24시간 내 결과를 전달해 드려요. 긴급 분석(평일 주간 6만원, 야간/주말 12만원)도 있어요.'
	},
	{
		question: 'SLA는 어떻게 계산되나요?',
		answer:
			'기본 분석과 빠른 분석은 평일 09:00~18:00 업무 시간을 기준으로 계산해요. 업무 시간 이후에 접수되면 다음 영업일 09:00부터 시간이 흐르기 시작해요.'
	},
	{
		question: '야간이나 주말에도 신청할 수 있나요?',
		answer:
			'야간과 주말·공휴일에는 긴급 상품을 선택하시면 돼요. 해당 시간대에는 3시간 SLA로 안내드리고 즉시 대응해 드려요.'
	},
	{
		question: '어떤 형태의 견적서도 분석할 수 있나요?',
		answer:
			'사진, PDF, 엑셀, 카카오톡 캡처 등 어떤 형식이든 분석 가능합니다. 견적서 원본이 아니더라도 항목과 금액이 확인 가능하면 분석을 진행해 드려요.'
	},
	{
		question: '결과물은 어떤 형태로 받게 되나요?',
		answer:
			'기본적으로 PDF 리포트와 요약본을 드리고, 요청하시면 발표 자료나 코드 매핑 파일도 함께 제공해 드려요. 리포트에는 항목별 적정 가격, 과다 청구 항목, 위험 요소, 절감 가능 금액이 포함됩니다.'
	},
	{
		question: '평균적으로 얼마나 절감할 수 있나요?',
		answer:
			'ZipCheck를 통해 분석한 고객의 평균 절감률은 9.2%입니다. 과다 청구 항목을 발견하고 적정 가격으로 협상할 수 있도록 근거 데이터를 제공해 드려요.'
	},
	{
		question: '아파트, 빌라, 상업 공간 모두 가능한가요?',
		answer:
			'아파트, 빌라, 오피스텔은 물론 카페, 사무실, 상가 등 상업 공간의 인테리어 견적도 분석 가능합니다. 주거·상업 공간 모두 실제 시공 데이터를 보유하고 있어요.'
	},
	{
		question: '추가 문의나 보완 요청은 어떻게 하나요?',
		answer:
			'리포트 수령 후 1회까지는 무료로 보완을 도와드려요. 범위를 넘는 경우에는 SLA에 맞춰 추가 견적을 안내해 드려요.'
	},
	{
		question: '견적 분석 데이터는 어디서 오나요?',
		answer:
			'3,000건 이상의 실제 시공 데이터와 자재 유통망 가격을 기반으로 합니다. 최근 시세와 자재 단가를 반영해 현재 시장 상황에 맞는 적정가를 산출해요.'
	}
]

export const processSteps: ProcessStep[] = [
	{
		title: '신청서 접수',
		description:
			'프로젝트 목적과 일정을 알려 주시면 ZipCheck 포털에서 바로 분석을 시작해요.'
	},
	{
		title: 'AI 분석과 컨설턴트 리뷰',
		description:
			'AI가 빠르게 표준화를 마치고, 담당 컨설턴트가 현장 상황을 반영해 다시 확인해요.'
	},
	{
		title: '리포트 전달과 코멘트',
		description:
			'SLA에 맞춰 보고서를 보내드리고, 궁금한 점이 있다면 이어서 대화를 이어가요.'
	},
	{
		title: '지속 액션 지원 (추가 기능 예정)',
		description:
			'추가 견적, 계약, 현장 점검이 필요하시면 ZipCheck 네트워크를 통해 이어드릴 예정이에요.'
	}
]

export const heroStats: HeroStat[] = [
	{ value: '3,000', suffix: '+', label: '누적 분석' },
	{ value: '48', suffix: 'h', label: '응답 보장' },
	{ value: '9.2', suffix: '%', label: '평균 절감' }
]

export const conceptCards: ConceptCard[] = [
	{
		style: '모던 내추럴',
		title: '따뜻한 우드톤 리빙룸',
		description: '자연 소재의 따뜻함과 미니멀한 라인이 만나는 공간',
		placeholder: 'ph-living',
		image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/concept-living.webp',
		colSpan: 2,
		rowSpan: 2
	},
	{
		style: '내추럴 키친',
		title: '오픈형 주방',
		description: '',
		placeholder: 'ph-kitchen',
		image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/concept-kitchen.webp'
	},
	{
		style: '스칸디나비안',
		title: '편안한 침실',
		description: '',
		placeholder: 'ph-bedroom',
		image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/concept-bedroom.webp'
	}
]

export const styleCards: StyleCard[] = [
	{ name: '모던 내추럴', subtitle: '우드톤 + 미니멀 라인', placeholder: 'ph-living', image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/style-modern-natural.webp' },
	{ name: '클래식 엘레강스', subtitle: '몰딩 + 대리석 패턴', placeholder: 'ph-kitchen', image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/style-classic-elegance.webp' },
	{ name: '스칸디나비안', subtitle: '화이트 + 파스텔 포인트', placeholder: 'ph-bedroom', image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/style-scandinavian.webp' },
	{ name: '인더스트리얼', subtitle: '콘크리트 + 메탈 프레임', placeholder: 'ph-bathroom', image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/style-industrial.webp' },
	{ name: '모던 럭셔리', subtitle: '다크톤 + 골드 포인트', placeholder: 'ph-dark', image: 'https://pub-bff60533ea4745ec98033ba24869e844.r2.dev/images/interior/style-modern-luxury.webp' }
]

export const quoteExampleItems: QuoteExampleItem[] = [
	{
		category: '싱크대 교체',
		detail: '상부장 + 하부장 + 싱크볼',
		originalPrice: '520만',
		adjustedPrice: '450만',
		status: 'overcharged'
	},
	{
		category: '타일 시공',
		detail: '바닥 + 벽면 포세린 타일',
		adjustedPrice: '380만',
		status: 'fair'
	},
	{
		category: '전기 배선',
		detail: '콘센트 추가 + 조명 이설',
		originalPrice: '280만',
		adjustedPrice: '210만',
		status: 'overcharged'
	},
	{
		category: '도배 / 페인트',
		detail: '주방 + 다이닝 영역',
		adjustedPrice: '180만',
		status: 'fair'
	}
]

export const quoteExampleSummary = {
	original: '3,800',
	adjusted: '3,450',
	savings: '350',
	savingsPercent: '9.2'
}

export const nordicProcessSteps = [
	{
		number: '01',
		title: '견적서 업로드',
		description: '사진, PDF, 엑셀 등 어떤 형식이든 괜찮아요. 카톡 사진도 OK.'
	},
	{
		number: '02',
		title: '유통망 기반 견적 분석',
		description: '실제 유통 가격과 시공 단가 데이터를 기반으로 항목별 적정가를 산출합니다.'
	},
	{
		number: '03',
		title: '리포트 전달',
		description: '48시간(기본) / 24시간(빠른) 내 상세 분석 리포트를 전달합니다.'
	}
]

export const nordicFeatures = [
	{ icon: 'BarChart3', title: '실데이터 비교', description: '실제 시공 데이터와 비교 분석' },
	{ icon: 'FileSearch', title: '항목별 분석', description: '모든 항목을 하나하나 쪼개어 확인' },
	{ icon: 'MessageCircle', title: '상세 코멘트', description: '항목별 친절하고 상세한 분석 설명' },
	{ icon: 'ShieldCheck', title: '투명한 리포트', description: '분석 근거와 비교 데이터를 모두 공개' }
]

export const contactCopy: ContactCopy = {
	title: '조금 더 이야기 나누고 싶으신가요?',
	subtitle:
		'프로젝트 규모와 일정을 알려 주시면 1영업일 이내 전담 컨설턴트가 연락드려 자세한 프로세스를 안내해 드릴게요.',
	supportEmail: 'contact@zipcheck.kr',
	privacyUrl: '/legal/privacy'
}
