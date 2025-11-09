/**
 * Run analysis_jobs migration
 *
 * This script executes the analysis_jobs migration to create tables
 * needed for AI analysis statistics and job tracking.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { pool } from '../lib/db'

async function runMigration() {
  console.log('🚀 Running analysis_jobs migration...')

  try {
    // Read migration SQL file (fixed version)
    const migrationPath = join(__dirname, '../migrations/20251109_fix_analysis_jobs_fk.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded:', migrationPath)

    // Execute migration
    await pool.query(migrationSQL)

    console.log('✅ Migration executed successfully!')
    console.log('')
    console.log('Created tables:')
    console.log('  - analysis_jobs')
    console.log('  - analysis_job_inputs')
    console.log('  - analysis_job_usage')
    console.log('  - analysis_job_outputs')
    console.log('')
    console.log('Created indexes and triggers')
    console.log('Created view: analysis_job_stats')

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('analysis_jobs', 'analysis_job_inputs', 'analysis_job_usage', 'analysis_job_outputs')
      ORDER BY table_name
    `)

    console.log('')
    console.log('✅ Verified tables:')
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
