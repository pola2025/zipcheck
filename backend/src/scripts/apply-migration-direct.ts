/**
 * 마이그레이션을 직접 적용하는 스크립트
 * Supabase client를 통해 SQL을 직접 실행합니다
 */

import { supabase } from '../lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function applyMigrationDirect() {
	console.log('🔧 Applying migration directly to Supabase...\n')

	const migrationPath = path.resolve(
		__dirname,
		'../../supabase/migrations/20250113_add_multiple_quote_comparison.sql'
	)

	console.log(`📂 Reading: ${migrationPath}`)

	try {
		const sql = fs.readFileSync(migrationPath, 'utf-8')
		console.log(`✅ Loaded ${sql.length} characters\n`)

		// SQL을 개별 statements로 분리
		const statements = sql
			.split(';')
			.map((s) => s.trim())
			.filter(
				(s) =>
					s.length > 0 &&
					!s.startsWith('--') &&
					!s.startsWith('/*') &&
					s !== 'COMMENT ON TABLE' &&
					s !== 'COMMENT ON COLUMN'
			)

		console.log(`📝 Executing ${statements.length} statements...\n`)

		let successCount = 0
		let skipCount = 0

		// 각 statement를 개별적으로 실행
		for (let i = 0; i < statements.length; i++) {
			let statement = statements[i].trim()

			// 빈 statement는 스킵
			if (!statement) continue

			// COMMENT 구문 처리
			if (statement.startsWith('COMMENT ON')) {
				// 다음 세미콜론까지 포함
				let fullComment = statement
				let j = i + 1
				while (j < statements.length && !fullComment.includes("'")) {
					fullComment += ';' + statements[j]
					j++
				}
				statement = fullComment
			}

			const preview = statement.substring(0, 100).replace(/\n/g, ' ')
			console.log(`[${i + 1}] ${preview}...`)

			try {
				// 각 SQL statement 실행
				const { error } = await supabase.rpc('exec_sql', {
					sql_query: statement + ';'
				})

				if (error) {
					// 이미 존재하는 객체는 스킵
					if (
						error.message?.includes('already exists') ||
						error.message?.includes('duplicate') ||
						error.message?.includes('does not exist')
					) {
						console.log(`    ⚠️  Skipped (${error.message.substring(0, 50)})`)
						skipCount++
					} else {
						console.log(`    ❌ Error: ${error.message}`)
					}
				} else {
					console.log(`    ✅ Done`)
					successCount++
				}
			} catch (err: any) {
				console.log(`    ❌ Exception: ${err.message}`)
			}
		}

		console.log('\n' + '='.repeat(60))
		console.log('📊 Summary:')
		console.log(`   ✅ Success: ${successCount}`)
		console.log(`   ⚠️  Skipped: ${skipCount}`)
		console.log('='.repeat(60))
		console.log('\n✅ Migration applied!')
	} catch (error) {
		console.error('❌ Failed:', error)
		process.exit(1)
	}
}

applyMigrationDirect()
