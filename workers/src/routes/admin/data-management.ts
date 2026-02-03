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

// Get data statistics
app.get('/data-stats', async (c) => {
	const result = await query(c.env.DATABASE_URL, `
		SELECT
			(SELECT COUNT(*) FROM construction_prices) as construction_count,
			(SELECT COUNT(*) FROM distributor_prices) as distributor_count,
			(SELECT COUNT(DISTINCT category) FROM construction_prices) as construction_categories,
			(SELECT COUNT(DISTINCT category) FROM distributor_prices) as distributor_categories
	`)
	return c.json(result[0])
})

// Get item-level price statistics
app.get('/item-stats', async (c) => {
	const category = c.req.query('category')
	const search = c.req.query('search')

	let whereClause = 'WHERE 1=1'
	const params: unknown[] = []

	if (category) {
		params.push(category)
		whereClause += ` AND category = $${params.length}`
	}
	if (search) {
		params.push(`%${search}%`)
		whereClause += ` AND item_name ILIKE $${params.length}`
	}

	const rows = await findMany(c.env.DATABASE_URL, `
		SELECT item_name, unit, category,
			AVG(unit_price) as avg_price,
			MIN(unit_price) as min_price,
			MAX(unit_price) as max_price,
			COUNT(*) as sample_count
		FROM construction_prices
		${whereClause}
		GROUP BY item_name, unit, category
		ORDER BY item_name
		LIMIT 100
	`, params)

	return c.json(rows)
})

export default app
