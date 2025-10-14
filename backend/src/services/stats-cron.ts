/**
 * Statistics Cron Jobs
 *
 * Sends daily/weekly/monthly statistics to Slack
 */

import cron from 'node-cron'
import { query } from '../lib/db'
import { notifyDailyStats, notifyWeeklyStats, notifyMonthlyStats } from './slack-notifications'

interface StatsData {
	date: string
	totalJobs: number
	succeededJobs: number
	failedJobs: number
	timeoutJobs?: number
	totalTokens: number
	totalCost: number
	avgTokens: number
	avgCost: number
	successRate: number
}

/**
 * Calculate statistics for a given time period
 */
async function calculateStats(startDate: Date, endDate: Date): Promise<StatsData> {
	const result = await query(
		`SELECT
			COUNT(*) as total_jobs,
			COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded_jobs,
			COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
			COUNT(*) FILTER (WHERE status = 'timeout') as timeout_jobs,
			COALESCE(SUM(actual_tokens_used), 0) as total_tokens,
			COALESCE(SUM(actual_cost_usd), 0) as total_cost,
			COALESCE(AVG(actual_tokens_used), 0) as avg_tokens,
			COALESCE(AVG(actual_cost_usd), 0) as avg_cost
		FROM analysis_jobs
		WHERE created_at >= $1 AND created_at < $2`,
		[startDate.toISOString(), endDate.toISOString()]
	)

	const row = result.rows[0]
	const totalJobs = parseInt(row.total_jobs)
	const succeededJobs = parseInt(row.succeeded_jobs)
	const successRate = totalJobs > 0 ? (succeededJobs / totalJobs) * 100 : 0

	return {
		date: startDate.toISOString().split('T')[0],
		totalJobs,
		succeededJobs,
		failedJobs: parseInt(row.failed_jobs),
		timeoutJobs: parseInt(row.timeout_jobs),
		totalTokens: parseInt(row.total_tokens),
		totalCost: parseFloat(row.total_cost),
		avgTokens: Math.round(parseFloat(row.avg_tokens)),
		avgCost: parseFloat(row.avg_cost),
		successRate: Math.round(successRate * 10) / 10 // Round to 1 decimal
	}
}

/**
 * Daily statistics job (runs at 23:59 KST every day)
 */
function startDailyStatsJob() {
	// Run at 23:59 KST (14:59 UTC, assuming KST = UTC+9)
	cron.schedule('59 14 * * *', async () => {
		try {
			console.log('🕐 Running daily statistics job...')

			const now = new Date()
			const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
			const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

			const stats = await calculateStats(startOfDay, endOfDay)

			if (stats.totalJobs > 0) {
				// notifyDailyStats only needs basic stats (no peakDay, no startDate/endDate)
				await notifyDailyStats({
					date: stats.date,
					totalJobs: stats.totalJobs,
					succeededJobs: stats.succeededJobs,
					failedJobs: stats.failedJobs,
					totalTokens: stats.totalTokens,
					totalCost: stats.totalCost,
					avgTokens: stats.avgTokens,
					avgCost: stats.avgCost,
					successRate: stats.successRate
				})
				console.log(`✅ Daily stats sent: ${stats.totalJobs} jobs, ${stats.successRate}% success rate`)
			} else {
				console.log('ℹ️  No jobs today, skipping daily stats notification')
			}
		} catch (error) {
			console.error('❌ Daily stats job error:', error)
		}
	}, {
		timezone: 'Asia/Seoul'
	})

	console.log('✅ Daily statistics cron job started (runs at 23:59 KST)')
}

/**
 * Weekly statistics job (runs on Sunday at 23:59 KST)
 */
function startWeeklyStatsJob() {
	// Run on Sunday at 23:59 KST
	cron.schedule('59 14 * * 0', async () => {
		try {
			console.log('🕐 Running weekly statistics job...')

			const now = new Date()
			const dayOfWeek = now.getDay()
			const startOfWeek = new Date(now)
			startOfWeek.setDate(now.getDate() - dayOfWeek) // Go back to Sunday
			startOfWeek.setHours(0, 0, 0, 0)

			const endOfWeek = new Date(startOfWeek)
			endOfWeek.setDate(startOfWeek.getDate() + 7)

			const stats = await calculateStats(startOfWeek, endOfWeek)

			if (stats.totalJobs > 0) {
				// Calculate peak day (day with most jobs)
				const peakDayResult = await query(
					`SELECT DATE(created_at) as day, COUNT(*) as count
					FROM analysis_jobs
					WHERE created_at >= $1 AND created_at < $2
					GROUP BY DATE(created_at)
					ORDER BY COUNT(*) DESC
					LIMIT 1`,
					[startOfWeek.toISOString(), endOfWeek.toISOString()]
				)

				const peakDay = peakDayResult.rows[0]?.day || startOfWeek.toISOString().split('T')[0]
				const peakDayJobs = parseInt(peakDayResult.rows[0]?.count || '0')

				await notifyWeeklyStats({
					startDate: startOfWeek.toISOString().split('T')[0],
					endDate: endOfWeek.toISOString().split('T')[0],
					totalJobs: stats.totalJobs,
					succeededJobs: stats.succeededJobs,
					failedJobs: stats.failedJobs,
					totalTokens: stats.totalTokens,
					totalCost: stats.totalCost,
					avgTokens: stats.avgTokens,
					avgCost: stats.avgCost,
					successRate: stats.successRate,
					peakDay,
					peakDayJobs
				})
				console.log(`✅ Weekly stats sent: ${stats.totalJobs} jobs, ${stats.successRate}% success rate`)
			} else {
				console.log('ℹ️  No jobs this week, skipping weekly stats notification')
			}
		} catch (error) {
			console.error('❌ Weekly stats job error:', error)
		}
	}, {
		timezone: 'Asia/Seoul'
	})

	console.log('✅ Weekly statistics cron job started (runs on Sunday at 23:59 KST)')
}

