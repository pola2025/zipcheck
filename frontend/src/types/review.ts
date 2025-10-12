export interface Review {
	id: string
	company_name: string
	company_type: string
	region: string
	title: string
	content: string
	rating: number
	author_name: string
	project_type: string
	project_size: number
	project_cost: number
	is_recommended: boolean
	view_count: number
	like_count: number
	comment_count: number
	created_at: string
}

export interface ReviewFilters {
	region: string
	company_type: string
	rating: string
	sort_by: string
}
