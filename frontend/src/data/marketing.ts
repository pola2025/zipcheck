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

export const heroCopy = {
	title: '인테리어 견적 바로 점검해보세요',
	subtitle:
		'실제 시공데이터와 현업 인테리어 대표 견적분석',
	primaryCta: { label: '견적 분석 신청하기', href: '/plan-selection' } satisfies CTA,
	secondaryCta: {
		label: '분석 예시 보기',
		href: 'mailto:contact@zipcheck.kr',
		target: '_blank'
	} satisfies CTA,
	benefits: [
		{ icon: 'Sparkle', label: '20년+ 경력 인테리어 대표 직접 분석' },
		{ icon: 'ShieldCheck', label: '실제 유통망 원가 기준 검증' },
		{ icon: 'Timer', label: '최대 48시간 내 전문가 코멘트 제공' }
	] satisfies Benefit[]
}

export const problemSolutionItems: ProblemSolutionItem[] = [
	{
		type: 'problem',
		title: '받은 견적이 적정한지 도저히 모르겠어요',
		body: '',
		bullets: [
			'업체 견적이 합리적인 가격인지, 바가지를 쓰는 가격인지 판단할 기준이 없어서 불안합니다.',
			'수천만원의 인테리어 비용/시간을 알맞게 진행하고 싶어요.'
		]
	},
	{
		type: 'solution',
		title: 'ZipCheck이 실제 원가 기준으로 명확하게 분석해드립니다',
		body: '',
		bullets: [
			'3천여건 이상의 실제 시공데이터, 유통망 원가 기반',
			'현업 20년 이상 경력의 인테리어 대표 분석 내용 첨부',
			'자재, 인건비, 디자인 등 검토 후 상세내용 제공'
		]
	}
]

export const featureItems: FeatureItem[] = [
	{
		icon: 'BarChart3',
		title: '수천만원 절약하는 3만원 투자',
		description:
			'몇만원의 분석 비용으로 수천만원의 인테리어 비용 낭비를 막을 수 있습니다. 3천 건 이상의 실제 공사 데이터를 기반으로 정확한 원가를 산출합니다.'
	},
	{
		icon: 'FileSearch',
		title: '위험요소 사전 파악',
		description:
			'실제 인테리어 견적의 적정 수준과 위험요소를 사전에 파악할 수 있습니다. 시공 중 발생할 수 있는 문제를 미리 예방하세요.'
	},
	{
		icon: 'ShieldQuestion',
		title: '브랜드 프리미엄 체크',
		description:
			'브랜드 프리미엄이 있는 경우 어떤 요소들이 더 프리미엄인지 명확하게 체크합니다. 디자인, 자재, 시공마감 보장 등을 세밀하게 분석합니다.'
	},
	{
		icon: 'Wand2',
		title: '실제 유통망 원가 기준 분석',
		description:
			'실제 유통망 단계에서 원가 기준으로 정확한 견적 비용을 산출합니다. 자재, 인건비, 잡비 등 실무 비용을 모두 포함하여 분석합니다.'
	},
	{
		icon: 'Clock',
		title: '20년 경력 전문가 직접 코멘트',
		description:
			'현업 20년 이상 경력의 인테리어 대표가 직접 분석하고 코멘트를 작성합니다. 48시간 내에 전문가의 상세한 의견을 받아보실 수 있습니다.'
	},
	{
		icon: 'Database',
		title: '몇개월의 시간 낭비 방지',
		description:
			'잘못된 견적으로 인한 공사 지연, 추가 비용, 품질 문제를 사전에 방지합니다. 수천만원과 몇개월의 시간을 효율적으로 관리하세요.'
	}
]

export const testimonials: Testimonial[] = [
	{
		quote:
			'복수 프로젝트 견적을 동시에 비교해야 했는데 ZipCheck가 항목을 정규화해 주니 승인 속도가 눈에 띄게 빨라졌습니다.',
		author: '김정우',
		role: '중견 건설사 시공팀장',
		rating: 4.9
	},
	{
		quote:
			'심야 긴급 일정으로 하루 이내 결과가 필요했지만 SLA를 지켜 주어 입찰 기한을 맞출 수 있었습니다. 리포트 품질도 기대 이상이었습니다.',
		author: '이세영',
		role: '부동산 개발 기획팀',
		rating: 4.7
	},
	{
		quote:
			'모든 커뮤니케이션이 기록으로 남고, 회의 자료로 바로 활용할 수 있어 재발주율과 고객 만족도가 동시에 올라갔습니다.',
		author: '박민수',
		role: '리모델링 전문 PM',
		rating: 4.8
	}
]

