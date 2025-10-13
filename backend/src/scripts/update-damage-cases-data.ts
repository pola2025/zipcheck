/**
 * 피해사례 데이터 업데이트
 * 하자보수 → 계약위반/업체 잠수/연락두절 등 실제 피해사례로 변경
 */

import { pool } from '../lib/db'

async function updateDamageCasesData() {
	console.log('🔄 Updating damage cases data...\n')

	const client = await pool.connect()

	try {
		await client.query('BEGIN')

		// 1. 기존 데이터 삭제
		console.log('🗑️  Deleting old damage cases...')
		const deleteResult = await client.query('DELETE FROM damage_cases')
		console.log(`✅ Deleted ${deleteResult.rowCount} old records\n`)

		// 2. 새로운 피해사례 데이터 삽입
		console.log('📝 Inserting new damage case data...')
		const insertResult = await client.query(`
			INSERT INTO damage_cases (
				title,
				description,
				category,
				severity,
				status
			)
			VALUES
				(
					'계약서와 다른 자재로 시공',
					'계약서에는 A등급 자재로 명시되어 있었으나, 실제로는 B등급 자재로 시공되었습니다. 업체에 문의했으나 차이가 없다며 넘어가려고 합니다. 계약서를 근거로 재시공을 요구하고 있으나 응답이 없는 상태입니다.',
					'계약위반',
					'high',
					'open'
				),
				(
					'대금 지급 후 업체 연락두절',
					'중도금까지 지급하고 시공이 80% 진행된 상태에서 업체와 연락이 두절되었습니다. 업체 대표 번호도 받지 않고, 현장 책임자도 나오지 않습니다. 남은 마감 공사가 진행되지 않아 입주를 못하고 있습니다.',
					'업체잠수',
					'critical',
					'in_progress'
				),
				(
					'약속한 공사 항목 누락',
					'견적서에 포함된 주방 싱크대 교체와 욕실 방수 공사가 진행되지 않았습니다. 업체에서는 "그건 기본 시공에 포함 안 된다"며 추가 비용을 요구합니다. 계약서에 명시되어 있는데도 말을 바꾸고 있습니다.',
					'미시공',
					'high',
					'open'
				),
				(
					'잔금 지급 전 공사 중단',
					'잔금 지급 전 공사를 완료하기로 했으나, 업체에서 잔금을 먼저 입금하라며 공사를 중단했습니다. 아직 마감 작업이 남아있고 보수할 부분도 있는데 시공을 거부하고 있습니다.',
					'공사중단',
					'high',
					'open'
				),
				(
					'허위 자격증 및 면허 사용',
					'업체에서 제공한 시공 자격증이 위조된 것으로 확인되었습니다. 실제로는 무면허 업자가 시공했으며, 이로 인해 부실시공이 발생했습니다. 법적 대응을 준비 중입니다.',
					'허위업체',
					'critical',
					'open'
				)
			RETURNING id, title, category, severity
		`)

		console.log(`✅ Inserted ${insertResult.rowCount} new damage cases`)
		insertResult.rows.forEach(dc => {
			console.log(`   - ${dc.title} (${dc.category}, ${dc.severity})`)
		})

		await client.query('COMMIT')

		console.log('\n' + '='.repeat(60))
		console.log('✅ Damage cases data update completed!')
		console.log('='.repeat(60))

		// 데이터 확인
		console.log('\n📊 Final count:')
		const countResult = await client.query('SELECT COUNT(*) as count FROM damage_cases')
		console.log(`   - damage_cases: ${countResult.rows[0].count} rows`)

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
updateDamageCasesData()