/**
 * Monthly statistics job (runs on the 1st of each month at 00:00 KST)
 */
function startMonthlyStatsJob() {
	// Run on 1st of month at 00:00 KST
	cron.schedule('0 15 1 * *', async () => {
		try {
			console.log('🕐 Running monthly statistics job...')

			const now = new Date()
			const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0)
			const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0) // 1st of current month

			const stats = await calculateStats(startOfMonth, endOfMonth)

			if (stats.totalJobs > 0) {
				// Format month as YYYY-MM
				const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

				await notifyMonthlyStats({
					month: monthStr,
					totalJobs: stats.totalJobs,
					succeededJobs: stats.succeededJobs,
					failedJobs: stats.failedJobs,
					totalTokens: stats.totalTokens,
					totalCost: stats.totalCost,
					avgTokens: stats.avgTokens,
					avgCost: stats.avgCost,
					successRate: stats.successRate
				})
				console.log(`✅ Monthly stats sent: ${stats.totalJobs} jobs, ${stats.successRate}% success rate`)
			} else {
				console.log('ℹ️  No jobs last month, skipping monthly stats notification')
			}
		} catch (error) {
			console.error('❌ Monthly stats job error:', error)
		}
	}, {
		timezone: 'Asia/Seoul'
	})

	console.log('✅ Monthly statistics cron job started (runs on 1st of month at 00:00 KST)')
}

/**
 * Start all statistics cron jobs
 */
export function startStatsCronJobs() {
	console.log('🚀 Starting statistics cron jobs...')

	startDailyStatsJob()
	startWeeklyStatsJob()
	startMonthlyStatsJob()

	console.log('✅ All statistics cron jobs started')
}

/**
 * Manual trigger for testing (call from API endpoint)
 */
export async function triggerDailyStats() {
	const now = new Date()
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
	const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

	const stats = await calculateStats(startOfDay, endOfDay)
	await notifyDailyStats({
		date: stats.date,
		totalJobs: stats.totalJobs,
		succeededJobs: stats.succeededJobs,
		failedJobs: stats.failedJobs,
		totalTokens: stats.totalTokens,
		totalCost: stats.totalCost,
		avgTokens: stats.avgTokens,
		avgCost: stats.avgCost,
		successRate: stats.successRate
	})
	return stats
}

export async function triggerWeeklyStats() {
	const now = new Date()
	const dayOfWeek = now.getDay()
	const startOfWeek = new Date(now)
	startOfWeek.setDate(now.getDate() - dayOfWeek)
	startOfWeek.setHours(0, 0, 0, 0)

	const endOfWeek = new Date(startOfWeek)
	endOfWeek.setDate(startOfWeek.getDate() + 7)

	const stats = await calculateStats(startOfWeek, endOfWeek)

	// Calculate peak day
	const peakDayResult = await query(
		`SELECT DATE(created_at) as day, COUNT(*) as count
		FROM analysis_jobs
		WHERE created_at >= $1 AND created_at < $2
		GROUP BY DATE(created_at)
		ORDER BY COUNT(*) DESC
		LIMIT 1`,
		[startOfWeek.toISOString(), endOfWeek.toISOString()]
	)

	const peakDay = peakDayResult.rows[0]?.day || startOfWeek.toISOString().split('T')[0]
	const peakDayJobs = parseInt(peakDayResult.rows[0]?.count || '0')

	await notifyWeeklyStats({
		startDate: startOfWeek.toISOString().split('T')[0],
		endDate: endOfWeek.toISOString().split('T')[0],
		totalJobs: stats.totalJobs,
		succeededJobs: stats.succeededJobs,
		failedJobs: stats.failedJobs,
		totalTokens: stats.totalTokens,
		totalCost: stats.totalCost,
		avgTokens: stats.avgTokens,
		avgCost: stats.avgCost,
		successRate: stats.successRate,
		peakDay,
		peakDayJobs
	})
	return stats
}

export async function triggerMonthlyStats() {
	const now = new Date()
	const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
	const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0)
	const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)

	const stats = await calculateStats(startOfMonth, endOfMonth)

	const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

	await notifyMonthlyStats({
		month: monthStr,
		totalJobs: stats.totalJobs,
		succeededJobs: stats.succeededJobs,
		failedJobs: stats.failedJobs,
		totalTokens: stats.totalTokens,
		totalCost: stats.totalCost,
		avgTokens: stats.avgTokens,
		avgCost: stats.avgCost,
		successRate: stats.successRate
	})
	return stats
}
