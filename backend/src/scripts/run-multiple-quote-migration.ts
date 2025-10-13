/**
 * 다중 견적 비교 시스템 마이그레이션 실행 스크립트
 * Phase 2: 데이터베이스 스키마 변경
 */

import { supabase } from '../lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
	console.log('🔧 Starting Multiple Quote Comparison Migration...\n')

	// 마이그레이션 파일 경로
	const migrationPath = path.resolve(
		__dirname,
		'../../supabase/migrations/20250113_add_multiple_quote_comparison.sql'
	)

	console.log(`📂 Reading migration file: ${migrationPath}`)

	try {
		// SQL 파일 읽기
		const sql = fs.readFileSync(migrationPath, 'utf-8')
		console.log(`✅ Migration file loaded (${sql.length} characters)\n`)

		// SQL을 세미콜론으로 분리하여 순차 실행
		const statements = sql
			.split(';')
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !s.startsWith('--'))

		console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

		let successCount = 0
		let errorCount = 0

		// 각 statement를 순차적으로 실행
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i]
			const preview = statement.substring(0, 80).replace(/\n/g, ' ')

			try {
				console.log(`⏳ [${i + 1}/${statements.length}] Executing: ${preview}...`)

				// Supabase로 SQL 실행
				const { data, error } = await supabase.rpc('exec_sql', {
					sql_query: statement + ';'
				})

				if (error) {
					// 이미 존재하는 객체는 경고만 표시
					if (
						error.message?.includes('already exists') ||
						error.message?.includes('duplicate')
					) {
						console.log(`⚠️  Already exists (skipped)`)
					} else {
						console.error(`❌ Error:`, error.message)
						errorCount++
					}
				} else {
					console.log(`✅ Success`)
					successCount++
				}
			} catch (err) {
				console.error(`❌ Unexpected error:`, err)
				errorCount++
			}

			console.log() // 빈 줄
		}

		// 결과 요약
		console.log('=' .repeat(60))
		console.log('📊 Migration Summary:')
		console.log(`   Total statements: ${statements.length}`)
		console.log(`   ✅ Successful: ${successCount}`)
		console.log(`   ❌ Failed: ${errorCount}`)
		console.log('=' .repeat(60))

		if (errorCount === 0) {
			console.log('\n🎉 Migration completed successfully!')
		} else {
			console.log('\n⚠️  Migration completed with errors. Please review.')
		}

		// 변경사항 검증
		console.log('\n🔍 Verifying changes...\n')
		await verifyMigration()
	} catch (error) {
		console.error('❌ Migration failed:', error)
		process.exit(1)
	}
}

/**
 * 마이그레이션 결과 검증
 */
async function verifyMigration() {
	try {
		// 1. quote_requests 테이블에 새 컬럼이 추가되었는지 확인
		console.log('  Checking quote_requests table...')
		const { data: qrColumns, error: qrError } = await supabase.rpc('exec_sql', {
			sql_query: `
				SELECT column_name, data_type
				FROM information_schema.columns
				WHERE table_name = 'quote_requests'
				AND column_name IN ('payment_id', 'plan_id', 'quantity', 'paid_amount')
				ORDER BY column_name;
			`
		})

		if (qrError) {
			console.log(`  ⚠️  Could not verify quote_requests: ${qrError.message}`)
		} else {
			console.log(`  ✅ quote_requests: ${qrColumns?.length || 0} new columns found`)
		}

		// 2. quote_sets 테이블이 생성되었는지 확인
		console.log('  Checking quote_sets table...')
		const { data: qsTable, error: qsError } = await supabase.rpc('exec_sql', {
			sql_query: `
				SELECT EXISTS (
					SELECT FROM information_schema.tables
					WHERE table_name = 'quote_sets'
				) as exists;
			`
		})

		if (qsError) {
			console.log(`  ⚠️  Could not verify quote_sets: ${qsError.message}`)
		} else {
			console.log(`  ✅ quote_sets table: ${qsTable?.[0]?.exists ? 'EXISTS' : 'NOT FOUND'}`)
		}

		// 3. comparison_analyses 테이블이 생성되었는지 확인
		console.log('  Checking comparison_analyses table...')
		const { data: caTable, error: caError } = await supabase.rpc('exec_sql', {
			sql_query: `
				SELECT EXISTS (
					SELECT FROM information_schema.tables
					WHERE table_name = 'comparison_analyses'
				) as exists;
			`
		})

		if (caError) {
			console.log(`  ⚠️  Could not verify comparison_analyses: ${caError.message}`)
		} else {
			console.log(
				`  ✅ comparison_analyses table: ${caTable?.[0]?.exists ? 'EXISTS' : 'NOT FOUND'}`
			)
		}

		// 4. 뷰가 생성되었는지 확인
		console.log('  Checking quote_request_details view...')
		const { data: viewExists, error: viewError } = await supabase.rpc('exec_sql', {
			sql_query: `
				SELECT EXISTS (
					SELECT FROM information_schema.views
					WHERE table_name = 'quote_request_details'
				) as exists;
			`
		})

		if (viewError) {
			console.log(`  ⚠️  Could not verify view: ${viewError.message}`)
		} else {
			console.log(
				`  ✅ quote_request_details view: ${viewExists?.[0]?.exists ? 'EXISTS' : 'NOT FOUND'}`
			)
		}

		console.log('\n✅ Verification completed!')
	} catch (error) {
		console.error('⚠️  Verification error:', error)
	}
}

// 스크립트 실행
runMigration()
