/**
 * GOI 공유 상수 — Backend
 * 카테고리별 업종 표준 마진율, 가중치 등
 */

export type StdCategory =
	| '욕실' | '바닥' | '가구' | '목공' | '전기'
	| '도배' | '철거' | '주방' | '창호' | '페인트' | '기타'

/**
 * 카테고리별 업종 표준 마진율 (시장가 기준)
 * 시장가 = 원가 × (1 + marginRate)
 */
export const CATEGORY_MARGIN_RATES: Record<string, number> = {
	'철거': 0.35,
	'도배': 0.25,
	'페인트': 0.25,
	'전기': 0.25,
	'목공': 0.22,
	'바닥': 0.20,
	'창호': 0.18,
	'욕실': 0.18,
	'주방': 0.15,
	'가구': 0.15,
}

/**
 * 카테고리별 가중치 (점수 산출용)
 */
export const CATEGORY_WEIGHTS: Record<string, number> = {
	'욕실': 0.18,
	'바닥': 0.17,
	'주방': 0.14,
	'목공': 0.12,
	'전기': 0.08,
	'도배': 0.07,
	'철거': 0.06,
	'가구': 0.06,
	'창호': 0.05,
	'페인트': 0.04,
	'기타': 0.03,
}

/**
 * 카테고리별 마진율 기반 차등 스코어링
 * 업종 표준 마진 ±5%p = 최적(95점)
 */
export function categoryMarginToScore(marginRate: number, stdCategory: string): number {
	const industryMargin = (CATEGORY_MARGIN_RATES[stdCategory] || 0.20) * 100
	const deviation = marginRate - industryMargin

	if (marginRate < 0) return 35            // 마이너스 마진 = 데이터 오류 가능성
	if (marginRate < industryMargin * 0.3) return 55  // 덤핑 의심
	if (deviation < -10) return 78            // 저마진
	if (deviation < -5) return 88             // 적정 근접 (약간 저렴)
	if (Math.abs(deviation) <= 5) return 95   // 업계 표준 ±5%p = 최적
	if (deviation <= 10) return 85            // 약간 높음
	if (deviation <= 20) return 70            // 높음
	if (deviation <= 35) return 50            // 과다
	if (deviation <= 55) return 35            // 매우 과다
	return 20                                 // 비정상
}
