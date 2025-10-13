import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	}
})

// 실제 34평 (112.4㎡) 아파트 올수리 견적서 샘플
// 2024-2025년 실제 시장 가격 반영
const realisticQuoteRequest = {
	customer_name: '김현우',
	customer_phone: '010-2345-6789',
	customer_email: 'kim.hyunwoo@example.com',
	property_type: '아파트',
	property_size: 112.4, // 34평을 제곱미터로 표기
	region: '경기 수원시 영통구',
	address: '경기도 수원시 영통구 매탄동 123-45',
	status: 'completed',
	items: [
		// 1. 철거 및 폐기물 처리
		{
			category: '철거',
			itemName: '기존 바닥재 철거',
			quantity: 112.4,
			unit: '㎡',
			unitPrice: 8000,
			totalPrice: 899200,
			notes: '강마루/장판 철거, 쓰레기 수거 포함'
		},
		{
			category: '철거',
			itemName: '기존 벽지 제거',
			quantity: 112.4,
			unit: '㎡',
			unitPrice: 3000,
			totalPrice: 337200,
			notes: '전체 벽지 제거 및 초배지 작업'
		},
		{
			category: '철거',
			itemName: '폐기물 처리',
			quantity: 1,
			unit: '식',
			unitPrice: 800000,
			totalPrice: 800000,
			notes: '철거 폐기물 및 건축 쓰레기 처리'
		},

		// 2. 목공사
		{
			category: '목공',
			itemName: '거실 아트월 시공',
			quantity: 8,
			unit: '㎡',
			unitPrice: 180000,
			totalPrice: 1440000,
			notes: '원목 패널 + LED 간접조명'
		},
		{
			category: '목공',
			itemName: '주방 상판 교체',
			quantity: 3.6,
			unit: 'm',
			unitPrice: 220000,
			totalPrice: 792000,
			notes: '엔지니어드스톤 상판, 하부장 보수'
		},
		{
			category: '목공',
			itemName: '천장 몰딩',
			quantity: 45,
			unit: 'm',
			unitPrice: 25000,
			totalPrice: 1125000,
			notes: '거실, 주방, 복도 천장 몰딩 시공'
		},

		// 3. 바닥재
		{
			category: '바닥',
			itemName: '강화마루 (거실, 침실)',
			quantity: 85,
			unit: '㎡',
			unitPrice: 95000,
			totalPrice: 8075000,
			notes: 'LG하우시스 지아 12T, 몰딩 및 시공비 포함'
		},
		{
			category: '바닥',
			itemName: '주방 타일',
			quantity: 12,
			unit: '㎡',
			unitPrice: 85000,
			totalPrice: 1020000,
			notes: '300x600 포세린 타일, 시공비 포함'
		},
		{
			category: '바닥',
			itemName: '현관 포세린 타일',
			quantity: 6,
			unit: '㎡',
			unitPrice: 120000,
			totalPrice: 720000,
			notes: '600x600 포세린 타일, 시공비 포함'
		},
		{
			category: '바닥',
			itemName: '베란다 데크타일',
			quantity: 9.4,
			unit: '㎡',
			unitPrice: 65000,
			totalPrice: 611000,
			notes: '우드 데크타일, 배수 시공 포함'
		},

		// 4. 도배
		{
			category: '도배',
			itemName: '거실/주방 실크벽지',
			quantity: 48,
			unit: '㎡',
			unitPrice: 22000,
			totalPrice: 1056000,
			notes: 'LG 실크벽지 프리미엄급'
		},
		{
			category: '도배',
			itemName: '침실 실크벽지',
			quantity: 64.4,
			unit: '㎡',
			unitPrice: 20000,
			totalPrice: 1288000,
			notes: 'LG 실크벽지 일반급, 방 3개'
		},

		// 5. 욕실
		{
			category: '욕실',
			itemName: '안방 욕실 리모델링',
			quantity: 1,
			unit: '식',
			unitPrice: 3800000,
			totalPrice: 3800000,
			notes: '세면대(듀라빗), 양변기(코헬러), 욕조, 샤워부스, 벽/바닥 타일, 방수 포함'
		},
		{
			category: '욕실',
			itemName: '공용 욕실 리모델링',
			quantity: 1,
			unit: '식',
			unitPrice: 3500000,
			totalPrice: 3500000,
			notes: '세면대, 양변기, 샤워부스, 벽/바닥 타일, 방수 포함'
		},
		{
			category: '욕실',
			itemName: '욕실 악세사리',
			quantity: 2,
			unit: '식',
			unitPrice: 250000,
			totalPrice: 500000,
			notes: '수건걸이, 휴지걸이, 선반 등'
		},

		// 6. 주방
		{
			category: '주방',
			itemName: '주방 벽 타일',
			quantity: 8,
			unit: '㎡',
			unitPrice: 95000,
			totalPrice: 760000,
			notes: '300x600 포세린 타일, 포인트 디자인'
		},
		{
			category: '주방',
			itemName: '싱크볼 교체',
			quantity: 1,
			unit: '식',
			unitPrice: 350000,
			totalPrice: 350000,
			notes: '스테인리스 언더마운트 싱크볼'
		},
		{
			category: '주방',
			itemName: '주방 수전',
			quantity: 1,
			unit: '개',
			unitPrice: 280000,
			totalPrice: 280000,
			notes: '그로헤 주방 수전'
		},

		// 7. 전기/조명
		{
			category: '전기',
			itemName: 'LED 매입등 (다운라이트)',
			quantity: 24,
			unit: '개',
			unitPrice: 45000,
			totalPrice: 1080000,
			notes: '거실, 침실, 주방 매입등 교체'
		},
		{
			category: '전기',
			itemName: '거실 펜던트 조명',
			quantity: 1,
			unit: '식',
			unitPrice: 350000,
			totalPrice: 350000,
			notes: '디자인 펜던트 조명 + 시공'
		},
		{
			category: '전기',
			itemName: '간접조명',
			quantity: 18,
			unit: 'm',
			unitPrice: 35000,
			totalPrice: 630000,
			notes: 'LED 간접조명 (거실 천장, 아트월)'
		},
		{
			category: '전기',
			itemName: '스위치/콘센트 교체',
			quantity: 35,
			unit: '개',
			unitPrice: 15000,
			totalPrice: 525000,
			notes: '전체 스위치 및 콘센트 교체 (슈나이더)'
		},
		{
			category: '전기',
			itemName: '비디오폰 교체',
			quantity: 1,
			unit: '식',
			unitPrice: 220000,
			totalPrice: 220000,
			notes: '코맥스 디지털 비디오폰'
		},

		// 8. 창호
		{
			category: '창호',
			itemName: '거실 중문',
			quantity: 1,
			unit: '식',
			unitPrice: 1200000,
			totalPrice: 1200000,
			notes: '3연동 슬라이딩 중문, 로이복층유리'
		},
		{
			category: '창호',
			itemName: '방충망 교체',
			quantity: 6,
			unit: '개',
			unitPrice: 80000,
			totalPrice: 480000,
			notes: '거실, 침실 방충망 교체'
		},

		// 9. 가구
		{
			category: '가구',
			itemName: '안방 붙박이장',
			quantity: 3.2,
			unit: 'm',
			unitPrice: 450000,
			totalPrice: 1440000,
			notes: '3.2m 붙박이장, 슬라이딩 도어, 내부 시스템 포함'
		},
		{
			category: '가구',
			itemName: '작은방 붙박이장',
			quantity: 2.4,
			unit: 'm',
			unitPrice: 400000,
			totalPrice: 960000,
			notes: '2.4m 붙박이장, 여닫이 도어'
		},
		{
			category: '가구',
			itemName: '현관 신발장',
			quantity: 2.0,
			unit: 'm',
			unitPrice: 380000,
			totalPrice: 760000,
			notes: '2.0m 신발장 + 벤치 시트'
		},
		{
			category: '가구',
			itemName: '드레스룸 시스템 선반',
			quantity: 1,
			unit: '식',
			unitPrice: 850000,
			totalPrice: 850000,
			notes: '맞춤 시스템 선반 + 서랍'
		},

		// 10. 페인트
		{
			category: '페인트',
			itemName: '천장 도장',
			quantity: 112.4,
			unit: '㎡',
			unitPrice: 12000,
			totalPrice: 1348800,
			notes: '전체 천장 백색 도장 (KCC 페인트)'
		},
		{
			category: '페인트',
			itemName: '몰딩 도장',
			quantity: 45,
			unit: 'm',
			unitPrice: 8000,
			totalPrice: 360000,
			notes: '천장 몰딩 백색 도장'
		},

		// 11. 기타
		{
			category: '기타',
			itemName: '청소 및 마무리',
			quantity: 1,
			unit: '식',
			unitPrice: 400000,
			totalPrice: 400000,
			notes: '전체 청소 및 보양 제거'
		},
		{
			category: '기타',
			itemName: '현장 관리비',
			quantity: 1,
			unit: '식',
			unitPrice: 800000,
			totalPrice: 800000,
			notes: '현장 감리 및 관리'
		}
	]
}

