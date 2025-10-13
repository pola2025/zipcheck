/**
 * 마이그레이션 SQL을 콘솔에 출력하는 스크립트
 * Supabase Dashboard SQL Editor에 복사-붙여넣기 하세요
 */

import * as fs from 'fs'
import * as path from 'path'

function showMigrationSQL() {
	const migrationPath = path.resolve(
		__dirname,
		'../../supabase/migrations/20250113_add_multiple_quote_comparison.sql'
	)

	console.log('\n' + '='.repeat(80))
	console.log('📋 SUPABASE MIGRATION SQL')
	console.log('='.repeat(80))
	console.log('\n✨ 아래 SQL을 복사해서 Supabase Dashboard > SQL Editor에 붙여넣고 실행하세요\n')
	console.log('='.repeat(80))
	console.log('\n')

	try {
		const sql = fs.readFileSync(migrationPath, 'utf-8')
		console.log(sql)
		console.log('\n')
		console.log('='.repeat(80))
		console.log(`\n✅ Total: ${sql.length} characters`)
		console.log('\n📍 Steps:')
		console.log('   1. Supabase Dashboard 접속')
		console.log('   2. 왼쪽 메뉴에서 "SQL Editor" 클릭')
		console.log('   3. 위 SQL을 복사해서 붙여넣기')
		console.log('   4. "Run" 버튼 클릭')
		console.log('\n' + '='.repeat(80) + '\n')
	} catch (error) {
		console.error('❌ Failed to read migration file:', error)
		process.exit(1)
	}
}

showMigrationSQL()
