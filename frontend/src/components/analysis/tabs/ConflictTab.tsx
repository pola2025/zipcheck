import { useState, useEffect } from 'react'
import { Plus, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Analysis, AnalysisItem, DecisionLog, ConflictRule } from '../../../types/analysis'
import { getApiUrl } from '../../../lib/api-config'

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
}

const DISPUTE_TYPES = [
	{ value: 'grade_disagreement', label: '등급 불일치' },
	{ value: 'category_dispute', label: '카테고리 분쟁' },
	{ value: 'price_dispute', label: '가격 분쟁' },
	{ value: 'bundling_dispute', label: '일식 분쟁' },
]

function authHeaders() {
	const token = localStorage.getItem('admin_token') || ''
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	}
}

export default function ConflictTab({ analysis, items }: Props) {
	const [logs, setLogs] = useState<DecisionLog[]>([])
	const [rules, setRules] = useState<ConflictRule[]>([])
	const [loading, setLoading] = useState(true)
	const [showAddLog, setShowAddLog] = useState(false)
	const [showAddRule, setShowAddRule] = useState(false)

	// Log form
	const [logForm, setLogForm] = useState({
		item_id: '',
		dispute_type: 'price_dispute',
		dispute_description: '',
		resolution: '',
		resolved_by: '',
		resolution_reasoning: '',
		status: 'open',
	})

	// Rule form
	const [ruleForm, setRuleForm] = useState({
		rule_name: '',
		description: '',
		scope: 'GLOBAL',
		category: '',
		priority: 0,
	})

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		setLoading(true)
		try {
			const [logsRes, rulesRes] = await Promise.all([
				fetch(getApiUrl(`/api/admin/analyses/${analysis.id}/decisions`), { headers: authHeaders() }),
				fetch(getApiUrl('/api/admin/conflict-rules'), { headers: authHeaders() }),
			])

			if (logsRes.ok) {
				const lr = await logsRes.json()
				setLogs(lr.data || [])
			}
			if (rulesRes.ok) {
				const rr = await rulesRes.json()
				setRules(rr.data || [])
			}
		} finally {
			setLoading(false)
		}
	}

	const createLog = async () => {
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${analysis.id}/decisions`), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify(logForm),
			})
			if (!res.ok) throw new Error('Decision Log 생성 실패')
			setShowAddLog(false)
			setLogForm({ item_id: '', dispute_type: 'price_dispute', dispute_description: '', resolution: '', resolved_by: '', resolution_reasoning: '', status: 'open' })
			await fetchData()
		} catch (e) {
			alert('Decision Log 생성 실패')
		}
	}

	const createRule = async () => {
		try {
			const res = await fetch(getApiUrl('/api/admin/conflict-rules'), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify(ruleForm),
			})
			if (!res.ok) {
				const err = await res.json()
				alert(err.error || '규칙 생성 실패')
				return
			}
			setShowAddRule(false)
			setRuleForm({ rule_name: '', description: '', scope: 'GLOBAL', category: '', priority: 0 })
			await fetchData()
		} catch (e) {
			alert('규칙 생성 실패')
		}
	}

	// Rules that apply to this analysis
	const applicableRules = rules.filter((r) => {
		if (r.scope === 'GLOBAL') return true
		if (r.scope === 'CATEGORY') {
			return items.some((i) => i.std_category === r.category)
		}
		return false
	})

	return (
		<div className="space-y-6">
			{loading ? (
				<div className="text-center py-8 text-sand-500">로딩 중...</div>
			) : (
				<>
					{/* Applicable Rules */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-sand-800 flex items-center gap-2">
								<ShieldCheck className="w-4 h-4" />
								적용 규칙 ({applicableRules.length})
							</h3>
							<button
								onClick={() => setShowAddRule(!showAddRule)}
								className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-lg text-xs font-semibold text-forest-600 transition-all flex items-center gap-1"
							>
								<Plus className="w-3.5 h-3.5" />
								새 규칙
							</button>
						</div>

						{showAddRule && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								className="bg-sand-50 rounded-xl p-4 border border-sand-200 mb-3 space-y-3"
							>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-xs text-sand-600 block mb-1">규칙명</label>
										<input
											value={ruleForm.rule_name}
											onChange={(e) => setRuleForm({ ...ruleForm, rule_name: e.target.value })}
											className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
											placeholder="예: VAT_ALWAYS_INCLUDED"
										/>
									</div>
									<div>
										<label className="text-xs text-sand-600 block mb-1">범위</label>
										<select
											value={ruleForm.scope}
											onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
											className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
										>
											<option value="GLOBAL">전역 (GLOBAL)</option>
											<option value="CATEGORY">카테고리 (CATEGORY)</option>
											<option value="CASE_SPECIFIC">사례 특정 (CASE_SPECIFIC)</option>
										</select>
									</div>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">설명</label>
									<textarea
										value={ruleForm.description}
										onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300 resize-none"
										rows={2}
									/>
								</div>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => setShowAddRule(false)}
										className="px-3 py-1.5 bg-sand-100 text-sand-700 rounded-lg text-sm font-semibold"
									>
										취소
									</button>
									<button
										onClick={createRule}
										disabled={!ruleForm.rule_name || !ruleForm.description}
										className="px-3 py-1.5 bg-forest-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
									>
										생성
									</button>
								</div>
							</motion.div>
						)}

						<div className="space-y-2">
							{applicableRules.length === 0 ? (
								<p className="text-sm text-sand-500 text-center py-4">적용되는 규칙이 없습니다</p>
							) : (
								applicableRules.map((rule) => (
									<div
										key={rule.id}
										className="bg-white rounded-xl p-3 border border-sand-200 flex items-center justify-between"
									>
										<div>
											<div className="flex items-center gap-2">
												<span className={`px-2 py-0.5 rounded text-xs font-semibold ${
													rule.scope === 'GLOBAL' ? 'bg-blue-50 text-blue-700' :
													rule.scope === 'CATEGORY' ? 'bg-amber-50 text-amber-700' :
													'bg-sand-100 text-sand-700'
												}`}>
													{rule.scope}
												</span>
												<span className="text-sm font-semibold text-sand-900">{rule.rule_name}</span>
											</div>
											<p className="text-xs text-sand-600 mt-1">{rule.description}</p>
										</div>
										<span className="text-xs text-sand-500">P{rule.priority}</span>
									</div>
								))
							)}
						</div>
					</div>

					{/* Decision Logs */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-sand-800 flex items-center gap-2">
								<AlertTriangle className="w-4 h-4" />
								Decision Log ({logs.length})
							</h3>
							<button
								onClick={() => setShowAddLog(!showAddLog)}
								className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700 transition-all flex items-center gap-1"
							>
								<Plus className="w-3.5 h-3.5" />
								로그 추가
							</button>
						</div>

						{showAddLog && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-3 space-y-3"
							>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-xs text-sand-600 block mb-1">분쟁 유형</label>
										<select
											value={logForm.dispute_type}
											onChange={(e) => setLogForm({ ...logForm, dispute_type: e.target.value })}
											className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
										>
											{DISPUTE_TYPES.map((dt) => (
												<option key={dt.value} value={dt.value}>{dt.label}</option>
											))}
										</select>
									</div>
									<div>
										<label className="text-xs text-sand-600 block mb-1">관련 항목</label>
										<select
											value={logForm.item_id}
											onChange={(e) => setLogForm({ ...logForm, item_id: e.target.value })}
											className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
										>
											<option value="">없음</option>
											{items.map((i) => (
												<option key={i.id} value={i.id}>
													{i.std_item || i.original_item_name || i.id.slice(0, 8)}
												</option>
											))}
										</select>
									</div>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">분쟁 내용 *</label>
									<textarea
										value={logForm.dispute_description}
										onChange={(e) => setLogForm({ ...logForm, dispute_description: e.target.value })}
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300 resize-none"
										rows={2}
										placeholder="분쟁 내용을 입력하세요..."
									/>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">해결 방안</label>
									<textarea
										value={logForm.resolution}
										onChange={(e) => setLogForm({ ...logForm, resolution: e.target.value })}
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300 resize-none"
										rows={2}
										placeholder="해결 방안을 입력하세요..."
									/>
								</div>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => setShowAddLog(false)}
										className="px-3 py-1.5 bg-sand-100 text-sand-700 rounded-lg text-sm font-semibold"
									>
										취소
									</button>
									<button
										onClick={createLog}
										disabled={!logForm.dispute_description}
										className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
									>
										추가
									</button>
								</div>
							</motion.div>
						)}

						<div className="space-y-2">
							{logs.length === 0 ? (
								<p className="text-sm text-sand-500 text-center py-4">Decision Log가 없습니다</p>
							) : (
								logs.map((log) => (
									<div
										key={log.id}
										className="bg-white rounded-xl p-3 border border-sand-200"
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<span className={`w-2 h-2 rounded-full ${
													log.status === 'open' ? 'bg-amber-500' :
													log.status === 'resolved' ? 'bg-green-500' :
													'bg-red-500'
												}`} />
												<span className="text-xs font-semibold text-sand-600">{log.dispute_type}</span>
											</div>
											<span className="text-xs text-sand-500">
												{new Date(log.created_at).toLocaleDateString('ko-KR')}
											</span>
										</div>
										<p className="text-sm text-sand-900">{log.dispute_description}</p>
										{log.resolution && (
											<div className="mt-2 pl-3 border-l-2 border-green-300">
												<p className="text-xs text-green-700 flex items-center gap-1 mb-0.5">
													<CheckCircle className="w-3 h-3" /> 해결
												</p>
												<p className="text-sm text-sand-700">{log.resolution}</p>
											</div>
										)}
									</div>
								))
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}
