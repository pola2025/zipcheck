/**
 * 테스트 데이터 시드 스크립트
 * Neon DB에 샘플 데이터를 추가합니다
 */

import { pool } from '../lib/db'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function seedTestData() {
	console.log('🌱 Starting to seed test data...\n')

	const client = await pool.connect()

	try {
		await client.query('BEGIN')

		// 1. Users 테이블에 테스트 사용자 추가
		console.log('👤 Creating test users...')
		const usersResult = await client.query(`
			INSERT INTO users (name, phone, email)
			VALUES
				('김철수', '010-1234-5678', 'chulsoo@example.com'),
				('이영희', '010-2345-6789', 'younghee@example.com'),
				('박민수', '010-3456-7890', 'minsoo@example.com')
			ON CONFLICT (phone) DO NOTHING
			RETURNING id, name, phone
		`)
		console.log(`✅ Created ${usersResult.rowCount} users`)
		usersResult.rows.forEach(user => {
			console.log(`   - ${user.name} (${user.phone})`)
		})

		// 2. Quote Requests 테이블에 테스트 견적 요청 추가
		console.log('\n📋 Creating test quote requests...')
		const quoteRequestsResult = await client.query(`
			INSERT INTO quote_requests (
				customer_name,
				customer_phone,
				customer_email,
				property_type,
				property_size,
				region,
				address,
				items,
				status,
				plan_id,
				plan_name,
				quantity,
				is_comparison,
				original_amount,
				discount_amount,
				paid_amount,
				payment_status
			)
			VALUES
				(
					'김철수',
					'010-1234-5678',
					'chulsoo@example.com',
					'apartment',
					85.5,
					'서울특별시 강남구',
					'서울특별시 강남구 테헤란로 123',
					'[
						{"category": "바닥재", "item": "강마루", "quantity": 85, "unit": "m²"},
						{"category": "도배", "item": "실크벽지", "quantity": 200, "unit": "m²"},
						{"category": "주방", "item": "싱크대 교체", "quantity": 3, "unit": "m"}
					]'::jsonb,
					'pending',
					'basic',
					'기본 분석',
					1,
					false,
					30000,
					0,
					30000,
					'paid'
				),
				(
					'이영희',
					'010-2345-6789',
					'younghee@example.com',
					'villa',
					120.0,
					'서울특별시 서초구',
					'서울특별시 서초구 반포대로 456',
					'[
						{"category": "바닥재", "item": "강마루", "quantity": 120, "unit": "m²"},
						{"category": "도배", "item": "합지벽지", "quantity": 250, "unit": "m²"},
						{"category": "욕실", "item": "타일 교체", "quantity": 15, "unit": "m²"}
					]'::jsonb,
					'pending',
					'fast',
					'빠른 분석',
					3,
					true,
					90000,
					20000,
					70000,
					'paid'
				),
				(
					'박민수',
					'010-3456-7890',
					'minsoo@example.com',
					'officetel',
					45.0,
					'경기도 성남시',
					'경기도 성남시 분당구 판교역로 789',
					'[
						{"category": "바닥재", "item": "장판", "quantity": 45, "unit": "m²"},
						{"category": "도배", "item": "실크벽지", "quantity": 100, "unit": "m²"}
					]'::jsonb,
					'completed',
					'urgent',
					'긴급 분석',
					1,
					false,
					50000,
					0,
					50000,
					'paid'
				)
			RETURNING id, customer_name, property_type, status
		`)
		console.log(`✅ Created ${quoteRequestsResult.rowCount} quote requests`)
		const quoteRequestIds = quoteRequestsResult.rows.map(r => r.id)
		quoteRequestsResult.rows.forEach(qr => {
			console.log(`   - ${qr.customer_name} (${qr.property_type}) - ${qr.status}`)
		})

		// 3. Quote Sets 테이블에 테스트 견적서 세트 추가 (두 번째 요청에 대해)
		console.log('\n📊 Creating test quote sets for comparison...')
		const quoteSetsResult = await client.query(`
			INSERT INTO quote_sets (
				request_id,
				set_id,
				vendor_name,
				vendor_phone,
				vendor_verified,
				upload_type,
				items,
				total_amount,
				item_count,
				validation_status,
				trust_score,
				review_count
			)
			VALUES
				(
					$1,
					'SET_A',
					'A건설 인테리어',
					'02-1234-5678',
					true,
					'image',
					'[
						{"category": "바닥재", "item": "강마루", "quantity": 120, "unit": "m²", "unitPrice": 45000, "totalPrice": 5400000},
						{"category": "도배", "item": "합지벽지", "quantity": 250, "unit": "m²", "unitPrice": 8000, "totalPrice": 2000000},
						{"category": "욕실", "item": "타일 교체", "quantity": 15, "unit": "m²", "unitPrice": 80000, "totalPrice": 1200000}
					]'::jsonb,
					8600000,
					3,
					'passed',
					4.5,
					23
				),
				(
					$1,
					'SET_B',
					'B인테리어',
					'02-2345-6789',
					true,
					'image',
					'[
						{"category": "바닥재", "item": "강마루", "quantity": 120, "unit": "m²", "unitPrice": 42000, "totalPrice": 5040000},
						{"category": "도배", "item": "합지벽지", "quantity": 250, "unit": "m²", "unitPrice": 7500, "totalPrice": 1875000},
						{"category": "욕실", "item": "타일 교체", "quantity": 15, "unit": "m²", "unitPrice": 75000, "totalPrice": 1125000}
					]'::jsonb,
					8040000,
					3,
					'passed',
					4.2,
					18
				),
				(
					$1,
					'SET_C',
					'C리모델링',
					'02-3456-7890',
					false,
					'image',
					'[
						{"category": "바닥재", "item": "강마루", "quantity": 120, "unit": "m²", "unitPrice": 48000, "totalPrice": 5760000},
						{"category": "도배", "item": "합지벽지", "quantity": 250, "unit": "m²", "unitPrice": 8500, "totalPrice": 2125000},
						{"category": "욕실", "item": "타일 교체", "quantity": 15, "unit": "m²", "unitPrice": 85000, "totalPrice": 1275000}
					]'::jsonb,
					9160000,
					3,
					'passed',
					3.8,
					12
				)
			RETURNING id, set_id, vendor_name, total_amount
		`, [quoteRequestIds[1]]) // 두 번째 quote request (이영희)
		console.log(`✅ Created ${quoteSetsResult.rowCount} quote sets`)
		quoteSetsResult.rows.forEach(qs => {
			console.log(`   - ${qs.set_id}: ${qs.vendor_name} (₩${qs.total_amount.toLocaleString()})`)
		})

		// 4. Company Reviews 테이블에 테스트 리뷰 추가
		console.log('\n⭐ Creating test company reviews...')
		const reviewsResult = await client.query(`
			INSERT INTO company_reviews (
				company_name,
				rating,
				review_text,
				pros,
				cons,
				work_type,
				work_date,
				verified
			)
			VALUES
				(
					'A건설 인테리어',
					4.5,
					'꼼꼼하고 친절하게 시공해주셨습니다. 마감도 깔끔하고 만족스럽습니다.',
					'꼼꼼한 시공, 친절한 서비스',
					'공사 기간이 예상보다 조금 길었음',
					'아파트 전체 리모델링',
					'2024-11-15',
					true
				),
				(
					'B인테리어',
					4.0,
					'가격 대비 괜찮은 퀄리티였습니다. 추천합니다.',
					'합리적인 가격, 빠른 시공',
					'일부 마감이 아쉬웠음',
					'바닥재 교체',
					'2024-12-01',
					true
				)
			RETURNING id, company_name, rating
		`)
		console.log(`✅ Created ${reviewsResult.rowCount} company reviews`)
		reviewsResult.rows.forEach(review => {
			console.log(`   - ${review.company_name}: ${review.rating}★`)
		})

		// 5. Damage Cases 테이블에 테스트 하자 사례 추가
		console.log('\n⚠️  Creating test damage cases...')
		const damageResult = await client.query(`
			INSERT INTO damage_cases (
				title,
				description,
				category,
				severity,
				status
			)
			VALUES
				(
					'욕실 타일 균열 발견',
					'시공 후 3개월 만에 욕실 타일에 균열이 발견되었습니다. AS 요청 예정입니다.',
					'타일',
					'medium',
					'open'
				),
				(
					'강마루 들뜸 현상',
					'거실 강마루 일부가 들뜸 현상이 발생했습니다. 습기 문제로 추정됩니다.',
					'바닥재',
					'high',
					'in_progress'
				)
			RETURNING id, title, severity
		`)
		console.log(`✅ Created ${damageResult.rowCount} damage cases`)
		damageResult.rows.forEach(damage => {
			console.log(`   - ${damage.title} (${damage.severity})`)
		})

		await client.query('COMMIT')

		console.log('\n' + '='.repeat(60))
		console.log('✅ Test data seeding completed successfully!')
		console.log('='.repeat(60))

		// 데이터 확인
		console.log('\n📊 Final row counts:')
		const tables = ['users', 'quote_requests', 'quote_sets', 'company_reviews', 'damage_cases']
		for (const table of tables) {
			const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`)
			console.log(`   - ${table}: ${countResult.rows[0].count} rows`)
		}

	} catch (error: any) {
		await client.query('ROLLBACK')
		console.error('\n❌ Seeding failed:', error.message)
		if (error.detail) {
			console.error('Detail:', error.detail)
		}
		process.exit(1)
	} finally {
		client.release()
		await pool.end()
		console.log('\n🔌 Database connection closed')
	}
}

// Run seeding
seedTestData()