// AI 분석 결과 샘플 (실제 분석 완료된 경우)
const analysisResult = {
	overallScore: 78,
	totalAmount: 42747200, // 총 견적액
	averageMarketPrice: 45000000, // 시장 평균가
	priceRating: 'reasonable', // 'low' | 'reasonable' | 'high' | 'very_high'

	summary: {
		positive: [
			'전체 견적 금액이 34평(112.4㎡) 아파트 올수리 시장 평균가 대비 5% 저렴합니다',
			'바닥재(LG하우시스 지아 12T)가 품질 대비 합리적인 가격으로 책정되었습니다',
			'욕실 리모델링 단가가 시장가 대비 적정 수준입니다',
			'철거 및 폐기물 처리 비용이 명확히 분리되어 투명합니다'
		],
		negative: [
			'거실 아트월 시공 단가(㎡당 18만원)가 시장 평균 대비 15% 높습니다',
			'붙박이장 단가가 미터당 40만원 이상으로 고가 브랜드 수준입니다',
			'간접조명 미터당 단가가 다소 높은 편입니다'
		],
		warnings: [
			'시스템 에어컨이 견적에 포함되지 않았습니다 (별도 비용 발생 가능)',
			'샷시 교체가 제외되어 있습니다',
			'발코니 확장 공사가 포함되지 않았습니다'
		]
	},

	categoryAnalysis: [
		{
			category: '철거',
			totalCost: 2036400,
			marketAverage: 2000000,
			rating: 'reasonable',
			percentage: 4.8,
			items: 3,
			findings: [
				'철거 비용이 적정 수준입니다',
				'폐기물 처리 비용이 명확히 분리되어 있어 투명합니다'
			]
		},
		{
			category: '목공',
			totalCost: 3357000,
			marketAverage: 3000000,
			rating: 'slightly_high',
			percentage: 7.9,
			items: 3,
			findings: [
				'아트월 시공 단가가 시장가 대비 15% 높습니다',
				'주방 상판 엔지니어드스톤 품질이 우수합니다'
			]
		},
		{
			category: '바닥',
			totalCost: 10426000,
			marketAverage: 10500000,
			rating: 'reasonable',
			percentage: 24.4,
			items: 4,
			findings: [
				'LG하우시스 지아 12T 강화마루가 품질 대비 합리적입니다',
				'포세린 타일 단가가 적정 수준입니다'
			]
		},
		{
			category: '도배',
			totalCost: 2344000,
			marketAverage: 2300000,
			rating: 'reasonable',
			percentage: 5.5,
			items: 2,
			findings: [
				'실크벽지 단가가 시장 평균 수준입니다',
				'거실과 침실의 벽지 등급을 차별화하여 비용 절감했습니다'
			]
		},
		{
			category: '욕실',
			totalCost: 7800000,
			marketAverage: 7500000,
			rating: 'reasonable',
			percentage: 18.2,
			items: 3,
			findings: [
				'욕실 2개소 리모델링 비용이 적정합니다',
				'듀라빗, 코헬러 등 유명 브랜드 제품이 포함되어 있습니다'
			]
		},
		{
			category: '주방',
			totalCost: 1390000,
			marketAverage: 1500000,
			rating: 'good',
			percentage: 3.3,
			items: 3,
			findings: [
				'주방 타일 및 수전 가격이 합리적입니다',
				'그로헤 수전이 포함되어 품질이 우수합니다'
			]
		},
		{
			category: '전기',
			totalCost: 2805000,
			marketAverage: 2500000,
			rating: 'slightly_high',
			percentage: 6.6,
			items: 5,
			findings: [
				'LED 매입등 개당 단가가 다소 높습니다',
				'간접조명 미터당 단가가 시장가 대비 높은 편입니다',
				'슈나이더 스위치는 프리미엄 제품입니다'
			]
		},
		{
			category: '창호',
			totalCost: 1680000,
			marketAverage: 1600000,
			rating: 'reasonable',
			percentage: 3.9,
			items: 2,
			findings: [
				'3연동 중문 가격이 적정합니다',
				'로이복층유리로 단열 성능이 우수합니다'
			]
		},
		{
			category: '가구',
			totalCost: 4010000,
			marketAverage: 3500000,
			rating: 'high',
			percentage: 9.4,
			items: 4,
			findings: [
				'붙박이장 미터당 단가가 40만원 이상으로 고가입니다',
				'드레스룸 시스템 선반이 맞춤 제작이라 단가가 높습니다',
				'일반 기성품 대비 30% 이상 비용이 높습니다'
			]
		},
		{
			category: '페인트',
			totalCost: 1708800,
			marketAverage: 1800000,
			rating: 'good',
			percentage: 4.0,
			items: 2,
			findings: [
				'KCC 페인트 사용으로 품질이 보장됩니다',
				'천장 도장 단가가 합리적입니다'
			]
		},
		{
			category: '기타',
			totalCost: 1200000,
			marketAverage: 1000000,
			rating: 'reasonable',
			percentage: 2.8,
			items: 2,
			findings: [
				'청소 및 현장 관리비가 명시되어 있습니다',
				'현장 관리비가 전체 공사비의 약 2% 수준으로 적정합니다'
			]
		}
	],

	recommendations: [
		{
			type: 'cost_reduction',
			title: '가구 비용 절감 방안',
			description: '맞춤 가구 대신 시스템 가구(이케아, 한샘 등) 사용 시 약 120만원 절감 가능',
			potentialSaving: 1200000
		},
		{
			type: 'cost_reduction',
			title: '간접조명 단가 협상',
			description: '간접조명 미터당 단가를 2만5천원으로 협상 시 약 18만원 절감',
			potentialSaving: 180000
		},
		{
			type: 'quality_improvement',
			title: '바닥재 선택 우수',
			description: 'LG하우시스 지아 12T는 내구성이 뛰어나 장기적으로 비용 효율적입니다'
		},
		{
			type: 'warning',
			title: '시스템 에어컨 별도 확인 필요',
			description: '시스템 에어컨 4대 설치 시 약 700~900만원 추가 비용 발생 예상'
		},
		{
			type: 'warning',
			title: '샷시 교체 여부 확인',
			description: '샷시가 20년 이상 노후된 경우 교체 권장 (약 500~700만원 추가)'
		}
	],

	marketComparison: {
		averagePriceRange: {
			min: 38000000,
			max: 52000000
		},
		currentQuote: 42747200,
		percentile: 45, // 하위 45% (즉, 55%보다 저렴)
		similarCases: [
			{
				location: '경기 성남시',
				size: 112.4,
				cost: 45000000,
				year: 2024
			},
			{
				location: '서울 송파구',
				size: 112.4,
				cost: 48000000,
				year: 2024
			},
			{
				location: '경기 안양시',
				size: 112.4,
				cost: 41000000,
				year: 2025
			}
		]
	},

	expertNotes: {
		'목공-거실 아트월 시공': '아트월 디자인이 복잡하거나 원목 패널 등급이 높은 경우 이 가격이 합리적일 수 있습니다. 시공 전 상세 디자인과 자재 등급을 확인하세요.',
		'가구-안방 붙박이장': '미터당 45만원은 고급 브랜드(한샘, 리바트 프리미엄급) 수준입니다. 일반 브랜드 선택 시 30~40% 비용 절감 가능합니다.',
		'전기-간접조명': '간접조명 시공 단가가 높은 편이나, LED 품질과 조광 기능 포함 여부에 따라 적정가일 수 있습니다.',
		'욕실-안방 욕실 리모델링': '듀라빗 세면대와 코헬러 양변기는 프리미엄 제품으로 품질이 우수합니다. 비용 대비 만족도가 높을 것으로 예상됩니다.'
	}
}

