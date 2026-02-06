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
		// ─── 욕실 (기존 19 + 신규 15 = 34) ───
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 45000, unit: '㎡', grade: '가성비', material: '도기질' },
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 65000, unit: '㎡', grade: '중급', material: '자기질' },
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 95000, unit: '㎡', grade: '고급', material: '포세린' },
		{ std_category: '욕실', std_item: '바닥 타일', sub_category: '타일', unit_price: 155000, unit: '㎡', grade: '프리미엄', material: '이탈리안 대리석' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 40000, unit: '㎡', grade: '가성비', material: '도기질' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 60000, unit: '㎡', grade: '중급', material: '자기질' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 85000, unit: '㎡', grade: '고급', material: '포세린' },
		{ std_category: '욕실', std_item: '벽 타일', sub_category: '타일', unit_price: 140000, unit: '㎡', grade: '프리미엄', material: '수입 모자이크' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 180000, unit: '개', grade: '가성비' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 350000, unit: '개', grade: '중급', brand: '대림바스' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 650000, unit: '개', grade: '고급', brand: 'TOTO' },
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 1200000, unit: '개', grade: '프리미엄', brand: '듀라빗' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 200000, unit: '개', grade: '가성비' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 400000, unit: '개', grade: '중급', brand: '대림바스' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 800000, unit: '개', grade: '고급', brand: 'TOTO' },
		{ std_category: '욕실', std_item: '양변기', sub_category: '위생도기', unit_price: 1500000, unit: '개', grade: '프리미엄', brand: 'TOTO 비데일체형' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 120000, unit: '세트', grade: '가성비' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 250000, unit: '세트', grade: '중급', brand: '대림바스' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 450000, unit: '세트', grade: '고급', brand: '한스그로에' },
		{ std_category: '욕실', std_item: '수전', sub_category: '수전금구', unit_price: 850000, unit: '세트', grade: '프리미엄', brand: '그로에 레인샤워' },
		{ std_category: '욕실', std_item: '방수 공사', sub_category: '방수', unit_price: 20000, unit: '㎡', grade: '가성비', material: '시트방수' },
		{ std_category: '욕실', std_item: '방수 공사', sub_category: '방수', unit_price: 30000, unit: '㎡', grade: '중급', material: '액체방수' },
		{ std_category: '욕실', std_item: '방수 공사', sub_category: '방수', unit_price: 45000, unit: '㎡', grade: '고급', material: '우레탄방수' },
		{ std_category: '욕실', std_item: '욕조', sub_category: '위생도기', unit_price: 200000, unit: '개', grade: '가성비', material: 'ABS' },
		{ std_category: '욕실', std_item: '욕조', sub_category: '위생도기', unit_price: 350000, unit: '개', grade: '중급', material: 'FRP' },
		{ std_category: '욕실', std_item: '욕조', sub_category: '위생도기', unit_price: 1200000, unit: '개', grade: '고급', material: '주철' },
		{ std_category: '욕실', std_item: '욕조', sub_category: '위생도기', unit_price: 2500000, unit: '개', grade: '프리미엄', material: '인조대리석 독립형' },
		// 욕실 신규 아이템
		{ std_category: '욕실', std_item: '샤워부스', sub_category: '샤워', unit_price: 350000, unit: '식', grade: '가성비', material: '강화유리' },
		{ std_category: '욕실', std_item: '샤워부스', sub_category: '샤워', unit_price: 650000, unit: '식', grade: '중급', material: '강화유리 프레임' },
		{ std_category: '욕실', std_item: '샤워부스', sub_category: '샤워', unit_price: 1100000, unit: '식', grade: '고급', material: '프레임리스' },
		{ std_category: '욕실', std_item: '욕실 수납장', sub_category: '수납', unit_price: 150000, unit: '식', grade: '가성비' },
		{ std_category: '욕실', std_item: '욕실 수납장', sub_category: '수납', unit_price: 300000, unit: '식', grade: '중급' },
		{ std_category: '욕실', std_item: '욕실 수납장', sub_category: '수납', unit_price: 550000, unit: '식', grade: '고급' },
		{ std_category: '욕실', std_item: 'LED미러', sub_category: '거울', unit_price: 80000, unit: '개', grade: '가성비' },
		{ std_category: '욕실', std_item: 'LED미러', sub_category: '거울', unit_price: 180000, unit: '개', grade: '중급' },
		{ std_category: '욕실', std_item: 'LED미러', sub_category: '거울', unit_price: 350000, unit: '개', grade: '고급', brand: '듀라빗' },

		// ─── 바닥 (기존 12 + 신규 15 = 27) ───
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 35000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 50000, unit: '㎡', grade: '중급', brand: 'LG하우시스' },
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 75000, unit: '㎡', grade: '고급', brand: 'LG하우시스' },
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 110000, unit: '㎡', grade: '프리미엄', brand: '한화L&C' },
		{ std_category: '바닥', std_item: '강화마루', sub_category: '마루', unit_price: 25000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '강화마루', sub_category: '마루', unit_price: 38000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '강화마루', sub_category: '마루', unit_price: 55000, unit: '㎡', grade: '고급', brand: '크로노텍스' },
		{ std_category: '바닥', std_item: '강화마루', sub_category: '마루', unit_price: 85000, unit: '㎡', grade: '프리미엄', brand: '퀵스텝' },
		{ std_category: '바닥', std_item: '원목마루', sub_category: '마루', unit_price: 65000, unit: '㎡', grade: '중급', material: '멀바우' },
		{ std_category: '바닥', std_item: '원목마루', sub_category: '마루', unit_price: 90000, unit: '㎡', grade: '고급', material: '오크' },
		{ std_category: '바닥', std_item: '원목마루', sub_category: '마루', unit_price: 150000, unit: '㎡', grade: '프리미엄', material: '월넛' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 50000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 75000, unit: '㎡', grade: '중급', material: '포세린' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 120000, unit: '㎡', grade: '고급', material: '대리석' },
		{ std_category: '바닥', std_item: '타일', sub_category: '타일', unit_price: 200000, unit: '㎡', grade: '프리미엄', material: '수입 대리석' },
		{ std_category: '바닥', std_item: '장판', sub_category: '장판', unit_price: 15000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '장판', sub_category: '장판', unit_price: 25000, unit: '㎡', grade: '중급', brand: 'LG하우시스' },
		{ std_category: '바닥', std_item: '장판', sub_category: '장판', unit_price: 38000, unit: '㎡', grade: '고급', brand: 'LG하우시스 모노륨' },
		// 바닥 신규 아이템
		{ std_category: '바닥', std_item: '데코타일', sub_category: '타일', unit_price: 18000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '데코타일', sub_category: '타일', unit_price: 30000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '데코타일', sub_category: '타일', unit_price: 48000, unit: '㎡', grade: '고급', brand: 'LG하우시스' },
		{ std_category: '바닥', std_item: '마이크로시멘트', sub_category: '특수마감', unit_price: 80000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '마이크로시멘트', sub_category: '특수마감', unit_price: 120000, unit: '㎡', grade: '고급' },
		{ std_category: '바닥', std_item: '마이크로시멘트', sub_category: '특수마감', unit_price: 180000, unit: '㎡', grade: '프리미엄' },
		{ std_category: '바닥', std_item: '헤링본마루', sub_category: '마루', unit_price: 65000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '헤링본마루', sub_category: '마루', unit_price: 100000, unit: '㎡', grade: '고급', material: '오크' },
		{ std_category: '바닥', std_item: '헤링본마루', sub_category: '마루', unit_price: 160000, unit: '㎡', grade: '프리미엄', material: '월넛' },

		// ─── 가구 (기존 8 + 신규 17 = 25) ───
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 350000, unit: '칸', grade: '가성비', material: 'PB' },
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 550000, unit: '칸', grade: '중급', material: 'MDF' },
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 850000, unit: '칸', grade: '고급', material: '원목' },
		{ std_category: '가구', std_item: '붙박이장', sub_category: '수납', unit_price: 1300000, unit: '칸', grade: '프리미엄', material: '원목 무절' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 450000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 750000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 1200000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '신발장', sub_category: '수납', unit_price: 1800000, unit: '식', grade: '프리미엄' },
		{ std_category: '가구', std_item: '드레스룸', sub_category: '수납', unit_price: 600000, unit: '식', grade: '가성비', material: 'PB' },
		{ std_category: '가구', std_item: '드레스룸', sub_category: '수납', unit_price: 900000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '드레스룸', sub_category: '수납', unit_price: 2000000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '드레스룸', sub_category: '수납', unit_price: 3500000, unit: '식', grade: '프리미엄', material: '원목 시스템' },
		// 가구 신규 아이템
		{ std_category: '가구', std_item: '화장대', sub_category: '가구', unit_price: 300000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: '화장대', sub_category: '가구', unit_price: 550000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '화장대', sub_category: '가구', unit_price: 900000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '화장대', sub_category: '가구', unit_price: 1500000, unit: '식', grade: '프리미엄', material: '원목' },
		{ std_category: '가구', std_item: '팬트리장', sub_category: '수납', unit_price: 400000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: '팬트리장', sub_category: '수납', unit_price: 700000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '팬트리장', sub_category: '수납', unit_price: 1100000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '팬트리장', sub_category: '수납', unit_price: 1800000, unit: '식', grade: '프리미엄' },
		{ std_category: '가구', std_item: 'TV장', sub_category: '가구', unit_price: 350000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: 'TV장', sub_category: '가구', unit_price: 600000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: 'TV장', sub_category: '가구', unit_price: 1000000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: 'TV장', sub_category: '가구', unit_price: 1600000, unit: '식', grade: '프리미엄', material: '원목' },

		// ─── 목공 (기존 10 + 신규 20 = 30) ───
		{ std_category: '목공', std_item: '걸레받이', sub_category: '마감재', unit_price: 8000, unit: 'm', grade: '가성비', material: 'PVC' },
		{ std_category: '목공', std_item: '걸레받이', sub_category: '마감재', unit_price: 12000, unit: 'm', grade: '중급', material: 'MDF' },
		{ std_category: '목공', std_item: '걸레받이', sub_category: '마감재', unit_price: 18000, unit: 'm', grade: '고급', material: '원목' },
		{ std_category: '목공', std_item: '몰딩', sub_category: '마감재', unit_price: 10000, unit: 'm', grade: '가성비' },
		{ std_category: '목공', std_item: '몰딩', sub_category: '마감재', unit_price: 18000, unit: 'm', grade: '중급' },
		{ std_category: '목공', std_item: '몰딩', sub_category: '마감재', unit_price: 28000, unit: 'm', grade: '고급', material: '원목' },
		{ std_category: '목공', std_item: '문틀', sub_category: '문', unit_price: 120000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '문틀', sub_category: '문', unit_price: 180000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '문틀', sub_category: '문', unit_price: 270000, unit: '개', grade: '고급', material: '원목' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 650000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 1000000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 1500000, unit: '개', grade: '고급', material: '하이폴딩' },
		{ std_category: '목공', std_item: '중문', sub_category: '문', unit_price: 2200000, unit: '개', grade: '프리미엄', material: '3연동 하이폴딩' },
		{ std_category: '목공', std_item: '천장 틀 작업', sub_category: '천장', unit_price: 17000, unit: '㎡', grade: '가성비' },
		{ std_category: '목공', std_item: '천장 틀 작업', sub_category: '천장', unit_price: 25000, unit: '㎡', grade: '중급' },
		{ std_category: '목공', std_item: '천장 틀 작업', sub_category: '천장', unit_price: 38000, unit: '㎡', grade: '고급' },
		// 목공 신규 아이템
		{ std_category: '목공', std_item: '우물천장', sub_category: '천장', unit_price: 35000, unit: '㎡', grade: '가성비' },
		{ std_category: '목공', std_item: '우물천장', sub_category: '천장', unit_price: 55000, unit: '㎡', grade: '중급' },
		{ std_category: '목공', std_item: '우물천장', sub_category: '천장', unit_price: 85000, unit: '㎡', grade: '고급' },
		{ std_category: '목공', std_item: '우물천장', sub_category: '천장', unit_price: 130000, unit: '㎡', grade: '프리미엄' },
		{ std_category: '목공', std_item: '아트월', sub_category: '벽면', unit_price: 250000, unit: '식', grade: '가성비' },
		{ std_category: '목공', std_item: '아트월', sub_category: '벽면', unit_price: 450000, unit: '식', grade: '중급' },
		{ std_category: '목공', std_item: '아트월', sub_category: '벽면', unit_price: 750000, unit: '식', grade: '고급' },
		{ std_category: '목공', std_item: '아트월', sub_category: '벽면', unit_price: 1200000, unit: '식', grade: '프리미엄', material: '천연석 마감' },
		{ std_category: '목공', std_item: '선반', sub_category: '수납', unit_price: 30000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '선반', sub_category: '수납', unit_price: 55000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '선반', sub_category: '수납', unit_price: 90000, unit: '개', grade: '고급', material: '원목' },
		{ std_category: '목공', std_item: '문짝 교체', sub_category: '문', unit_price: 150000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '문짝 교체', sub_category: '문', unit_price: 250000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '문짝 교체', sub_category: '문', unit_price: 400000, unit: '개', grade: '고급' },

		// ─── 전기 (기존 10 + 신규 18 = 28) ───
		{ std_category: '전기', std_item: '콘센트 교체', sub_category: '콘센트', unit_price: 30000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '콘센트 교체', sub_category: '콘센트', unit_price: 45000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '콘센트 교체', sub_category: '콘센트', unit_price: 65000, unit: '개', grade: '고급', brand: '르그랑' },
		{ std_category: '전기', std_item: '콘센트 교체', sub_category: '콘센트', unit_price: 95000, unit: '개', grade: '프리미엄', brand: '르그랑 아델' },
		{ std_category: '전기', std_item: '스위치 교체', sub_category: '스위치', unit_price: 25000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '스위치 교체', sub_category: '스위치', unit_price: 40000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '스위치 교체', sub_category: '스위치', unit_price: 60000, unit: '개', grade: '고급', brand: '르그랑' },
		{ std_category: '전기', std_item: '스위치 교체', sub_category: '스위치', unit_price: 90000, unit: '개', grade: '프리미엄', brand: '르그랑 아델' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 60000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 120000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 250000, unit: '개', grade: '고급' },
		{ std_category: '전기', std_item: '조명 교체', sub_category: '조명', unit_price: 500000, unit: '개', grade: '프리미엄', brand: '루이스폴센' },
		{ std_category: '전기', std_item: '분전반 교체', sub_category: '분전반', unit_price: 180000, unit: '식', grade: '가성비' },
		{ std_category: '전기', std_item: '분전반 교체', sub_category: '분전반', unit_price: 280000, unit: '식', grade: '중급' },
		{ std_category: '전기', std_item: '분전반 교체', sub_category: '분전반', unit_price: 420000, unit: '식', grade: '고급' },
		{ std_category: '전기', std_item: '전선 교체', sub_category: '배선', unit_price: 10000, unit: 'm', grade: '가성비' },
		{ std_category: '전기', std_item: '전선 교체', sub_category: '배선', unit_price: 15000, unit: 'm', grade: '중급' },
		{ std_category: '전기', std_item: '전선 교체', sub_category: '배선', unit_price: 22000, unit: 'm', grade: '고급' },
		// 전기 신규 아이템
		{ std_category: '전기', std_item: 'EV충전기', sub_category: '충전', unit_price: 800000, unit: '식', grade: '가성비' },
		{ std_category: '전기', std_item: 'EV충전기', sub_category: '충전', unit_price: 1300000, unit: '식', grade: '중급' },
		{ std_category: '전기', std_item: 'EV충전기', sub_category: '충전', unit_price: 2000000, unit: '식', grade: '고급' },
		{ std_category: '전기', std_item: '인터폰', sub_category: '통신', unit_price: 150000, unit: '식', grade: '가성비' },
		{ std_category: '전기', std_item: '인터폰', sub_category: '통신', unit_price: 280000, unit: '식', grade: '중급' },
		{ std_category: '전기', std_item: '인터폰', sub_category: '통신', unit_price: 450000, unit: '식', grade: '고급' },
		{ std_category: '전기', std_item: '실링팬', sub_category: '조명', unit_price: 200000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '실링팬', sub_category: '조명', unit_price: 380000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '실링팬', sub_category: '조명', unit_price: 650000, unit: '개', grade: '고급', brand: '헌터' },
		{ std_category: '전기', std_item: '다운라이트', sub_category: '조명', unit_price: 25000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '다운라이트', sub_category: '조명', unit_price: 45000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '다운라이트', sub_category: '조명', unit_price: 80000, unit: '개', grade: '고급' },

		// ─── 도배 (기존 7 + 신규 12 = 19) ───
		{ std_category: '도배', std_item: '합지 도배', sub_category: '벽지', unit_price: 3500, unit: '㎡', grade: '가성비', material: '합지' },
		{ std_category: '도배', std_item: '합지 도배', sub_category: '벽지', unit_price: 5000, unit: '㎡', grade: '중급', material: '합지' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 4500, unit: '㎡', grade: '가성비', material: '실크' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 6000, unit: '㎡', grade: '중급', material: '실크' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 9000, unit: '㎡', grade: '고급', material: '실크' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 14000, unit: '㎡', grade: '프리미엄', material: '수입 실크' },
		{ std_category: '도배', std_item: '천연 벽지', sub_category: '벽지', unit_price: 15000, unit: '㎡', grade: '고급', material: '천연소재' },
		{ std_category: '도배', std_item: '천연 벽지', sub_category: '벽지', unit_price: 25000, unit: '㎡', grade: '프리미엄', material: '규조토' },
		{ std_category: '도배', std_item: '천장 도배', sub_category: '천장', unit_price: 2800, unit: '㎡', grade: '가성비' },
		{ std_category: '도배', std_item: '천장 도배', sub_category: '천장', unit_price: 4000, unit: '㎡', grade: '중급' },
		{ std_category: '도배', std_item: '천장 도배', sub_category: '천장', unit_price: 6000, unit: '㎡', grade: '고급' },
		// 도배 신규 아이템
		{ std_category: '도배', std_item: '포인트벽지', sub_category: '벽지', unit_price: 8000, unit: '㎡', grade: '가성비' },
		{ std_category: '도배', std_item: '포인트벽지', sub_category: '벽지', unit_price: 15000, unit: '㎡', grade: '중급' },
		{ std_category: '도배', std_item: '포인트벽지', sub_category: '벽지', unit_price: 25000, unit: '㎡', grade: '고급' },
		{ std_category: '도배', std_item: '포인트벽지', sub_category: '벽지', unit_price: 45000, unit: '㎡', grade: '프리미엄', material: '수입 벽지' },
		{ std_category: '도배', std_item: '줄눈 보수', sub_category: '보수', unit_price: 3000, unit: 'm', grade: '가성비' },
		{ std_category: '도배', std_item: '줄눈 보수', sub_category: '보수', unit_price: 5000, unit: 'm', grade: '중급' },
		{ std_category: '도배', std_item: '줄눈 보수', sub_category: '보수', unit_price: 8000, unit: 'm', grade: '고급' },

		// ─── 철거 (기존 7 + 신규 29 = 36) ───
		{ std_category: '철거', std_item: '바닥 철거', sub_category: '바닥', unit_price: 12000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '바닥 철거', sub_category: '바닥', unit_price: 18000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '바닥 철거', sub_category: '바닥', unit_price: 26000, unit: '㎡', grade: '고급' },
		{ std_category: '철거', std_item: '벽체 철거', sub_category: '벽', unit_price: 17000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '벽체 철거', sub_category: '벽', unit_price: 25000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '벽체 철거', sub_category: '벽', unit_price: 36000, unit: '㎡', grade: '고급' },
		{ std_category: '철거', std_item: '욕실 철거', sub_category: '욕실', unit_price: 280000, unit: '식', grade: '가성비' },
		{ std_category: '철거', std_item: '욕실 철거', sub_category: '욕실', unit_price: 400000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '욕실 철거', sub_category: '욕실', unit_price: 580000, unit: '식', grade: '고급' },
		{ std_category: '철거', std_item: '주방 철거', sub_category: '주방', unit_price: 200000, unit: '식', grade: '가성비' },
		{ std_category: '철거', std_item: '주방 철거', sub_category: '주방', unit_price: 300000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '주방 철거', sub_category: '주방', unit_price: 440000, unit: '식', grade: '고급' },
		{ std_category: '철거', std_item: '폐기물 반출', sub_category: '폐기물', unit_price: 50000, unit: '톤', grade: '가성비' },
		{ std_category: '철거', std_item: '폐기물 반출', sub_category: '폐기물', unit_price: 70000, unit: '톤', grade: '중급' },
		{ std_category: '철거', std_item: '폐기물 반출', sub_category: '폐기물', unit_price: 100000, unit: '톤', grade: '고급' },
		{ std_category: '철거', std_item: '도배 철거', sub_category: '벽', unit_price: 3500, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '도배 철거', sub_category: '벽', unit_price: 5000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '도배 철거', sub_category: '벽', unit_price: 7500, unit: '㎡', grade: '고급' },
		{ std_category: '철거', std_item: '마루 철거', sub_category: '바닥', unit_price: 8000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '마루 철거', sub_category: '바닥', unit_price: 12000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '마루 철거', sub_category: '바닥', unit_price: 17000, unit: '㎡', grade: '고급' },
		// 철거 신규 아이템
		{ std_category: '철거', std_item: '타일 철거', sub_category: '바닥', unit_price: 12000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '타일 철거', sub_category: '바닥', unit_price: 18000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '타일 철거', sub_category: '바닥', unit_price: 26000, unit: '㎡', grade: '고급' },
		{ std_category: '철거', std_item: '전기설비 철거', sub_category: '전기', unit_price: 120000, unit: '식', grade: '가성비' },
		{ std_category: '철거', std_item: '전기설비 철거', sub_category: '전기', unit_price: 180000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '전기설비 철거', sub_category: '전기', unit_price: 260000, unit: '식', grade: '고급' },
		{ std_category: '철거', std_item: '창호 철거', sub_category: '창호', unit_price: 80000, unit: '식', grade: '가성비' },
		{ std_category: '철거', std_item: '창호 철거', sub_category: '창호', unit_price: 120000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '창호 철거', sub_category: '창호', unit_price: 170000, unit: '식', grade: '고급' },
		{ std_category: '철거', std_item: '천장 철거', sub_category: '천장', unit_price: 10000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '천장 철거', sub_category: '천장', unit_price: 15000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '천장 철거', sub_category: '천장', unit_price: 22000, unit: '㎡', grade: '고급' },
		{ std_category: '철거', std_item: '가구 철거', sub_category: '가구', unit_price: 80000, unit: '식', grade: '가성비' },
		{ std_category: '철거', std_item: '가구 철거', sub_category: '가구', unit_price: 120000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '가구 철거', sub_category: '가구', unit_price: 170000, unit: '식', grade: '고급' },

		// ─── 주방 (기존 11 + 신규 17 = 28) ───
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 200000, unit: 'm', grade: '가성비', material: '인조대리석' },
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 350000, unit: 'm', grade: '중급', material: '엔지니어드스톤' },
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 550000, unit: 'm', grade: '고급', material: '천연대리석' },
		{ std_category: '주방', std_item: '싱크대 상판', sub_category: '싱크대', unit_price: 900000, unit: 'm', grade: '프리미엄', material: '세자르스톤' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 300000, unit: 'm', grade: '가성비' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 500000, unit: 'm', grade: '중급' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 800000, unit: 'm', grade: '고급' },
		{ std_category: '주방', std_item: '하부장', sub_category: '싱크대', unit_price: 1200000, unit: 'm', grade: '프리미엄' },
		{ std_category: '주방', std_item: '상부장', sub_category: '싱크대', unit_price: 220000, unit: 'm', grade: '가성비' },
		{ std_category: '주방', std_item: '상부장', sub_category: '싱크대', unit_price: 380000, unit: 'm', grade: '중급' },
		{ std_category: '주방', std_item: '상부장', sub_category: '싱크대', unit_price: 580000, unit: 'm', grade: '고급' },
		{ std_category: '주방', std_item: '상부장', sub_category: '싱크대', unit_price: 900000, unit: 'm', grade: '프리미엄' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 350000, unit: '개', grade: '가성비' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 550000, unit: '개', grade: '중급' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 900000, unit: '개', grade: '고급' },
		{ std_category: '주방', std_item: '빌트인 후드', sub_category: '가전', unit_price: 1500000, unit: '개', grade: '프리미엄', brand: '밀레' },
		// 주방 신규 아이템
		{ std_category: '주방', std_item: '빌트인 오븐', sub_category: '가전', unit_price: 500000, unit: '개', grade: '가성비' },
		{ std_category: '주방', std_item: '빌트인 오븐', sub_category: '가전', unit_price: 900000, unit: '개', grade: '중급' },
		{ std_category: '주방', std_item: '빌트인 오븐', sub_category: '가전', unit_price: 1500000, unit: '개', grade: '고급', brand: '보쉬' },
		{ std_category: '주방', std_item: '빌트인 오븐', sub_category: '가전', unit_price: 2500000, unit: '개', grade: '프리미엄', brand: '밀레' },
		{ std_category: '주방', std_item: '주방 타일', sub_category: '타일', unit_price: 40000, unit: '㎡', grade: '가성비' },
		{ std_category: '주방', std_item: '주방 타일', sub_category: '타일', unit_price: 65000, unit: '㎡', grade: '중급' },
		{ std_category: '주방', std_item: '주방 타일', sub_category: '타일', unit_price: 100000, unit: '㎡', grade: '고급' },
		{ std_category: '주방', std_item: '주방 타일', sub_category: '타일', unit_price: 160000, unit: '㎡', grade: '프리미엄', material: '수입 서브웨이' },
		{ std_category: '주방', std_item: '아일랜드 식탁', sub_category: '가구', unit_price: 800000, unit: '식', grade: '가성비' },
		{ std_category: '주방', std_item: '아일랜드 식탁', sub_category: '가구', unit_price: 1500000, unit: '식', grade: '중급' },
		{ std_category: '주방', std_item: '아일랜드 식탁', sub_category: '가구', unit_price: 2500000, unit: '식', grade: '고급', material: '엔지니어드스톤' },
		{ std_category: '주방', std_item: '아일랜드 식탁', sub_category: '가구', unit_price: 4000000, unit: '식', grade: '프리미엄', material: '천연대리석' },

		// ─── 창호 (기존 9 + 신규 16 = 25) ───
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 180000, unit: '㎡', grade: '가성비' },
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 300000, unit: '㎡', grade: '중급', brand: 'KCC' },
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 450000, unit: '㎡', grade: '고급', brand: 'LG하우시스' },
		{ std_category: '창호', std_item: '시스템 창호', sub_category: '창', unit_price: 700000, unit: '㎡', grade: '프리미엄', brand: '슈코' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 120000, unit: '개', grade: '가성비' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 200000, unit: '개', grade: '중급' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 350000, unit: '개', grade: '고급' },
		{ std_category: '창호', std_item: '방문', sub_category: '문', unit_price: 550000, unit: '개', grade: '프리미엄', material: '원목' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 350000, unit: '개', grade: '가성비' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 600000, unit: '개', grade: '중급' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 1000000, unit: '개', grade: '고급' },
		{ std_category: '창호', std_item: '현관문', sub_category: '문', unit_price: 1800000, unit: '개', grade: '프리미엄', brand: '예일' },
		// 창호 신규 아이템
		{ std_category: '창호', std_item: '발코니창', sub_category: '창', unit_price: 150000, unit: '㎡', grade: '가성비' },
		{ std_category: '창호', std_item: '발코니창', sub_category: '창', unit_price: 250000, unit: '㎡', grade: '중급' },
		{ std_category: '창호', std_item: '발코니창', sub_category: '창', unit_price: 400000, unit: '㎡', grade: '고급' },
		{ std_category: '창호', std_item: '발코니창', sub_category: '창', unit_price: 600000, unit: '㎡', grade: '프리미엄' },
		{ std_category: '창호', std_item: '블라인드', sub_category: '부속', unit_price: 25000, unit: '㎡', grade: '가성비' },
		{ std_category: '창호', std_item: '블라인드', sub_category: '부속', unit_price: 45000, unit: '㎡', grade: '중급' },
		{ std_category: '창호', std_item: '블라인드', sub_category: '부속', unit_price: 75000, unit: '㎡', grade: '고급' },
		{ std_category: '창호', std_item: '블라인드', sub_category: '부속', unit_price: 120000, unit: '㎡', grade: '프리미엄', brand: '헌터더글라스' },
		{ std_category: '창호', std_item: '방충망', sub_category: '부속', unit_price: 15000, unit: '㎡', grade: '가성비' },
		{ std_category: '창호', std_item: '방충망', sub_category: '부속', unit_price: 25000, unit: '㎡', grade: '중급' },
		{ std_category: '창호', std_item: '방충망', sub_category: '부속', unit_price: 40000, unit: '㎡', grade: '고급', material: '스테인리스' },

		// ─── 페인트 (기존 7 + 신규 17 = 24) ───
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 5000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 8000, unit: '㎡', grade: '중급', brand: '벤자민무어' },
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 13000, unit: '㎡', grade: '고급', brand: '파로스앤보로' },
		{ std_category: '페인트', std_item: '벽면 페인트', sub_category: '벽', unit_price: 20000, unit: '㎡', grade: '프리미엄', brand: '파로앤볼' },
		{ std_category: '페인트', std_item: '천장 페인트', sub_category: '천장', unit_price: 5000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '천장 페인트', sub_category: '천장', unit_price: 7000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '천장 페인트', sub_category: '천장', unit_price: 10000, unit: '㎡', grade: '고급' },
		{ std_category: '페인트', std_item: '에폭시', sub_category: '바닥', unit_price: 12000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '에폭시', sub_category: '바닥', unit_price: 18000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '에폭시', sub_category: '바닥', unit_price: 28000, unit: '㎡', grade: '고급' },
		// 페인트 신규 아이템
		{ std_category: '페인트', std_item: '친환경 페인트', sub_category: '벽', unit_price: 8000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '친환경 페인트', sub_category: '벽', unit_price: 12000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '친환경 페인트', sub_category: '벽', unit_price: 18000, unit: '㎡', grade: '고급' },
		{ std_category: '페인트', std_item: '친환경 페인트', sub_category: '벽', unit_price: 28000, unit: '㎡', grade: '프리미엄', brand: '리보스' },
		{ std_category: '페인트', std_item: '탄성코트', sub_category: '외벽', unit_price: 10000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '탄성코트', sub_category: '외벽', unit_price: 16000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '탄성코트', sub_category: '외벽', unit_price: 25000, unit: '㎡', grade: '고급' },
		{ std_category: '페인트', std_item: '우드스테인', sub_category: '목재', unit_price: 8000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '우드스테인', sub_category: '목재', unit_price: 13000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '우드스테인', sub_category: '목재', unit_price: 20000, unit: '㎡', grade: '고급', brand: '오스모' },
		{ std_category: '페인트', std_item: '우드스테인', sub_category: '목재', unit_price: 32000, unit: '㎡', grade: '프리미엄', brand: '리보스' },
		{ std_category: '페인트', std_item: '방수 페인트', sub_category: '방수', unit_price: 7000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '방수 페인트', sub_category: '방수', unit_price: 11000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '방수 페인트', sub_category: '방수', unit_price: 17000, unit: '㎡', grade: '고급' },

		// ─── 추가 욕실 아이템 ───
		{ std_category: '욕실', std_item: '세면대', sub_category: '위생도기', unit_price: 2000000, unit: '개', grade: '프리미엄', brand: '콜러' },
		{ std_category: '욕실', std_item: '샤워부스', sub_category: '샤워', unit_price: 1800000, unit: '식', grade: '프리미엄', material: '유럽수입 프레임리스' },
		{ std_category: '욕실', std_item: '욕실 수납장', sub_category: '수납', unit_price: 900000, unit: '식', grade: '프리미엄', brand: '듀라빗' },
		{ std_category: '욕실', std_item: 'LED미러', sub_category: '거울', unit_price: 600000, unit: '개', grade: '프리미엄', brand: '콜러' },
		{ std_category: '욕실', std_item: '타일 줄눈', sub_category: '타일', unit_price: 8000, unit: '㎡', grade: '가성비' },
		{ std_category: '욕실', std_item: '타일 줄눈', sub_category: '타일', unit_price: 12000, unit: '㎡', grade: '중급' },
		{ std_category: '욕실', std_item: '타일 줄눈', sub_category: '타일', unit_price: 20000, unit: '㎡', grade: '고급', material: '에폭시' },
		{ std_category: '욕실', std_item: '환풍기', sub_category: '환기', unit_price: 50000, unit: '개', grade: '가성비' },
		{ std_category: '욕실', std_item: '환풍기', sub_category: '환기', unit_price: 100000, unit: '개', grade: '중급' },
		{ std_category: '욕실', std_item: '환풍기', sub_category: '환기', unit_price: 180000, unit: '개', grade: '고급' },
		{ std_category: '욕실', std_item: '욕실 난방', sub_category: '난방', unit_price: 150000, unit: '식', grade: '가성비' },
		{ std_category: '욕실', std_item: '욕실 난방', sub_category: '난방', unit_price: 280000, unit: '식', grade: '중급' },
		{ std_category: '욕실', std_item: '욕실 난방', sub_category: '난방', unit_price: 450000, unit: '식', grade: '고급' },

		// ─── 추가 바닥 아이템 ───
		{ std_category: '바닥', std_item: '데코타일', sub_category: '타일', unit_price: 75000, unit: '㎡', grade: '프리미엄', brand: '암스트롱' },
		{ std_category: '바닥', std_item: '헤링본마루', sub_category: '마루', unit_price: 45000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '폴리싱타일', sub_category: '타일', unit_price: 55000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '폴리싱타일', sub_category: '타일', unit_price: 85000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '폴리싱타일', sub_category: '타일', unit_price: 130000, unit: '㎡', grade: '고급' },
		{ std_category: '바닥', std_item: '폴리싱타일', sub_category: '타일', unit_price: 200000, unit: '㎡', grade: '프리미엄' },
		{ std_category: '바닥', std_item: '셀프레벨링', sub_category: '특수마감', unit_price: 30000, unit: '㎡', grade: '가성비' },
		{ std_category: '바닥', std_item: '셀프레벨링', sub_category: '특수마감', unit_price: 50000, unit: '㎡', grade: '중급' },
		{ std_category: '바닥', std_item: '셀프레벨링', sub_category: '특수마감', unit_price: 80000, unit: '㎡', grade: '고급' },
		{ std_category: '바닥', std_item: '강마루', sub_category: '마루', unit_price: 150000, unit: '㎡', grade: '프리미엄', brand: '유럽수입' },

		// ─── 추가 가구 아이템 ───
		{ std_category: '가구', std_item: '수납장', sub_category: '수납', unit_price: 250000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: '수납장', sub_category: '수납', unit_price: 450000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '수납장', sub_category: '수납', unit_price: 750000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '수납장', sub_category: '수납', unit_price: 1200000, unit: '식', grade: '프리미엄' },
		{ std_category: '가구', std_item: '책장', sub_category: '가구', unit_price: 300000, unit: '식', grade: '가성비' },
		{ std_category: '가구', std_item: '책장', sub_category: '가구', unit_price: 500000, unit: '식', grade: '중급' },
		{ std_category: '가구', std_item: '책장', sub_category: '가구', unit_price: 850000, unit: '식', grade: '고급' },
		{ std_category: '가구', std_item: '책장', sub_category: '가구', unit_price: 1400000, unit: '식', grade: '프리미엄', material: '원목' },

		// ─── 추가 목공 아이템 ───
		{ std_category: '목공', std_item: '간접조명 박스', sub_category: '천장', unit_price: 25000, unit: 'm', grade: '가성비' },
		{ std_category: '목공', std_item: '간접조명 박스', sub_category: '천장', unit_price: 40000, unit: 'm', grade: '중급' },
		{ std_category: '목공', std_item: '간접조명 박스', sub_category: '천장', unit_price: 65000, unit: 'm', grade: '고급' },
		{ std_category: '목공', std_item: '간접조명 박스', sub_category: '천장', unit_price: 100000, unit: 'm', grade: '프리미엄' },
		{ std_category: '목공', std_item: '니치', sub_category: '벽면', unit_price: 80000, unit: '개', grade: '가성비' },
		{ std_category: '목공', std_item: '니치', sub_category: '벽면', unit_price: 150000, unit: '개', grade: '중급' },
		{ std_category: '목공', std_item: '니치', sub_category: '벽면', unit_price: 250000, unit: '개', grade: '고급' },
		{ std_category: '목공', std_item: '걸레받이', sub_category: '마감재', unit_price: 28000, unit: 'm', grade: '프리미엄', material: '대리석' },
		{ std_category: '목공', std_item: '몰딩', sub_category: '마감재', unit_price: 45000, unit: 'm', grade: '고급', material: '원목' },
		{ std_category: '목공', std_item: '문틀', sub_category: '문', unit_price: 400000, unit: '개', grade: '프리미엄', material: '원목' },

		// ─── 추가 전기 아이템 ───
		{ std_category: '전기', std_item: '다운라이트', sub_category: '조명', unit_price: 130000, unit: '개', grade: '프리미엄', brand: '필립스' },
		{ std_category: '전기', std_item: 'EV충전기', sub_category: '충전', unit_price: 3200000, unit: '식', grade: '프리미엄', brand: '테슬라 월커넥터' },
		{ std_category: '전기', std_item: '분전반 교체', sub_category: '분전반', unit_price: 600000, unit: '식', grade: '프리미엄' },
		{ std_category: '전기', std_item: '전선 교체', sub_category: '배선', unit_price: 35000, unit: 'm', grade: '프리미엄' },
		{ std_category: '전기', std_item: '매립등', sub_category: '조명', unit_price: 35000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '매립등', sub_category: '조명', unit_price: 60000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '매립등', sub_category: '조명', unit_price: 100000, unit: '개', grade: '고급' },
		{ std_category: '전기', std_item: '매립등', sub_category: '조명', unit_price: 160000, unit: '개', grade: '프리미엄' },
		{ std_category: '전기', std_item: '간접조명', sub_category: '조명', unit_price: 15000, unit: 'm', grade: '가성비' },
		{ std_category: '전기', std_item: '간접조명', sub_category: '조명', unit_price: 25000, unit: 'm', grade: '중급' },
		{ std_category: '전기', std_item: '간접조명', sub_category: '조명', unit_price: 40000, unit: 'm', grade: '고급' },
		{ std_category: '전기', std_item: '간접조명', sub_category: '조명', unit_price: 65000, unit: 'm', grade: '프리미엄' },

		// ─── 추가 도배 아이템 ───
		{ std_category: '도배', std_item: '합지 도배', sub_category: '벽지', unit_price: 7000, unit: '㎡', grade: '고급', material: '수입 합지' },
		{ std_category: '도배', std_item: '천연 벽지', sub_category: '벽지', unit_price: 10000, unit: '㎡', grade: '중급', material: '한지' },
		{ std_category: '도배', std_item: '천장 도배', sub_category: '천장', unit_price: 9000, unit: '㎡', grade: '프리미엄' },
		{ std_category: '도배', std_item: '포인트벽지', sub_category: '벽지', unit_price: 65000, unit: '㎡', grade: '프리미엄', material: '유럽 디자인' },
		{ std_category: '도배', std_item: '벽지 보수', sub_category: '보수', unit_price: 3000, unit: '㎡', grade: '가성비' },
		{ std_category: '도배', std_item: '벽지 보수', sub_category: '보수', unit_price: 5000, unit: '㎡', grade: '중급' },
		{ std_category: '도배', std_item: '벽지 보수', sub_category: '보수', unit_price: 8000, unit: '㎡', grade: '고급' },
		{ std_category: '도배', std_item: '실크 도배', sub_category: '벽지', unit_price: 20000, unit: '㎡', grade: '프리미엄', material: '수입 실크 프리미엄' },

		// ─── 추가 철거 아이템 ───
		{ std_category: '철거', std_item: '설비 철거', sub_category: '설비', unit_price: 150000, unit: '식', grade: '가성비' },
		{ std_category: '철거', std_item: '설비 철거', sub_category: '설비', unit_price: 250000, unit: '식', grade: '중급' },
		{ std_category: '철거', std_item: '설비 철거', sub_category: '설비', unit_price: 380000, unit: '식', grade: '고급' },
		{ std_category: '철거', std_item: '조적 철거', sub_category: '벽', unit_price: 30000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '조적 철거', sub_category: '벽', unit_price: 45000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '조적 철거', sub_category: '벽', unit_price: 65000, unit: '㎡', grade: '고급' },

		// ─── 추가 주방 아이템 ───
		{ std_category: '주방', std_item: '빌트인 식기세척기', sub_category: '가전', unit_price: 600000, unit: '개', grade: '가성비' },
		{ std_category: '주방', std_item: '빌트인 식기세척기', sub_category: '가전', unit_price: 1000000, unit: '개', grade: '중급' },
		{ std_category: '주방', std_item: '빌트인 식기세척기', sub_category: '가전', unit_price: 1600000, unit: '개', grade: '고급', brand: '보쉬' },
		{ std_category: '주방', std_item: '빌트인 식기세척기', sub_category: '가전', unit_price: 2800000, unit: '개', grade: '프리미엄', brand: '밀레' },
		{ std_category: '주방', std_item: '주방 수전', sub_category: '수전금구', unit_price: 80000, unit: '개', grade: '가성비' },
		{ std_category: '주방', std_item: '주방 수전', sub_category: '수전금구', unit_price: 150000, unit: '개', grade: '중급' },
		{ std_category: '주방', std_item: '주방 수전', sub_category: '수전금구', unit_price: 280000, unit: '개', grade: '고급', brand: '그로에' },
		{ std_category: '주방', std_item: '주방 수전', sub_category: '수전금구', unit_price: 500000, unit: '개', grade: '프리미엄', brand: '한스그로에' },

		// ─── 추가 창호 아이템 ───
		{ std_category: '창호', std_item: '방충망', sub_category: '부속', unit_price: 60000, unit: '㎡', grade: '프리미엄', material: '롤스크린' },
		{ std_category: '창호', std_item: '커튼박스', sub_category: '부속', unit_price: 30000, unit: 'm', grade: '가성비' },
		{ std_category: '창호', std_item: '커튼박스', sub_category: '부속', unit_price: 50000, unit: 'm', grade: '중급' },
		{ std_category: '창호', std_item: '커튼박스', sub_category: '부속', unit_price: 80000, unit: 'm', grade: '고급' },
		{ std_category: '창호', std_item: '커튼박스', sub_category: '부속', unit_price: 120000, unit: 'm', grade: '프리미엄' },
		{ std_category: '창호', std_item: '유리 교체', sub_category: '창', unit_price: 60000, unit: '㎡', grade: '가성비' },
		{ std_category: '창호', std_item: '유리 교체', sub_category: '창', unit_price: 100000, unit: '㎡', grade: '중급' },
		{ std_category: '창호', std_item: '유리 교체', sub_category: '창', unit_price: 160000, unit: '㎡', grade: '고급', material: '로이복층유리' },
		{ std_category: '창호', std_item: '유리 교체', sub_category: '창', unit_price: 250000, unit: '㎡', grade: '프리미엄', material: '삼중유리' },

		// ─── 추가 페인트 아이템 ───
		{ std_category: '페인트', std_item: '에폭시', sub_category: '바닥', unit_price: 45000, unit: '㎡', grade: '프리미엄' },
		{ std_category: '페인트', std_item: '곰팡이방지 페인트', sub_category: '특수', unit_price: 8000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '곰팡이방지 페인트', sub_category: '특수', unit_price: 13000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '곰팡이방지 페인트', sub_category: '특수', unit_price: 20000, unit: '㎡', grade: '고급' },
		{ std_category: '페인트', std_item: '칠판 페인트', sub_category: '특수', unit_price: 12000, unit: '㎡', grade: '가성비' },
		{ std_category: '페인트', std_item: '칠판 페인트', sub_category: '특수', unit_price: 18000, unit: '㎡', grade: '중급' },
		{ std_category: '페인트', std_item: '칠판 페인트', sub_category: '특수', unit_price: 28000, unit: '㎡', grade: '고급' },

		// ─── 설비/배관 (신규 카테고리 보충) ───
		{ std_category: '욕실', std_item: '배관 교체', sub_category: '배관', unit_price: 80000, unit: 'm', grade: '가성비' },
		{ std_category: '욕실', std_item: '배관 교체', sub_category: '배관', unit_price: 120000, unit: 'm', grade: '중급' },
		{ std_category: '욕실', std_item: '배관 교체', sub_category: '배관', unit_price: 180000, unit: 'm', grade: '고급' },
		{ std_category: '욕실', std_item: '바닥 난방', sub_category: '난방', unit_price: 35000, unit: '㎡', grade: '가성비' },
		{ std_category: '욕실', std_item: '바닥 난방', sub_category: '난방', unit_price: 55000, unit: '㎡', grade: '중급' },
		{ std_category: '욕실', std_item: '바닥 난방', sub_category: '난방', unit_price: 85000, unit: '㎡', grade: '고급' },

		// ─── 추가 전기 보충 ───
		{ std_category: '전기', std_item: '인터폰', sub_category: '통신', unit_price: 700000, unit: '식', grade: '프리미엄', brand: '코맥스 월패드' },
		{ std_category: '전기', std_item: '실링팬', sub_category: '조명', unit_price: 1000000, unit: '개', grade: '프리미엄', brand: '빅애스팬' },
		{ std_category: '전기', std_item: '홈네트워크', sub_category: '통신', unit_price: 300000, unit: '식', grade: '가성비' },
		{ std_category: '전기', std_item: '홈네트워크', sub_category: '통신', unit_price: 550000, unit: '식', grade: '중급' },
		{ std_category: '전기', std_item: '홈네트워크', sub_category: '통신', unit_price: 900000, unit: '식', grade: '고급' },
		{ std_category: '전기', std_item: '홈네트워크', sub_category: '통신', unit_price: 1500000, unit: '식', grade: '프리미엄' },

		// ─── 추가 목공 보충 ───
		{ std_category: '목공', std_item: '벽체 조적', sub_category: '벽면', unit_price: 45000, unit: '㎡', grade: '가성비' },
		{ std_category: '목공', std_item: '벽체 조적', sub_category: '벽면', unit_price: 70000, unit: '㎡', grade: '중급' },
		{ std_category: '목공', std_item: '벽체 조적', sub_category: '벽면', unit_price: 110000, unit: '㎡', grade: '고급' },
		{ std_category: '목공', std_item: '석고보드', sub_category: '벽면', unit_price: 18000, unit: '㎡', grade: '가성비' },
		{ std_category: '목공', std_item: '석고보드', sub_category: '벽면', unit_price: 28000, unit: '㎡', grade: '중급' },
		{ std_category: '목공', std_item: '석고보드', sub_category: '벽면', unit_price: 42000, unit: '㎡', grade: '고급' },

		// ─── 추가 주방 보충 ───
		{ std_category: '주방', std_item: '빌트인 냉장고장', sub_category: '가구', unit_price: 400000, unit: '식', grade: '가성비' },
		{ std_category: '주방', std_item: '빌트인 냉장고장', sub_category: '가구', unit_price: 700000, unit: '식', grade: '중급' },
		{ std_category: '주방', std_item: '빌트인 냉장고장', sub_category: '가구', unit_price: 1100000, unit: '식', grade: '고급' },
		{ std_category: '주방', std_item: '빌트인 냉장고장', sub_category: '가구', unit_price: 1800000, unit: '식', grade: '프리미엄' },

		// ─── 추가 창호 보충 ───
		{ std_category: '창호', std_item: '방화문', sub_category: '문', unit_price: 300000, unit: '개', grade: '가성비' },
		{ std_category: '창호', std_item: '방화문', sub_category: '문', unit_price: 500000, unit: '개', grade: '중급' },
		{ std_category: '창호', std_item: '방화문', sub_category: '문', unit_price: 800000, unit: '개', grade: '고급' },
		{ std_category: '창호', std_item: '방화문', sub_category: '문', unit_price: 1200000, unit: '개', grade: '프리미엄' },

		// ─── 추가 철거 보충 ───
		{ std_category: '철거', std_item: '석면 철거', sub_category: '특수', unit_price: 30000, unit: '㎡', grade: '가성비' },
		{ std_category: '철거', std_item: '석면 철거', sub_category: '특수', unit_price: 50000, unit: '㎡', grade: '중급' },
		{ std_category: '철거', std_item: '석면 철거', sub_category: '특수', unit_price: 80000, unit: '㎡', grade: '고급' },

		// ─── 추가 도배 보충 ───
		{ std_category: '도배', std_item: '합지 도배', sub_category: '벽지', unit_price: 10000, unit: '㎡', grade: '프리미엄', material: '수입 프리미엄 합지' },
		{ std_category: '도배', std_item: '천연 벽지', sub_category: '벽지', unit_price: 35000, unit: '㎡', grade: '프리미엄', material: '유럽 천연소재' },
		{ std_category: '도배', std_item: '줄눈 보수', sub_category: '보수', unit_price: 12000, unit: 'm', grade: '프리미엄' },

		// ─── 마감 보충 ───
		{ std_category: '바닥', std_item: '걸레받이', sub_category: '마감재', unit_price: 8000, unit: 'm', grade: '가성비' },
		{ std_category: '바닥', std_item: '걸레받이', sub_category: '마감재', unit_price: 13000, unit: 'm', grade: '중급' },
		{ std_category: '바닥', std_item: '걸레받이', sub_category: '마감재', unit_price: 20000, unit: 'm', grade: '고급' },
		{ std_category: '바닥', std_item: '문턱', sub_category: '마감재', unit_price: 25000, unit: '개', grade: '가성비' },
		{ std_category: '바닥', std_item: '문턱', sub_category: '마감재', unit_price: 45000, unit: '개', grade: '중급' },
		{ std_category: '바닥', std_item: '문턱', sub_category: '마감재', unit_price: 70000, unit: '개', grade: '고급', material: '대리석' },

		// ─── 벤치마크 매칭 v3 추가 항목 ───
		// 펜던트 조명
		{ std_category: '전기', std_item: '펜던트 조명', sub_category: '조명', unit_price: 80000, unit: '개', grade: '가성비' },
		{ std_category: '전기', std_item: '펜던트 조명', sub_category: '조명', unit_price: 200000, unit: '개', grade: '중급' },
		{ std_category: '전기', std_item: '펜던트 조명', sub_category: '조명', unit_price: 400000, unit: '개', grade: '고급' },
		{ std_category: '전기', std_item: '펜던트 조명', sub_category: '조명', unit_price: 800000, unit: '개', grade: '프리미엄', brand: '루이스폴센' },
		// 비디오폰
		{ std_category: '전기', std_item: '비디오폰', sub_category: '통신', unit_price: 120000, unit: '식', grade: '가성비' },
		{ std_category: '전기', std_item: '비디오폰', sub_category: '통신', unit_price: 220000, unit: '식', grade: '중급' },
		{ std_category: '전기', std_item: '비디오폰', sub_category: '통신', unit_price: 380000, unit: '식', grade: '고급' },
		{ std_category: '전기', std_item: '비디오폰', sub_category: '통신', unit_price: 600000, unit: '식', grade: '프리미엄' },
		// 주방 싱크볼
		{ std_category: '주방', std_item: '싱크볼', sub_category: '싱크대', unit_price: 150000, unit: '개', grade: '가성비' },
		{ std_category: '주방', std_item: '싱크볼', sub_category: '싱크대', unit_price: 280000, unit: '개', grade: '중급' },
		{ std_category: '주방', std_item: '싱크볼', sub_category: '싱크대', unit_price: 450000, unit: '개', grade: '고급' },
		{ std_category: '주방', std_item: '싱크볼', sub_category: '싱크대', unit_price: 700000, unit: '개', grade: '프리미엄', material: '스테인리스 언더마운트' },
		// 욕실 악세사리
		{ std_category: '욕실', std_item: '욕실 악세사리', sub_category: '악세사리', unit_price: 80000, unit: '세트', grade: '가성비' },
		{ std_category: '욕실', std_item: '욕실 악세사리', sub_category: '악세사리', unit_price: 150000, unit: '세트', grade: '중급' },
		{ std_category: '욕실', std_item: '욕실 악세사리', sub_category: '악세사리', unit_price: 300000, unit: '세트', grade: '고급' },
		{ std_category: '욕실', std_item: '욕실 악세사리', sub_category: '악세사리', unit_price: 500000, unit: '세트', grade: '프리미엄' },
		// 청소/마무리
		{ std_category: '기타', std_item: '청소/마무리', sub_category: '청소', unit_price: 200000, unit: '식', grade: '가성비' },
		{ std_category: '기타', std_item: '청소/마무리', sub_category: '청소', unit_price: 350000, unit: '식', grade: '중급' },
		{ std_category: '기타', std_item: '청소/마무리', sub_category: '청소', unit_price: 500000, unit: '식', grade: '고급' },
		{ std_category: '기타', std_item: '청소/마무리', sub_category: '청소', unit_price: 800000, unit: '식', grade: '프리미엄' },
		// 현장 관리비
		{ std_category: '기타', std_item: '현장 관리비', sub_category: '관리', unit_price: 300000, unit: '식', grade: '가성비' },
		{ std_category: '기타', std_item: '현장 관리비', sub_category: '관리', unit_price: 500000, unit: '식', grade: '중급' },
		{ std_category: '기타', std_item: '현장 관리비', sub_category: '관리', unit_price: 800000, unit: '식', grade: '고급' },
		{ std_category: '기타', std_item: '현장 관리비', sub_category: '관리', unit_price: 1200000, unit: '식', grade: '프리미엄' },
	]
}

export default app
