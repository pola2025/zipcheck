import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample quote requests data
const sampleQuoteRequests = [
	{
		customer_name: '이재호',
		customer_phone: '010-9897-9834',
		customer_email: 'mkt@polarad.co.kr',
		property_type: '아파트',
		property_size: 32,
		region: '서울 강남구',
		address: '서울시 강남구 역삼동 123-45',
		status: 'pending',
		items: [
			{
				category: '주방',
				itemName: '씽크대',
				quantity: 1,
				unit: '식',
				unitPrice: 2800000,
				totalPrice: 2800000,
				notes: '상판 엔지니어드스톤, 하부장 6자, 상부장 포함'
			},
			{
				category: '주방',
				itemName: '주방 타일',
				quantity: 12,
				unit: '㎡',
				unitPrice: 85000,
				totalPrice: 1020000,
				notes: '300x600 포세린 타일, 시공비 포함'
			},
			{
				category: '바닥',
				itemName: '강화마루',
				quantity: 84,
				unit: '㎡',
				unitPrice: 95000,
				totalPrice: 7980000,
				notes: '12T 독일산 강화마루, 몰딩 및 시공비 포함'
			},
			{
				category: '바닥',
				itemName: '현관 포세린 타일',
				quantity: 6,
				unit: '㎡',
				unitPrice: 120000,
				totalPrice: 720000,
				notes: '600x600 포세린 타일, 시공비 포함'
			},
			{
				category: '욕실',
				itemName: '욕실1 (안방)',
				quantity: 1,
				unit: '식',
				unitPrice: 4200000,
				totalPrice: 4200000,
				notes: '세면대, 양변기, 욕조, 샤워부스, 타일 및 방수 포함'
			},
			{
				category: '욕실',
				itemName: '욕실2 (공용)',
				quantity: 1,
				unit: '식',
				unitPrice: 3800000,
				totalPrice: 3800000,
				notes: '세면대, 양변기, 샤워부스, 타일 및 방수 포함'
			},
			{
				category: '도배',
				itemName: '실크벽지',
				quantity: 32,
				unit: '평',
				unitPrice: 45000,
				totalPrice: 1440000,
				notes: '실크벽지, 기존벽지 제거, 초배지 포함'
			},
			{
				category: '조명',
				itemName: 'LED 매입등',
				quantity: 18,
				unit: '개',
				unitPrice: 45000,
				totalPrice: 810000,
				notes: '거실, 침실, 주방 매입등 교체'
			}
		]
	},
	{
		customer_name: '김서연',
		customer_phone: '010-1234-5678',
		customer_email: 'kim@example.com',
		property_type: '아파트',
		property_size: 84,
		region: '서울 강남구',
		address: '서울특별시 강남구 삼성동 123-45',
		status: 'completed',
		items: [
			{
				category: '철거 및 폐기물 처리',
				itemName: '기존 바닥재 철거',
				specification: '강마루/장판 철거, 84㎡',
				quantity: 84,
				unit: '㎡',
				unitPrice: 15000,
				totalPrice: 1260000
			},
			{
				category: '바닥재',
				itemName: '강화마루 시공',
				specification: 'LG 하우시스 지아 8T, 전실',
				quantity: 84,
				unit: '㎡',
				unitPrice: 45000,
				totalPrice: 3780000
			},
			{
				category: '벽지/도배',
				itemName: '실크벽지 시공',
				specification: 'LG 실크벽지 프리미엄급, 전실',
				quantity: 250,
				unit: '㎡',
				unitPrice: 18000,
				totalPrice: 4500000
			},
			{
				category: '주방',
				itemName: '주방 상판 교체',
				specification: '인조대리석 상판 2.4m',
				quantity: 2.4,
				unit: 'm',
				unitPrice: 180000,
				totalPrice: 432000
			},
			{
				category: '욕실',
				itemName: '욕실 타일 시공',
				specification: '벽타일 300x600, 2개소',
				quantity: 40,
				unit: '㎡',
				unitPrice: 55000,
				totalPrice: 2200000
			}
		]
	},
	{
		customer_name: '박민준',
		customer_phone: '010-9876-5432',
		customer_email: 'park@example.com',
		property_type: '빌라',
		property_size: 25,
		region: '서울 마포구',
		address: '서울특별시 마포구 합정동 456-78',
		status: 'analyzing',
		items: [
			{
				category: '바닥',
				itemName: '강화마루',
				quantity: 65,
				unit: '㎡',
				unitPrice: 85000,
				totalPrice: 5525000,
				notes: '10T 국산 강화마루, 몰딩 포함'
			},
			{
				category: '도배',
				itemName: '벽지 시공',
				quantity: 25,
				unit: '평',
				unitPrice: 40000,
				totalPrice: 1000000,
				notes: '일반 실크벽지'
			},
			{
				category: '욕실',
				itemName: '욕실 리모델링',
				quantity: 1,
				unit: '식',
				unitPrice: 3500000,
				totalPrice: 3500000,
				notes: '타일, 세면대, 양변기 포함'
			}
		]
	}
]

async function seedData() {
	console.log('🌱 Starting data seeding...')

	try {
		// Insert quote requests
		for (const request of sampleQuoteRequests) {
			console.log(`\n📝 Creating quote request for ${request.customer_name}...`)

			const { data, error } = await supabase
				.from('quote_requests')
				.insert([request])
				.select()

			if (error) {
				console.error(`❌ Error creating quote request: ${error.message}`)
				continue
			}

			console.log(`✅ Successfully created quote request with ID: ${data[0].id}`)
		}

		console.log('\n✨ Data seeding completed!')
	} catch (error) {
		console.error('❌ Error seeding data:', error)
		process.exit(1)
	}
}

seedData()