async function seedRealisticQuote() {
	console.log('🌱 실제 견적서 샘플 데이터 생성 시작...\n')

	const client = await pool.connect()

	try {
		await client.query('BEGIN')

		// 1. 견적 신청 데이터 삽입
		console.log('📝 견적 신청 데이터 삽입 중...')
		const insertQuoteQuery = `
			INSERT INTO quote_requests (
				customer_name,
				customer_phone,
				customer_email,
				property_type,
				property_size,
				region,
				address,
				items,
				status,
				analysis_result,
				analyzed_at,
				analyzed_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'AI System')
			RETURNING id
		`

		const result = await client.query(insertQuoteQuery, [
			realisticQuoteRequest.customer_name,
			realisticQuoteRequest.customer_phone,
			realisticQuoteRequest.customer_email,
			realisticQuoteRequest.property_type,
			realisticQuoteRequest.property_size,
			realisticQuoteRequest.region,
			realisticQuoteRequest.address,
			JSON.stringify(realisticQuoteRequest.items),
			realisticQuoteRequest.status,
			JSON.stringify(analysisResult)
		])

		const quoteId = result.rows[0].id

		await client.query('COMMIT')

		console.log('\n✅ 견적서 샘플 데이터 생성 완료!')
		console.log(`📋 견적 ID: ${quoteId}`)
		console.log(`👤 고객명: ${realisticQuoteRequest.customer_name}`)
		console.log(`🏠 평수: 112.4㎡ (34평)`)
		console.log(`💰 총 견적액: ${analysisResult.totalAmount.toLocaleString()}원`)
		console.log(`📊 전체 항목: ${realisticQuoteRequest.items.length}개`)
		console.log(`⭐ AI 분석 점수: ${analysisResult.overallScore}점`)

		console.log('\n📊 카테고리별 비용:')
		analysisResult.categoryAnalysis.forEach(cat => {
			console.log(`  - ${cat.category}: ${cat.totalCost.toLocaleString()}원 (${cat.percentage.toFixed(1)}%)`)
		})

	} catch (error) {
		await client.query('ROLLBACK')
		console.error('❌ 오류 발생:', error)
		throw error
	} finally {
		client.release()
		await pool.end()
	}
}

// 스크립트 실행
seedRealisticQuote()
	.then(() => {
		console.log('\n🎉 완료!')
		process.exit(0)
	})
	.catch((error) => {
		console.error('❌ 실패:', error)
		process.exit(1)
	})
