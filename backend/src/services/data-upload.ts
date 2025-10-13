import { query, insertOne } from '../lib/db'
import {
	parseExcelFile,
	validateConstructionRow,
	validateDistributorRow,
	type ConstructionRow,
	type DistributorRow
} from './excel-parser'
import {
	parseConstructionSheets,
	type ConstructionProject,
	type ConstructionItem
} from './construction-sheet-parser'

interface UploadResult {
	totalRows: number
	successRows: number
	errorRows: number
	errors: Array<{ row: number; message: string }>
	uploadId?: string
}

/**
 * 시공 데이터 업로드
 */
export async function uploadConstructionData(file: Express.Multer.File): Promise<UploadResult> {
	const result: UploadResult = {
		totalRows: 0,
		successRows: 0,
		errorRows: 0,
		errors: []
	}

	try {
		// 1. Excel 파일 파싱
		console.log('📄 Parsing Excel file...')
		const rows = parseExcelFile(file.buffer) as ConstructionRow[]
		result.totalRows = rows.length

		console.log(`📊 Found ${rows.length} rows`)
		if (rows.length > 0) {
			console.log('🔍 First row keys:', Object.keys(rows[0]))
			console.log('🔍 First row data:', rows[0])
		}

		// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
		// OLD: const { data: uploadHistory, error: historyError } = await supabase.from('upload_history').insert({...}).select().single()
		const uploadHistory = await insertOne<any>('upload_history', {
			dataset_type: 'construction',
			file_name: file.originalname,
			file_size: file.size,
			total_rows: rows.length,
			status: 'processing'
		})

		if (!uploadHistory) {
			throw new Error('Failed to create upload history')
		}

		result.uploadId = uploadHistory.id

		// 3. 각 행 처리
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i]
			const rowNum = i + 2 // Excel 행 번호 (헤더 다음부터)

			try {
				// 검증
				const validation = validateConstructionRow(row, rowNum)
				if (!validation.isValid) {
					result.errors.push({ row: rowNum, message: validation.error! })
					result.errorRows++
					continue
				}

				const data = validation.data!

				// 카테고리 찾기 또는 생성
				const category = await findOrCreateCategory(data.category)

				// 항목 찾기 또는 생성
				const item = await findOrCreateItem(category.id, data.itemName)

				// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
				// OLD: const { error: insertError } = await supabase.from('construction_records').insert({...})
				const insertResult = await insertOne<any>('construction_records', {
					item_id: item.id,
					year: data.year,
					quarter: data.quarter,
					month: data.month,
					region: data.region,
					material_cost: data.materialCost,
					labor_cost: data.laborCost,
					overhead_cost: data.overheadCost,
					total_cost: data.totalCost,
					property_size: data.propertySize,
					property_type: data.propertyType,
					contractor_id: data.contractorId,
					notes: data.notes,
					source_file: file.originalname,
					raw_data: row
				})

				if (!insertResult) {
					throw new Error('Failed to insert construction record')
				}

				result.successRows++

				if (result.successRows % 50 === 0) {
					console.log(`✅ Processed ${result.successRows}/${rows.length} rows`)
				}
			} catch (error) {
				console.error(`❌ Error processing row ${rowNum}:`, error)
				const message = error instanceof Error ? error.message : '알 수 없는 오류'
				result.errors.push({
					row: rowNum,
					message
				})
				result.errorRows++
			}
		}

		// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
		// OLD: await supabase.from('upload_history').update({...}).eq('id', uploadHistory.id)
		await query(
			`UPDATE upload_history
			SET success_rows = $1,
				error_rows = $2,
				errors = $3,
				status = $4,
				completed_at = $5,
				updated_at = NOW()
			WHERE id = $6`,
			[result.successRows, result.errorRows, JSON.stringify(result.errors), 'completed', new Date().toISOString(), uploadHistory.id]
		)

		console.log(`\n✅ Upload completed!`)
		console.log(`   - Total: ${result.totalRows}`)
		console.log(`   - Success: ${result.successRows}`)
		console.log(`   - Errors: ${result.errorRows}`)

		return result
	} catch (error) {
		console.error('💥 Upload failed:', error)
		throw error
	}
}

/**
 * 유통사 가격 데이터 업로드
 */
