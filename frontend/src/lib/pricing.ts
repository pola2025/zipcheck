/**
 * ZipCheck 견적 분석 가격 계산 시스템
 *
 * 가격 정책:
 * - 1건째: 기본가 × 100%
 * - 2건째: 기본가 × 2/3 (66.67%)
 * - 3건째: 기본가 × 2/3 (66.67%)
 */

export type PlanId = 'basic' | 'fast' | 'urgent' | 'urgent-night' | 'urgent-holiday'
export type Quantity = 1 | 2 | 3

export interface Plan {
  id: PlanId
  name: string
  basePrice: number
  slaHours: number
  description: string
  features: string[]
}

export interface PriceBreakdownItem {
  index: number
  price: number
  discount: number
  percentage: number
}

export interface PriceCalculation {
  planId: PlanId
  planName: string
  basePrice: number
  quantity: Quantity
  breakdown: PriceBreakdownItem[]
  originalAmount: number
  discountAmount: number
  totalAmount: number
  slaHours: number
}

/**
 * 요금제 정의
 */
export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: 'basic',
    name: '기본 분석',
    basePrice: 30000,
    slaHours: 48,
    description: '2일 이내 견적 분석',
    features: [
      '48시간 이내 분석 완료',
      '상세 견적 분석 리포트',
      '가격 적정성 검증',
      '개선 제안 사항'
    ]
  },
  fast: {
    id: 'fast',
    name: '빠른 분석',
    basePrice: 45000,
    slaHours: 24,
    description: '24시간 이내 견적 분석',
    features: [
      '24시간 이내 분석 완료',
      '상세 견적 분석 리포트',
      '가격 적정성 검증',
      '개선 제안 사항',
      '우선 처리'
    ]
  },
  urgent: {
    id: 'urgent',
    name: '긴급 분석',
    basePrice: 60000,
    slaHours: 3,
    description: '3시간 이내 긴급 견적 분석',
    features: [
      '3시간 이내 분석 완료',
      '상세 견적 분석 리포트',
      '가격 적정성 검증',
      '개선 제안 사항',
      '긴급 우선 처리',
      '전문가 직접 검토'
    ]
  },
  'urgent-night': {
    id: 'urgent-night',
    name: '심야 긴급',
    basePrice: 120000,
    slaHours: 3,
    description: '21:00-09:00 심야 긴급 분석',
    features: [
      '심야 시간대 3시간 이내 완료',
      '상세 견적 분석 리포트',
      '가격 적정성 검증',
      '개선 제안 사항',
      '최우선 처리',
      '전문가 직접 검토',
      '24시간 고객 지원'
    ]
  },
  'urgent-holiday': {
    id: 'urgent-holiday',
    name: '휴일 긴급',
    basePrice: 120000,
    slaHours: 3,
    description: '주말/공휴일 긴급 분석',
    features: [
      '주말/공휴일 3시간 이내 완료',
      '상세 견적 분석 리포트',
      '가격 적정성 검증',
      '개선 제안 사항',
      '최우선 처리',
      '전문가 직접 검토',
      '24시간 고객 지원'
    ]
  }
}

/**
 * 가격 계산 (할인 적용)
 *
 * @param planId 요금제 ID
 * @param quantity 견적 분석 건수 (1-3)
 * @returns 가격 계산 결과
 *
 * @example
 * // 기본 분석 3건
 * calculatePrice('basic', 3)
 * // => { totalAmount: 70000, discountAmount: 20000, ... }
 */
export function calculatePrice(planId: PlanId, quantity: Quantity): PriceCalculation {
  const plan = PLANS[planId]
  if (!plan) {
    throw new Error(`Unknown plan ID: ${planId}`)
  }

  const basePrice = plan.basePrice
  const breakdown: PriceBreakdownItem[] = []
  let totalAmount = 0

  // 1건째: 100%
  const firstPrice = basePrice
  breakdown.push({
    index: 1,
    price: firstPrice,
    discount: 0,
    percentage: 100
  })
  totalAmount += firstPrice

  // 2건째: 66.67% (2/3)
  if (quantity >= 2) {
    const secondPrice = Math.round(basePrice * 2 / 3)
    const secondDiscount = basePrice - secondPrice
    breakdown.push({
      index: 2,
      price: secondPrice,
      discount: secondDiscount,
      percentage: 66.67
    })
    totalAmount += secondPrice
  }

  // 3건째: 66.67% (2/3)
  if (quantity === 3) {
    const thirdPrice = Math.round(basePrice * 2 / 3)
    const thirdDiscount = basePrice - thirdPrice
    breakdown.push({
      index: 3,
      price: thirdPrice,
      discount: thirdDiscount,
      percentage: 66.67
    })
    totalAmount += thirdPrice
  }

  // 정상가 및 할인 금액 계산
  const originalAmount = basePrice * quantity
  const discountAmount = originalAmount - totalAmount

  return {
    planId: plan.id,
    planName: plan.name,
    basePrice: plan.basePrice,
    quantity,
    breakdown,
    originalAmount,
    discountAmount,
    totalAmount,
    slaHours: plan.slaHours
  }
}

/**
 * 가격 상세 내역 조회
 *
 * @param planId 요금제 ID
 * @param quantity 견적 분석 건수 (1-3)
 * @returns 가격 상세 내역 배열
 */
export function getPriceBreakdown(planId: PlanId, quantity: Quantity): PriceBreakdownItem[] {
  return calculatePrice(planId, quantity).breakdown
}

/**
 * 할인율 계산
 *
 * @param originalAmount 정상 금액
 * @param discountAmount 할인 금액
 * @returns 할인율 (%)
 */
export function getDiscountRate(originalAmount: number, discountAmount: number): number {
  if (originalAmount === 0) return 0
  return Math.round((discountAmount / originalAmount) * 100)
}

/**
 * 요금제별 전체 가격표 생성
 *
 * @returns 모든 요금제 × 모든 수량의 가격표
 */
export function generatePriceTable(): Record<PlanId, PriceCalculation[]> {
  const table: Record<PlanId, PriceCalculation[]> = {} as Record<PlanId, PriceCalculation[]>

  for (const planId of Object.keys(PLANS) as PlanId[]) {
    table[planId] = [
      calculatePrice(planId, 1),
      calculatePrice(planId, 2),
      calculatePrice(planId, 3)
    ]
  }

  return table
}

/**
 * 금액 포맷팅 (한국 원화)
 *
 * @param amount 금액
 * @returns 포맷된 문자열 (예: "30,000원")
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 절약 금액 메시지 생성
 *
 * @param discountAmount 할인 금액
 * @returns 절약 메시지
 */
export function getSavingsMessage(discountAmount: number): string {
  if (discountAmount === 0) {
    return ''
  }
  return `${formatPrice(discountAmount)} 할인`
}
