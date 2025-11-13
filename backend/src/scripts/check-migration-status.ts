/**
 * Check if analysis_jobs migration has been applied
 *
 * This script checks if the analysis_jobs tables exist in the database
 */

import { pool } from '../lib/db'

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...')
  console.log('')

  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('analysis_jobs', 'analysis_job_inputs', 'analysis_job_usage', 'analysis_job_outputs')
      ORDER BY table_name
    `)

    console.log('📊 Migration Status:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const expectedTables = ['analysis_jobs', 'analysis_job_inputs', 'analysis_job_usage', 'analysis_job_outputs']
    const existingTables = result.rows.map(row => row.table_name)

    expectedTables.forEach(tableName => {
      if (existingTables.includes(tableName)) {
        console.log(`✅ ${tableName} - EXISTS`)
      } else {
        console.log(`❌ ${tableName} - MISSING`)
      }
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')

    if (existingTables.length === expectedTables.length) {
      console.log('✅ All tables exist! Migration has been applied.')

      // Check if view exists
      const viewResult = await pool.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name = 'analysis_job_stats'
      `)

      if (viewResult.rows.length > 0) {
        console.log('✅ analysis_job_stats view exists')
      } else {
        console.log('❌ analysis_job_stats view missing')
      }

      // Check record count
      const countResult = await pool.query('SELECT COUNT(*) FROM analysis_jobs')
      console.log(`📊 Current records: ${countResult.rows[0].count}`)

    } else {
      console.log('❌ Migration incomplete! Some tables are missing.')
      console.log('')
      console.log('To apply migration, run:')
      console.log('  npx tsx src/scripts/run-analysis-jobs-migration.ts')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error checking migration status:', error)
    process.exit(1)
  }
}

checkMigrationStatus()