export async function uploadDistributorData(file: Express.Multer.File): Promise<UploadResult> {
	const result: UploadResult = {
		totalRows: 0,
		successRows: 0,
		errorRows: 0,
		errors: []
	}

	try {
		// 1. Excel 파일 파싱
		console.log('📄 Parsing Excel file...')
		const rows = parseExcelFile(file.buffer) as DistributorRow[]
		result.totalRows = rows.length

		console.log(`📊 Found ${rows.length} rows`)

		// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
		// OLD: const { data: uploadHistory, error: historyError } = await supabase.from('upload_history').insert({...}).select().single()
		const uploadHistory = await insertOne<any>('upload_history', {
			dataset_type: 'distributor',
			file_name: file.originalname,
			file_size: file.size,
			total_rows: rows.length,
			status: 'processing'
		})

		if (!uploadHistory) {
			throw new Error('Failed to create upload history')
		}

		result.uploadId = uploadHistory.id

		// 3. 각 행 처리
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i]
			const rowNum = i + 2

			try {
				// 검증
				const validation = validateDistributorRow(row, rowNum)
				if (!validation.isValid) {
					result.errors.push({ row: rowNum, message: validation.error! })
					result.errorRows++
					continue
				}

				const data = validation.data!

				// 카테고리 찾기 또는 생성
				const category = await findOrCreateCategory(data.category)

				// 항목 찾기 또는 생성
				const item = await findOrCreateItem(category.id, data.itemName)

				// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
				// OLD: await supabase.from('distributor_prices').update({ is_current: false }).eq('item_id', item.id).eq('distributor_name', data.distributorName).eq('is_current', true)
				await query(
					`UPDATE distributor_prices
					SET is_current = false, updated_at = NOW()
					WHERE item_id = $1
					AND distributor_name = $2
					AND is_current = true`,
					[item.id, data.distributorName]
				)

				// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
				// OLD: const { error: insertError } = await supabase.from('distributor_prices').insert({...})
				const insertResult = await insertOne<any>('distributor_prices', {
					item_id: item.id,
					distributor_name: data.distributorName,
					brand: data.brand,
					model: data.model,
					wholesale_price: data.wholesalePrice,
					retail_price: data.retailPrice,
					discount_rate: data.discountRate,
					unit: data.unit,
					year: data.year,
					month: data.month,
					is_current: true,
					valid_from: new Date(data.year, data.month - 1, 1),
					notes: data.notes,
					source_file: file.originalname,
					raw_data: row
				})

				if (!insertResult) {
					throw new Error('Failed to insert distributor price')
				}

				result.successRows++

				if (result.successRows % 50 === 0) {
					console.log(`✅ Processed ${result.successRows}/${rows.length} rows`)
				}
			} catch (error) {
				console.error(`❌ Error processing row ${rowNum}:`, error)
				const message = error instanceof Error ? error.message : '알 수 없는 오류'
				result.errors.push({
					row: rowNum,
					message
				})
				result.errorRows++
			}
		}

		// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
		// OLD: await supabase.from('upload_history').update({...}).eq('id', uploadHistory.id)
		await query(
			`UPDATE upload_history
			SET success_rows = $1,
				error_rows = $2,
				errors = $3,
				status = $4,
				completed_at = $5,
				updated_at = NOW()
			WHERE id = $6`,
			[result.successRows, result.errorRows, JSON.stringify(result.errors), 'completed', new Date().toISOString(), uploadHistory.id]
		)

		console.log(`\n✅ Upload completed!`)
		console.log(`   - Total: ${result.totalRows}`)
		console.log(`   - Success: ${result.successRows}`)
		console.log(`   - Errors: ${result.errorRows}`)

		return result
	} catch (error) {
		console.error('💥 Upload failed:', error)
		throw error
	}
}

/**
 * 카테고리 찾기 또는 생성
 */
async function findOrCreateCategory(name: string) {
	// ✅ CONVERTED: Supabase SELECT → PostgreSQL query
	// OLD: const { data: existing } = await supabase.from('categories').select('*').eq('name', name).single()
	const existingResult = await query(
		'SELECT * FROM categories WHERE name = $1 LIMIT 1',
		[name]
	)

	if (existingResult.rows.length > 0) {
		return existingResult.rows[0]
	}

	// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
	// OLD: const { data: created, error } = await supabase.from('categories').insert({ name }).select().single()
	const created = await insertOne<any>('categories', { name })

	if (!created) {
		throw new Error('Failed to create category')
	}

	return created
}

/**
 * 항목 찾기 또는 생성
 */
