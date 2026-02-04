export interface DamageCase {
	id: string
	user_id?: string
	slug?: string
	title: string
	description: string
	images: string | string[] | null
	category?: string
	severity?: string
	status: string
	company_name?: string
	representative_name?: string
	region?: string
	damage_type?: string
	damage_amount?: number
	view_count?: number
	like_count?: number
	comment_count?: number
	created_at: string
	updated_at?: string
}

export interface DamageCaseMatched extends DamageCase {
	match_count: number
	company_phone?: string
	business_number?: string
}

export interface DamageCaseFilters {
	category: string
	status: string
	sort_by: string
}
