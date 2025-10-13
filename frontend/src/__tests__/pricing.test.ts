/**
 * ZipCheck 가격 계산 시스템 단위 테스트
 */

import { describe, test, expect } from 'vitest'
import {
  calculatePrice,
  getPriceBreakdown,
  getDiscountRate,
  generatePriceTable,
  formatPrice,
  getSavingsMessage,
  PLANS,
  type PlanId,
  type Quantity
} from '../lib/pricing'

describe('PLANS 정의', () => {
  test('모든 요금제가 정의되어 있어야 함', () => {
    expect(PLANS.basic).toBeDefined()
    expect(PLANS.fast).toBeDefined()
    expect(PLANS.urgent).toBeDefined()
    expect(PLANS['urgent-night']).toBeDefined()
    expect(PLANS['urgent-holiday']).toBeDefined()
  })

  test('기본 분석 요금제 정보가 정확해야 함', () => {
    expect(PLANS.basic.basePrice).toBe(30000)
    expect(PLANS.basic.slaHours).toBe(48)
    expect(PLANS.basic.name).toBe('기본 분석')
  })

  test('빠른 분석 요금제 정보가 정확해야 함', () => {
    expect(PLANS.fast.basePrice).toBe(45000)
    expect(PLANS.fast.slaHours).toBe(24)
  })

  test('긴급 분석 요금제 정보가 정확해야 함', () => {
    expect(PLANS.urgent.basePrice).toBe(60000)
    expect(PLANS.urgent.slaHours).toBe(3)
  })

  test('심야 긴급 요금제 정보가 정확해야 함', () => {
    expect(PLANS['urgent-night'].basePrice).toBe(120000)
    expect(PLANS['urgent-night'].slaHours).toBe(3)
  })

  test('휴일 긴급 요금제 정보가 정확해야 함', () => {
    expect(PLANS['urgent-holiday'].basePrice).toBe(120000)
    expect(PLANS['urgent-holiday'].slaHours).toBe(3)
  })
})

describe('calculatePrice - 기본 분석 (30,000원)', () => {
  test('1건 신청 시 기본가 100%', () => {
    const result = calculatePrice('basic', 1)
    expect(result.totalAmount).toBe(30000)
    expect(result.originalAmount).toBe(30000)
    expect(result.discountAmount).toBe(0)
    expect(result.breakdown).toHaveLength(1)
    expect(result.breakdown[0].price).toBe(30000)
    expect(result.breakdown[0].discount).toBe(0)
  })

  test('2건 신청 시 2건째 66.67% 적용', () => {
    const result = calculatePrice('basic', 2)
    expect(result.totalAmount).toBe(50000) // 30000 + 20000
    expect(result.originalAmount).toBe(60000)
    expect(result.discountAmount).toBe(10000)
    expect(result.breakdown).toHaveLength(2)
    expect(result.breakdown[0].price).toBe(30000)
    expect(result.breakdown[1].price).toBe(20000)
    expect(result.breakdown[1].discount).toBe(10000)
  })

  test('3건 신청 시 2건째, 3건째 66.67% 적용', () => {
    const result = calculatePrice('basic', 3)
    expect(result.totalAmount).toBe(70000) // 30000 + 20000 + 20000
    expect(result.originalAmount).toBe(90000)
    expect(result.discountAmount).toBe(20000)
    expect(result.breakdown).toHaveLength(3)
    expect(result.breakdown[0].price).toBe(30000)
    expect(result.breakdown[1].price).toBe(20000)
    expect(result.breakdown[2].price).toBe(20000)
  })
})

describe('calculatePrice - 빠른 분석 (45,000원)', () => {
  test('1건 신청 시 기본가 100%', () => {
    const result = calculatePrice('fast', 1)
    expect(result.totalAmount).toBe(45000)
    expect(result.discountAmount).toBe(0)
  })

  test('2건 신청 시 할인 적용', () => {
    const result = calculatePrice('fast', 2)
    expect(result.totalAmount).toBe(75000) // 45000 + 30000
    expect(result.originalAmount).toBe(90000)
    expect(result.discountAmount).toBe(15000)
  })

  test('3건 신청 시 할인 적용', () => {
    const result = calculatePrice('fast', 3)
    expect(result.totalAmount).toBe(105000) // 45000 + 30000 + 30000
    expect(result.originalAmount).toBe(135000)
    expect(result.discountAmount).toBe(30000)
  })
})

