/**
 * Airtable Analytics Sync Service
 *
 * GA4 일별 분석 데이터를 Airtable에 동기화합니다.
 * 테이블: Analytics_Daily
 */

import Airtable, { FieldSet } from 'airtable'
import { getTrafficReport, getDeviceReport, getFunnelReport } from './google-analytics'

function getAirtableBase() {
	const apiKey = process.env.AIRTABLE_API_KEY
	const baseId = process.env.AIRTABLE_BASE_ID

	if (!apiKey || !baseId) {
		throw new Error('AIRTABLE_API_KEY 또는 AIRTABLE_BASE_ID 환경변수가 설정되지 않았습니다.')
	}

	return new Airtable({ apiKey }).base(baseId)
}

const TABLE_NAME = 'Analytics_Daily'

interface SyncResult {
	synced: number
	errors: number
	details: string[]
}

/**
 * GA4 일별 데이터를 Airtable에 동기화 (upsert)
 */
export async function syncDailyAnalytics(days: number = 30): Promise<SyncResult> {
	const base = getAirtableBase()
	const table = base(TABLE_NAME)

	// GA4 데이터 수집
	const [trafficReport, deviceReport, funnelReport] = await Promise.all([
		getTrafficReport(days),
		getDeviceReport(days),
		getFunnelReport(days),
	])

	// 디바이스별 사용자 수 맵
	const deviceMap: Record<string, number> = {}
	for (const d of deviceReport) {
		deviceMap[d.device.toLowerCase()] = d.users
	}

	// 퍼널 데이터 맵
	const funnelMap: Record<string, number> = {}
	for (const f of funnelReport) {
		funnelMap[f.label] = f.pageViews
	}

	// 최다 유입 출처
	const topSource = trafficReport.trafficSources[0]
		? `${trafficReport.trafficSources[0].source} / ${trafficReport.trafficSources[0].medium}`
		: 'N/A'

	// 기존 레코드 조회 (Date 기준)
	const existingRecords = new Map<string, string>()
	try {
		const records = await table.select({
			fields: ['Date'],
			maxRecords: 400,
		}).all()

		for (const rec of records) {
			const date = rec.get('Date') as string
			if (date) {
				existingRecords.set(date, rec.id)
			}
		}
	} catch {
		// 테이블이 없을 수 있음 - 새로 생성됨
	}

	const result: SyncResult = { synced: 0, errors: 0, details: [] }

	// 일별 데이터를 Airtable에 upsert
	for (const day of trafficReport.dailyData) {
		// GA4 date format: "20250103" → "2025-01-03"
		const formattedDate = `${day.date.slice(0, 4)}-${day.date.slice(4, 6)}-${day.date.slice(6, 8)}`

		const fields: Partial<FieldSet> = {
			Date: formattedDate,
			Users: day.users,
			Sessions: day.sessions,
			PageViews: day.pageViews,
			BounceRate: Math.round(trafficReport.bounceRate * 100) / 100,
			AvgDuration: Math.round(trafficReport.avgSessionDuration),
			Desktop_Users: deviceMap['desktop'] || 0,
			Mobile_Users: deviceMap['mobile'] || 0,
			Tablet_Users: deviceMap['tablet'] || 0,
			Top_Source: topSource,
			Funnel_Main: funnelMap['메인 페이지'] || 0,
			Funnel_Plan: funnelMap['플랜 선택'] || 0,
			Funnel_Payment: funnelMap['결제'] || 0,
			Funnel_Submission: funnelMap['견적 신청'] || 0,
			Funnel_Status: funnelMap['견적 확인'] || 0,
		}

		try {
			const existingId = existingRecords.get(formattedDate)
			if (existingId) {
				await table.update(existingId, fields)
			} else {
				await table.create(fields)
			}
			result.synced++
		} catch (error) {
			result.errors++
			const msg = error instanceof Error ? error.message : 'Unknown error'
			result.details.push(`${formattedDate}: ${msg}`)
		}
	}

	result.details.unshift(`${result.synced}개 레코드 동기화 완료, ${result.errors}개 실패`)
	return result
}
