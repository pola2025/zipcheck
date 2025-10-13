# 견적 분석 결과 데이터 구조 정의

## 📊 분석 결과 데이터 구조 (analysis_result)

```typescript
interface AnalysisResult {
	// 1. 종합 평가
	overallScore: number // 0-100 (78점)
	totalAmount: number // 총 견적액 (42,747,200원)
	averageMarketPrice: number // 시장 평균가 (45,000,000원)
	priceRating: 'low' | 'reasonable' | 'high' | 'very_high' // 가격 수준

	// 2. 요약 (긍정/부정/경고)
	summary: {
		positive: string[] // 긍정적 평가
		negative: string[] // 부정적 평가
		warnings: string[] // 주의사항
	}

	// 3. 카테고리별 분석
	categoryAnalysis: Array<{
		category: string // '철거', '목공', '바닥' 등
		totalCost: number // 해당 카테고리 총 비용
		marketAverage: number // 시장 평균가
		rating: 'good' | 'reasonable' | 'slightly_high' | 'high' // 평가
		percentage: number // 전체 대비 비율 (%)
		items: number // 항목 개수
		findings: string[] // 세부 발견 사항
	}>

	// 4. 권장사항
	recommendations: Array<{
		type: 'cost_reduction' | 'quality_improvement' | 'warning' // 유형
		title: string // 제목
		description: string // 설명
		potentialSaving?: number // 예상 절감액 (있는 경우)
	}>

	// 5. 시장 비교
	marketComparison: {
		averagePriceRange: {
			min: number
			max: number
		}
		currentQuote: number
		percentile: number // 하위 몇 % (45 = 하위 45%, 즉 55%보다 저렴)
		similarCases: Array<{
			location: string
			size: number // ㎡
			cost: number
			year: number
		}>
	}

	// 6. 전문가 의견 (항목별)
	expertNotes: Record<string, string> // { "카테고리-항목명": "전문가 의견" }
}
```

## 🎨 UI 표시 방식

### 1. 종합 평가 섹션
- 원형 게이지 (0-100점)
- 총 견적액
- 시장 평균 대비 차이 (%)
- 가격 수준 배지

### 2. 카테고리별 비용 분석
- 도넛 차트 (카테고리별 비율)
- 막대 차트 (카테고리별 비용 vs 시장 평균)
- 각 카테고리 평가 (good/reasonable/high)

### 3. 주요 발견사항
- 긍정적 평가 (초록색 체크)
- 부정적 평가 (빨간색 경고)
- 주의사항 (노란색 경고)

### 4. 권장사항
- 비용 절감 방안 (💰 절감 금액 표시)
- 품질 개선 사항
- 주의사항

### 5. 시장 비교
- 가격대 분포 차트
- 유사 사례 비교 테이블

### 6. 전문가 의견
- 항목별 확장 가능한 카드
- 전문가 코멘트 표시

## 📏 평수 표기 규칙

정부 권장사항에 따라:
- **제곱미터(㎡)를 메인으로 표기**
- 평수는 환산값으로만 표기
  - 예: `112.4㎡ (34평)`
  - 예: `84㎡ (25.4평)`

환산 공식: `㎡ ÷ 3.3058 = 평`

## 🎯 데이터 샘플

34평(112.4㎡) 아파트 올수리:
- 총 견적액: 42,747,200원
- 시장 평균: 45,000,000원
- 절감액: 2,252,800원 (-5%)
- 종합 점수: 78점
- 카테고리: 11개
- 세부 항목: 33개

마지막 업데이트: 2025-10-13
