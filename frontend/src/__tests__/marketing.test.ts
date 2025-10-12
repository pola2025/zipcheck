import { describe, expect, it } from 'vitest'

import { quoteFormSchema } from 'components/marketing/QuoteForm'
import {
	heroCopy,
	featureItems,
	plans,
	faqs,
	testimonials
} from 'data/marketing'

describe('quoteFormSchema', () => {
	it('accepts valid payload', () => {
		const result = quoteFormSchema.safeParse({
			name: '홍길동',
			email: 'user@example.com',
			phone: '010-1234-5678',
			message: '20평 아파트 리모델링 견적이 적절한지 확인 부탁드립니다.',
			privacy: true
		})

		expect(result.success).toBe(true)
	})

	it('rejects missing consent', () => {
		const result = quoteFormSchema.safeParse({
			name: '홍길동',
			email: 'user@example.com',
			message: '추가 정보 없이 문의드립니다.',
			privacy: false
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/동의해 주세요/)
		}
	})

	it('validates phone number pattern', () => {
		const result = quoteFormSchema.safeParse({
			name: '홍길동',
			email: 'user@example.com',
			phone: 'invalid',
			message: '전화번호 검증 테스트입니다.',
			privacy: true
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/전화번호/)
		}
	})
})

describe('marketing data integrity', () => {
	it('hero has three key benefits and CTAs', () => {
		expect(heroCopy.benefits).toHaveLength(3)
		expect(heroCopy.primaryCta).toBeDefined()
		expect(heroCopy.secondaryCta).toBeDefined()
	})

	it('feature grid exposes six items', () => {
		expect(featureItems).toHaveLength(6)
	})

	it('pricing plans include highlighted option', () => {
		expect(plans.some(plan => plan.highlighted)).toBe(true)
	})

	it('faqs and testimonials are populated', () => {
		expect(faqs.length).toBeGreaterThan(0)
		expect(testimonials.length).toBeGreaterThan(0)
	})
})