async function findOrCreateItem(categoryId: string, name: string) {
	// ✅ CONVERTED: Supabase SELECT → PostgreSQL query
	// OLD: const { data: existing } = await supabase.from('items').select('*').eq('category_id', categoryId).eq('name', name).single()
	const existingResult = await query(
		'SELECT * FROM items WHERE category_id = $1 AND name = $2 LIMIT 1',
		[categoryId, name]
	)

	if (existingResult.rows.length > 0) {
		return existingResult.rows[0]
	}

	// ✅ CONVERTED: Supabase SELECT with ILIKE → PostgreSQL query
	// OLD: const { data: similar } = await supabase.from('items').select('*').eq('category_id', categoryId).ilike('name', `${namePrefix}%`).limit(1).single()
	const namePrefix = name.substring(0, 5)
	const similarResult = await query(
		'SELECT * FROM items WHERE category_id = $1 AND name ILIKE $2 LIMIT 1',
		[categoryId, `${namePrefix}%`]
	)

	if (similarResult.rows.length > 0) {
		const similar = similarResult.rows[0]
		// 유사한 항목이 있으면 aliases에 추가
		const aliases = similar.aliases || []
		if (!aliases.includes(name)) {
			// ✅ CONVERTED: Supabase UPDATE → PostgreSQL query
			// PostgreSQL 배열 형식 사용
			const newAliases = [...aliases, name]
			await query(
				'UPDATE items SET aliases = $1, updated_at = NOW() WHERE id = $2',
				[newAliases, similar.id] // PostgreSQL이 자동으로 배열로 변환
			)
		}
		return similar
	}

	// ✅ CONVERTED: Supabase INSERT → PostgreSQL insertOne
	// OLD: const { data: created, error } = await supabase.from('items').insert({ category_id: categoryId, name }).select().single()
	const created = await insertOne<any>('items', {
		category_id: categoryId,
		name
	})

	if (!created) {
		throw new Error('Failed to create item')
	}

	return created
}

/**
 * 현장별 실행내역서 업로드 (173개 시트 형식)
 */
export async function uploadConstructionSheets(file: Express.Multer.File): Promise<UploadResult> {
	const result: UploadResult = {
		totalRows: 0,
		successRows: 0,
		errorRows: 0,
		errors: []
	}

	try {
		// 1. Excel 파일 파싱 (현장별 실행내역서 형식)
		console.log('📄 Parsing Construction Sheets...')
		const projects = parseConstructionSheets(file.buffer)

		// 전체 항목 수 계산
		const totalItems = projects.reduce((sum, p) => sum + p.items.length, 0)
		result.totalRows = totalItems

		console.log(`📊 Found ${projects.length} projects with ${totalItems} total items`)

		// 2. 업로드 히스토리 생성
		const uploadHistory = await insertOne<any>('upload_history', {
			dataset_type: 'construction',
			file_name: file.originalname,
			file_size: file.size,
			total_rows: totalItems,
			status: 'processing'
		})

		if (!uploadHistory) {
			throw new Error('Failed to create upload history')
		}

		result.uploadId = uploadHistory.id

		// 3. 각 프로젝트의 항목 처리
		let processedCount = 0

		for (const project of projects) {
			for (const item of project.items) {
				processedCount++

				try {
					// 카테고리 찾기 또는 생성
					const category = await findOrCreateCategory(item.category)

					// 항목 찾기 또는 생성
					const dbItem = await findOrCreateItem(category.id, item.itemName)

					// construction_records에 삽입
					const insertResult = await insertOne<any>('construction_records', {
						item_id: dbItem.id,
						year: project.year,
						quarter: project.quarter,
						month: project.month,
						region: project.region,
						material_cost: null, // 현장별 실행내역서에는 세부 비용 구분 없음
						labor_cost: null,
						overhead_cost: null,
						total_cost: item.amount,
						property_size: null,
						property_type: null,
						contractor_id: item.vendor,
						notes: item.notes,
						source_file: file.originalname,
						raw_data: {
							projectName: project.projectName,
							projectPeriod: project.projectPeriod,
							itemNumber: item.number,
							category: item.category,
							itemName: item.itemName,
							vendor: item.vendor,
							amount: item.amount,
							notes: item.notes
						}
					})

					if (!insertResult) {
						throw new Error('Failed to insert construction record')
					}

					result.successRows++

					if (result.successRows % 50 === 0) {
						console.log(`✅ Processed ${result.successRows}/${totalItems} items`)
					}
				} catch (error) {
					console.error(`❌ Error processing item ${item.itemName}:`, error)
					const message = error instanceof Error ? error.message : '알 수 없는 오류'
					result.errors.push({
						row: processedCount,
						message: `[${project.projectName}] ${item.itemName}: ${message}`
					})
					result.errorRows++
				}
			}
		}

		// 4. 업로드 히스토리 업데이트
		await query(
			`UPDATE upload_history
			SET success_rows = $1,
				error_rows = $2,
				errors = $3,
				status = $4,
				completed_at = $5,
				updated_at = NOW()
			WHERE id = $6`,
			[
				result.successRows,
				result.errorRows,
				JSON.stringify(result.errors),
				'completed',
				new Date().toISOString(),
				uploadHistory.id
			]
		)

		console.log(`\n✅ Upload completed!`)
		console.log(`   - Total projects: ${projects.length}`)
		console.log(`   - Total items: ${result.totalRows}`)
		console.log(`   - Success: ${result.successRows}`)
		console.log(`   - Errors: ${result.errorRows}`)

		return result
	} catch (error) {
		console.error('💥 Upload failed:', error)
		throw error
	}
}
