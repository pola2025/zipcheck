/**
 * GPT-5 Pro Jobs Migration Runner
 *
 * 이 스크립트는 analysis_jobs, analysis_job_inputs, analysis_job_usage,
 * analysis_job_outputs 테이블을 생성합니다.
 */

import { pool } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function runMigration() {
	console.log('🚀 Running GPT-5 Pro Jobs Migration...\n')
	console.log('='.repeat(80))

	try {
		// 마이그레이션 파일 읽기
		const migrationPath = path.join(
			__dirname,
			'../migrations/20250114_add_gpt5_pro_jobs.sql'
		)
		const sql = fs.readFileSync(migrationPath, 'utf-8')

		console.log('\n📄 Migration file loaded:')
		console.log(`   Path: ${migrationPath}`)
		console.log(`   Size: ${sql.length} characters`)

		// SQL 실행
		console.log('\n⚙️  Executing migration...')
		await pool.query(sql)

		console.log('\n✅ Migration executed successfully!')

		// 생성된 테이블 확인
		console.log('\n🔍 Verifying created tables...')
		const tables = [
			'analysis_jobs',
			'analysis_job_inputs',
			'analysis_job_usage',
			'analysis_job_outputs'
		]

		for (const table of tables) {
			const result = await pool.query(
				`SELECT COUNT(*) FROM information_schema.tables
				WHERE table_name = $1`,
				[table]
			)
			const exists = parseInt(result.rows[0].count) > 0
			console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'exists' : 'not found'}`)
		}

		// 뷰 확인
		const viewResult = await pool.query(
			`SELECT COUNT(*) FROM information_schema.views
			WHERE table_name = 'analysis_job_stats'`
		)
		const viewExists = parseInt(viewResult.rows[0].count) > 0
		console.log(
			`   ${viewExists ? '✅' : '❌'} analysis_job_stats (view): ${viewExists ? 'exists' : 'not found'}`
		)

		console.log('\n' + '='.repeat(80))
		console.log('✨ GPT-5 Pro Jobs Migration completed!\n')
	} catch (error) {
		console.error('\n❌ Migration failed:', error)
		throw error
	} finally {
		await pool.end()
	}
}

// 실행
runMigration()
