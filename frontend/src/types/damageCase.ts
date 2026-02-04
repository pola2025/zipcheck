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
	view_count?: number
	like_count?: number
	comment_count?: number
	created_at: string
	updated_at?: string
}

export interface DamageCaseFilters {
	category: string
	status: string
	sort_by: string
}
