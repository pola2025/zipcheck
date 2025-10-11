import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
	throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
)

// 타입 정의
export interface Category {
	id: string
	name: string
	description?: string
}

export interface Item {
	id: string
	category_id: string
	name: string
	description?: string
	unit?: string
	aliases?: string[]
}

export interface ConstructionRecord {
	id: string
	item_id: string
	year: number
	quarter?: number
	month?: number
	region?: string
	material_cost?: number
	labor_cost?: number
	overhead_cost?: number
	total_cost: number
	contractor_id?: string
	property_size?: number
	property_type?: string
	notes?: string
	source_file?: string
	raw_data?: any
}

export interface DistributorPrice {
	id: string
	item_id: string
	distributor_name: string
	brand?: string
	model?: string
	wholesale_price?: number
	retail_price?: number
	discount_rate?: number
	unit?: string
	quantity?: number
	year: number
	month: number
	is_current: boolean
	valid_from?: Date
	valid_until?: Date
	notes?: string
	source_file?: string
	raw_data?: any
}
