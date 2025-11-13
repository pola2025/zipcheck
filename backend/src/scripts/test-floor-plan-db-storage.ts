/**
 * Test Floor Plan Data Storage in Database
 *
 * 테스트:
 * 1. quote_requests 테이블에 도면 데이터 저장
 * 2. 저장된 데이터 조회
 * 3. room_areas JSON 파싱
 */

import { pool } from '../lib/db'

async function testDatabaseStorage() {
	console.log('🧪 데이터베이스 저장 테스트 시작\n')
	console.log('='.repeat(80))

	try {
		// 1. 테스트 데이터 준비
		const testData = {
			customer_name: '테스트 고객',
			customer_phone: '010-1234-5678',
			customer_email: 'test@example.com',
			property_type: '아파트',
			property_size: 34.0,
			region: '서울 강남구',
			address: '서울시 강남구 테헤란로 123',
			items: [{ name: '도배', quantity: 1, unit_price: 1000000, total_price: 1000000 }],
			status: 'pending',
			floor_plan_images: [
				'https://example.com/floor-plan-1.jpg',
				'https://example.com/floor-plan-2.jpg'
			],
			room_areas: {
				주방: 5.5,
				거실: 15.3,
				안방: 8.0,
				화장실: 3.2,
				베란다: 2.0
			},
			floor_plan_analysis_result: {
				totalArea: 34.0,
				confidence: 0.85,
				rawText: '평면도\n주방 5.5평\n거실 15.3평\n안방 8평\n화장실 3.2평\n베란다 2평'
			}
		}

		console.log('📝 테스트 데이터 준비 완료')
		console.log(`   이미지: ${testData.floor_plan_images.length}장`)
		console.log(`   공간: ${Object.keys(testData.room_areas).length}개`)
		console.log(`   총 면적: ${testData.property_size}평`)

		// 2. INSERT
		console.log('\n💾 데이터베이스에 저장 중...')
		const insertResult = await pool.query(
			`
			INSERT INTO quote_requests (
				customer_name, customer_phone, customer_email,
				property_type, property_size, region, address, items, status,
				floor_plan_images, room_areas, floor_plan_analysis_result
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			RETURNING id, created_at
		`,
			[
				testData.customer_name,
				testData.customer_phone,
				testData.customer_email,
				testData.property_type,
				testData.property_size,
				testData.region,
				testData.address,
				JSON.stringify(testData.items),
				testData.status,
				testData.floor_plan_images, // TEXT[] array
				testData.room_areas, // JSONB
				testData.floor_plan_analysis_result // JSONB
			]
		)

		const insertedId = insertResult.rows[0].id
		console.log(`✅ 저장 완료! ID: ${insertedId}`)

		// 3. SELECT
		console.log('\n📖 저장된 데이터 조회 중...')
		const selectResult = await pool.query(
			`
			SELECT
				id, customer_name, property_size,
				floor_plan_images, room_areas, floor_plan_analysis_result,
				created_at
			FROM quote_requests
			WHERE id = $1
		`,
			[insertedId]
		)

		if (selectResult.rows.length === 0) {
			throw new Error('데이터를 찾을 수 없습니다!')
		}

		const retrievedData = selectResult.rows[0]
		console.log('✅ 조회 완료!')

		// 4. 데이터 검증
		console.log('\n🔍 데이터 검증 중...')

		// floor_plan_images (TEXT[])
		console.log('\n   ✓ floor_plan_images (TEXT[]):')
		console.log(`     타입: ${Array.isArray(retrievedData.floor_plan_images) ? 'Array' : typeof retrievedData.floor_plan_images}`)
		console.log(`     길이: ${retrievedData.floor_plan_images?.length || 0}`)
		if (retrievedData.floor_plan_images) {
			retrievedData.floor_plan_images.forEach((url: string, i: number) => {
				console.log(`     ${i + 1}. ${url}`)
			})
		}

		// room_areas (JSONB)
		console.log('\n   ✓ room_areas (JSONB):')
		console.log(`     타입: ${typeof retrievedData.room_areas}`)
		if (retrievedData.room_areas) {
			Object.entries(retrievedData.room_areas).forEach(([room, area]) => {
				console.log(`     - ${room}: ${area}평`)
			})

			const totalArea = Object.values(retrievedData.room_areas).reduce(
				(sum: number, area: any) => sum + area,
				0
			)
			console.log(`     총 면적: ${totalArea}평`)
		}

		// floor_plan_analysis_result (JSONB)
		console.log('\n   ✓ floor_plan_analysis_result (JSONB):')
		console.log(`     타입: ${typeof retrievedData.floor_plan_analysis_result}`)
		if (retrievedData.floor_plan_analysis_result) {
			console.log(`     totalArea: ${retrievedData.floor_plan_analysis_result.totalArea}`)
			console.log(`     confidence: ${retrievedData.floor_plan_analysis_result.confidence}`)
			console.log(`     rawText 길이: ${retrievedData.floor_plan_analysis_result.rawText?.length || 0}`)
		}

		// 5. 정리 (테스트 데이터 삭제)
		console.log('\n🧹 테스트 데이터 정리 중...')
		await pool.query('DELETE FROM quote_requests WHERE id = $1', [insertedId])
		console.log('✅ 정리 완료')

		console.log('\n' + '='.repeat(80))
		console.log('✅ 모든 테스트 통과!')
	} catch (error) {
		console.error('\n❌ 테스트 실패:', error)
		throw error
	} finally {
		// 연결 종료
		await pool.end()
	}
}

// 실행
testDatabaseStorage()
