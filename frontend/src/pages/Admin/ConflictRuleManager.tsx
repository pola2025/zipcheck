import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { getApiUrl } from '../../lib/api-config'
import type { ConflictRule, ConflictScope, StdCategory } from '../../types/analysis'

const SCOPES: ConflictScope[] = ['GLOBAL', 'CATEGORY', 'CASE_SPECIFIC']
const STD_CATEGORIES: StdCategory[] = [
	'욕실', '바닥', '가구', '목공', '전기', '도배', '철거', '주방', '창호', '페인트', '기타'
]

function authHeaders() {
	const token = localStorage.getItem('admin_token') || ''
	return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

const scopeColors: Record<string, string> = {
	GLOBAL: 'bg-blue-50 text-blue-700 border-blue-200',
	CATEGORY: 'bg-amber-50 text-amber-700 border-amber-200',
	CASE_SPECIFIC: 'bg-sand-100 text-sand-700 border-sand-300',
}

export default function ConflictRuleManager() {
	const [rules, setRules] = useState<ConflictRule[]>([])
	const [loading, setLoading] = useState(true)
	const [scopeFilter, setScopeFilter] = useState('')
	const [showAdd, setShowAdd] = useState(false)
	const [form, setForm] = useState({
		rule_name: '', description: '', scope: 'GLOBAL' as ConflictScope,
		category: '', priority: 0,
	})

	useEffect(() => { fetchRules() }, [scopeFilter])

	const fetchRules = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (scopeFilter) params.set('scope', scopeFilter)
			params.set('active', 'true')

			const res = await fetch(getApiUrl(`/api/admin/conflict-rules?${params}`), { headers: authHeaders() })
			if (res.ok) {
				const result = await res.json()
				setRules(result.data || [])
			}
		} finally { setLoading(false) }
	}

	const handleAdd = async () => {
		if (!form.rule_name || !form.description) return
		try {
			const res = await fetch(getApiUrl('/api/admin/conflict-rules'), {
				method: 'POST', headers: authHeaders(),
				body: JSON.stringify(form),
			})
			if (!res.ok) {
				const err = await res.json()
				alert(err.error || '생성 실패')
				return
			}
			setShowAdd(false)
			setForm({ rule_name: '', description: '', scope: 'GLOBAL', category: '', priority: 0 })
			await fetchRules()
		} catch { alert('규칙 생성 실패') }
	}

	const handleDelete = async (id: string) => {
		if (!confirm('이 규칙을 삭제하시겠습니까?')) return
		const res = await fetch(getApiUrl(`/api/admin/conflict-rules/${id}`), { method: 'DELETE', headers: authHeaders() })
		if (res.ok) await fetchRules()
	}

	const handleToggle = async (rule: ConflictRule) => {
		await fetch(getApiUrl(`/api/admin/conflict-rules/${rule.id}`), {
			method: 'PUT', headers: authHeaders(),
			body: JSON.stringify({ is_active: !rule.is_active }),
		})
		await fetchRules()
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Rulebook 관리</h2>
					<p className="text-sand-700 text-sm mt-1">규칙 충돌 계층 관리 (GLOBAL &gt; CATEGORY &gt; CASE_SPECIFIC)</p>
				</div>
				<button onClick={() => setShowAdd(!showAdd)} className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
					<Plus className="w-4 h-4" /> 규칙 추가
				</button>
			</div>

			{showAdd && (
				<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-sand-300 space-y-4">
					<h3 className="text-sm font-semibold text-sand-800">새 규칙 추가</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div className="col-span-2">
							<label className="text-xs text-sand-600 block mb-1">규칙명 *</label>
							<input value={form.rule_name} onChange={(e) => setForm({...form, rule_name: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" placeholder="예: BATHROOM_VAT_ALWAYS" />
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">범위</label>
							<select value={form.scope} onChange={(e) => setForm({...form, scope: e.target.value as ConflictScope})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300">
								{SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
							</select>
						</div>
						<div>
							<label className="text-xs text-sand-600 block mb-1">우선순위</label>
							<input type="number" value={form.priority} onChange={(e) => setForm({...form, priority: Number(e.target.value)})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300" />
						</div>
					</div>
					{form.scope === 'CATEGORY' && (
						<div>
							<label className="text-xs text-sand-600 block mb-1">카테고리</label>
							<select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300">
								<option value="">선택</option>
								{STD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
							</select>
						</div>
					)}
					<div>
						<label className="text-xs text-sand-600 block mb-1">설명 *</label>
						<textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm focus:outline-none focus:border-forest-300 resize-none" rows={3} placeholder="규칙 설명..." />
					</div>
					<div className="flex justify-end gap-2">
						<button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-sand-100 text-sand-700 rounded-xl text-sm font-semibold">취소</button>
						<button onClick={handleAdd} disabled={!form.rule_name || !form.description} className="px-4 py-2 bg-forest-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">추가</button>
					</div>
				</motion.div>
			)}

			{/* Scope Filter */}
			<div className="flex gap-2">
				<button onClick={() => setScopeFilter('')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!scopeFilter ? 'bg-forest-600 text-white' : 'bg-sand-50 text-sand-700 border border-sand-300'}`}>전체</button>
				{SCOPES.map(s => (
					<button key={s} onClick={() => setScopeFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scopeFilter === s ? 'bg-forest-600 text-white' : 'bg-sand-50 text-sand-700 border border-sand-300'}`}>{s}</button>
				))}
			</div>

			{/* Rules List */}
			<div className="space-y-3">
				{loading ? (
					<div className="text-center py-8 text-sand-500"><RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />로딩 중...</div>
				) : rules.length === 0 ? (
					<div className="text-center py-8 text-sand-500"><ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>규칙이 없습니다</p></div>
				) : (
					rules.map((rule, idx) => (
						<motion.div
							key={rule.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.03 }}
							className="bg-white rounded-2xl p-5 border border-sand-300"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${scopeColors[rule.scope]}`}>{rule.scope}</span>
										<span className="text-base font-semibold text-sand-900">{rule.rule_name}</span>
										<span className="text-xs text-sand-500">P{rule.priority}</span>
										{rule.category && <span className="text-xs bg-sand-100 text-sand-600 px-2 py-0.5 rounded">{rule.category}</span>}
									</div>
									<p className="text-sm text-sand-700">{rule.description}</p>
									<p className="text-xs text-sand-500 mt-2">
										생성: {new Date(rule.created_at).toLocaleDateString('ko-KR')}
										{rule.created_by && ` · ${rule.created_by}`}
									</p>
								</div>
								<div className="flex items-center gap-2 ml-4">
									<button onClick={() => handleDelete(rule.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						</motion.div>
					))
				)}
			</div>
		</div>
	)
}
