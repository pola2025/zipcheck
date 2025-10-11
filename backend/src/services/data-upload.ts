import { supabase } from '../lib/supabase'
import {
	parseExcelFile,
	validateConstructionRow,
	validateDistributorRow,
	type ConstructionRow,
	type DistributorRow
} from './excel-parser'

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

		// 2. 업로드 이력 생성
		const { data: uploadHistory, error: historyError } = await supabase
			.from('upload_history')
			.insert({
				dataset_type: 'construction',
				file_name: file.originalname,
				file_size: file.size,
				total_rows: rows.length,
				status: 'processing'
			})
			.select()
			.single()

		if (historyError) throw historyError
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

				// 시공 데이터 저장
				const { error: insertError } = await supabase.from('construction_records').insert({
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

				if (insertError) throw insertError

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

		// 4. 업로드 이력 업데이트
		await supabase
			.from('upload_history')
			.update({
				success_rows: result.successRows,
				error_rows: result.errorRows,
				errors: result.errors,
				status: 'completed',
				completed_at: new Date().toISOString()
			})
			.eq('id', uploadHistory.id)

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

		// 2. 업로드 이력 생성
		const { data: uploadHistory, error: historyError } = await supabase
			.from('upload_history')
			.insert({
				dataset_type: 'distributor',
				file_name: file.originalname,
				file_size: file.size,
				total_rows: rows.length,
				status: 'processing'
			})
			.select()
			.single()

		if (historyError) throw historyError
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

				// 기존 데이터를 is_current = false로 업데이트
				await supabase
					.from('distributor_prices')
					.update({ is_current: false })
					.eq('item_id', item.id)
					.eq('distributor_name', data.distributorName)
					.eq('is_current', true)

				// 유통사 가격 데이터 저장
				const { error: insertError } = await supabase.from('distributor_prices').insert({
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

				if (insertError) throw insertError

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

		// 4. 업로드 이력 업데이트
		await supabase
			.from('upload_history')
			.update({
				success_rows: result.successRows,
				error_rows: result.errorRows,
				errors: result.errors,
				status: 'completed',
				completed_at: new Date().toISOString()
			})
			.eq('id', uploadHistory.id)

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
	// 먼저 찾기
	const { data: existing } = await supabase
		.from('categories')
		.select('*')
		.eq('name', name)
		.single()

	if (existing) return existing

	// 없으면 생성
	const { data: created, error } = await supabase
		.from('categories')
		.insert({ name })
		.select()
		.single()

	if (error) throw error
	return created
}

/**
 * 항목 찾기 또는 생성
 */
async function findOrCreateItem(categoryId: string, name: string) {
	// 먼저 완전 일치 찾기
	const { data: existing } = await supabase
		.from('items')
		.select('*')
		.eq('category_id', categoryId)
		.eq('name', name)
		.single()

	if (existing) return existing

	// 유사한 이름 찾기 (첫 5글자로 검색)
	const namePrefix = name.substring(0, 5)
	const { data: similar } = await supabase
		.from('items')
		.select('*')
		.eq('category_id', categoryId)
		.ilike('name', `${namePrefix}%`)
		.limit(1)
		.single()

	if (similar) {
		// 유사한 항목이 있으면 aliases에 추가
		const aliases = similar.aliases || []
		if (!aliases.includes(name)) {
			await supabase
				.from('items')
				.update({ aliases: [...aliases, name] })
				.eq('id', similar.id)
		}
		return similar
	}

	// 없으면 새로 생성
	const { data: created, error } = await supabase
		.from('items')
		.insert({
			category_id: categoryId,
			name
		})
		.select()
		.single()

	if (error) throw error
	return created
}
