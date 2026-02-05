import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, RefreshCw, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { getApiUrl } from '../../lib/api-config'
import type { BenchmarkPrice, StdCategory, Grade } from '../../types/analysis'

const STD_CATEGORIES: StdCategory[] = [
	'욕실', '바닥', '가구', '목공', '전기', '도배', '철거', '주방', '창호', '페인트', '기타'
]
const GRADES: Grade[] = ['가성비', '중급', '고급', '프리미엄']

function authHeaders() {
	const token = localStorage.getItem('admin_token') || ''
	return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export default function BenchmarkManager() {
	const [benchmarks, setBenchmarks] = useState<BenchmarkPrice[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState({ category: '', grade: '', search: '' })
	const [showAdd, setShowAdd] = useState(false)
	const [form, setForm] = useState({
		std_category: '욕실', std_item: '', unit_price: '', unit: '㎡', grade: '중급',
		brand: '', model: '', material: '', source: '', region: '서울',
	})

	useEffect(() => { fetchBenchmarks() }, [filter.category, filter.grade])

	const fetchBenchmarks = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (filter.category) params.set('category', filter.category)
			if (filter.grade) params.set('grade', filter.grade)
			if (filter.search) params.set('search', filter.search)
			params.set('limit', '100')

			const res = await fetch(getApiUrl(`/api/admin/benchmarks?${params}`), { headers: authHeaders() })
			if (res.ok) {
				const result = await res.json()
				setBenchmarks(result.data || [])
			}
		} finally { setLoading(false) }
	}

	const handleAdd = async () => {
		if (!form.std_item || !form.unit_price) return
		try {
			const res = await fetch(getApiUrl('/api/admin/benchmarks'), {
				method: 'POST', headers: authHeaders(),
				body: JSON.stringify({ ...form, unit_price: Number(form.unit_price) }),
			})
			if (!res.ok) throw new Error('추가 실패')
			setShowAdd(false)
			setForm({ std_category: '욕실', std_item: '', unit_price: '', unit: '㎡', grade: '중급', brand: '', model: '', material: '', source: '', region: '서울' })
			await fetchBenchmarks()
		} catch { alert('벤치마크 추가 실패') }
	}

	const handleDelete = async (id: string) => {
		if (!confirm('삭제하시겠습니까?')) return
		const res = await fetch(getApiUrl(`/api/admin/benchmarks/${id}`), { method: 'DELETE', headers: authHeaders() })
		if (res.ok) await fetchBenchmarks()
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>벤치마크 단가 관리</h2>
					<p className="text-sand-700 text-sm mt-1">Master Price Pulse 데이터 관리</p>
				</div>
				<button onClick={() => setShowAdd(!showAdd)} className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
					<Plus className="w-4 h-4" /> 단가 추가
				</button>
			</div>

			{showAdd && (
				<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-sand-300 space-y-4">
					<h3 className="text-sm font-semibold text-sand-800">새 벤치마크 추가</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div>
							<label className="text-xs text-sand-600 block mb-1">카테고리 *</label>
							<select value={form.std_category} onChange={(e) => setForm({...form, std_category: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300">
								{STD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
							</select>
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">항목명 *</label>
							<input value={form.std_item} onChange={(e) => setForm({...form, std_item: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" placeholder="예: 바닥 타일" />
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">단가 (원) *</label>
							<input type="number" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" placeholder="50000" />
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">단위 *</label>
							<input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" placeholder="㎡" />
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">등급</label>
							<select value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300">
								{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
							</select>
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">브랜드</label>
							<input value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" />
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">자재</label>
							<input value={form.material} onChange={(e) => setForm({...form, material: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" />
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">출처</label>
							<input value={form.source} onChange={(e) => setForm({...form, source: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" placeholder="시공사 견적" />
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-sand-100 text-sand-700 rounded-xl text-sm font-semibold">취소</button>
						<button onClick={handleAdd} disabled={!form.std_item || !form.unit_price} className="px-4 py-2 bg-forest-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">추가</button>
					</div>
				</motion.div>
			)}

			{/* Filters */}
			<div className="bg-white rounded-2xl p-5 border border-sand-300 grid grid-cols-3 gap-4">
				<div>
					<label className="text-xs text-sand-600 mb-1 block">카테고리</label>
					<select value={filter.category} onChange={(e) => setFilter({...filter, category: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300">
						<option value="">전체</option>
						{STD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
					</select>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">등급</label>
					<select value={filter.grade} onChange={(e) => setFilter({...filter, grade: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300">
						<option value="">전체</option>
						{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
					</select>
				</div>
				<div className="flex items-end">
					<button onClick={fetchBenchmarks} className="px-4 py-2 bg-sand-50 hover:bg-sand-100 border border-sand-300 rounded-xl text-sm font-semibold text-sand-700 transition-all flex items-center gap-2">
						<RefreshCw className="w-4 h-4" /> 새로고침
					</button>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white rounded-2xl border border-sand-300 overflow-hidden">
				{loading ? (
					<div className="p-12 text-center text-sand-600"><RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />로딩 중...</div>
				) : benchmarks.length === 0 ? (
					<div className="p-12 text-center text-sand-500">데이터가 없습니다</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="bg-sand-50 border-b border-sand-300">
									<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">카테고리</th>
									<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">항목명</th>
									<th className="text-right py-3 px-4 text-xs font-semibold text-sand-700">단가</th>
									<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">단위</th>
									<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">등급</th>
									<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">브랜드</th>
									<th className="text-left py-3 px-4 text-xs font-semibold text-sand-700">출처</th>
									<th className="text-center py-3 px-4 text-xs font-semibold text-sand-700">삭제</th>
								</tr>
							</thead>
							<tbody>
								{benchmarks.map((bp) => (
									<tr key={bp.id} className="border-b border-sand-100 hover:bg-sand-50">
										<td className="py-3 px-4 text-sm text-sand-700">{bp.std_category}</td>
										<td className="py-3 px-4 text-sm font-semibold text-sand-900">{bp.std_item}</td>
										<td className="py-3 px-4 text-right text-sm font-bold text-sand-900">{bp.unit_price.toLocaleString()}원</td>
										<td className="py-3 px-4 text-center text-sm text-sand-700">{bp.unit}</td>
										<td className="py-3 px-4 text-center text-xs"><span className="px-2 py-0.5 bg-sand-100 rounded-full">{bp.grade}</span></td>
										<td className="py-3 px-4 text-sm text-sand-600">{bp.brand || '—'}</td>
										<td className="py-3 px-4 text-sm text-sand-600">{bp.source || '—'}</td>
										<td className="py-3 px-4 text-center">
											<button onClick={() => handleDelete(bp.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
												<Trash2 className="w-4 h-4" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
