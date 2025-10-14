import { supabase } from '../lib/supabase'

async function resetQuoteAnalysis() {
	console.log('🔄 Resetting quote request analysis...')

	try {
		// Reset ALL quote requests to pending status
		const { data, error } = await supabase
			.from('quote_requests')
			.update({
				status: 'pending',
				analysis_result: null,
				analyzed_at: null,
				analyzed_by: null
			})
			.neq('status', 'pending') // Only update non-pending requests
			.select()

		if (error) {
			console.error('❌ Error:', error)
			process.exit(1)
		}

		console.log(`✅ Reset ${data?.length || 0} quote request(s) to pending status`)
		if (data && data.length > 0) {
			data.forEach((req: any) => {
				console.log(`  - ${req.customer_name} (${req.id})`)
			})
		}
		console.log('\n✨ Now you can re-run the AI analysis from the admin panel')
	} catch (error) {
		console.error('❌ Error:', error)
		process.exit(1)
	}
}

resetQuoteAnalysis()
