/**
 * 실제 시장 데이터 기반 테스트 분석 케이스 생성 스크립트
 *
 * 데이터 출처:
 *   - Case 1: 로티인테리어 33평 가성비 올수리 (2025, ~3,030만원)
 *   - Case 2: 집브로/오늘의집 30평 고급 올수리 (2025, ~5,800만원)
 *
 * 사용법: node scripts/seed-test-analyses.mjs
 */

const API_BASE = 'https://zipcheck-api.zipcheck2025.workers.dev'

// ============================================
// 1단계: 로그인하여 JWT 토큰 획득
// ============================================

async function login() {
	// ADMIN_PASSWORD는 환경변수에서 읽거나 직접 입력
	const password = process.env.ADMIN_PASSWORD
	if (!password) {
		console.error('ADMIN_PASSWORD 환경변수를 설정하세요.')
		console.error('예: ADMIN_PASSWORD=xxxx node scripts/seed-test-analyses.mjs')
		process.exit(1)
	}

	const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password }),
	})

	if (!res.ok) {
		const err = await res.json().catch(() => ({}))
		console.error('로그인 실패:', err)
		process.exit(1)
	}

	const data = await res.json()
	console.log('로그인 성공')
	return data.token
}

// ============================================
// API 헬퍼
// ============================================

async function api(token, method, path, body) {
	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: body ? JSON.stringify(body) : undefined,
	})

	const data = await res.json()
	if (!res.ok) {
		console.error(`API 오류 [${method} ${path}]:`, data)
		throw new Error(data.error || 'API error')
	}
	return data
}

// ============================================
// Case 1: 로티인테리어 33평 가성비 올수리
// 출처: https://rotidesign.kr/ (2025)
// 총 3,030만원 (가성비 등급)
// ============================================