describe('calculatePrice - 긴급 분석 (60,000원)', () => {
  test('1건 신청 시 기본가 100%', () => {
    const result = calculatePrice('urgent', 1)
    expect(result.totalAmount).toBe(60000)
    expect(result.discountAmount).toBe(0)
  })

  test('2건 신청 시 할인 적용', () => {
    const result = calculatePrice('urgent', 2)
    expect(result.totalAmount).toBe(100000) // 60000 + 40000
    expect(result.originalAmount).toBe(120000)
    expect(result.discountAmount).toBe(20000)
  })

  test('3건 신청 시 할인 적용', () => {
    const result = calculatePrice('urgent', 3)
    expect(result.totalAmount).toBe(140000) // 60000 + 40000 + 40000
    expect(result.originalAmount).toBe(180000)
    expect(result.discountAmount).toBe(40000)
  })
})

describe('calculatePrice - 심야 긴급 (120,000원)', () => {
  test('1건 신청 시 기본가 100%', () => {
    const result = calculatePrice('urgent-night', 1)
    expect(result.totalAmount).toBe(120000)
    expect(result.discountAmount).toBe(0)
  })

  test('2건 신청 시 할인 적용', () => {
    const result = calculatePrice('urgent-night', 2)
    expect(result.totalAmount).toBe(200000) // 120000 + 80000
    expect(result.originalAmount).toBe(240000)
    expect(result.discountAmount).toBe(40000)
  })

  test('3건 신청 시 할인 적용', () => {
    const result = calculatePrice('urgent-night', 3)
    expect(result.totalAmount).toBe(280000) // 120000 + 80000 + 80000
    expect(result.originalAmount).toBe(360000)
    expect(result.discountAmount).toBe(80000)
  })
})

describe('calculatePrice - 휴일 긴급 (120,000원)', () => {
  test('1건 신청 시 기본가 100%', () => {
    const result = calculatePrice('urgent-holiday', 1)
    expect(result.totalAmount).toBe(120000)
    expect(result.discountAmount).toBe(0)
  })

  test('2건 신청 시 할인 적용', () => {
    const result = calculatePrice('urgent-holiday', 2)
    expect(result.totalAmount).toBe(200000) // 120000 + 80000
    expect(result.discountAmount).toBe(40000)
  })

  test('3건 신청 시 할인 적용', () => {
    const result = calculatePrice('urgent-holiday', 3)
    expect(result.totalAmount).toBe(280000) // 120000 + 80000 + 80000
    expect(result.discountAmount).toBe(80000)
  })
})

describe('calculatePrice - 반환 구조 검증', () => {
  test('모든 필수 필드가 포함되어야 함', () => {
    const result = calculatePrice('basic', 2)
    expect(result).toHaveProperty('planId')
    expect(result).toHaveProperty('planName')
    expect(result).toHaveProperty('basePrice')
    expect(result).toHaveProperty('quantity')
    expect(result).toHaveProperty('breakdown')
    expect(result).toHaveProperty('originalAmount')
    expect(result).toHaveProperty('discountAmount')
    expect(result).toHaveProperty('totalAmount')
    expect(result).toHaveProperty('slaHours')
  })

  test('breakdown 배열 구조가 올바라야 함', () => {
    const result = calculatePrice('basic', 3)
    expect(result.breakdown).toHaveLength(3)
    result.breakdown.forEach((item, idx) => {
      expect(item).toHaveProperty('index')
      expect(item).toHaveProperty('price')
      expect(item).toHaveProperty('discount')
      expect(item).toHaveProperty('percentage')
      expect(item.index).toBe(idx + 1)
    })
  })

  test('잘못된 planId 시 에러 발생', () => {
    expect(() => {
      calculatePrice('invalid' as PlanId, 1)
    }).toThrow('Unknown plan ID')
  })
})

