/**
 * Admin endpoints for 견적 분석 시스템
 * Mount: /api/admin/analyses
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findOne, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import { sendQuoteCompletedEmail } from '../../services/google-gmail'
import { calculateScoreFromItems } from '../../services/scoring'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /
 * 분석 목록 (status/reviewer 필터, 페이지네이션)
 */
app.get('/', async (c) => {
	try {
		const status = c.req.query('status')
		const reviewer = c.req.query('reviewer')
		const page = parseInt(c.req.query('page') || '1')
		const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
		const offset = (page - 1) * limit

		let where = 'WHERE 1=1'
		const params: unknown[] = []
		let paramIdx = 1

		if (status) {
			where += ` AND a.status = $${paramIdx++}`
			params.push(status)
		}
		if (reviewer) {
			where += ` AND a.reviewed_by = $${paramIdx++}`
			params.push(reviewer)
		}

		const countResult = await query(
			c.env.DATABASE_URL,
			`SELECT COUNT(*) as total FROM analyses a ${where}`,
			params
		)
		const total = parseInt(String(countResult[0]?.total || '0'))

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT a.*,
				(SELECT COUNT(*) FROM analysis_items WHERE analysis_id = a.id) as item_count
			 FROM analyses a
			 ${where}
			 ORDER BY a.created_at DESC
			 LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
			[...params, limit, offset]
		)

		return c.json({
			data: rows,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
		})
	} catch (error) {
		console.error('[Analyses] List error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /
 * 새 분석 생성 (quote_request_id 기반 또는 수동)
 */
app.post('/', async (c) => {
	try {
		const body = await c.req.json()
		const {
			quoteRequestId, customerName, customerPhone, customerEmail,
			contractorName, propertyType, propertySizeSqm, region, address
		} = body

		// quote_request에서 데이터 가져오기
		let qr: Record<string, unknown> | null = null
		if (quoteRequestId) {
			qr = await findOne(
				c.env.DATABASE_URL,
				'SELECT * FROM quote_requests WHERE id = $1',
				[quoteRequestId]
			)
		}

		// Blind Labeling 자동 전환: completed 분석 20건 이상이면 false
		const completedCount = await query(
			c.env.DATABASE_URL,
			`SELECT COUNT(*) as total FROM analyses WHERE status = 'completed'`,
			[]
		)
		const isBlindLabeling = parseInt(String(completedCount[0]?.total || '0')) < 20

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO analyses (
				quote_request_id, customer_name, customer_phone, customer_email,
				contractor_name, property_type, property_size_sqm, region, address,
				status, current_step, is_blind_labeling
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', 1, $10) RETURNING *`,
			[
				quoteRequestId || null,
				customerName || qr?.customer_name || null,
				customerPhone || qr?.customer_phone || null,
				customerEmail || qr?.customer_email || null,
				contractorName || null,
				propertyType || qr?.property_type || null,
				propertySizeSqm || qr?.property_size || null,
				region || qr?.region || null,
				address || qr?.address || null,
				isBlindLabeling,
			]
		)

		return c.json({ success: true, data: rows[0], blind_labeling_auto: !isBlindLabeling ? 'disabled (20+ completed)' : 'enabled' }, 201)
	} catch (error) {
		console.error('[Analyses] Create error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * GET /:id
 * 분석 상세 + 아이템 전체
 */
app.get('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const analysis = await findOne(
			c.env.DATABASE_URL,
			'SELECT * FROM analyses WHERE id = $1',
			[id]
		)
		if (!analysis) {
			return c.json({ error: '분석을 찾을 수 없습니다.' }, 404)
		}

		const items = await findMany(
			c.env.DATABASE_URL,
			'SELECT * FROM analysis_items WHERE analysis_id = $1 ORDER BY sort_order, created_at',
			[id]
		)

		return c.json({ data: { ...analysis, items } })
	} catch (error) {
		console.error('[Analyses] Get error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PATCH /:id
 * 메타데이터 업데이트
 */
app.patch('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json()

		// 허용된 필드만 업데이트
		const allowed = [
			'status', 'current_step', 'customer_name', 'customer_phone', 'customer_email',
			'contractor_name', 'contractor_license', 'contractor_license_verified',
			'property_type', 'property_size_sqm', 'region', 'address',
			'is_vat_included', 'is_blind_labeling', 'completeness', 'pricing_type',
			'quote_date', 'construction_start_month', 'reviewed_by', 'reviewer_notes',
			'total_score', 'score_breakdown'
		]

		const updates: string[] = []
		const values: unknown[] = []
		let idx = 1

		for (const key of allowed) {
			if (body[key] !== undefined) {
				const dbKey = key // already snake_case
				if (key === 'score_breakdown') {
					updates.push(`${dbKey} = $${idx++}::jsonb`)
				} else {
					updates.push(`${dbKey} = $${idx++}`)
				}
				values.push(key === 'score_breakdown' ? JSON.stringify(body[key]) : body[key])
			}
		}

		if (updates.length === 0) {
			return c.json({ error: '업데이트할 필드가 없습니다.' }, 400)
		}

		updates.push(`updated_at = NOW()`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE analyses SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
			[...values, id]
		)

		if (!rows.length) {
			return c.json({ error: '분석을 찾을 수 없습니다.' }, 404)
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[Analyses] Update error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /:id/complete
 * 분석 완료 (점수 저장 + 상태 변경)
 */
app.post('/:id/complete', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json()
		const { total_score, score_breakdown } = body

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE analyses SET
				status = 'completed',
				total_score = $1,
				score_breakdown = $2::jsonb,
				completed_at = NOW(),
				updated_at = NOW()
			 WHERE id = $3 RETURNING *`,
			[total_score, JSON.stringify(score_breakdown), id]
		)

		if (!rows.length) {
			return c.json({ error: '분석을 찾을 수 없습니다.' }, 404)
		}

		// 분석 완료 → 고객에게 이메일 알림 (non-blocking)
		const analysis = rows[0] as Record<string, unknown>
		if (analysis.customer_email) {
			try {
				await sendQuoteCompletedEmail(
					c.env,
					String(analysis.customer_email),
					String(analysis.id),
					String(analysis.customer_name || '고객')
				)
			} catch (emailErr) {
				console.error('[Analyses] Failed to send completion email:', emailErr)
			}
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[Analyses] Complete error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /:id/calculate-score
 * 서버에서 점수 재계산 (저장하지 않고 결과만 반환)
 * Frontend ScoreTab에서 사용 — Single Source of Truth
 */
app.post('/:id/calculate-score', async (c) => {
	try {
		const id = c.req.param('id')

		const analysis = await findOne(
			c.env.DATABASE_URL,
			'SELECT property_size_sqm, contractor_license_verified FROM analyses WHERE id = $1',
			[id]
		) as Record<string, unknown> | null
		if (!analysis) {
			return c.json({ error: '분석을 찾을 수 없습니다.' }, 404)
		}

		const items = await findMany(
			c.env.DATABASE_URL,
			`SELECT std_category, std_item, original_quantity, original_unit,
				original_unit_price, original_total_price, deviation_percent,
				is_bundled, unit_mismatch, margin_rate, margin_bracket
			 FROM analysis_items WHERE analysis_id = $1`,
			[id]
		)

		const breakdown = calculateScoreFromItems({
			items: items as any[],
			propertySizeSqm: analysis.property_size_sqm as number | null,
			hasLicense: analysis.contractor_license_verified as boolean | null,
		})

		return c.json({ data: breakdown })
	} catch (error) {
		console.error('[Analyses] Calculate score error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

// ============================================
// 아이템 CRUD
// ============================================

/**
 * GET /:id/items
 */
app.get('/:id/items', async (c) => {
	try {
		const analysisId = c.req.param('id')
		const items = await findMany(
			c.env.DATABASE_URL,
			'SELECT * FROM analysis_items WHERE analysis_id = $1 ORDER BY sort_order, created_at',
			[analysisId]
		)
		return c.json({ data: items })
	} catch (error) {
		console.error('[Analyses] Items list error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /:id/items
 * 아이템 추가
 */
app.post('/:id/items', async (c) => {
	try {
		const analysisId = c.req.param('id')
		const body = await c.req.json()

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO analysis_items (
				analysis_id, original_category, original_item_name,
				original_quantity, original_unit, original_unit_price, original_total_price,
				original_notes, std_category, std_item, sub_category,
				attributes, is_bundled, components, debundling_logic,
				correction_reason_code, success_reason_code, confidence,
				reviewed_by, reviewer_confidence, error_type,
				benchmark_price_id, benchmark_unit_price, adjusted_benchmark_price,
				adjustment_factors, deviation_percent, deviation_bracket,
				is_vat_override, vat_adjusted_price, sort_order
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
				$12::jsonb, $13, $14::jsonb, $15,
				$16, $17, $18, $19, $20, $21,
				$22, $23, $24, $25::jsonb, $26, $27,
				$28, $29, $30
			) RETURNING *`,
			[
				analysisId,
				body.original_category || null,
				body.original_item_name || null,
				body.original_quantity ?? null,
				body.original_unit || null,
				body.original_unit_price ?? null,
				body.original_total_price ?? null,
				body.original_notes || null,
				body.std_category || null,
				body.std_item || null,
				body.sub_category || null,
				JSON.stringify(body.attributes || {}),
				body.is_bundled || false,
				JSON.stringify(body.components || []),
				body.debundling_logic || null,
				body.correction_reason_code || null,
				body.success_reason_code || null,
				body.confidence ?? 0.5,
				body.reviewed_by || null,
				body.reviewer_confidence ?? null,
				body.error_type || null,
				body.benchmark_price_id || null,
				body.benchmark_unit_price ?? null,
				body.adjusted_benchmark_price ?? null,
				JSON.stringify(body.adjustment_factors || {}),
				body.deviation_percent ?? null,
				body.deviation_bracket || null,
				body.is_vat_override || false,
				body.vat_adjusted_price ?? null,
				body.sort_order ?? 0,
			]
		)

		return c.json({ success: true, data: rows[0] }, 201)
	} catch (error) {
		console.error('[Analyses] Item create error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id/items/:itemId
 * 아이템 수정
 */
app.put('/:id/items/:itemId', async (c) => {
	try {
		const itemId = c.req.param('itemId')
		const body = await c.req.json()

		const allowed = [
			'original_category', 'original_item_name', 'original_quantity', 'original_unit',
			'original_unit_price', 'original_total_price', 'original_notes',
			'std_category', 'std_item', 'sub_category',
			'attributes', 'is_bundled', 'components', 'debundling_logic',
			'correction_reason_code', 'success_reason_code', 'confidence',
			'reviewed_by', 'reviewer_confidence', 'error_type',
			'benchmark_price_id', 'benchmark_unit_price', 'adjusted_benchmark_price',
			'adjustment_factors', 'deviation_percent', 'deviation_bracket',
			'is_vat_override', 'vat_adjusted_price', 'sort_order'
		]

		const jsonbFields = ['attributes', 'components', 'adjustment_factors']

		const updates: string[] = []
		const values: unknown[] = []
		let idx = 1

		for (const key of allowed) {
			if (body[key] !== undefined) {
				if (jsonbFields.includes(key)) {
					updates.push(`${key} = $${idx++}::jsonb`)
					values.push(JSON.stringify(body[key]))
				} else {
					updates.push(`${key} = $${idx++}`)
					values.push(body[key])
				}
			}
		}

		if (updates.length === 0) {
			return c.json({ error: '업데이트할 필드가 없습니다.' }, 400)
		}

		updates.push(`updated_at = NOW()`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE analysis_items SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
			[...values, itemId]
		)

		if (!rows.length) {
			return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[Analyses] Item update error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * DELETE /:id/items/:itemId
 */
app.delete('/:id/items/:itemId', async (c) => {
	try {
		const itemId = c.req.param('itemId')
		const rows = await query(
			c.env.DATABASE_URL,
			'DELETE FROM analysis_items WHERE id = $1 RETURNING id',
			[itemId]
		)
		if (!rows.length) {
			return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)
		}
		return c.json({ success: true })
	} catch (error) {
		console.error('[Analyses] Item delete error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /:id/items/bulk
 * 파싱된 항목 일괄 임포트 (quote_request items → analysis_items)
 */
app.post('/:id/items/bulk', async (c) => {
	try {
		const analysisId = c.req.param('id')
		const { items } = await c.req.json<{ items: Array<Record<string, unknown>> }>()

		if (!items?.length) {
			return c.json({ error: '항목이 비어있습니다.' }, 400)
		}

		const inserted: unknown[] = []
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			const rows = await query(
				c.env.DATABASE_URL,
				`INSERT INTO analysis_items (
					analysis_id, original_category, original_item_name,
					original_quantity, original_unit, original_unit_price, original_total_price,
					original_notes, sort_order
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
				[
					analysisId,
					item.category || null,
					item.itemName || item.item_name || null,
					item.quantity ?? null,
					item.unit || null,
					item.unitPrice ?? item.unit_price ?? null,
					item.totalPrice ?? item.total_price ?? null,
					item.notes || null,
					i,
				]
			)
			if (rows[0]) inserted.push(rows[0])
		}

		return c.json({ success: true, data: inserted, count: inserted.length }, 201)
	} catch (error) {
		console.error('[Analyses] Bulk import error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

// ============================================
// Decision Logs
// ============================================

/**
 * GET /:id/decisions
 */
app.get('/:id/decisions', async (c) => {
	try {
		const analysisId = c.req.param('id')
		const rows = await findMany(
			c.env.DATABASE_URL,
			'SELECT * FROM decision_logs WHERE analysis_id = $1 ORDER BY created_at DESC',
			[analysisId]
		)
		return c.json({ data: rows })
	} catch (error) {
		console.error('[Analyses] Decisions list error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /:id/decisions
 */
app.post('/:id/decisions', async (c) => {
	try {
		const analysisId = c.req.param('id')
		const body = await c.req.json()

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO decision_logs (
				analysis_id, item_id, dispute_type, dispute_description,
				resolution, resolved_by, resolution_reasoning, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
			[
				analysisId,
				body.item_id || null,
				body.dispute_type,
				body.dispute_description,
				body.resolution || null,
				body.resolved_by || null,
				body.resolution_reasoning || null,
				body.status || 'open',
			]
		)

		return c.json({ success: true, data: rows[0] }, 201)
	} catch (error) {
		console.error('[Analyses] Decision create error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

export default app
