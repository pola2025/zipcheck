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
			'전반적으로 시세 범위 내이나 일부 항목에서 과다 책정이 있습니다. 브랜드 프리미엄과 시공 품질을 꼼꼼히 확인하세요.'
	},
	items: [
		{
			id: 'kitchen',
			category: '주방',
			name: '씽크대/주방',
			description:
				'무광매트 상하부장(에릴)/냉장고장/하츠 천장형 후드/백조사각싱크볼/무광서스',
			amount: 5850000
		},
		{
			id: 'room-extension',
			category: '안방확장실',
			name: '안방확장실 타일공사',
			description: '타일(피타션형덧시공), 벽타일 300×600, 욕조(실키욕조)',
			amount: 3800000
		},
		{
			id: 'floor',
			category: '마루',
			name: '마루 강마루',
			description: '전체 강마루 등화그라데(황토보드 서비스)',
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
			description: '거실3인치 매립3인치(식탁등, 펜던트1등, 방등, 엣지등)',
			amount: 2450000
		},
		{
			id: 'misc',
			category: '공과잡비',
			name: '공과잡비',
			description: '방문손잡이/자재대소운반, 폐기물처리, 보양, 현장유지관리비',
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
				'무광매트 상하부장과 인조대리석 상판은 중급 브랜드 기준 적정가입니다. 다만 하드웨어(경첩, 레일) 품질과 싱크볼 브랜드를 반드시 확인하세요. 현재 견적은 고급 브랜드 기준으로 책정된 것으로 보입니다.',
			checkpoints: [
				'싱크볼 브랜드/원산지 확인 필수',
				'상판 두께 확인 (12mm vs 20mm)',
				'경첩/레일 브랜드 명시 요청',
				'AS 보증 기간 및 범위 확인',
				'후드 배기 방식(덕트/순환) 확인'
			],
			alternatives: [
				'중급 브랜드로 변경 시 약 -900,000원 절감',
				'상판을 엔지니어드스톤으로 변경 고려',
				'후드를 일반형으로 변경 시 -300,000원'
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
				'안방확장실 타일공사는 시세 범위 내입니다. 타일 규격(300×600)과 욕조가 포함된 것을 감안하면 적정합니다. 다만 타일 브랜드와 방수 공정은 꼭 확인하세요.',
			checkpoints: [
				'타일 브랜드 확인 (국산/수입)',
				'방수 시공 방법 확인 (우레탄/시트 방수)',
				'욕조 브랜드 및 크기 확인',
				'코킹 작업 포함 여부',
				'바닥 배수 기울기 확인'
			],
			alternatives: ['타일을 국산 중급으로 변경 시 약 -200,000원']
		},
		{
			itemId: 'floor',
			priceEvaluation: 'appropriate',
			marketPriceDiff: -2,
			appropriatePrice: 3930000,
			hasBrandPremium: false,
			riskLevel: 'low',
			expertComment:
				'강마루 등화그라데는 시세보다 약간 저렴한 편입니다. 황토보드 서비스가 포함되어 있어 합리적인 가격입니다. 시공 품질과 마감재 두께를 확인하세요.',
			checkpoints: [
				'강마루 두께 확인 (8mm/10mm/12mm)',
				'황토보드 두께 및 브랜드 확인',
				'문지방 시공 방식 확인',
				'걸레받이 포함 여부',
				'층간소음 방지 성능 확인'
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
				'안방 여닫이와 작은방 슬라이딩 붙박이장 가격은 약간 높은 편이나 브랜드 프리미엄을 감안하면 수용 가능한 범위입니다. 내부 마감과 선반 구성을 확인하세요.',
			checkpoints: [
				'도어 브랜드 확인 (국산/수입)',
				'내부 선반 개수 및 위치 조정 가능 여부',
				'서랍 포함 여부',
				'경첩/레일 품질 확인',
				'조명 포함 여부'
			],
			alternatives: ['슬라이딩을 여닫이로 변경 시 약 -150,000원']
		},
		{
			itemId: 'lighting',
			priceEvaluation: 'appropriate',
			marketPriceDiff: 3,
			appropriatePrice: 2380000,
			hasBrandPremium: false,
			riskLevel: 'low',
			expertComment:
				'거실 매립등과 각 방 조명 가격은 적정합니다. LED 2구 방등 기준으로 합리적인 견적입니다. 조명 색온도와 밝기를 미리 확인하세요.',
			checkpoints: [
				'LED 색온도 선택 (주백색/전구색)',
				'밝기(루멘) 확인',
				'펜던트 등 디자인 선택',
				'스위치 위치 조정 가능 여부',
				'조명 브랜드 확인'
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
				'공과잡비가 총 공사금액의 7.3%로 업계 평균(5-6%)보다 높습니다. 세부 내역을 요청하여 불필요한 항목이 없는지 확인하세요. 특히 현장유지관리비 항목을 재검토하세요.',
			checkpoints: [
				'폐기물 처리 업체 및 방식 확인',
				'보양 범위 명시 요청',
				'현장유지관리비 세부 내역',
				'자재 운반 횟수 및 방법',
				'방문손잡이 브랜드 확인'
			],
			alternatives: [
				'현장유지관리비 재협상 시 약 -350,000원',
				'폐기물 처리를 직접 업체 섭외 시 -200,000원'
			]
		}
	]
}