describe('getPriceBreakdown', () => {
  test('가격 상세 내역을 반환해야 함', () => {
    const breakdown = getPriceBreakdown('fast', 3)
    expect(breakdown).toHaveLength(3)
    expect(breakdown[0]).toEqual({
      index: 1,
      price: 45000,
      discount: 0,
      percentage: 100
    })
    expect(breakdown[1].price).toBe(30000)
    expect(breakdown[2].price).toBe(30000)
  })

  test('1건 신청 시 1개 항목만 반환', () => {
    const breakdown = getPriceBreakdown('basic', 1)
    expect(breakdown).toHaveLength(1)
  })
})

describe('getDiscountRate', () => {
  test('할인율을 정확히 계산해야 함', () => {
    expect(getDiscountRate(90000, 20000)).toBe(22) // 22.22% → 22%
    expect(getDiscountRate(100000, 50000)).toBe(50) // 50%
    expect(getDiscountRate(100000, 0)).toBe(0) // 할인 없음
  })

  test('0으로 나누기 예외 처리', () => {
    expect(getDiscountRate(0, 0)).toBe(0)
  })
})

describe('generatePriceTable', () => {
  test('모든 요금제의 가격표를 생성해야 함', () => {
    const table = generatePriceTable()
    expect(Object.keys(table)).toHaveLength(5)
    expect(table.basic).toHaveLength(3)
    expect(table.fast).toHaveLength(3)
    expect(table.urgent).toHaveLength(3)
    expect(table['urgent-night']).toHaveLength(3)
    expect(table['urgent-holiday']).toHaveLength(3)
  })

  test('가격표의 각 항목이 올바른 구조여야 함', () => {
    const table = generatePriceTable()
    Object.values(table).forEach(plans => {
      plans.forEach((plan, idx) => {
        expect(plan.quantity).toBe((idx + 1) as Quantity)
        expect(plan.totalAmount).toBeGreaterThan(0)
      })
    })
  })
})

describe('formatPrice', () => {
  test('금액을 한국 원화 형식으로 포맷해야 함', () => {
    expect(formatPrice(30000)).toBe('30,000원')
    expect(formatPrice(120000)).toBe('120,000원')
    expect(formatPrice(1000000)).toBe('1,000,000원')
  })

  test('0원도 올바르게 포맷해야 함', () => {
    expect(formatPrice(0)).toBe('0원')
  })
})

describe('getSavingsMessage', () => {
  test('할인 금액이 있을 때 메시지 반환', () => {
    expect(getSavingsMessage(20000)).toBe('20,000원 할인')
    expect(getSavingsMessage(50000)).toBe('50,000원 할인')
  })

  test('할인 금액이 0일 때 빈 문자열 반환', () => {
    expect(getSavingsMessage(0)).toBe('')
  })
})

describe('가격 정확성 검증 - 모든 조합', () => {
  const testCases: Array<{
    planId: PlanId
    quantity: Quantity
    expected: number
  }> = [
    // 기본 분석 (30,000)
    { planId: 'basic', quantity: 1, expected: 30000 },
    { planId: 'basic', quantity: 2, expected: 50000 },
    { planId: 'basic', quantity: 3, expected: 70000 },
    // 빠른 분석 (45,000)
    { planId: 'fast', quantity: 1, expected: 45000 },
    { planId: 'fast', quantity: 2, expected: 75000 },
    { planId: 'fast', quantity: 3, expected: 105000 },
    // 긴급 분석 (60,000)
    { planId: 'urgent', quantity: 1, expected: 60000 },
    { planId: 'urgent', quantity: 2, expected: 100000 },
    { planId: 'urgent', quantity: 3, expected: 140000 },
    // 심야 긴급 (120,000)
    { planId: 'urgent-night', quantity: 1, expected: 120000 },
    { planId: 'urgent-night', quantity: 2, expected: 200000 },
    { planId: 'urgent-night', quantity: 3, expected: 280000 },
    // 휴일 긴급 (120,000)
    { planId: 'urgent-holiday', quantity: 1, expected: 120000 },
    { planId: 'urgent-holiday', quantity: 2, expected: 200000 },
    { planId: 'urgent-holiday', quantity: 3, expected: 280000 }
  ]

  testCases.forEach(({ planId, quantity, expected }) => {
    test(`${PLANS[planId].name} ${quantity}건 = ${expected.toLocaleString()}원`, () => {
      const result = calculatePrice(planId, quantity)
      expect(result.totalAmount).toBe(expected)
    })
  })
})