const case1 = {
	analysis: {
		customerName: '이수진',
		customerPhone: '010-8765-4321',
		customerEmail: 'lee.sujin@example.com',
		contractorName: '로티인테리어 김포점',
		propertyType: '아파트',
		propertySizeSqm: 109.1, // 33평
		region: '경기',
		address: '경기도 김포시 장기동 한강메트로자이 2차',
	},
	meta: {
		is_vat_included: true,
		completeness: 'full',
		pricing_type: 'mixed',
		quote_date: '2025-03-15',
		construction_start_month: 5,    // 5월 착공 (성수기)
		reviewed_by: 'admin',
		contractor_license_verified: false, // 면허 미확인
	},
	items: [
		// 철거
		{
			original_category: '철거', original_item_name: '전체 철거 (바닥재+벽지+욕실 등)',
			original_quantity: 1, original_unit: '식', original_unit_price: 3000000, original_total_price: 3000000,
			original_notes: '구축 아파트 전체 철거, 폐기물 처리 포함',
			std_category: '철거', std_item: '전체 철거',
			is_bundled: true,
			components: [
				{ name: '바닥재 철거', estimatedRatio: 0.3, variance_estimate: 0.05 },
				{ name: '벽지 제거', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '욕실 철거', estimatedRatio: 0.25, variance_estimate: 0.05 },
				{ name: '폐기물 처리', estimatedRatio: 0.3, variance_estimate: 0.05 },
			],
			confidence: 0.85,
			benchmark_unit_price: 2800000,
			adjusted_benchmark_price: 2660000, // 33평 보정 (경기 0.9 × 면적 1.05)
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 12.8,
			deviation_bracket: 'slightly_high',
			attributes: { grade: '가성비' },
		},

		// 목공
		{
			original_category: '목공', original_item_name: '영림 몰딩도어 교체',
			original_quantity: 5, original_unit: '짝', original_unit_price: 420000, original_total_price: 2100000,
			original_notes: '영림 몰딩도어 5짝 (방문 4+화장실 1), 문선 포함',
			std_category: '목공', std_item: '방문 교체',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 380000,
			adjusted_benchmark_price: 253460, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 65.7,
			deviation_bracket: 'high',
			attributes: { brand: '영림', grade: '가성비' },
		},
		{
			original_category: '목공', original_item_name: '천장 몰딩 시공',
			original_quantity: 42, original_unit: 'm', original_unit_price: 50000, original_total_price: 2100000,
			original_notes: '전실 천장 몰딩, 걸레받이 시공',
			std_category: '목공', std_item: '천장 몰딩',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 25000,
			adjusted_benchmark_price: 16673, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 199.8,
			deviation_bracket: 'high',
			attributes: { grade: '가성비' },
		},

		// 욕실
		{
			original_category: '욕실', original_item_name: '안방 욕실 리모델링',
			original_quantity: 1, original_unit: '식', original_unit_price: 3500000, original_total_price: 3500000,
			original_notes: '양변기+세면대+욕조+타일+방수 일체',
			std_category: '욕실', std_item: '욕실 리모델링',
			is_bundled: true,
			components: [
				{ name: '양변기', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '세면대', estimatedRatio: 0.12, variance_estimate: 0.03 },
				{ name: '타일', estimatedRatio: 0.35, variance_estimate: 0.05 },
				{ name: '방수', estimatedRatio: 0.2, variance_estimate: 0.03 },
				{ name: '수전/액세서리', estimatedRatio: 0.18, variance_estimate: 0.04 },
			],
			confidence: 0.8,
			benchmark_unit_price: 3500000,
			adjusted_benchmark_price: 2334500, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 49.9,
			deviation_bracket: 'high',
			attributes: { grade: '가성비' },
		},
		{
			original_category: '욕실', original_item_name: '공용 욕실 리모델링',
			original_quantity: 1, original_unit: '식', original_unit_price: 3500000, original_total_price: 3500000,
			original_notes: '양변기+세면대+샤워부스+타일+방수',
			std_category: '욕실', std_item: '욕실 리모델링',
			is_bundled: true,
			components: [
				{ name: '양변기', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '세면대', estimatedRatio: 0.12, variance_estimate: 0.03 },
				{ name: '타일', estimatedRatio: 0.35, variance_estimate: 0.05 },
				{ name: '방수', estimatedRatio: 0.2, variance_estimate: 0.03 },
				{ name: '수전/액세서리', estimatedRatio: 0.18, variance_estimate: 0.04 },
			],
			confidence: 0.8,
			benchmark_unit_price: 3500000,
			adjusted_benchmark_price: 2334500,
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 49.9,
			deviation_bracket: 'high',
			attributes: { grade: '가성비' },
		},

		// 타일 (욕실 외: 베란다/주방/현관)
		{
			original_category: '타일', original_item_name: '베란다/주방/현관 타일 시공',
			original_quantity: 18, original_unit: '㎡', original_unit_price: 100000, original_total_price: 1800000,
			original_notes: '300x600 포세린 타일, 시공비 포함',
			std_category: '바닥', std_item: '포세린 타일',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 85000,
			adjusted_benchmark_price: 56695, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 76.4,
			deviation_bracket: 'high',
			attributes: { material: '포세린', grade: '가성비' },
		},

		// 도배
		{
			original_category: '도배', original_item_name: '실크벽지 도배',
			original_quantity: 109, original_unit: '㎡', original_unit_price: 22936, original_total_price: 2500000,
			original_notes: '전체 실크벽지 시공 (LG)',
			std_category: '도배', std_item: '실크벽지',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 20000,
			adjusted_benchmark_price: 13342, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 71.9,
			deviation_bracket: 'high',
			attributes: { brand: 'LG', grade: '가성비' },
		},

		// 바닥 (장판)
		{
			original_category: '바닥', original_item_name: '장판 시공',
			original_quantity: 85, original_unit: '㎡', original_unit_price: 20000, original_total_price: 1700000,
			original_notes: '거실/침실 장판 시공',
			std_category: '바닥', std_item: '장판',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 25000,
			adjusted_benchmark_price: 16673, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 19.9,
			deviation_bracket: 'slightly_high',
			attributes: { grade: '가성비' },
		},

		// 전기 (조명)
		{
			original_category: '조명', original_item_name: '엣지등 조명 교체',
			original_quantity: 15, original_unit: '개', original_unit_price: 100000, original_total_price: 1500000,
			original_notes: 'LED 엣지등 15개 교체 (거실+침실+주방)',
			std_category: '전기', std_item: 'LED 조명',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 45000,
			adjusted_benchmark_price: 30008, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 233.3,
			deviation_bracket: 'high',
			attributes: { grade: '가성비' },
		},

		// 페인트
		{
			original_category: '페인트', original_item_name: '세라믹코트 도장',
			original_quantity: 109, original_unit: '㎡', original_unit_price: 7339, original_total_price: 800000,
			original_notes: '천장 세라믹코트 도장',
			std_category: '페인트', std_item: '천장 도장',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 12000,
			adjusted_benchmark_price: 8003, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: -8.3,
			deviation_bracket: 'good',
			attributes: { material: '세라믹코트', grade: '가성비' },
		},

		// 가구
		{
			original_category: '가구', original_item_name: '현관장/주방가구',
			original_quantity: 1, original_unit: '식', original_unit_price: 4800000, original_total_price: 4800000,
			original_notes: '현관 신발장 + 주방 상하부장 + 냉장고장',
			std_category: '가구', std_item: '주방가구 세트',
			is_bundled: true,
			components: [
				{ name: '현관 신발장', estimatedRatio: 0.2, variance_estimate: 0.05 },
				{ name: '주방 상부장', estimatedRatio: 0.25, variance_estimate: 0.05 },
				{ name: '주방 하부장', estimatedRatio: 0.3, variance_estimate: 0.05 },
				{ name: '냉장고장', estimatedRatio: 0.25, variance_estimate: 0.05 },
			],
			confidence: 0.75,
			benchmark_unit_price: 5500000,
			adjusted_benchmark_price: 3668500, // 가성비 보정
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 30.8,
			deviation_bracket: 'slightly_high',
			attributes: { grade: '가성비' },
		},

		// 기타
		{
			original_category: '기타', original_item_name: '기타 비용',
			original_quantity: 1, original_unit: '식', original_unit_price: 3000000, original_total_price: 3000000,
			original_notes: '양생, 청소, 현장관리, 예비비 등',
			std_category: '기타', std_item: '현장 관리비',
			is_bundled: true,
			components: [
				{ name: '양생', estimatedRatio: 0.2, variance_estimate: 0.05 },
				{ name: '청소', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '현장관리', estimatedRatio: 0.35, variance_estimate: 0.05 },
				{ name: '예비비', estimatedRatio: 0.3, variance_estimate: 0.1 },
			],
			confidence: 0.6,
			benchmark_unit_price: 1200000,
			adjusted_benchmark_price: 800400,
			adjustment_factors: { area: 1.05, region: 0.9, year: 1.0, grade: 0.7, season: 1.07 },
			deviation_percent: 274.8,
			deviation_bracket: 'high',
			attributes: {},
		},
	],
}

