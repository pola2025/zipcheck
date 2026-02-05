import { useState, useEffect } from 'react'
import { Save, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Analysis, AnalysisItem, StdCategory, Grade, CorrectionReasonCode, SuccessReasonCode, ItemAttributes } from '../../../types/analysis'
import ItemCard from '../ItemCard'

const STD_CATEGORIES: StdCategory[] = [
	'욕실', '바닥', '가구', '목공', '전기', '도배', '철거', '주방', '창호', '페인트', '기타'
]

const GRADES: Grade[] = ['가성비', '중급', '고급', '프리미엄']

const CORRECTION_REASONS: { value: CorrectionReasonCode; label: string }[] = [
	{ value: 'WRONG_GRADE', label: '등급 오류' },
	{ value: 'WRONG_CATEGORY', label: '카테고리 오류' },
	{ value: 'WRONG_UNIT', label: '단위 오류' },
	{ value: 'MISSING_LOGISTICS', label: '운반비 누락' },
	{ value: 'BUNDLED_MISSED', label: '일식 미감지' },
	{ value: 'BRAND_CONFUSED', label: '브랜드 혼동' },
	{ value: 'OCR_MISREAD', label: 'OCR 오독' },
	{ value: 'OTHER', label: '기타' },
]

const SUCCESS_REASONS: { value: SuccessReasonCode; label: string }[] = [
	{ value: 'MATCH_BY_BRAND', label: '브랜드 매칭' },
	{ value: 'MATCH_BY_MARKET_AVG', label: '시장 평균 매칭' },
	{ value: 'MATCH_BY_SIMILAR_CASE', label: '유사 사례 매칭' },
	{ value: 'MATCH_BY_AREA_SCALING', label: '면적 스케일링' },
	{ value: 'MATCH_BY_SEASONAL', label: '계절 매칭' },
	{ value: 'MATCH_BY_DEBUNDLE', label: '일식분해 매칭' },
]

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
	onUpdateItem: (itemId: string, data: Partial<AnalysisItem>) => Promise<AnalysisItem | null>
	saving: boolean
}

