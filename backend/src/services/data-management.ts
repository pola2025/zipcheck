import { supabase } from '../lib/supabase'

/**
 * 시장 평균 재계산 (Supabase 함수 호출)
 */
export async function recalculateMarketAverages(): Promise<void> {
	console.log('📊 Recalculating market averages...')

	try {
		const { error } = await supabase.rpc('recalculate_market_averages')

		if (error) throw error

		console.log('✅ Market averages recalculated successfully!')
	} catch (error) {
		console.error('❌ Market average recalculation failed:', error)
		throw error
	}
}

/**
 * 업로드 이력 조회
 */
export async function getUploadHistory(limit: number = 50) {
	const { data, error } = await supabase
		.from('upload_history')
		.select('*')
		.order('uploaded_at', { ascending: false })
		.limit(limit)

	if (error) throw error

	return data
}

/**
 * 데이터 통계 조회
 */
export async function getDataStats() {
	try {
		// 총 항목 수
		const { count: itemsCount } = await supabase
			.from('items')
			.select('*', { count: 'exact', head: true })

		// 시공 데이터 수
		const { count: constructionCount } = await supabase
			.from('construction_records')
			.select('*', { count: 'exact', head: true })

		// 유통사 가격 데이터 수
		const { count: distributorCount } = await supabase
			.from('distributor_prices')
			.select('*', { count: 'exact', head: true })

		// 연도별 시공 데이터
		const { data: yearlyData } = await supabase
			.from('construction_records')
			.select('year')
			.gte('year', new Date().getFullYear() - 1)

		const records2024 = yearlyData?.filter((r) => r.year === 2024).length || 0
		const records2025 = yearlyData?.filter((r) => r.year === 2025).length || 0

		// 데이터 누락 항목 찾기
		const { data: itemsWithoutData } = await supabase
			.from('items')
			.select(
				`
        id,
        name,
        construction_records!left(id),
        distributor_prices!left(id)
      `
			)
			.limit(100)

		const missingData = itemsWithoutData
			?.filter((item: any) => {
				const hasConstruction = item.construction_records?.length > 0
				const hasDistributor = item.distributor_prices?.length > 0
				return !hasConstruction || !hasDistributor
			})
			.map((item: any) => ({
				id: item.id,
				name: item.name,
				hasConstructionData: item.construction_records?.length > 0,
				hasDistributorPrice: item.distributor_prices?.length > 0
			}))

		return {
			totalItems: itemsCount || 0,
			constructionRecords: constructionCount || 0,
			distributorPrices: distributorCount || 0,
			records2024,
			records2025,
			missingData: missingData || []
		}
	} catch (error) {
		console.error('Error fetching stats:', error)
		throw error
	}
}
