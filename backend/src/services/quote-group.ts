import { supabase } from '../lib/supabase'

interface QuoteGroupData {
	customer_name: string
	customer_phone: string
	customer_email?: string
	group_name: string
	property_type: string
	property_size?: number
	region: string
	address?: string
}

interface PricingInfo {
	quoteCount: number
	totalPrice: number
	additionalPrice: number
	canAddMore: boolean
	expiresAt: string
}

/**
 * 가격 계산 로직
 */
export function calculateGroupPrice(quoteCount: number): number {
	switch (quoteCount) {
		case 1:
			return 30000
		case 2:
			return 50000
		case 3:
			return 70000
		default:
			return 30000
	}
}

/**
 * 48시간 내 활성 그룹 찾기
 */
export async function findActiveGroup(customerPhone: string, propertyInfo: any) {
	const { data, error } = await supabase
		.from('quote_groups')
		.select('*')
		.eq('customer_phone', customerPhone)
		.eq('status', 'active')
		.gt('expires_at', new Date().toISOString())
		.order('created_at', { ascending: false })
		.limit(1)

	if (error) {
		console.error('Error finding active group:', error)
		return null
	}

	if (!data || data.length === 0) {
		return null
	}

	const group = data[0]

	// 같은 프로젝트인지 확인 (선택적)
	const isSameProject =
		group.property_type === propertyInfo.property_type &&
		group.region === propertyInfo.region &&
		Math.abs((group.property_size || 0) - (propertyInfo.property_size || 0)) <= 5 // 평수 오차 5평 이내

	if (!isSameProject) {
		return null
	}

	// 최대 3개 제한
	if (group.quote_count >= 3) {
		return null
	}

	return group
}

/**
 * 새 그룹 생성
 */
export async function createQuoteGroup(data: QuoteGroupData) {
	const { data: group, error } = await supabase
		.from('quote_groups')
		.insert({
			...data,
			status: 'active',
			quote_count: 1,
			total_price: 30000,
			expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48시간 후
		})
		.select()
		.single()

	if (error) {
		console.error('Error creating quote group:', error)
		throw error
	}

	return group
}

/**
 * 그룹에 견적 추가
 */
export async function addQuoteToGroup(groupId: string) {
	// 현재 그룹 정보 조회
	const { data: group, error: fetchError } = await supabase
		.from('quote_groups')
		.select('*')
		.eq('id', groupId)
		.single()

	if (fetchError || !group) {
		throw new Error('그룹을 찾을 수 없습니다.')
	}

	// 최대 3개 제한
	if (group.quote_count >= 3) {
		throw new Error('최대 3개까지만 비교 가능합니다.')
	}

	// 48시간 체크
	if (new Date(group.expires_at) < new Date()) {
		throw new Error('48시간이 경과하여 그룹에 추가할 수 없습니다.')
	}

	const newCount = group.quote_count + 1
	const newPrice = calculateGroupPrice(newCount)

	// 그룹 업데이트
	const { data: updated, error: updateError } = await supabase
		.from('quote_groups')
		.update({
			quote_count: newCount,
			total_price: newPrice
		})
		.eq('id', groupId)
		.select()
		.single()

	if (updateError) {
		throw updateError
	}

	return {
		group: updated,
		sequence: newCount,
		additionalPrice: newPrice - group.total_price
	}
}

/**
 * 그룹 가격 정보 조회
 */
export async function getGroupPricing(groupId: string): Promise<PricingInfo> {
	const { data: group, error } = await supabase
		.from('quote_groups')
		.select('*')
		.eq('id', groupId)
		.single()

	if (error || !group) {
		throw new Error('그룹을 찾을 수 없습니다.')
	}

	const currentPrice = group.total_price
	const nextPrice = calculateGroupPrice(group.quote_count + 1)
	const additionalPrice = nextPrice - currentPrice

	return {
		quoteCount: group.quote_count,
		totalPrice: currentPrice,
		additionalPrice: group.quote_count < 3 ? additionalPrice : 0,
		canAddMore: group.quote_count < 3 && new Date(group.expires_at) > new Date(),
		expiresAt: group.expires_at
	}
}

/**
 * 그룹의 모든 견적 조회
 */
export async function getGroupQuotes(groupId: string) {
	const { data, error } = await supabase
		.from('quote_requests')
		.select('*')
		.eq('group_id', groupId)
		.order('sequence_in_group', { ascending: true })

	if (error) {
		console.error('Error fetching group quotes:', error)
		throw error
	}

	return data
}

/**
 * 그룹 상태 업데이트
 */
export async function updateGroupStatus(groupId: string, status: 'active' | 'expired' | 'completed') {
	const { data, error } = await supabase
		.from('quote_groups')
		.update({ status })
		.eq('id', groupId)
		.select()
		.single()

	if (error) {
		throw error
	}

	return data
}

/**
 * 만료된 그룹 자동 처리 (크론 작업용)
 */
export async function expireOldGroups() {
	const { data, error } = await supabase
		.from('quote_groups')
		.update({ status: 'expired' })
		.eq('status', 'active')
		.lt('expires_at', new Date().toISOString())
		.select()

	if (error) {
		console.error('Error expiring old groups:', error)
		throw error
	}

	console.log(`✅ Expired ${data.length} old quote groups`)
	return data
}
