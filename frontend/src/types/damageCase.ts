export interface DamageCase {
	id: string
	company_name: string
	region: string
	title: string
	content: string
	damage_type: string
	damage_amount: number
	author_name: string
	resolution_status: string
	legal_action: boolean
	view_count: number
	like_count: number
	comment_count: number
	created_at: string
}

export interface DamageCaseFilters {
	region: string
	damage_type: string
	resolution_status: string
	sort_by: string
}
