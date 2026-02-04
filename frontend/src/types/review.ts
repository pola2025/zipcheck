// Backend API 응답과 정확히 일치하는 타입 정의
// 참고: backend/src/routes/company-reviews.ts
export interface Review {
	id: string
	slug?: string
	user_id: string
	company_name: string
	company_phone: string | null
	business_number: string | null
	region: string | null
	project_type: string | null
	project_size: number | null
	project_cost: number | null
	rating: number
	review_text: string  // Backend 실제 필드명
	images: string | null  // JSON stringified array
	verified: boolean
	status: string  // 'published' | 'pending' | 'deleted'
	view_count: number
	like_count: number  // Backend의 실제 필드 (helpful_count 아님)
	created_at: string
	updated_at: string
}

export interface ReviewFilters {
	region: string
	company_type: string
	rating: string
	sort_by: string
}