// ============================================
// Case 2: 30평 서울 고급 올수리
// 출처: 오늘의집/집브로 종합 (2025-2026)
// 총 5,800만원 (고급 등급)
// ============================================

const case2 = {
	analysis: {
		customerName: '박지영',
		customerPhone: '010-5678-1234',
		customerEmail: 'park.jiyoung@example.com',
		contractorName: '아지트디자인',
		propertyType: '아파트',
		propertySizeSqm: 99.2, // 30평
		region: '서울',
		address: '서울특별시 마포구 상암동 월드컵파크 3차',
	},
	meta: {
		is_vat_included: true,
		completeness: 'full',
		pricing_type: 'itemized',
		quote_date: '2025-11-20',
		construction_start_month: 1,    // 1월 착공 (비수기)
		reviewed_by: 'admin',
		contractor_license_verified: true,  // 면허 확인
		contractor_license: '서울특별시 제2024-12345호',
	},
	items: [
		// 철거
		{
			original_category: '철거', original_item_name: '기존 바닥재 철거',
			original_quantity: 99.2, original_unit: '㎡', original_unit_price: 9000, original_total_price: 892800,
			original_notes: '기존 온돌마루 철거',
			std_category: '철거', std_item: '바닥 철거',
			is_bundled: false,
			confidence: 0.95,
			benchmark_unit_price: 8000,
			adjusted_benchmark_price: 9120, // 서울 1.0, 면적 1.2(30평 소형), 고급 1.4, 비수기 0.95
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -1.3,
			deviation_bracket: 'fair',
			attributes: { grade: '고급' },
		},
		{
			original_category: '철거', original_item_name: '벽지/천장 철거',
			original_quantity: 99.2, original_unit: '㎡', original_unit_price: 3500, original_total_price: 347200,
			original_notes: '전체 벽지 및 천장지 제거',
			std_category: '철거', std_item: '벽지 철거',
			is_bundled: false,
			confidence: 0.95,
			benchmark_unit_price: 3000,
			adjusted_benchmark_price: 3420, // 고급 보정
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: 2.3,
			deviation_bracket: 'fair',
			attributes: { grade: '고급' },
		},
		{
			original_category: '철거', original_item_name: '폐기물 처리',
			original_quantity: 1, original_unit: '식', original_unit_price: 1200000, original_total_price: 1200000,
			original_notes: '5톤 트럭 2대분, 석면검사비 별도',
			std_category: '철거', std_item: '폐기물 처리',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 800000,
			adjusted_benchmark_price: 1216800,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -1.4,
			deviation_bracket: 'fair',
			attributes: { grade: '고급' },
		},

		// 목공
		{
			original_category: '목공', original_item_name: '거실 아트월 목공',
			original_quantity: 6.5, original_unit: '㎡', original_unit_price: 200000, original_total_price: 1300000,
			original_notes: '월넛 패널 + 간접조명 틀',
			std_category: '목공', std_item: '아트월 시공',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 180000,
			adjusted_benchmark_price: 273726,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -26.9,
			deviation_bracket: 'dump_risk',
			attributes: { brand: '월넛패널', grade: '고급' },
		},
		{
			original_category: '목공', original_item_name: '방문 교체 (5짝)',
			original_quantity: 5, original_unit: '짝', original_unit_price: 550000, original_total_price: 2750000,
			original_notes: '에코도어 ABS엣지 3연동 포함',
			std_category: '목공', std_item: '방문 교체',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 380000,
			adjusted_benchmark_price: 577836,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -4.8,
			deviation_bracket: 'fair',
			attributes: { brand: '에코도어', grade: '고급' },
		},
		{
			original_category: '목공', original_item_name: '천장/걸레받이 몰딩',
			original_quantity: 48, original_unit: 'm', original_unit_price: 28000, original_total_price: 1344000,
			original_notes: '폴리우레탄 몰딩',
			std_category: '목공', std_item: '천장 몰딩',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 25000,
			adjusted_benchmark_price: 38019,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -26.4,
			deviation_bracket: 'dump_risk',
			attributes: { material: '폴리우레탄', grade: '고급' },
		},

		// 바닥
		{
			original_category: '바닥', original_item_name: '강화마루 (거실/침실)',
			original_quantity: 72, original_unit: '㎡', original_unit_price: 120000, original_total_price: 8640000,
			original_notes: 'LG하우시스 지아 프리미엄 12T',
			std_category: '바닥', std_item: '강화마루',
			is_bundled: false,
			confidence: 0.95,
			benchmark_unit_price: 95000,
			adjusted_benchmark_price: 144438,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -16.9,
			deviation_bracket: 'under_warning',
			attributes: { brand: 'LG하우시스', model: '지아 프리미엄 12T', grade: '고급' },
		},
		{
			original_category: '바닥', original_item_name: '주방/현관 포세린 타일',
			original_quantity: 15, original_unit: '㎡', original_unit_price: 130000, original_total_price: 1950000,
			original_notes: '600x600 이탈리아산 포세린',
			std_category: '바닥', std_item: '포세린 타일',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 85000,
			adjusted_benchmark_price: 129237,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: 0.6,
			deviation_bracket: 'fair',
			attributes: { material: '이탈리아 포세린', grade: '고급' },
		},

		// 도배
		{
			original_category: '도배', original_item_name: '합지벽지 (침실)',
			original_quantity: 55, original_unit: '㎡', original_unit_price: 35000, original_total_price: 1925000,
			original_notes: '신한 합지벽지',
			std_category: '도배', std_item: '합지벽지',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 20000,
			adjusted_benchmark_price: 30408,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: 15.1,
			deviation_bracket: 'slightly_high',
			attributes: { brand: '신한', grade: '고급' },
		},
		{
			original_category: '도배', original_item_name: '거실 포인트벽지',
			original_quantity: 12, original_unit: '㎡', original_unit_price: 55000, original_total_price: 660000,
			original_notes: '수입 텍스처 벽지',
			std_category: '도배', std_item: '포인트벽지',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 45000,
			adjusted_benchmark_price: 68418,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -19.6,
			deviation_bracket: 'under_warning',
			attributes: { material: '수입 텍스처', grade: '고급' },
		},

		// 욕실
		{
			original_category: '욕실', original_item_name: '안방 욕실 (프리미엄)',
			original_quantity: 1, original_unit: '식', original_unit_price: 5500000, original_total_price: 5500000,
			original_notes: '듀라빗 세면대+TOTO 양변기+욕조+레인샤워+이탈리아 타일',
			std_category: '욕실', std_item: '욕실 리모델링',
			is_bundled: true,
			components: [
				{ name: '세면대(듀라빗)', estimatedRatio: 0.12, variance_estimate: 0.02 },
				{ name: '양변기(TOTO)', estimatedRatio: 0.1, variance_estimate: 0.02 },
				{ name: '타일(이탈리아)', estimatedRatio: 0.35, variance_estimate: 0.05 },
				{ name: '방수', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '수전/레인샤워', estimatedRatio: 0.18, variance_estimate: 0.03 },
				{ name: '욕조', estimatedRatio: 0.1, variance_estimate: 0.03 },
			],
			confidence: 0.8,
			benchmark_unit_price: 3500000,
			adjusted_benchmark_price: 5322300,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: 3.3,
			deviation_bracket: 'fair',
			attributes: { brand: '듀라빗/TOTO', grade: '고급' },
		},
		{
			original_category: '욕실', original_item_name: '공용 욕실',
			original_quantity: 1, original_unit: '식', original_unit_price: 4200000, original_total_price: 4200000,
			original_notes: '대림 세면대+양변기+샤워부스+국산 타일',
			std_category: '욕실', std_item: '욕실 리모델링',
			is_bundled: true,
			components: [
				{ name: '세면대', estimatedRatio: 0.12, variance_estimate: 0.03 },
				{ name: '양변기', estimatedRatio: 0.1, variance_estimate: 0.03 },
				{ name: '타일', estimatedRatio: 0.35, variance_estimate: 0.05 },
				{ name: '방수', estimatedRatio: 0.18, variance_estimate: 0.03 },
				{ name: '수전/샤워', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '샤워부스', estimatedRatio: 0.1, variance_estimate: 0.03 },
			],
			confidence: 0.8,
			benchmark_unit_price: 3500000,
			adjusted_benchmark_price: 5322300,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -21.1,
			deviation_bracket: 'under_warning',
			attributes: { brand: '대림', grade: '고급' },
		},

		// 주방
		{
			original_category: '주방', original_item_name: '주방 상하부장 교체',
			original_quantity: 1, original_unit: '식', original_unit_price: 6500000, original_total_price: 6500000,
			original_notes: '한샘 유로 8400, 엔지니어드스톤 상판, 빌트인 수납',
			std_category: '주방', std_item: '주방가구 세트',
			is_bundled: true,
			components: [
				{ name: '상부장', estimatedRatio: 0.2, variance_estimate: 0.03 },
				{ name: '하부장', estimatedRatio: 0.25, variance_estimate: 0.03 },
				{ name: '상판(엔지니어드스톤)', estimatedRatio: 0.2, variance_estimate: 0.05 },
				{ name: '싱크볼+수전', estimatedRatio: 0.15, variance_estimate: 0.03 },
				{ name: '빌트인 수납', estimatedRatio: 0.2, variance_estimate: 0.05 },
			],
			confidence: 0.75,
			benchmark_unit_price: 5500000,
			adjusted_benchmark_price: 8361300,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -22.3,
			deviation_bracket: 'under_warning',
			attributes: { brand: '한샘', model: '유로 8400', grade: '고급' },
		},

		// 전기
		{
			original_category: '전기', original_item_name: 'LED 다운라이트',
			original_quantity: 20, original_unit: '개', original_unit_price: 55000, original_total_price: 1100000,
			original_notes: '필립스 LED 다운라이트 6인치',
			std_category: '전기', std_item: 'LED 조명',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 45000,
			adjusted_benchmark_price: 68418,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -19.6,
			deviation_bracket: 'under_warning',
			attributes: { brand: '필립스', grade: '고급' },
		},
		{
			original_category: '전기', original_item_name: '스위치/콘센트 교체',
			original_quantity: 30, original_unit: '개', original_unit_price: 22000, original_total_price: 660000,
			original_notes: '슈나이더 아바타',
			std_category: '전기', std_item: '스위치/콘센트',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 15000,
			adjusted_benchmark_price: 22806,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -3.5,
			deviation_bracket: 'fair',
			attributes: { brand: '슈나이더', model: '아바타', grade: '고급' },
		},
		{
			original_category: '전기', original_item_name: '간접조명 (거실+안방)',
			original_quantity: 14, original_unit: 'm', original_unit_price: 40000, original_total_price: 560000,
			original_notes: 'LED 간접조명 + 디밍',
			std_category: '전기', std_item: '간접조명',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 35000,
			adjusted_benchmark_price: 53216,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -24.8,
			deviation_bracket: 'under_warning',
			attributes: { grade: '고급' },
		},

		// 창호
		{
			original_category: '창호', original_item_name: '거실 3연동 중문',
			original_quantity: 1, original_unit: '식', original_unit_price: 1500000, original_total_price: 1500000,
			original_notes: '로이복층유리, 시스템 레일',
			std_category: '창호', std_item: '중문',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 1200000,
			adjusted_benchmark_price: 1824120,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -17.8,
			deviation_bracket: 'under_warning',
			attributes: { material: '로이복층유리', grade: '고급' },
		},

		// 가구
		{
			original_category: '가구', original_item_name: '안방 붙박이장',
			original_quantity: 3.0, original_unit: 'm', original_unit_price: 550000, original_total_price: 1650000,
			original_notes: '리바트 프리미엄 슬라이딩',
			std_category: '가구', std_item: '붙박이장',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 450000,
			adjusted_benchmark_price: 684180,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -19.6,
			deviation_bracket: 'under_warning',
			attributes: { brand: '리바트', grade: '고급' },
		},
		{
			original_category: '가구', original_item_name: '현관 신발장',
			original_quantity: 1.8, original_unit: 'm', original_unit_price: 450000, original_total_price: 810000,
			original_notes: '맞춤 신발장 + 벤치',
			std_category: '가구', std_item: '신발장',
			is_bundled: false,
			confidence: 0.85,
			benchmark_unit_price: 380000,
			adjusted_benchmark_price: 577836,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -22.1,
			deviation_bracket: 'under_warning',
			attributes: { grade: '고급' },
		},

		// 페인트
		{
			original_category: '페인트', original_item_name: '천장 페인트',
			original_quantity: 99.2, original_unit: '㎡', original_unit_price: 14000, original_total_price: 1388800,
			original_notes: '벤자민무어 친환경 도장 2회',
			std_category: '페인트', std_item: '천장 도장',
			is_bundled: false,
			confidence: 0.9,
			benchmark_unit_price: 12000,
			adjusted_benchmark_price: 18244,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -23.3,
			deviation_bracket: 'under_warning',
			attributes: { brand: '벤자민무어', grade: '고급' },
		},

		// 기타
		{
			original_category: '기타', original_item_name: '청소/양생/관리',
			original_quantity: 1, original_unit: '식', original_unit_price: 1500000, original_total_price: 1500000,
			original_notes: '입주청소, 양생비, 현장감리비',
			std_category: '기타', std_item: '현장 관리비',
			is_bundled: true,
			components: [
				{ name: '양생', estimatedRatio: 0.2, variance_estimate: 0.05 },
				{ name: '입주청소', estimatedRatio: 0.25, variance_estimate: 0.03 },
				{ name: '현장감리', estimatedRatio: 0.55, variance_estimate: 0.05 },
			],
			confidence: 0.7,
			benchmark_unit_price: 1200000,
			adjusted_benchmark_price: 1824120,
			adjustment_factors: { area: 1.14, region: 1.0, year: 1.0, grade: 1.4, season: 0.95 },
			deviation_percent: -17.8,
			deviation_bracket: 'under_warning',
			attributes: {},
		},
	],
}

