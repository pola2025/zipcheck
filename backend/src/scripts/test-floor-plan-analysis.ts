/**
 * Test Floor Plan Analysis Logic
 *
 * 테스트 내용:
 * 1. 텍스트 파싱 로직 (Google Cloud Vision 없이)
 * 2. 공간별 면적 추출
 * 3. 단위 변환 (㎡ → 평)
 */

// 샘플 도면 텍스트 (OCR 결과 시뮬레이션)
const sampleFloorPlanTexts = [
	// 샘플 1: 기본 형식
	`
평면도
주방 5.5평
거실 15.3평
안방 8평
화장실 3.2평
베란다 2평
	`,

	// 샘플 2: 제곱미터 형식
	`
FLOOR PLAN
주방: 18.15㎡
거실: 50.49㎡
안방: 26.4㎡
화장실: 10.56㎡
	`,

	// 샘플 3: 괄호 형식
	`
1층 평면도
주방(5평)
거실(15평)
화장실1(3평)
화장실2(2.5평)
베란다(2평)
	`,

	// 샘플 4: 혼합 형식
	`
리모델링 평면도
주방식당 : 8.2평
거실 15평
안방 8평
작은방 6평
화장실1 3.2㎡
화장실2 2.8㎡
드레스룸(4평)
	`
]

// 위치 키워드와 제외 패턴
const locationPatterns = [
	{ keyword: '주방', exclude: [] },
	{ keyword: '거실', exclude: [] },
	{ keyword: '안방', exclude: [] },
	{ keyword: '화장실', exclude: [] },
	{ keyword: '욕실', exclude: [] },
	{ keyword: '베란다', exclude: [] },
	{ keyword: '발코니', exclude: [] },
	{ keyword: '현관', exclude: [] },
	{ keyword: '복도', exclude: [] },
	{ keyword: '드레스룸', exclude: [] },
	{ keyword: '서재', exclude: [] },
	{ keyword: '창고', exclude: [] },
	{ keyword: '다용도실', exclude: [] },
	{ keyword: '식당', exclude: [] },
	{ keyword: '주방식당', exclude: [] },
	{ keyword: '방', exclude: ['방수', '방문', '방충', '방음', '방범', '방열'] }
]

function extractLocation(text: string): string | null {
	if (!text) return null

	for (const pattern of locationPatterns) {
		// 제외 패턴 체크
		if (pattern.exclude.some(ex => text.includes(ex))) {
			continue
		}

		// 키워드 체크
		if (text.includes(pattern.keyword)) {
			return pattern.keyword
		}
	}

	return null
}

function parseRoomAreas(text: string): Record<string, number> {
	const roomAreas: Record<string, number> = {}

	// 각 라인별로 파싱
	const lines = text.split('\n')

	for (const line of lines) {
		// 공간 키워드 찾기
		const location = extractLocation(line)

		if (location) {
			// 숫자 추출 (평수 또는 제곱미터)
			const numberMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:평|㎡|m2|M2)/i)

			if (numberMatch) {
				let area = parseFloat(numberMatch[1])

				// ㎡인 경우 평수로 변환
				if (line.match(/㎡|m2|M2/i)) {
					area = area / 3.3
				}

				// 같은 공간이 여러 번 나오면 합산 (예: 화장실1, 화장실2)
				if (roomAreas[location]) {
					roomAreas[location] += area
				} else {
					roomAreas[location] = area
				}
			}
		}
	}

	return roomAreas
}

function runTests() {
	console.log('🧪 도면 분석 로직 테스트 시작\n')
	console.log('='.repeat(80))

	let totalTests = 0
	let passedTests = 0

	for (let i = 0; i < sampleFloorPlanTexts.length; i++) {
		const text = sampleFloorPlanTexts[i]
		console.log(`\n📋 테스트 ${i + 1}/${sampleFloorPlanTexts.length}`)
		console.log('-'.repeat(80))
		console.log('입력 텍스트:')
		console.log(text.trim())

		try {
			const roomAreas = parseRoomAreas(text)
			const totalArea = Object.values(roomAreas).reduce((sum, area) => sum + area, 0)

			console.log('\n✅ 파싱 결과:')
			Object.entries(roomAreas).forEach(([room, area]) => {
				console.log(`  ${room}: ${area.toFixed(1)}평`)
			})
			console.log(`\n  총 면적: ${totalArea.toFixed(1)}평`)
			console.log(`  공간 개수: ${Object.keys(roomAreas).length}개`)

			totalTests++
			if (Object.keys(roomAreas).length > 0) {
				passedTests++
				console.log('\n✅ 테스트 통과')
			} else {
				console.log('\n❌ 테스트 실패: 공간을 찾지 못했습니다.')
			}
		} catch (error) {
			console.error('\n❌ 테스트 실패:', error)
			totalTests++
		}
	}

	console.log('\n' + '='.repeat(80))
	console.log(`\n📊 테스트 결과: ${passedTests}/${totalTests} 통과`)

	// 엣지 케이스 테스트
	console.log('\n' + '='.repeat(80))
	console.log('\n🔬 엣지 케이스 테스트')
	console.log('-'.repeat(80))

	const edgeCases = [
		{ name: '제외 패턴 테스트 (방수, 방문, 방충)', text: '방수공사 50만원\n방문 3개\n방충망 설치', expected: 0 },
		{ name: '숫자 없는 경우', text: '주방\n거실\n안방', expected: 0 },
		{ name: '단위 없는 숫자', text: '주방 5\n거실 15', expected: 0 },
		{ name: '중복 공간 합산', text: '화장실1 3평\n화장실2 2평\n화장실3 1.5평', expected: 6.5 }
	]

	edgeCases.forEach((testCase, index) => {
		console.log(`\n테스트 ${index + 1}: ${testCase.name}`)
		const result = parseRoomAreas(testCase.text)
		const totalArea = Object.values(result).reduce((sum, area) => sum + area, 0)

		if (testCase.expected === 0 && Object.keys(result).length === 0) {
			console.log(`  ✅ 통과 - 공간을 찾지 않음 (예상대로)`)
		} else if (testCase.expected > 0 && Math.abs(totalArea - testCase.expected) < 0.1) {
			console.log(`  ✅ 통과 - 총 면적: ${totalArea.toFixed(1)}평 (예상: ${testCase.expected}평)`)
		} else if (testCase.expected === 0 && Object.keys(result).length > 0) {
			console.log(`  ❌ 실패 - 공간을 찾음: ${Object.keys(result).join(', ')}`)
		} else {
			console.log(`  ⚠️  부분 통과 - 총 면적: ${totalArea.toFixed(1)}평 (예상: ${testCase.expected}평)`)
		}

		if (Object.keys(result).length > 0) {
			console.log(`  파싱된 공간:`, result)
		}
	})

	console.log('\n' + '='.repeat(80))
	console.log('✨ 테스트 완료!\n')
}

// 실행
runTests()
