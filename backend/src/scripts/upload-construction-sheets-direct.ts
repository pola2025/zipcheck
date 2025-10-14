/**
 * 현장별 실행내역서를 DB에 직접 업로드하는 스크립트
 */

import * as fs from 'fs'
import * as path from 'path'
import { uploadConstructionSheets } from '../services/data-upload'

async function uploadSheets() {
	const filePath = path.resolve('F:\\GOI\\현장별실행내역서.xlsx')

	console.log('📂 Uploading Construction Sheets to Database...')
	console.log(`📁 File: ${filePath}\n`)

	try {
		const buffer = fs.readFileSync(filePath)

		// Multer 파일 객체 모방
		const file = {
			buffer,
			originalname: '현장별실행내역서.xlsx',
			size: buffer.length,
			mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			fieldname: 'file',
			encoding: '7bit',
			destination: '',
			filename: '',
			path: ''
		} as Express.Multer.File

		console.log('🔄 Uploading to database...\n')

		const result = await uploadConstructionSheets(file)

		console.log('\n' + '='.repeat(80))
		console.log('✅ Upload completed!\n')
		console.log(`📊 Results:`)
		console.log(`   - Total Rows: ${result.totalRows}`)
		console.log(`   - Success: ${result.successRows}`)
		console.log(`   - Errors: ${result.errorRows}`)

		if (result.errors.length > 0) {
			console.log(`\n⚠️  Errors (first 10):`)
			result.errors.slice(0, 10).forEach(err => {
				console.log(`   - Row ${err.row}: ${err.message}`)
			})
		}

		console.log('='.repeat(80))

	} catch (error) {
		console.error('❌ Upload failed:', error)
		if (error instanceof Error) {
			console.error('Stack:', error.stack)
		}
		process.exit(1)
	} finally {
		// Close database connection
		process.exit(0)
	}
}

uploadSheets()
