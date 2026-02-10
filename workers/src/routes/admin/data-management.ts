import { Hono } from 'hono'
import type { Env, Variables } from '../../types'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import { query, findMany, insertOne } from '../../lib/db'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/*', authenticateToken(), requireAdmin())

// Upload construction data (Excel)
app.post('/upload-construction', async (c) => {
	try {
		const formData = await c.req.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return c.json({ error: '파일을 선택해주세요.' }, 400)
		}

		const XLSX = await import('xlsx')
		const buffer = await file.arrayBuffer()
		const workbook = XLSX.read(buffer, { type: 'array' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

		if (rows.length === 0) {
			return c.json({ error: '데이터가 비어있습니다.' }, 400)
		}

		let inserted = 0
		let skipped = 0

		for (const row of rows) {
			const itemName = String(row['항목명'] || row['item_name'] || '').trim()
			const unit = String(row['단위'] || row['unit'] || '').trim()
			const unitPrice = parseFloat(String(row['단가'] || row['unit_price'] || '0'))
			const category = String(row['카테고리'] || row['category'] || '기타').trim()
			const source = String(row['출처'] || row['source'] || '').trim()

			if (!itemName || unitPrice <= 0) {
				skipped++
				continue
			}

			await query(c.env.DATABASE_URL, `
				INSERT INTO construction_prices (item_name, unit, unit_price, category, source, uploaded_at)
				VALUES ($1, $2, $3, $4, $5, NOW())
				ON CONFLICT (item_name, source) DO UPDATE SET
					unit = EXCLUDED.unit, unit_price = EXCLUDED.unit_price,
					category = EXCLUDED.category, uploaded_at = NOW()
			`, [itemName, unit, unitPrice, category, source])

			inserted++
		}

		// Log upload
		await insertOne(c.env.DATABASE_URL, 'upload_history', {
			file_name: file.name,
			file_type: 'construction',
			total_rows: rows.length,
			inserted_rows: inserted,
			skipped_rows: skipped,
			uploaded_at: new Date().toISOString(),
		})

		return c.json({
			success: true,
			message: `${inserted}건 업로드 완료 (${skipped}건 스킵)`,
			total: rows.length,
			inserted,
			skipped,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: `업로드 실패: ${message}` }, 500)
	}
})

// Upload construction sheets (multi-sheet Excel)
app.post('/upload-construction-sheets', async (c) => {
	try {
		const formData = await c.req.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return c.json({ error: '파일을 선택해주세요.' }, 400)
		}

		const XLSX = await import('xlsx')
		const buffer = await file.arrayBuffer()
		const workbook = XLSX.read(buffer, { type: 'array' })

		let totalInserted = 0
		let totalSkipped = 0
		const sheetResults: Array<{ name: string; inserted: number; skipped: number }> = []

		for (const sheetName of workbook.SheetNames) {
			const sheet = workbook.Sheets[sheetName]
			const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

			let inserted = 0
			let skipped = 0

			for (const row of rows) {
				const itemName = String(row['항목명'] || row['공종'] || row['item_name'] || '').trim()
				const unit = String(row['단위'] || row['unit'] || '').trim()
				const unitPrice = parseFloat(String(row['단가'] || row['unit_price'] || '0'))

				if (!itemName || unitPrice <= 0) {
					skipped++
					continue
				}

				await query(c.env.DATABASE_URL, `
					INSERT INTO construction_prices (item_name, unit, unit_price, category, source, uploaded_at)
					VALUES ($1, $2, $3, $4, $5, NOW())
					ON CONFLICT (item_name, source) DO UPDATE SET
						unit = EXCLUDED.unit, unit_price = EXCLUDED.unit_price, uploaded_at = NOW()
				`, [itemName, unit, unitPrice, sheetName, file.name])

				inserted++
			}

			sheetResults.push({ name: sheetName, inserted, skipped })
			totalInserted += inserted
			totalSkipped += skipped
		}

		await insertOne(c.env.DATABASE_URL, 'upload_history', {
			file_name: file.name,
			file_type: 'construction_sheets',
			total_rows: totalInserted + totalSkipped,
			inserted_rows: totalInserted,
			skipped_rows: totalSkipped,
			uploaded_at: new Date().toISOString(),
		})

		return c.json({
			success: true,
			message: `${workbook.SheetNames.length}개 시트에서 ${totalInserted}건 업로드`,
			sheets: sheetResults,
			totalInserted,
			totalSkipped,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: `업로드 실패: ${message}` }, 500)
	}
})

// Upload distributor price data
app.post('/upload-distributor', async (c) => {
	try {
		const formData = await c.req.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return c.json({ error: '파일을 선택해주세요.' }, 400)
		}

		const XLSX = await import('xlsx')
		const buffer = await file.arrayBuffer()
		const workbook = XLSX.read(buffer, { type: 'array' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

		let inserted = 0
		let skipped = 0

		for (const row of rows) {
			const itemName = String(row['제품명'] || row['item_name'] || '').trim()
			const brand = String(row['브랜드'] || row['brand'] || '').trim()
			const retailPrice = parseFloat(String(row['소비자가'] || row['retail_price'] || '0'))
			const wholesalePrice = parseFloat(String(row['도매가'] || row['wholesale_price'] || '0'))
			const category = String(row['카테고리'] || row['category'] || '기타').trim()

			if (!itemName || (retailPrice <= 0 && wholesalePrice <= 0)) {
				skipped++
				continue
			}

			await query(c.env.DATABASE_URL, `
				INSERT INTO distributor_prices (item_name, brand, retail_price, wholesale_price, category, uploaded_at)
				VALUES ($1, $2, $3, $4, $5, NOW())
				ON CONFLICT (item_name, brand) DO UPDATE SET
					retail_price = EXCLUDED.retail_price, wholesale_price = EXCLUDED.wholesale_price,
					category = EXCLUDED.category, uploaded_at = NOW()
			`, [itemName, brand, retailPrice, wholesalePrice, category])

			inserted++
		}

		await insertOne(c.env.DATABASE_URL, 'upload_history', {
			file_name: file.name,
			file_type: 'distributor',
			total_rows: rows.length,
			inserted_rows: inserted,
			skipped_rows: skipped,
			uploaded_at: new Date().toISOString(),
		})

		return c.json({
			success: true,
			message: `${inserted}건 업로드 완료 (${skipped}건 스킵)`,
			total: rows.length,
			inserted,
			skipped,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json({ error: `업로드 실패: ${message}` }, 500)
	}
})

// Get upload history
app.get('/upload-history', async (c) => {
	const rows = await findMany(c.env.DATABASE_URL,
		'SELECT * FROM upload_history ORDER BY uploaded_at DESC LIMIT 50'
	)
	return c.json(rows)
})

// Get data statistics (benchmark_prices = 시드/크롤링 데이터)
app.get('/data-stats', async (c) => {
	try {
		const overview = await query(c.env.DATABASE_URL, `
			SELECT
				COUNT(DISTINCT std_category) as categories_count,
				COUNT(DISTINCT std_item) as items_count,
				COUNT(*) as records_count,
				COALESCE(SUM(unit_price), 0)::text as total_amount
			FROM benchmark_prices
			WHERE is_active = true
		`)

		const byCategory = await findMany(c.env.DATABASE_URL, `
			SELECT
				std_category as category,
				COUNT(*) as record_count,
				COALESCE(SUM(unit_price), 0)::text as total_cost
			FROM benchmark_prices
			WHERE is_active = true
			GROUP BY std_category
			ORDER BY SUM(unit_price) DESC
		`)

		const byRegion = await findMany(c.env.DATABASE_URL, `
			SELECT
				region,
				COUNT(*) as count,
				COALESCE(SUM(unit_price), 0)::text as total_cost
			FROM benchmark_prices
			WHERE is_active = true AND region IS NOT NULL
			GROUP BY region
			ORDER BY SUM(unit_price) DESC
			LIMIT 10
		`)

		return c.json({
			overview: overview[0] || { categories_count: 0, items_count: 0, records_count: 0, total_amount: '0' },
			byCategory: byCategory || [],
			byRegion: byRegion || []
		})
	} catch (error) {
		return c.json({
			overview: { categories_count: 0, items_count: 0, records_count: 0, total_amount: '0' },
			byCategory: [],
			byRegion: []
		})
	}
})

// Get item-level price statistics (benchmark_prices)
app.get('/item-stats', async (c) => {
	const category = c.req.query('category')
	const search = c.req.query('search')

	let whereClause = 'WHERE is_active = true'
	const params: unknown[] = []

	if (category) {
		params.push(category)
		whereClause += ` AND std_category = $${params.length}`
	}
	if (search) {
		params.push(`%${search}%`)
		whereClause += ` AND std_item ILIKE $${params.length}`
	}

	const rows = await findMany(c.env.DATABASE_URL, `
		SELECT
			std_item || '-' || COALESCE(std_category, '') as id,
			std_item as item_name,
			std_category as category_name,
			COUNT(*) as record_count,
			ROUND(AVG(unit_price))::int as avg_total_cost,
			0 as avg_material_cost,
			0 as avg_labor_cost,
			0 as avg_overhead_cost,
			MIN(unit_price)::int as min_cost,
			MAX(unit_price)::int as max_cost,
			ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY unit_price))::int as median_cost
		FROM benchmark_prices
		${whereClause}
		GROUP BY std_item, std_category
		ORDER BY std_item
		LIMIT 100
	`, params)

	return c.json({ items: rows || [] })
})

export default app
