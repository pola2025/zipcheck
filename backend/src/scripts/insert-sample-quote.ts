import dotenv from 'dotenv'
import path from 'path'
import * as fs from 'fs'
import { supabase } from '../lib/supabase'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function insertSampleQuote() {
	console.log('📝 Inserting sample quote request...\n')

	try {
		// Load sample quote request
		const samplePath = path.resolve(__dirname, '../../../sample-quote-request.json')
		const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf-8'))

		console.log(`Customer: ${sampleData.customer_name}`)
		console.log(`Phone: ${sampleData.customer_phone}`)
		console.log(`Property: ${sampleData.property_type} (${sampleData.property_size}평)`)
		console.log(`Items: ${sampleData.items.length}개 항목\n`)

		// Insert the sample quote request
		const { data, error } = await supabase
			.from('quote_requests')
			.insert({
				customer_name: sampleData.customer_name,
				customer_phone: sampleData.customer_phone,
				customer_email: sampleData.customer_email,
				property_type: sampleData.property_type,
				property_size: sampleData.property_size,
				region: sampleData.region,
				address: sampleData.address,
				items: sampleData.items,
				status: 'pending'
			})
			.select()
			.single()

		if (error) {
			console.error('❌ Error inserting sample data:', error)
			throw error
		}

		console.log('✅ Sample quote request inserted successfully!')
		console.log(`📊 Quote Request ID: ${data.id}`)
		console.log(`📊 Status: ${data.status}`)
		console.log(`📊 Created at: ${data.created_at}\n`)

		console.log('🔗 You can now:')
		console.log(`1. View this request in admin: /admin/quote-requests`)
		console.log(`2. Run AI analysis on request ID: ${data.id}`)
		console.log(`3. User can lookup by phone: ${sampleData.customer_phone}\n`)
	} catch (error) {
		console.error('❌ Failed to insert sample data:', error)
		process.exit(1)
	}
}

insertSampleQuote()
