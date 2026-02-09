/**
 * ZipCheck 견적 분석 가격 시스템
 *
 * 현재: 선착순 50명 무료 프로모션 (정가 9,900원)
 * 단일 플랜: 48시간 분석
 */

export type PlanId = 'basic'

export interface Plan {
  id: PlanId
  name: string
  basePrice: number
  displayPrice: number
  slaHours: number
  description: string
  features: string[]
}

export interface PriceCalculation {
  planId: PlanId
  planName: string
  basePrice: number
  vatAmount: number
  totalAmount: number
  slaHours: number
}

export const FREE_PROMO = {
  enabled: true,
  maxCount: 50,
  displayPrice: 9900,
  actualPrice: 0,
}

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: 'basic',
    name: '견적 분석',
    basePrice: 9900,
    displayPrice: 9900,
    slaHours: 48,
    description: '48시간 안에 결과를 전달해 드려요.',
    features: [
      '항목별 적정가 비교',
      '항목별 상세 코멘트',
      '과다 청구 탐지',
      '시장 데이터 기반 분석',
    ]
  },
}

/**
 * 가격 계산 (VAT 포함)
 */
export function calculatePrice(planId: PlanId): PriceCalculation {
  const plan = PLANS[planId]
  if (!plan) {
    throw new Error(`Unknown plan ID: ${planId}`)
  }

  const vatAmount = Math.floor(plan.basePrice * 0.1)
  const totalAmount = plan.basePrice + vatAmount

  return {
    planId: plan.id,
    planName: plan.name,
    basePrice: plan.basePrice,
    vatAmount,
    totalAmount,
    slaHours: plan.slaHours
  }
}

/**
 * 금액 포맷팅 (한국 원화)
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 만원 단위 금액을 한국어로 포맷팅
 * 10000 이상(1억원 이상)은 "1억원 이상"으로 표시
 * @param value 만원 단위 숫자 (예: 4500 → "4,500만원", 10000 → "1억원 이상")
 */
export function formatKoreanMoney(value: number): string {
  if (!value || value <= 0) return ''
  if (value >= 10000) return '1억원 이상'
  return `${value.toLocaleString()}만원`
}
