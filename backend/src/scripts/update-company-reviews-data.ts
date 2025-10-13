/**
 * 업체 후기 데이터 업데이트
 * 연락처, 사업자번호 포함한 실제 업체 후기로 변경
 */

import { pool } from '../lib/db'

async function updateCompanyReviewsData() {
	console.log('🔄 Updating company reviews data...\n')

	const client = await pool.connect()

	try {
		await client.query('BEGIN')

		// 1. 기존 데이터 삭제
		console.log('🗑️  Deleting old company reviews...')
		const deleteResult = await client.query('DELETE FROM company_reviews')
		console.log(`✅ Deleted ${deleteResult.rowCount} old records\n`)

		// 2. 새로운 업체 후기 데이터 삽입
		console.log('📝 Inserting new company review data...')
		const insertResult = await client.query(`
			INSERT INTO company_reviews (
				company_name,
				company_phone,
				business_number,
				rating,
				review_text,
				work_type,
				work_date,
				verified,
				status
			)
			VALUES
				(
					'서울인테리어',
					'02-1234-5678',
					'123-45-67890',
					4.5,
					'꼼꼼한 시공과 친절한 상담으로 만족스러운 인테리어를 완성했습니다. 추천합니다!',
					'아파트 전체 리모델링',
					'2024-12-15',
					true,
					'published'
				),
				(
					'강남리모델링',
					'02-2345-6789',
					'234-56-78901',
					5.0,
					'가격 대비 퀄리티가 정말 좋았어요. 사장님이 꼼꼼하게 챙겨주셔서 감사했습니다.',
					'주방 리모델링',
					'2025-01-05',
					true,
					'published'
				),
				(
					'분당인테리어공방',
					'031-3456-7890',
					'345-67-89012',
					4.0,
					'전반적으로 만족스럽습니다. 일정이 조금 지연되었지만 마감은 깔끔하게 잘 해주셨어요.',
					'욕실 리모델링',
					'2024-11-20',
					true,
					'published'
				),
				(
					'디자인홈인테리어',
					'032-4567-8901',
					'456-78-90123',
					4.8,
					'디자인 감각이 뛰어나시고, 시공 품질도 우수합니다. 재시공 없이 한 번에 끝났어요!',
					'오피스텔 풀인테리어',
					'2024-12-28',
					false,
					'published'
				),
				(
					'스마트홈인테리어',
					'02-5678-9012',
					'567-89-01234',
					4.3,
					'스마트홈 시스템 설치까지 완벽하게 해주셨습니다. A/S도 빠르게 처리해주셨어요.',
					'빌라 전체 리모델링',
					'2025-01-10',
					false,
					'published'
				)
			RETURNING id, company_name, rating, company_phone, business_number
		`)

		console.log(`✅ Inserted ${insertResult.rowCount} new company reviews`)
		insertResult.rows.forEach(review => {
			console.log(`   - ${review.company_name}: ${review.rating}★ (${review.company_phone}, ${review.business_number})`)
		})

		await client.query('COMMIT')

		console.log('\n' + '='.repeat(60))
		console.log('✅ Company reviews data update completed!')
		console.log('='.repeat(60))

		// 데이터 확인
		console.log('\n📊 Final count:')
		const countResult = await client.query('SELECT COUNT(*) as count FROM company_reviews')
		console.log(`   - company_reviews: ${countResult.rows[0].count} rows`)

	} catch (error: any) {
		await client.query('ROLLBACK')
		console.error('\n❌ Update failed:', error.message)
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

// Run update
updateCompanyReviewsData()