export const trustLogos: TrustLogo[] = [
	{ name: '로드앤컴퍼니' },
	{ name: '스마트빌드' },
	{ name: '한빛건설' },
	{ name: 'GS 파트너스' },
	{ name: '브라이트웍스' }
]

export const plans: Plan[] = [
	{
		name: '기본 분석',
		price: '30,000원',
		period: 'VAT 별도',
		description: '48시간 이내 분석 완료',
		features: [
			'주문 가능 시간: 24시간',
			'분석 결과: 48시간 이내',
			'영업시간 기준 순차 대응',
			'20년 경력 전문가 직접 분석'
		],
		highlighted: true
	},
	{
		name: '빠른 분석',
		price: '45,000원',
		period: 'VAT 별도 (+50%)',
		description: '24시간 이내 우선 처리',
		features: [
			'주문 가능 시간: 24시간',
			'분석 결과: 24시간 이내',
			'업무일 기준 우선 배정',
			'상세 코멘트 및 협상 포인트 제공'
		],
		highlighted: true
	}
]

export const urgentPlans: Plan[] = [
	{
		name: '긴급 분석',
		price: '60,000원',
		period: '평일 09:00~18:00 (+100%)',
		description: '영업시간 내 3시간 완료',
		features: [
			'주문 가능 시간: 평일 09:00~18:00',
			'분석 결과: 3시간 이내',
			'전담 컨설턴트 실시간 협업',
			'즉시 분석 착수'
		]
	},
	{
		name: '심야 긴급',
		price: '120,000원',
		period: '평일 21:00~24:00 (+300%)',
		description: '다음날 오전 12시 이전',
		features: [
			'주문 가능 시간: 평일 21:00~24:00',
			'분석 결과: 다음 영업일 12시 이전',
			'야간 전담 컨설턴트 배정',
			'심야 즉시 착수'
		]
	},
	{
		name: '휴일 긴급',
		price: '120,000원',
		period: '주말·공휴일 09:00~18:00 (+300%)',
		description: '주말·공휴일 3시간 완료',
		features: [
			'주문 가능 시간: 주말·공휴일 09:00~18:00',
			'분석 결과: 3시간 이내',
			'휴일 긴급 대응팀 운영',
			'즉시 분석 착수'
		]
	}
]

export const faqs: FAQItem[] = [
	{
		question: 'SLA 시간은 어떻게 계산되나요?',
		answer:
			'Standard와 Express는 평일 09:00~18:00 영업시간 기준으로만 SLA를 카운트합니다. 영업시간 외에 주문하면 다음 영업일 09:00부터 계산이 시작됩니다.'
	},
	{
		question: '심야나 휴일에도 요청할 수 있나요?',
		answer:
			'Late-Night Urgent(평일 21:00~24:00)와 Holiday Urgent(주말·공휴일 09:00~18:00) 요금제를 이용하면 해당 시간대에도 3시간 SLA로 대응합니다.'
	},
	{
		question: '결과물은 어떤 형태로 제공되나요?',
		answer:
			'PDF 리포트와 엑셀 내역서를 기본 제공하고, 필요 시 발표자료용 슬라이드나 회계코드 매핑 파일도 옵션으로 요청할 수 있습니다.'
	},
	{
		question: '추가 견적이나 재요청은 어떻게 처리되나요?',
		answer:
			'동일 프로젝트의 보완 요청은 1회까지 무료로 제공하며, 범위를 초과하는 경우 SLA에 맞춰 재산정 후 진행합니다.'
	}
]

export const processSteps: ProcessStep[] = [
	{
		title: '요청서 접수',
		description:
			'프로젝트 목적과 예산, 일정 정보를 ZipCheck 포털에 업로드하면 즉시 분석이 시작됩니다.'
	},
	{
		title: 'AI 분석 & 컨설턴트 리뷰',
		description:
			'AI가 항목을 정규화하고 비용을 산정하면 전담 컨설턴트가 현장 여건을 반영해 검수합니다.'
	},
	{
		title: '리포트 전달 & 피드백',
		description:
			'요금제별 SLA에 맞춰 보고서를 전달하고, 대시보드에서 추가 요청과 코멘트를 교환합니다.'
	},
	{
		title: '후속 액션 실행 (추후 도입 예정)',
		description:
			'추가 견적, 계약, 현장 지원이 필요하면 ZipCheck 네트워크를 통해 연계해 드립니다.'
	}
]

export const contactCopy: ContactCopy = {
	title: '견적 상담이 필요하신가요?',
	subtitle:
		'프로젝트 규모와 일정만 알려 주시면 1영업일 이내 전담 컨설턴트가 연락드려 상세 프로세스를 안내합니다.',
	supportEmail: 'contact@zipcheck.kr',
	privacyUrl: '/legal/privacy'
}
