import { query, insertOne, findOne } from '../lib/db'

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
	// ✅ CONVERTED: Supabase SELECT with multiple conditions → PostgreSQL query
	// OLD: await supabase.from('quote_groups').select('*').eq('customer_phone', customerPhone).eq('status', 'active').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1)
	const result = await query(
		`SELECT * FROM quote_groups
		WHERE customer_phone = $1
		AND status = $2
		AND expires_at > $3
		ORDER BY created_at DESC
		LIMIT 1`,
		[customerPhone, 'active', new Date().toISOString()]
	)

	if (result.rows.length === 0) {
		return null
	}

	const group = result.rows[0]

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
	// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
	// OLD: const { data: group, error } = await supabase.from('quote_groups').insert({...}).select().single()
	const group = await insertOne<any>('quote_groups', {
		...data,
		status: 'active',
		quote_count: 1,
		total_price: 30000,
		expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48시간 후
	})

	if (!group) {
		console.error('Error creating quote group')
		throw new Error('Failed to create quote group')
	}

	return group
}

/**
 * 그룹에 견적 추가
 */
export async function addQuoteToGroup(groupId: string) {
	// ✅ CONVERTED: Supabase SELECT → PostgreSQL findOne
	// OLD: const { data: group, error: fetchError } = await supabase.from('quote_groups').select('*').eq('id', groupId).single()
	const group = await findOne<any>('quote_groups', { id: groupId })

	if (!group) {
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

	// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
	// OLD: const { data: updated, error: updateError } = await supabase.from('quote_groups').update({...}).eq('id', groupId).select().single()
	const updateResult = await query(
		`UPDATE quote_groups
		SET quote_count = $1, total_price = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING *`,
		[newCount, newPrice, groupId]
	)

	const updated = updateResult.rows[0]

	if (!updated) {
		throw new Error('Failed to update quote group')
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
	// ✅ CONVERTED: Supabase SELECT → PostgreSQL findOne
	// OLD: const { data: group, error } = await supabase.from('quote_groups').select('*').eq('id', groupId).single()
	const group = await findOne<any>('quote_groups', { id: groupId })

	if (!group) {
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
	// ✅ CONVERTED: Supabase SELECT → PostgreSQL query
	// OLD: const { data, error } = await supabase.from('quote_requests').select('*').eq('group_id', groupId).order('sequence_in_group', { ascending: true })
	const result = await query(
		`SELECT * FROM quote_requests
		WHERE group_id = $1
		ORDER BY sequence_in_group ASC`,
		[groupId]
	)

	return result.rows
}

/**
 * 그룹 상태 업데이트
 */
export async function updateGroupStatus(groupId: string, status: 'active' | 'expired' | 'completed') {
	// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
	// OLD: const { data, error } = await supabase.from('quote_groups').update({ status }).eq('id', groupId).select().single()
	const result = await query(
		`UPDATE quote_groups
		SET status = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING *`,
		[status, groupId]
	)

	const data = result.rows[0]

	if (!data) {
		throw new Error('Failed to update group status')
	}

	return data
}

/**
 * 만료된 그룹 자동 처리 (크론 작업용)
 */
export async function expireOldGroups() {
	// ✅ CONVERTED: Supabase UPDATE with multiple conditions → PostgreSQL query
	// OLD: const { data, error } = await supabase.from('quote_groups').update({ status: 'expired' }).eq('status', 'active').lt('expires_at', new Date().toISOString()).select()
	const result = await query(
		`UPDATE quote_groups
		SET status = $1, updated_at = NOW()
		WHERE status = $2
		AND expires_at < $3
		RETURNING *`,
		['expired', 'active', new Date().toISOString()]
	)

	console.log(`✅ Expired ${result.rows.length} old quote groups`)
	return result.rows
}
