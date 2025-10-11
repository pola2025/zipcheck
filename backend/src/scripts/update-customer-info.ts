import { supabase } from '../lib/supabase'

async function updateCustomerInfo() {
	console.log('📝 Updating customer information...')

	try {
		const { data, error } = await supabase
			.from('quote_requests')
			.update({
				customer_name: '이재호',
				customer_email: 'mkt@polarad.co.kr'
			})
			.eq('id', 'c0d7866a-f0ce-47df-8dcd-bb8eb871a01c')
			.select()
			.single()

		if (error) {
			console.error('❌ Error:', error)
			process.exit(1)
		}

		console.log('✅ Customer information updated:')
		console.log(`  - Name: ${data.customer_name}`)
		console.log(`  - Email: ${data.customer_email}`)
		console.log(`  - Phone: ${data.customer_phone}`)
	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	}
}

updateCustomerInfo()
