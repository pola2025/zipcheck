/**
 * ZipCheck 견적 분석 가격 시스템
 *
 * 요금제: 기본 분석 (30,000원) / 빠른 분석 (45,000원)
 * VAT 별도 (10%)
 */

export type PlanId = 'basic' | 'fast'

export interface Plan {
  id: PlanId
  name: string
  basePrice: number
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

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: 'basic',
    name: '기본 분석',
    basePrice: 30000,
    slaHours: 48,
    description: '48시간 안에 결과를 전달해 드려요.',
    features: [
      '주문은 하루 24시간 언제든 받아요.',
      '분석 결과는 접수 후 48시간 안에 도착해요.',
      '업무 시간 기준으로 순차 배정해 드려요.',
      '실제 유통 데이터 기반으로 분석해요.'
    ]
  },
  fast: {
    id: 'fast',
    name: '빠른 분석',
    basePrice: 45000,
    slaHours: 24,
    description: '24시간 안에 먼저 처리해 드려요.',
    features: [
      '주문은 하루 24시간 언제든 받아요.',
      '분석 결과는 접수 후 24시간 안에 전달해요.',
      '긴급 건은 전담 분석팀이 우선 배정돼요.',
      '세부 코멘트와 후속 질문까지 빠르게 도와드려요.'
    ]
  }
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
