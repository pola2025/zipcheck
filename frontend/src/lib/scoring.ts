/**
 * GOI 견적 분석 - 클라이언트 점수 유틸리티
 *
 * 점수 계산 로직은 Backend(workers/src/services/scoring.ts)가 Single Source of Truth.
 * 이 파일은 UI 표시용 헬퍼만 제공한다.
 */

export { categoryMarginToScore, CATEGORY_MARGIN_RATES } from './analysis-constants'

/**
 * 점수 → 등급 텍스트 + 색상 (UI 표시용)
 */
export function getScoreGrade(score: number): { label: string; color: string; description: string } {
	if (score >= 85) return { label: '매우 좋음', color: 'text-green-600', description: '매우 적정한 견적입니다' }
	if (score >= 72) return { label: '합리적', color: 'text-blue-600', description: '대체로 합리적인 견적입니다' }
	if (score >= 55) return { label: '평균 수준', color: 'text-amber-600', description: '일부 항목 검토가 필요합니다' }
	if (score >= 40) return { label: '다소 비쌈', color: 'text-orange-600', description: '상당 부분 검토가 필요합니다' }
	return { label: '매우 비쌈', color: 'text-red-600', description: '견적 재검토를 권장합니다' }
}
