import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
	PenSquare, Plus, Edit3, Trash2, Eye, Upload, Save,
	X, ChevronLeft, Image as ImageIcon, BarChart3, Send,
} from 'lucide-react'
import { getApiUrl } from '../../lib/api-config'
import { useAuth } from '../../contexts/AuthContext'

interface BlogPostAdmin {
	id: string
	title: string
	slug: string
	category: '정보 및 참고사항' | '피해예방'
	excerpt: string
	content: string
	read_time: string
	author: string
	thumbnail_key?: string
	thumbnail_url?: string
	tags: string
	status: 'draft' | 'published'
	published_date: string
	chart_data?: string
}

type ViewMode = 'list' | 'edit' | 'create'

const EMPTY_POST: Omit<BlogPostAdmin, 'id'> = {
	title: '',
	slug: '',
	category: '정보 및 참고사항',
	excerpt: '',
	content: '',
	read_time: '3분',
	author: '집첵 에디터',
	tags: '',
	status: 'draft',
	published_date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
	chart_data: '',
}

export default function BlogManagement() {
	const { token } = useAuth()
	const [posts, setPosts] = useState<BlogPostAdmin[]>([])
	const [loading, setLoading] = useState(true)
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const [editPost, setEditPost] = useState<BlogPostAdmin | (Omit<BlogPostAdmin, 'id'> & { id?: string })>(EMPTY_POST)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const [seedLoading, setSeedLoading] = useState(false)

	const fetchPosts = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(getApiUrl('/api/admin/blog/posts'), {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setPosts(data.posts || [])
			}
		} catch (err) {
			console.error('Failed to fetch posts:', err)
		} finally {
			setLoading(false)
		}
	}, [token])

	useEffect(() => { fetchPosts() }, [fetchPosts])

	const showMessage = (type: 'success' | 'error', text: string) => {
		setMessage({ type, text })
		setTimeout(() => setMessage(null), 3000)
	}

	const handleSave = async () => {
		if (!editPost.title || !editPost.slug || !editPost.content) {
			showMessage('error', '제목, 슬러그, 콘텐츠는 필수입니다')
			return
		}

		setSaving(true)
		try {
			const isEdit = 'id' in editPost && editPost.id
			const url = isEdit
				? getApiUrl(`/api/admin/blog/posts/${editPost.id}`)
				: getApiUrl('/api/admin/blog/posts')
			const method = isEdit ? 'PUT' : 'POST'

			const res = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(editPost),
			})

			if (res.ok) {
				showMessage('success', isEdit ? '수정 완료' : '생성 완료')
				setViewMode('list')
				fetchPosts()
			} else {
				const err = await res.json()
				showMessage('error', err.error || '저장 실패')
			}
		} catch {
			showMessage('error', '네트워크 오류')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string) => {
		if (!confirm('정말 삭제하시겠습니까?')) return

		try {
			const res = await fetch(getApiUrl(`/api/admin/blog/posts/${id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				showMessage('success', '삭제 완료')
				fetchPosts()
			}
		} catch {
			showMessage('error', '삭제 실패')
		}
	}

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setUploading(true)
		try {
			const formData = new FormData()
			formData.append('file', file)

			const res = await fetch(getApiUrl('/api/admin/blog/images/upload'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			})

			if (res.ok) {
				const data = await res.json()
				setEditPost((prev) => ({ ...prev, thumbnail_key: data.key }))
				showMessage('success', '이미지 업로드 완료')
			}
		} catch {
			showMessage('error', '이미지 업로드 실패')
		} finally {
			setUploading(false)
		}
	}

	const handleSeedStaticData = async () => {
		setSeedLoading(true)
		try {
			// Dynamically import static data
			const { BLOG_POSTS } = await import('../../data/blogPosts')
			const seedData = BLOG_POSTS.map((post) => ({
				title: post.title,
				slug: post.slug,
				category: post.category,
				excerpt: post.excerpt,
				content: post.content,
				read_time: post.readTime,
				author: post.author,
				tags: post.tags.join(', '),
				status: 'published' as const,
				published_date: post.date,
				chart_data: post.chartIds ? JSON.stringify(post.chartIds) : '',
			}))

			const res = await fetch(getApiUrl('/api/admin/blog/posts/seed'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ posts: seedData }),
			})

			if (res.ok) {
				const data = await res.json()
				showMessage('success', `${data.created}개 포스트 Airtable에 동기화 완료`)
				fetchPosts()
			} else {
				showMessage('error', 'Seed 실패')
			}
		} catch (err) {
			console.error('Seed error:', err)
			showMessage('error', 'Seed 실패')
		} finally {
			setSeedLoading(false)
		}
	}

	const generateSlug = (title: string) => {
		return title
			.toLowerCase()
			.replace(/[가-힣]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			|| `post-${Date.now()}`
	}

	// ── List View ───────────────────────────────────────

	if (viewMode === 'list') {
		return (
			<div className="p-4 md:p-6 max-w-5xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<PenSquare className="w-6 h-6 text-forest-600" />
						<h1 className="text-xl font-bold text-sand-900">블로그 관리</h1>
						<span className="text-sm text-sand-500">({posts.length}개)</span>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleSeedStaticData}
							disabled={seedLoading}
							className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-sand-600 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors disabled:opacity-50"
						>
							<Send size={14} />
							{seedLoading ? 'Seeding...' : 'Airtable 동기화'}
						</button>
						<button
							onClick={() => { setEditPost(EMPTY_POST); setViewMode('create') }}
							className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg transition-colors"
						>
							<Plus size={16} />
							새 글 작성
						</button>
					</div>
				</div>

				{/* Message */}
				{message && (
					<div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
						message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
					}`}>
						{message.text}
					</div>
				)}

				{/* Posts Table */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600" />
					</div>
				) : posts.length === 0 ? (
					<div className="text-center py-20 bg-white rounded-xl border border-sand-200">
						<PenSquare className="w-12 h-12 text-sand-300 mx-auto mb-3" />
						<p className="text-sand-500 text-sm mb-2">아직 블로그 게시글이 없습니다</p>
						<p className="text-sand-400 text-xs mb-4">Airtable 동기화 또는 새 글 작성을 시작하세요</p>
						<button
							onClick={handleSeedStaticData}
							disabled={seedLoading}
							className="px-4 py-2 text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-lg disabled:opacity-50"
						>
							{seedLoading ? 'Seeding...' : '정적 데이터 Airtable에 동기화'}
						</button>
					</div>
				) : (
					<div className="bg-white rounded-xl border border-sand-200 overflow-hidden">
						<table className="w-full">
							<thead>
								<tr className="border-b border-sand-100 bg-sand-50">
									<th className="text-left px-4 py-3 text-xs font-semibold text-sand-600">제목</th>
									<th className="text-left px-4 py-3 text-xs font-semibold text-sand-600 hidden md:table-cell">카테고리</th>
									<th className="text-left px-4 py-3 text-xs font-semibold text-sand-600 hidden md:table-cell">상태</th>
									<th className="text-left px-4 py-3 text-xs font-semibold text-sand-600 hidden md:table-cell">날짜</th>
									<th className="text-right px-4 py-3 text-xs font-semibold text-sand-600">관리</th>
								</tr>
							</thead>
							<tbody>
								{posts.map((post) => (
									<motion.tr
										key={post.id}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="border-b border-sand-50 hover:bg-sand-50/50 transition-colors"
									>
										<td className="px-4 py-3">
											<p className="text-sm font-medium text-sand-900 line-clamp-1">{post.title}</p>
											<p className="text-xs text-sand-400 mt-0.5 md:hidden">
												{post.category} · {post.status === 'published' ? '발행됨' : '임시저장'}
											</p>
										</td>
										<td className="px-4 py-3 hidden md:table-cell">
											<span className={`text-xs font-medium px-2 py-0.5 rounded ${
												post.category === '피해예방' ? 'bg-red-50 text-red-600' : 'bg-forest-50 text-forest-600'
											}`}>
												{post.category}
											</span>
										</td>
										<td className="px-4 py-3 hidden md:table-cell">
											<span className={`text-xs font-medium px-2 py-0.5 rounded ${
												post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-sand-100 text-sand-500'
											}`}>
												{post.status === 'published' ? '발행됨' : '임시저장'}
											</span>
										</td>
										<td className="px-4 py-3 text-xs text-sand-500 hidden md:table-cell">
											{post.published_date}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-1">
												<a
													href={`/blog/${post.slug}`}
													target="_blank"
													rel="noopener noreferrer"
													className="p-1.5 text-sand-400 hover:text-forest-600 transition-colors"
													title="미리보기"
												>
													<Eye size={15} />
												</a>
												<button
													onClick={() => { setEditPost(post); setViewMode('edit') }}
													className="p-1.5 text-sand-400 hover:text-blue-600 transition-colors"
													title="수정"
												>
													<Edit3 size={15} />
												</button>
												<button
													onClick={() => handleDelete(post.id)}
													className="p-1.5 text-sand-400 hover:text-red-600 transition-colors"
													title="삭제"
												>
													<Trash2 size={15} />
												</button>
											</div>
										</td>
									</motion.tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		)
	}

	// ── Edit / Create View ──────────────────────────────

	return (
		<div className="p-4 md:p-6 max-w-4xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setViewMode('list')}
						className="p-1.5 text-sand-400 hover:text-sand-700 transition-colors"
					>
						<ChevronLeft size={20} />
					</button>
					<h1 className="text-xl font-bold text-sand-900">
						{viewMode === 'create' ? '새 글 작성' : '글 수정'}
					</h1>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setViewMode('list')}
						className="flex items-center gap-1.5 px-3 py-2 text-sm text-sand-600 hover:text-sand-800 transition-colors"
					>
						<X size={16} />
						취소
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg transition-colors disabled:opacity-50"
					>
						<Save size={16} />
						{saving ? '저장 중...' : '저장'}
					</button>
				</div>
			</div>

			{/* Message */}
			{message && (
				<div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
					message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
				}`}>
					{message.text}
				</div>
			)}

			{/* Form */}
			<div className="space-y-4">
				{/* Title */}
				<div className="bg-white rounded-xl border border-sand-200 p-4">
					<label className="block text-xs font-semibold text-sand-600 mb-1.5">제목 *</label>
					<input
						type="text"
						value={editPost.title}
						onChange={(e) => {
							const title = e.target.value
							setEditPost((prev) => ({
								...prev,
								title,
								slug: prev.slug || generateSlug(title),
							}))
						}}
						className="w-full px-3 py-2.5 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
						placeholder="블로그 제목을 입력하세요"
					/>
				</div>

				{/* Slug + Category + Status */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">슬러그 *</label>
						<input
							type="text"
							value={editPost.slug}
							onChange={(e) => setEditPost((prev) => ({ ...prev, slug: e.target.value }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
							placeholder="url-slug"
						/>
					</div>
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">카테고리 *</label>
						<select
							value={editPost.category}
							onChange={(e) => setEditPost((prev) => ({ ...prev, category: e.target.value as BlogPostAdmin['category'] }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
						>
							<option value="정보 및 참고사항">정보 및 참고사항</option>
							<option value="피해예방">피해예방</option>
						</select>
					</div>
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">상태</label>
						<select
							value={editPost.status}
							onChange={(e) => setEditPost((prev) => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
						>
							<option value="draft">임시저장</option>
							<option value="published">발행</option>
						</select>
					</div>
				</div>

				{/* Excerpt */}
				<div className="bg-white rounded-xl border border-sand-200 p-4">
					<label className="block text-xs font-semibold text-sand-600 mb-1.5">요약</label>
					<textarea
						value={editPost.excerpt}
						onChange={(e) => setEditPost((prev) => ({ ...prev, excerpt: e.target.value }))}
						className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 resize-none"
						rows={2}
						placeholder="게시글 요약 (목록에서 보여지는 내용)"
					/>
				</div>

				{/* Thumbnail */}
				<div className="bg-white rounded-xl border border-sand-200 p-4">
					<label className="block text-xs font-semibold text-sand-600 mb-1.5">
						<ImageIcon size={14} className="inline mr-1" />
						썸네일 이미지
					</label>
					<div className="flex items-center gap-3">
						<label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-sand-600 bg-sand-100 hover:bg-sand-200 rounded-lg cursor-pointer transition-colors">
							<Upload size={14} />
							{uploading ? '업로드 중...' : '이미지 선택'}
							<input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
						</label>
						{editPost.thumbnail_key && (
							<span className="text-xs text-forest-600">{editPost.thumbnail_key}</span>
						)}
					</div>
				</div>

				{/* Content (HTML) */}
				<div className="bg-white rounded-xl border border-sand-200 p-4">
					<label className="block text-xs font-semibold text-sand-600 mb-1.5">콘텐츠 (HTML) *</label>
					<textarea
						value={editPost.content}
						onChange={(e) => setEditPost((prev) => ({ ...prev, content: e.target.value }))}
						className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-500/30 resize-y"
						rows={16}
						placeholder="<h2>제목</h2><p>내용을 HTML로 작성하세요...</p>"
					/>
				</div>

				{/* Chart Data */}
				<div className="bg-white rounded-xl border border-sand-200 p-4">
					<label className="block text-xs font-semibold text-sand-600 mb-1.5">
						<BarChart3 size={14} className="inline mr-1" />
						차트 데이터 (JSON)
					</label>
					<textarea
						value={editPost.chart_data || ''}
						onChange={(e) => setEditPost((prev) => ({ ...prev, chart_data: e.target.value }))}
						className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-500/30 resize-y"
						rows={4}
						placeholder='["cost-comparison", "regional-cost"] 또는 커스텀 차트 JSON'
					/>
					<p className="text-xs text-sand-400 mt-1">
						프리셋: cost-comparison, material-cost, damage-types, regional-cost
					</p>
				</div>

				{/* Meta: Tags, ReadTime, Author, Date */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">태그</label>
						<input
							type="text"
							value={editPost.tags}
							onChange={(e) => setEditPost((prev) => ({ ...prev, tags: e.target.value }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
							placeholder="콤마로 구분"
						/>
					</div>
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">읽기 시간</label>
						<input
							type="text"
							value={editPost.read_time}
							onChange={(e) => setEditPost((prev) => ({ ...prev, read_time: e.target.value }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
							placeholder="5분"
						/>
					</div>
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">작성자</label>
						<input
							type="text"
							value={editPost.author}
							onChange={(e) => setEditPost((prev) => ({ ...prev, author: e.target.value }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
							placeholder="집첵 에디터"
						/>
					</div>
					<div className="bg-white rounded-xl border border-sand-200 p-4">
						<label className="block text-xs font-semibold text-sand-600 mb-1.5">발행일</label>
						<input
							type="text"
							value={editPost.published_date}
							onChange={(e) => setEditPost((prev) => ({ ...prev, published_date: e.target.value }))}
							className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
							placeholder="2026.02.05"
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