// ============================================
// 실행
// ============================================

async function createTestCase(token, testCase, label) {
	console.log(`\n${'='.repeat(50)}`)
	console.log(`${label}`)
	console.log(`${'='.repeat(50)}`)

	// 1. 분석 생성
	console.log('분석 생성 중...')
	const { data: analysis } = await api(token, 'POST', '/api/admin/analyses', testCase.analysis)
	const analysisId = analysis.id
	console.log(`  분석 ID: ${analysisId}`)
	console.log(`  고객: ${testCase.analysis.customerName}`)
	console.log(`  주소: ${testCase.analysis.address}`)

	// 2. 메타데이터 업데이트
	console.log('메타데이터 업데이트...')
	await api(token, 'PATCH', `/api/admin/analyses/${analysisId}`, testCase.meta)

	// 3. 항목 추가 (subrequest limit 고려, 순차 처리)
	console.log(`항목 ${testCase.items.length}개 추가 중...`)
	for (let i = 0; i < testCase.items.length; i++) {
		const item = testCase.items[i]
		await api(token, 'POST', `/api/admin/analyses/${analysisId}/items`, {
			...item,
			sort_order: i,
		})
		process.stdout.write(`  [${i + 1}/${testCase.items.length}] ${item.std_category} - ${item.std_item}\n`)
	}

	// 4. 총액 계산
	const totalAmount = testCase.items.reduce((s, i) => s + (i.original_total_price || 0), 0)
	console.log(`\n  총 견적액: ${totalAmount.toLocaleString()}원`)
	console.log(`  항목 수: ${testCase.items.length}개`)

	// 5. 카테고리별 요약
	const catSummary = {}
	for (const item of testCase.items) {
		const cat = item.std_category || '기타'
		if (!catSummary[cat]) catSummary[cat] = { count: 0, total: 0 }
		catSummary[cat].count++
		catSummary[cat].total += item.original_total_price || 0
	}
	console.log('\n  카테고리별 비용:')
	for (const [cat, data] of Object.entries(catSummary)) {
		const pct = ((data.total / totalAmount) * 100).toFixed(1)
		console.log(`    ${cat}: ${data.total.toLocaleString()}원 (${pct}%) - ${data.count}건`)
	}

	return analysisId
}

async function main() {
	console.log('GOI 테스트 분석 케이스 생성 스크립트')
	console.log('데이터 출처: 로티인테리어(33평 가성비), 오늘의집/집브로(30평 고급)\n')

	const token = await login()

	const id1 = await createTestCase(token, case1, 'Case 1: 이수진 - 33평 가성비 올수리 (경기 김포)')
	const id2 = await createTestCase(token, case2, 'Case 2: 박지영 - 30평 고급 올수리 (서울 마포)')

	console.log(`\n${'='.repeat(50)}`)
	console.log('생성 완료!')
	console.log(`  Case 1 (이수진 가성비): ${id1}`)
	console.log(`  Case 2 (박지영 고급):   ${id2}`)
	console.log(`\n관리자 페이지에서 확인: https://admin.zcheck.co.kr`)
}

main().catch(err => {
	console.error('실행 실패:', err)
	process.exit(1)
})