export default function NormalizeTab({ analysis, items, onUpdateItem, saving }: Props) {
	const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null)
	const selectedItem = items.find((i) => i.id === selectedItemId)

	// Form state for editing
	const [form, setForm] = useState<Partial<AnalysisItem>>({})

	useEffect(() => {
		if (selectedItem) {
			setForm({
				std_category: selectedItem.std_category,
				std_item: selectedItem.std_item,
				sub_category: selectedItem.sub_category,
				attributes: selectedItem.attributes || {},
				is_bundled: selectedItem.is_bundled,
				correction_reason_code: selectedItem.correction_reason_code,
				success_reason_code: selectedItem.success_reason_code,
				confidence: selectedItem.confidence,
			})
		}
	}, [selectedItemId])

	const handleSave = async () => {
		if (!selectedItem) return
		await onUpdateItem(selectedItem.id, form)
	}

	const handleNext = async () => {
		await handleSave()
		const idx = items.findIndex((i) => i.id === selectedItemId)
		if (idx < items.length - 1) {
			setSelectedItemId(items[idx + 1].id)
		}
	}

	const updateAttr = (key: keyof ItemAttributes, value: string) => {
		setForm((prev) => ({
			...prev,
			attributes: { ...(prev.attributes || {}), [key]: value || undefined },
		}))
	}

	const isBlind = analysis.is_blind_labeling

	return (
		<div className="grid lg:grid-cols-[320px_1fr] gap-4">
			{/* Left: Item List */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-sand-800 mb-2">
					항목 목록 ({items.length})
				</h3>
				<div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
					{items.map((item) => (
						<ItemCard
							key={item.id}
							item={item}
							isSelected={selectedItemId === item.id}
							onClick={() => setSelectedItemId(item.id)}
							showLabels
						/>
					))}
				</div>
			</div>

			{/* Right: Labeling Form */}
			<div>
				{selectedItem ? (
					<motion.div
						key={selectedItem.id}
						initial={{ opacity: 0, x: 10 }}
						animate={{ opacity: 1, x: 0 }}
						className="bg-sand-50 rounded-xl border border-sand-200 p-4 space-y-4"
					>
						{/* Original Data (read-only) */}
						<div className="bg-white rounded-lg p-3 border border-sand-200">
							<p className="text-xs text-sand-500 mb-1">원본 데이터</p>
							<p className="text-sm font-semibold text-sand-900">
								{selectedItem.original_category} &gt; {selectedItem.original_item_name}
							</p>
							<p className="text-xs text-sand-600 mt-1">
								{selectedItem.original_quantity} {selectedItem.original_unit} × {(selectedItem.original_unit_price || 0).toLocaleString()}원
								= {(selectedItem.original_total_price || 0).toLocaleString()}원
							</p>
						</div>

						{/* Labeling Fields */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-sand-600 block mb-1">표준 카테고리 *</label>
								<select
									value={form.std_category || ''}
									onChange={(e) => setForm({ ...form, std_category: e.target.value as StdCategory })}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								>
									<option value="">선택</option>
									{STD_CATEGORIES.map((c) => (
										<option key={c} value={c}>{c}</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">표준 항목명 *</label>
								<input
									type="text"
									value={form.std_item || ''}
									onChange={(e) => setForm({ ...form, std_item: e.target.value })}
									placeholder={isBlind ? '직접 입력' : '자동완성...'}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								/>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">세부 분류</label>
								<input
									type="text"
									value={form.sub_category || ''}
									onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								/>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">등급</label>
								<select
									value={form.attributes?.grade || ''}
									onChange={(e) => updateAttr('grade', e.target.value)}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								>
									<option value="">선택</option>
									{GRADES.map((g) => (
										<option key={g} value={g}>{g}</option>
									))}
								</select>
							</div>
						</div>

						{/* Attributes */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-sand-600 block mb-1">브랜드</label>
								<input
									type="text"
									value={form.attributes?.brand || ''}
									onChange={(e) => updateAttr('brand', e.target.value)}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
									placeholder="예: 대림바스"
								/>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">모델</label>
								<input
									type="text"
									value={form.attributes?.model || ''}
									onChange={(e) => updateAttr('model', e.target.value)}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								/>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">자재</label>
								<input
									type="text"
									value={form.attributes?.material || ''}
									onChange={(e) => updateAttr('material', e.target.value)}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								/>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">두께</label>
								<input
									type="text"
									value={form.attributes?.thickness || ''}
									onChange={(e) => updateAttr('thickness', e.target.value)}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								/>
							</div>
						</div>

						{/* Feature Evidence */}
						<div>
							<label className="text-xs text-sand-600 block mb-1">등급 판단 근거</label>
							<textarea
								value={form.attributes?.feature_evidence || ''}
								onChange={(e) => updateAttr('feature_evidence', e.target.value)}
								className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300 resize-none"
								rows={2}
								placeholder="등급 판단 근거를 입력하세요..."
							/>
						</div>

						{/* Bundled Toggle */}
						<div className="flex items-center gap-3">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={form.is_bundled || false}
									onChange={(e) => setForm({ ...form, is_bundled: e.target.checked })}
									className="w-4 h-4 rounded border-sand-300 text-forest-600 focus:ring-forest-300"
								/>
								<span className="text-sm text-sand-800">일식 항목 (De-bundling 필요)</span>
							</label>
							{form.is_bundled && (
								<span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
									Tab 3에서 분해
								</span>
							)}
						</div>

						{/* Reason Codes */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-sand-600 block mb-1">보정 사유</label>
								<select
									value={form.correction_reason_code || ''}
									onChange={(e) => setForm({ ...form, correction_reason_code: e.target.value as CorrectionReasonCode || null })}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								>
									<option value="">없음</option>
									{CORRECTION_REASONS.map((r) => (
										<option key={r.value} value={r.value}>{r.label}</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-xs text-sand-600 block mb-1">성공 사유</label>
								<select
									value={form.success_reason_code || ''}
									onChange={(e) => setForm({ ...form, success_reason_code: e.target.value as SuccessReasonCode || null })}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
								>
									<option value="">없음</option>
									{SUCCESS_REASONS.map((r) => (
										<option key={r.value} value={r.value}>{r.label}</option>
									))}
								</select>
							</div>
						</div>

						{/* Confidence */}
						<div>
							<label className="text-xs text-sand-600 block mb-1">
								신뢰도: {((form.confidence || 0.5) * 100).toFixed(0)}%
							</label>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={form.confidence || 0.5}
								onChange={(e) => setForm({ ...form, confidence: parseFloat(e.target.value) })}
								className="w-full h-2 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-forest-600"
							/>
							<div className="flex justify-between text-xs text-sand-500 mt-0.5">
								<span>0%</span>
								<span>50%</span>
								<span>100%</span>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-between pt-2 border-t border-sand-200">
							<button
								onClick={handleSave}
								disabled={saving}
								className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								저장
							</button>
							<button
								onClick={handleNext}
								disabled={saving}
								className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-sand-300 disabled:opacity-50"
							>
								저장 후 다음
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</motion.div>
				) : (
					<div className="bg-sand-50 rounded-xl border border-sand-200 p-8 text-center text-sand-500 text-sm">
						왼쪽에서 항목을 선택하여 라벨링을 시작하세요
					</div>
				)}
			</div>
		</div>
	)
}
