/**
 * ZipCheck 가격 계산 시스템 단위 테스트
 */

import { describe, test, expect } from 'vitest'
import {
  calculatePrice,
  formatPrice,
  PLANS,
  type PlanId
} from '../lib/pricing'

describe('PLANS 정의', () => {
  test('기본 분석과 빠른 분석만 정의되어 있어야 함', () => {
    expect(PLANS.basic).toBeDefined()
    expect(PLANS.fast).toBeDefined()
    expect(Object.keys(PLANS)).toHaveLength(2)
  })

  test('기본 분석 요금제 정보가 정확해야 함', () => {
    expect(PLANS.basic.basePrice).toBe(30000)
    expect(PLANS.basic.slaHours).toBe(48)
    expect(PLANS.basic.name).toBe('기본 분석')
    expect(PLANS.basic.features).toHaveLength(4)
  })

  test('빠른 분석 요금제 정보가 정확해야 함', () => {
    expect(PLANS.fast.basePrice).toBe(45000)
    expect(PLANS.fast.slaHours).toBe(24)
    expect(PLANS.fast.name).toBe('빠른 분석')
    expect(PLANS.fast.features).toHaveLength(4)
  })
})

describe('calculatePrice - 기본 분석 (30,000원)', () => {
  test('기본가 + VAT 10% 계산', () => {
    const result = calculatePrice('basic')
    expect(result.basePrice).toBe(30000)
    expect(result.vatAmount).toBe(3000)
    expect(result.totalAmount).toBe(33000)
    expect(result.slaHours).toBe(48)
    expect(result.planName).toBe('기본 분석')
  })
})

describe('calculatePrice - 빠른 분석 (45,000원)', () => {
  test('기본가 + VAT 10% 계산', () => {
    const result = calculatePrice('fast')
    expect(result.basePrice).toBe(45000)
    expect(result.vatAmount).toBe(4500)
    expect(result.totalAmount).toBe(49500)
    expect(result.slaHours).toBe(24)
    expect(result.planName).toBe('빠른 분석')
  })
})

describe('calculatePrice - 반환 구조 검증', () => {
  test('모든 필수 필드가 포함되어야 함', () => {
    const result = calculatePrice('basic')
    expect(result).toHaveProperty('planId')
    expect(result).toHaveProperty('planName')
    expect(result).toHaveProperty('basePrice')
    expect(result).toHaveProperty('vatAmount')
    expect(result).toHaveProperty('totalAmount')
    expect(result).toHaveProperty('slaHours')
  })

  test('잘못된 planId 시 에러 발생', () => {
    expect(() => {
      calculatePrice('invalid' as PlanId)
    }).toThrow('Unknown plan ID')
  })
})

describe('formatPrice', () => {
  test('금액을 한국 원화 형식으로 포맷해야 함', () => {
    expect(formatPrice(30000)).toBe('30,000원')
    expect(formatPrice(45000)).toBe('45,000원')
    expect(formatPrice(33000)).toBe('33,000원')
  })

  test('0원도 올바르게 포맷해야 함', () => {
    expect(formatPrice(0)).toBe('0원')
  })
})
