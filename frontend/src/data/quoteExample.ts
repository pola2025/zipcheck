import type { QuoteExample } from 'types/quote'

export const quoteExample: QuoteExample = {
	summary: {
		originalAmount: 38000000,
		appropriateAmount: 34500000,
		savingsAmount: 3500000,
		savingsPercent: 9.2,
		overallGrade: 'APPROPRIATE_B',
		overallGradeDisplay: 'B+',
		overallComment:
			'전체적으로 시세 범위 안에 있지만 일부 항목은 브랜드 프리미엄이 붙어 있어요. 꼭 필요한 선택인지 확인하고 조정하면 더 알맞은 견적이 될 거예요.'
	},
	items: [
		{
			id: 'kitchen',
			category: '주방',
			name: '싱크대/주방',
			description:
				'무광매트 상하부장(에릴)/냉장고장/하츠 천장형 후드/백조 사각 싱크볼/무광 서스',
			amount: 5850000
		},
		{
			id: 'room-extension',
			category: '안방 확장실',
			name: '안방 확장실 타일 공사',
			description: '타일(피타션형 덧시공), 벽타일 300×600, 욕조(실키 욕조)',
			amount: 3800000
		},
		{
			id: 'floor',
			category: '마루',
			name: '마루 강마루',
			description: '전체 강마루 등화그라데(황토보드 서비스 포함)',
			amount: 3850000
		},
		{
			id: 'closet',
			category: '붙박이장',
			name: '붙박이장',
			description: '안방 붙박이장 여닫이/작은방 슬라이딩 붙박이',
			amount: 3250000
		},
		{
			id: 'lighting',
			category: '조명',
			name: '거실등/조명',
			description: '거실 3인치 매립등, 펜던트 1등, 방등, 엣지등',
			amount: 2450000
		},
		{
			id: 'misc',
			category: '공과잡비',
			name: '공과잡비',
			description: '방문 손잡이/자재 대소 운반, 폐기물 처리, 보양, 현장 유지 관리비',
			amount: 2770600
		}
	],
	analyses: [
		{
			itemId: 'kitchen',
			priceEvaluation: 'high',
			marketPriceDiff: 18,
			appropriatePrice: 4950000,
			hasBrandPremium: true,
			premiumFactors: ['상판 브랜드', '싱크볼 브랜드', '하드웨어'],
			riskLevel: 'high',
			expertComment:
				'무광 상하부장과 인조대리석 상판은 중간급 기준과 비슷해요. 다만 경첩·레일 같은 하드웨어와 싱크볼이 고급 라인으로 보이니 브랜드와 사양을 꼭 확인해 주세요.',
			checkpoints: [
				'싱크볼 브랜드와 원산지를 확인해 주세요.',
				'상판 두께가 12mm인지 20mm인지 살펴봐 주세요.',
				'경첩과 레일 브랜드를 적어 달라고 요청해 주세요.',
				'AS 보증 기간과 범위를 미리 확인해 주세요.',
				'후드는 덕트형인지 순환형인지 체크해 주세요.'
			],
			alternatives: [
				'중간급 브랜드로 선택하면 약 -900,000원까지 줄일 수 있어요.',
				'싱크볼을 상판과 잘 어울리는 라인으로 조정해 보세요.',
				'후드를 일반형으로 바꾸면 약 -300,000원이 절감돼요.'
			]
		},
		{
			itemId: 'room-extension',
			priceEvaluation: 'appropriate',
			marketPriceDiff: 5,
			appropriatePrice: 3620000,
			hasBrandPremium: false,
			riskLevel: 'medium',
			expertComment:
				'안방 확장실 타일 공사는 시세 안이에요. 타일 규격과 욕조가 포함된 구성을 고려하면 적정해요. 타일 브랜드와 방수 공정만 다시 확인해 주세요.',
			checkpoints: [
				'타일 브랜드(국산/수입)를 확인해 주세요.',
				'방수 방식이 우레탄인지 시트인지 확인해 주세요.',
				'욕조 브랜드와 크기를 살펴봐 주세요.',
				'코킹 작업이 포함돼 있는지 확인해 주세요.',
				'바닥 배수 기울기가 충분한지 확인해 주세요.'
			],
			alternatives: ['타일을 국산 중급으로 선택하면 약 -200,000원 절감돼요.']
		},
		{
			itemId: 'floor',
			priceEvaluation: 'appropriate',
			marketPriceDiff: -2,
			appropriatePrice: 3930000,
			hasBrandPremium: false,
			riskLevel: 'low',
			expertComment:
				'강마루 등화그라데는 시세보다 약간 저렴하고 황토보드 서비스도 포함돼요. 시공 품질과 마감재 두께만 확인하면 안심할 수 있어요.',
			checkpoints: [
				'강마루 두께가 8mm, 10mm, 12mm 중 무엇인지 확인해 주세요.',
				'황토보드 두께와 브랜드를 확인해 주세요.',
				'문지방 시공 방식이 어떻게 되는지 확인해 주세요.',
				'걸레받이가 포함되는지 확인해 주세요.',
				'층간소음 대비가 어느 정도인지 체크해 주세요.'
			]
		},
		{
			itemId: 'closet',
			priceEvaluation: 'appropriate',
			marketPriceDiff: 8,
			appropriatePrice: 3010000,
			hasBrandPremium: true,
			premiumFactors: ['슬라이딩 도어 브랜드'],
			riskLevel: 'medium',
			expertComment:
				'안방 여닫이와 작은방 슬라이딩 붙박이장은 다소 높은 편이지만 브랜드 프리미엄을 고려하면 수용 가능한 수준이에요. 내부 마감과 구성 옵션을 꼭 확인해 보세요.',
			checkpoints: [
				'도어 브랜드가 국산인지 수입인지 확인해 주세요.',
				'내부 선반 개수와 위치를 조정할 수 있는지 확인해 주세요.',
				'서랍 포함 여부를 확인해 주세요.',
				'경첩과 레일 품질을 확인해 주세요.',
				'조명 포함 여부를 확인해 주세요.'
			],
			alternatives: ['슬라이딩을 여닫이로 변경하면 약 -150,000원 절감돼요.']
		},
		{
			itemId: 'lighting',
			priceEvaluation: 'appropriate',
			marketPriceDiff: 3,
			appropriatePrice: 2380000,
			hasBrandPremium: false,
			riskLevel: 'low',
			expertComment:
				'거실 매립등과 각 방 조명 금액은 적정해요. LED 2구 방등 기준으로 합리적이니 색온도와 밝기만 미리 체크해 주세요.',
			checkpoints: [
				'LED 색온도를 주백색과 전구색 중에서 결정해 주세요.',
				'필요한 밝기(루멘)를 확인해 주세요.',
				'펜던트 등 디자인을 선택해 주세요.',
				'스위치 위치를 조정할 수 있는지 확인해 주세요.',
				'조명 브랜드를 확인해 주세요.'
			]
		},
		{
			itemId: 'misc',
			priceEvaluation: 'high',
			marketPriceDiff: 25,
			appropriatePrice: 2216000,
			hasBrandPremium: false,
			riskLevel: 'high',
			expertComment:
				'공과잡비가 총 금액의 7.3%로 업계 평균(5~6%)보다 살짝 높아요. 세부 내역을 요청해 불필요한 항목이 없는지 살펴보세요. 특히 현장 유지 관리비를 다시 협의하면 좋아요.',
			checkpoints: [
				'폐기물 처리 업체와 방식을 확인해 주세요.',
				'보양 범위가 어디까지인지 적어 달라고 요청해 주세요.',
				'현장 유지 관리비 세부 내역을 받아 주세요.',
				'자재 운반 횟수와 방법을 확인해 주세요.',
				'방문손잡이 브랜드를 확인해 주세요.'
			],
			alternatives: [
				'현장 유지 관리비를 재협상하면 약 -350,000원 절감돼요.',
				'폐기물 처리를 직접 업체에 의뢰하면 약 -200,000원 줄일 수 있어요.'
			]
		}
	]
}
