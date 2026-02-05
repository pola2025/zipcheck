/**
 * Admin endpoints for Benchmark Prices
 * Mount: /api/admin/benchmarks
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { query, findOne, findMany } from '../../lib/db'
import { authenticateToken, requireAdmin } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

/**
 * GET /
 * 벤치마크 단가 목록 (카테고리/등급/검색 필터)
 */
app.get('/', async (c) => {
	try {
		const category = c.req.query('category')
		const grade = c.req.query('grade')
		const search = c.req.query('search')
		const activeOnly = c.req.query('active') !== 'false'
		const page = parseInt(c.req.query('page') || '1')
		const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200)
		const offset = (page - 1) * limit

		let where = 'WHERE 1=1'
		const params: unknown[] = []
		let idx = 1

		if (activeOnly) {
			where += ` AND is_active = true`
		}
		if (category) {
			where += ` AND std_category = $${idx++}`
			params.push(category)
		}
		if (grade) {
			where += ` AND grade = $${idx++}`
			params.push(grade)
		}
		if (search) {
			where += ` AND (std_item ILIKE $${idx} OR brand ILIKE $${idx} OR material ILIKE $${idx})`
			params.push(`%${search}%`)
			idx++
		}

		const countResult = await query(
			c.env.DATABASE_URL,
			`SELECT COUNT(*) as total FROM benchmark_prices ${where}`,
			params
		)
		const total = parseInt(String(countResult[0]?.total || '0'))

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM benchmark_prices ${where}
			 ORDER BY std_category, std_item, grade
			 LIMIT $${idx++} OFFSET $${idx++}`,
			[...params, limit, offset]
		)

		return c.json({
			data: rows,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
		})
	} catch (error) {
		console.error('[Benchmarks] List error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /
 * 벤치마크 단가 추가
 */
app.post('/', async (c) => {
	try {
		const body = await c.req.json()

		if (!body.std_category || !body.std_item || !body.unit_price || !body.unit) {
			return c.json({ error: '카테고리, 항목명, 단가, 단위는 필수입니다.' }, 400)
		}

		const rows = await query(
			c.env.DATABASE_URL,
			`INSERT INTO benchmark_prices (
				std_category, std_item, sub_category, unit_price, unit, grade,
				brand, model, material, thickness, source, region, reference_date, is_active
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
			[
				body.std_category,
				body.std_item,
				body.sub_category || null,
				body.unit_price,
				body.unit,
				body.grade || '중급',
				body.brand || null,
				body.model || null,
				body.material || null,
				body.thickness || null,
				body.source || null,
				body.region || '서울',
				body.reference_date || null,
				body.is_active !== false,
			]
		)

		return c.json({ success: true, data: rows[0] }, 201)
	} catch (error) {
		console.error('[Benchmarks] Create error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /seed
 * 벤치마크 초기 시드 데이터 삽입 (이미 데이터 있으면 스킵)
 */
app.post('/seed', async (c) => {
	try {
		const existing = await query(
			c.env.DATABASE_URL,
			'SELECT COUNT(*) as total FROM benchmark_prices',
			[]
		)
		const existingCount = parseInt(String(existing[0]?.total || '0'))
		const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
		const force = body.force === true

		if (existingCount > 0 && !force) {
			return c.json({ message: `이미 ${existingCount}건의 벤치마크 데이터가 있습니다. force: true로 추가 삽입 가능.`, skipped: true, count: existingCount })
		}

		// force 모드: 기존 데이터에 없는 카테고리만 삽입
		let existingCategories = new Set<string>()
		if (existingCount > 0) {
			const catRows = await query(c.env.DATABASE_URL, 'SELECT DISTINCT std_category FROM benchmark_prices', [])
			existingCategories = new Set(catRows.map((r: Record<string, unknown>) => String(r.std_category)))
		}

		const allSeeds = getSeedData()
		const seeds = existingCategories.size > 0
			? allSeeds.filter(s => !existingCategories.has(s.std_category))
			: allSeeds

		if (seeds.length === 0) {
			return c.json({ message: '모든 카테고리 시드 데이터가 이미 존재합니다.', skipped: true, count: existingCount })
		}

		// 배치 INSERT (Cloudflare Workers 서브리퀘스트 제한 회피)
		const BATCH_SIZE = 20
		let inserted = 0

		for (let b = 0; b < seeds.length; b += BATCH_SIZE) {
			const batch = seeds.slice(b, b + BATCH_SIZE)
			const placeholders: string[] = []
			const values: unknown[] = []
			let idx = 1

			for (const s of batch) {
				placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, true)`)
				values.push(
					s.std_category, s.std_item, s.sub_category || null,
					s.unit_price, s.unit, s.grade,
					s.brand || null, s.material || null,
					s.source || '시장 시세', s.region || '서울', '2026-01-01'
				)
			}

			await query(
				c.env.DATABASE_URL,
				`INSERT INTO benchmark_prices (
					std_category, std_item, sub_category, unit_price, unit, grade,
					brand, material, source, region, reference_date, is_active
				) VALUES ${placeholders.join(', ')}`,
				values
			)
			inserted += batch.length
		}

		return c.json({ success: true, inserted, message: `${inserted}건 시드 데이터 삽입 완료` }, 201)
	} catch (error) {
		console.error('[Benchmarks] Seed error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * PUT /:id
 */
app.put('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const body = await c.req.json()

		const allowed = [
			'std_category', 'std_item', 'sub_category', 'unit_price', 'unit', 'grade',
			'brand', 'model', 'material', 'thickness', 'source', 'region',
			'reference_date', 'is_active'
		]

		const updates: string[] = []
		const values: unknown[] = []
		let idx = 1

		for (const key of allowed) {
			if (body[key] !== undefined) {
				updates.push(`${key} = $${idx++}`)
				values.push(body[key])
			}
		}

		if (updates.length === 0) {
			return c.json({ error: '업데이트할 필드가 없습니다.' }, 400)
		}

		updates.push(`updated_at = NOW()`)

		const rows = await query(
			c.env.DATABASE_URL,
			`UPDATE benchmark_prices SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
			[...values, id]
		)

		if (!rows.length) {
			return c.json({ error: '벤치마크를 찾을 수 없습니다.' }, 404)
		}

		return c.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('[Benchmarks] Update error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * DELETE /:id
 */
app.delete('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const rows = await query(
			c.env.DATABASE_URL,
			'DELETE FROM benchmark_prices WHERE id = $1 RETURNING id',
			[id]
		)
		if (!rows.length) {
			return c.json({ error: '벤치마크를 찾을 수 없습니다.' }, 404)
		}
		return c.json({ success: true })
	} catch (error) {
		console.error('[Benchmarks] Delete error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

/**
 * POST /search
 * Feature 가중 벤치마크 검색
 */
app.post('/search', async (c) => {
	try {
		const body = await c.req.json()
		const { std_category, std_item, grade, brand, material } = body

		let where = 'WHERE is_active = true'
		const params: unknown[] = []
		let idx = 1

		if (std_category) {
			where += ` AND std_category = $${idx++}`
			params.push(std_category)
		}
		if (std_item) {
			where += ` AND std_item ILIKE $${idx++}`
			params.push(`%${std_item}%`)
		}
		if (grade) {
			where += ` AND grade = $${idx++}`
			params.push(grade)
		}
		if (brand) {
			where += ` AND brand ILIKE $${idx++}`
			params.push(`%${brand}%`)
		}
		if (material) {
			where += ` AND material ILIKE $${idx++}`
			params.push(`%${material}%`)
		}

		const rows = await findMany(
			c.env.DATABASE_URL,
			`SELECT * FROM benchmark_prices ${where}
			 ORDER BY std_category, std_item, grade
			 LIMIT 20`,
			params
		)

		return c.json({ data: rows })
	} catch (error) {
		console.error('[Benchmarks] Search error:', error)
		return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
	}
})

// ============================================
// 시드 데이터 (10개 카테고리 × 등급별 시세)
// ============================================

interface SeedItem {
	std_category: string
	std_item: string
	sub_category?: string
	unit_price: number
	unit: string
	grade: string
	brand?: string
	material?: string
	source?: string
	region?: string
}

function getSeedData(): SeedItem[] {
	return [
		// ─── 욕실 ───
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 45000, unit: '㎡', grade: '가성비', material: '도기질' },
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 65000, unit: '㎡', grade: '중급', material: '자기질' },
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 95000, unit: '㎡', grade: '고급', material: '포세린' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 40000, unit: '㎡', grade: '가성비', material: '도기질' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 60000, unit: '㎡', grade: '중급', material: '자기질' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 85000, unit: '㎡', grade: '고급', material: '포세린' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 180000, unit: '개', grade: '가성비' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 350000, unit: '개', grade: '중급', brand: '대림바스' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 650000, unit: '개', grade: '고급', brand: 'TOTO' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 200000, unit: '개', grade: '가성비' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 400000, unit: '개', grade: '중급', brand: '대림바스' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 800000, unit: '개', grade: '고급', brand: 'TOTO' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 1500000, unit: '개', grade: '프리미엄', brand: 'TOTO 비데일체형' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 120000, unit: '세트', grade: '가성비' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 250000, unit: '세트', grade: '중급', brand: '대림바스' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 450000, unit: '세트', grade: '고급', brand: '한스그로에' },
		{ std_category: '욕실', std_item: '방수 공사', sub_category: '방수', unit_price: 30000, unit: '㎡', grade: '중급', material: '액체방수' },
		{ std_category: '욕실', std_item: '욕조', sub_category: '위생도기', unit_price: 350000, unit: '개', grade: '중급', material: 'FRP' },
		{ std_category: '욕실', std_item: '욕조', sub_category: '위생도기', unit_price: 1200000, unit: '개', grade: '고급', material: '주철' },

		// ─── 바닥 ───
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 35000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 50000, unit: '㎡', grade: '중급', brand: 'LG하우시스' },
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 75000, unit: '㎡', grade: '고급', brand: 'LG하우시스' },
		{ std_category: '바닥', std_item: '강화마루', sub_category: '마루', unit_price: 25000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '강화마루', sub_category: '마루', unit_price: 38000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '원목마루', sub_category: '마루', unit_price: 90000, unit: '㎡', grade: '고급', material: '오크' },
		{ std_category: '바닥', std_item: '원목마루', sub_category: '마루', unit_price: 150000, unit: '㎡', grade: '프리미엄', material: '월넛' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 50000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 75000, unit: '㎡', grade: '중급', material: '포세린' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 120000, unit: '㎡', grade: '고급', material: '대리석' },
		{ std_category: '바닥', std_item: '장판', sub_category: '장판', unit_price: 15000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '장판', sub_category: '장판', unit_price: 25000, unit: '㎡', grade: '중급', brand: 'LG하우시스' },

		// ─── 가구 ───
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 350000, unit: '칸', grade: '가성비', material: 'PB' },
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 550000, unit: '칸', grade: '중급', material: 'MDF' },
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 850000, unit: '칸', grade: '고급', material: '원목' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 450000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 750000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 1200000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '드레스룸', sub_category: '수납', unit_price: 900000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '드레스룸', sub_category: '수납', unit_price: 2000000, unit: '식', grade: '고급' },

		// ─── 목공 ───
		{ std_category: '목공', std_item: '걸레받이', sub_category: '마감재', unit_price: 8000, unit: 'm', grade: '가성비', material: 'PVC' },
		{ std_category: '목공', std_item: '걸레받이', sub_category: '마감재', unit_price: 12000, unit: 'm', grade: '중급', material: 'MDF' },
		{ std_category: '목공', std_item: '몰딩', sub_category: '마감재', unit_price: 10000, unit: 'm', grade: '가성비' },
		{ std_category: '목공', std_item: '몰딩', sub_category: '마감재', unit_price: 18000, unit: 'm', grade: '중급' },
		{ std_category: '목공', std_item: '문틀', sub_category: '문', unit_price: 120000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '문틀', sub_category: '문', unit_price: 180000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 650000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 1000000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 1500000, unit: '개', grade: '고급', material: '하이폴딩' },
		{ std_category: '목공', std_item: '천장 틀 작업', sub_category: '천장', unit_price: 25000, unit: '㎡', grade: '중급' },

		// ─── 전기 ───
		{ std_category: '전기', std_item: '콘센트 교체', sub_category: '콘센트', unit_price: 30000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '콘센트 교체', sub_category: '콘센트', unit_price: 45000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '스위치 교체', sub_category: '스위치', unit_price: 25000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '스위치 교체', sub_category: '스위치', unit_price: 40000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 60000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 120000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 250000, unit: '개', grade: '고급' },
		{ std_category: '전기', std_item: '분전반 교체', sub_category: '분전반', unit_price: 180000, unit: '식', grade: '가성비' },
		{ std_category: '전기', std_item: '분전반 교체', sub_category: '분전반', unit_price: 280000, unit: '식', grade: '중급' },
		{ std_category: '전기', std_item: '전선 교체', sub_category: '배선', unit_price: 15000, unit: 'm', grade: '중급' },

		// ─── 도배 ───
		{ std_category: '도배', std_item: '합지 도배', sub_category: '벽지', unit_price: 3500, unit: '㎡', grade: '가성비', material: '합지' },
		{ std_category: '도배', std_item: '합지 도배', sub_category: '벽지', unit_price: 5000, unit: '㎡', grade: '중급', material: '합지' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 6000, unit: '㎡', grade: '중급', material: '실크' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 9000, unit: '㎡', grade: '고급', material: '실크' },
		{ std_category: '도배', std_item: '천연 벽지', sub_category: '벽지', unit_price: 15000, unit: '㎡', grade: '고급', material: '천연소재' },
		{ std_category: '도배', std_item: '천연 벽지', sub_category: '벽지', unit_price: 25000, unit: '㎡', grade: '프리미엄', material: '규조토' },
		{ std_category: '도배', std_item: '천장 도배', sub_category: '천장', unit_price: 4000, unit: '㎡', grade: '중급' },

		// ─── 철거 ───
		{ std_category: '철거', std_item: '바닥 철거', sub_category: '바닥', unit_price: 18000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '벽체 철거', sub_category: '벽', unit_price: 25000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '욕실 철거', sub_category: '욕실', unit_price: 400000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '주방 철거', sub_category: '주방', unit_price: 300000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '폐기물 반출', sub_category: '폐기물', unit_price: 70000, unit: '톤', grade: '중급' },
		{ std_category: '철거', std_item: '도배 철거', sub_category: '벽', unit_price: 5000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '마루 철거', sub_category: '바닥', unit_price: 12000, unit: '㎡', grade: '중급' },

		// ─── 주방 ───
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 200000, unit: 'm', grade: '가성비', material: '인조대리석' },
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 350000, unit: 'm', grade: '중급', material: '엔지니어드스톤' },
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 550000, unit: 'm', grade: '고급', material: '천연대리석' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 300000, unit: 'm', grade: '가성비' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 500000, unit: 'm', grade: '중급' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 800000, unit: 'm', grade: '고급' },
		{ std_category: '주방', std_item: '상부장', sub_category: '싱크대', unit_price: 220000, unit: 'm', grade: '가성비' },
		{ std_category: '주방', std_item: '상부장', sub_category: '싱크대', unit_price: 380000, unit: 'm', grade: '중급' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 350000, unit: '개', grade: '가성비' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 550000, unit: '개', grade: '중급' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 900000, unit: '개', grade: '고급' },

		// ─── 창호 ───
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 180000, unit: '㎡', grade: '가성비' },
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 300000, unit: '㎡', grade: '중급', brand: 'KCC' },
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 450000, unit: '㎡', grade: '고급', brand: 'LG하우시스' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 120000, unit: '개', grade: '가성비' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 200000, unit: '개', grade: '중급' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 350000, unit: '개', grade: '고급' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 350000, unit: '개', grade: '가성비' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 600000, unit: '개', grade: '중급' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 1000000, unit: '개', grade: '고급' },

		// ─── 페인트 ───
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 5000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 8000, unit: '㎡', grade: '중급', brand: '벤자민무어' },
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 13000, unit: '㎡', grade: '고급', brand: '파로스앤보로' },
		{ std_category: '페인트', std_item: '천장 페인트', sub_category: '천장', unit_price: 5000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '천장 페인트', sub_category: '천장', unit_price: 7000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '에폭시', sub_category: '바닥', unit_price: 18000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '에폭시', sub_category: '바닥', unit_price: 28000, unit: '㎡', grade: '고급' },
	]
}

export default app
