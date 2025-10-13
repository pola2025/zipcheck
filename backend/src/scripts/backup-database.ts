/**
 * 데이터베이스 백업 스크립트
 * 마이그레이션 실행 전 현재 데이터를 JSON 파일로 백업합니다.
 */

import { supabase } from '../lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

interface BackupResult {
	timestamp: string
	tables: {
		quote_requests: any[]
		quote_groups: any[]
		// 추가 테이블이 있다면 여기에 추가
	}
	metadata: {
		totalRecords: number
		backupSize: string
	}
}

async function backupDatabase() {
	console.log('🔄 Starting database backup...\n')

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	const backupDir = path.resolve(__dirname, '../../../backups')
	const backupFile = path.join(backupDir, `backup-${timestamp}.json`)

	try {
		// 백업 디렉토리 생성
		if (!fs.existsSync(backupDir)) {
			fs.mkdirSync(backupDir, { recursive: true })
			console.log('📁 Created backup directory:', backupDir)
		}

		const backup: BackupResult = {
			timestamp,
			tables: {
				quote_requests: [],
				quote_groups: []
			},
			metadata: {
				totalRecords: 0,
				backupSize: ''
			}
		}

		// 1. quote_requests 백업
		console.log('⏳ Backing up quote_requests table...')
		const { data: quoteRequests, error: qrError } = await supabase
			.from('quote_requests')
			.select('*')
			.order('created_at', { ascending: false })

		if (qrError) {
			console.error('❌ Error backing up quote_requests:', qrError.message)
		} else {
			backup.tables.quote_requests = quoteRequests || []
			console.log(`✅ Backed up ${backup.tables.quote_requests.length} quote_requests`)
		}

		// 2. quote_groups 백업
		console.log('⏳ Backing up quote_groups table...')
		const { data: quoteGroups, error: qgError } = await supabase
			.from('quote_groups')
			.select('*')
			.order('created_at', { ascending: false })

		if (qgError) {
			// 테이블이 없을 수도 있음 (정상)
			if (qgError.message.includes('does not exist')) {
				console.log('ℹ️  quote_groups table does not exist (OK)')
			} else {
				console.error('❌ Error backing up quote_groups:', qgError.message)
			}
		} else {
			backup.tables.quote_groups = quoteGroups || []
			console.log(`✅ Backed up ${backup.tables.quote_groups.length} quote_groups`)
		}

		// 메타데이터 계산
		backup.metadata.totalRecords =
			backup.tables.quote_requests.length + backup.tables.quote_groups.length

		// JSON 파일로 저장
		const jsonContent = JSON.stringify(backup, null, 2)
		fs.writeFileSync(backupFile, jsonContent, 'utf-8')

		const fileSizeBytes = fs.statSync(backupFile).size
		const fileSizeKB = (fileSizeBytes / 1024).toFixed(2)
		backup.metadata.backupSize = `${fileSizeKB} KB`

		console.log('\n' + '='.repeat(60))
		console.log('✅ Backup completed successfully!')
		console.log('='.repeat(60))
		console.log(`📁 Backup file: ${backupFile}`)
		console.log(`📊 Total records: ${backup.metadata.totalRecords}`)
		console.log(`💾 File size: ${backup.metadata.backupSize}`)
		console.log('='.repeat(60))

		console.log('\n💡 Backup file location:')
		console.log(`   ${backupFile}`)

		console.log('\n💡 To restore from backup, use:')
		console.log(`   npm run restore:backup ${path.basename(backupFile)}`)

		return backupFile
	} catch (error) {
		console.error('\n❌ Backup failed:', error)
		process.exit(1)
	}
}

// 스크립트 실행
backupDatabase()
