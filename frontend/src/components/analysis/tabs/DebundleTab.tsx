import { useState } from 'react'
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AnalysisItem, BundleComponent } from '../../../types/analysis'
import ItemCard from '../ItemCard'

interface Props {
	items: AnalysisItem[]
	onUpdateItem: (itemId: string, data: Partial<AnalysisItem>) => Promise<AnalysisItem | null>
	saving: boolean
}

export default function DebundleTab({ items, onUpdateItem, saving }: Props) {
	const bundledItems = items.filter((i) => i.is_bundled)
	const [selectedItemId, setSelectedItemId] = useState<string | null>(bundledItems[0]?.id || null)
	const selectedItem = bundledItems.find((i) => i.id === selectedItemId)
	const [components, setComponents] = useState<BundleComponent[]>([])
	const [logic, setLogic] = useState('')

	// Sync form when selection changes
	useState(() => {
		if (selectedItem) {
			setComponents(selectedItem.components?.length ? selectedItem.components : [])
			setLogic(selectedItem.debundling_logic || '')
		}
	})

	const handleSelect = (id: string) => {
		setSelectedItemId(id)
		const item = bundledItems.find((i) => i.id === id)
		if (item) {
			setComponents(item.components?.length ? [...item.components] : [])
			setLogic(item.debundling_logic || '')
		}
	}

	const addComponent = () => {
		setComponents([...components, { name: '', estimatedRatio: 0, variance_estimate: 0 }])
	}

	const removeComponent = (idx: number) => {
		setComponents(components.filter((_, i) => i !== idx))
	}

	const updateComponent = (idx: number, field: keyof BundleComponent, value: string | number) => {
		const updated = [...components]
		updated[idx] = { ...updated[idx], [field]: value }
		setComponents(updated)
	}

	const totalRatio = components.reduce((sum, c) => sum + (c.estimatedRatio || 0), 0)
	const ratioValid = Math.abs(totalRatio - 1.0) < 0.01

	// Variance warning: any component with variance > 10%
	const hasHighVariance = components.some((c) => c.variance_estimate > 10)

	const handleSave = async () => {
		if (!selectedItem) return
		await onUpdateItem(selectedItem.id, {
			components,
			debundling_logic: logic,
		})
	}

	return (
		<div className="space-y-4">
			{bundledItems.length === 0 ? (
				<div className="text-center py-12 text-sand-500">
					<p className="text-lg font-semibold mb-2">일식 항목이 없습니다</p>
					<p className="text-sm">Tab 2 (정규화)에서 항목을 "일식"으로 체크하면 여기에 표시됩니다.</p>
				</div>
			) : (
				<div className="grid lg:grid-cols-[320px_1fr] gap-4">
					{/* Left: Bundled Items */}
					<div className="space-y-2">
						<h3 className="text-sm font-semibold text-sand-800 mb-2">
							일식 항목 ({bundledItems.length})
						</h3>
						<div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
							{bundledItems.map((item) => (
								<ItemCard
									key={item.id}
									item={item}
									isSelected={selectedItemId === item.id}
									onClick={() => handleSelect(item.id)}
								/>
							))}
						</div>
					</div>

					{/* Right: Decomposition Editor */}
					<div>
						{selectedItem ? (
							<motion.div
								key={selectedItem.id}
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								className="bg-sand-50 rounded-xl border border-sand-200 p-4 space-y-4"
							>
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-sm font-semibold text-sand-900">
											{selectedItem.original_item_name || '항목명 없음'}
										</h3>
										<p className="text-xs text-sand-600">
											총액: {(selectedItem.original_total_price || 0).toLocaleString()}원
										</p>
									</div>
									<button
										onClick={addComponent}
										className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-lg text-sm font-semibold text-forest-600 transition-all flex items-center gap-1"
									>
										<Plus className="w-4 h-4" />
										구성요소 추가
									</button>
								</div>

								{/* Ratio Total Indicator */}
								<div className="flex items-center gap-2">
									<div className="flex-1 bg-sand-200 rounded-full h-2">
										<div
											className={`h-2 rounded-full transition-all ${
												ratioValid ? 'bg-green-500' :
												totalRatio > 1 ? 'bg-red-500' : 'bg-amber-500'
											}`}
											style={{ width: `${Math.min(totalRatio * 100, 100)}%` }}
										/>
									</div>
									<span className={`text-xs font-mono ${ratioValid ? 'text-green-600' : 'text-red-600'}`}>
										{(totalRatio * 100).toFixed(0)}%
									</span>
								</div>

								{!ratioValid && (
									<p className="text-xs text-red-600">비율 합계가 100%여야 합니다.</p>
								)}

								{/* Variance Warning */}
								{hasHighVariance && (
									<div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
										<AlertTriangle className="w-4 h-4 text-red-500" />
										<span className="text-xs text-red-700">
											평가자 간 ratio 차이가 10%p를 초과하는 항목이 있습니다.
										</span>
									</div>
								)}

								{/* Components */}
								<div className="space-y-3">
									{components.map((comp, idx) => (
										<div key={idx} className="bg-white rounded-lg p-3 border border-sand-200 space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-xs text-sand-500 font-semibold">
													구성요소 {idx + 1}
												</span>
												<button
													onClick={() => removeComponent(idx)}
													className="p-1 text-red-400 hover:text-red-600 transition-colors"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
											<div className="grid grid-cols-3 gap-2">
												<div className="col-span-3 sm:col-span-1">
													<label className="text-xs text-sand-500 block mb-0.5">구성요소명</label>
													<input
														type="text"
														value={comp.name}
														onChange={(e) => updateComponent(idx, 'name', e.target.value)}
														className="w-full px-2 py-1.5 bg-sand-50 border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
														placeholder="예: 타일 자재"
													/>
												</div>
												<div>
													<label className="text-xs text-sand-500 block mb-0.5">비율</label>
													<input
														type="number"
														min="0"
														max="1"
														step="0.05"
														value={comp.estimatedRatio}
														onChange={(e) => updateComponent(idx, 'estimatedRatio', parseFloat(e.target.value) || 0)}
														className="w-full px-2 py-1.5 bg-sand-50 border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300"
													/>
												</div>
												<div>
													<label className="text-xs text-sand-500 block mb-0.5">오차 (±%)</label>
													<input
														type="number"
														min="0"
														max="100"
														step="1"
														value={comp.variance_estimate}
														onChange={(e) => updateComponent(idx, 'variance_estimate', parseFloat(e.target.value) || 0)}
														className={`w-full px-2 py-1.5 bg-sand-50 border rounded-lg text-sm focus:outline-none focus:border-forest-300 ${
															comp.variance_estimate > 10 ? 'border-red-400' : 'border-sand-300'
														}`}
													/>
												</div>
											</div>
											{/* Estimated amount */}
											<p className="text-xs text-sand-500">
												추정 금액: {Math.round((selectedItem.original_total_price || 0) * comp.estimatedRatio).toLocaleString()}원
											</p>
										</div>
									))}

									{components.length === 0 && (
										<div className="text-center py-6 text-sand-400 text-sm">
											"구성요소 추가"를 클릭하여 분해를 시작하세요
										</div>
									)}
								</div>

								{/* Debundling Logic */}
								<div>
									<label className="text-xs text-sand-600 block mb-1">분해 근거</label>
									<textarea
										value={logic}
										onChange={(e) => setLogic(e.target.value)}
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm focus:outline-none focus:border-forest-300 resize-none"
										rows={3}
										placeholder="일식 분해의 근거를 입력하세요..."
									/>
								</div>

								{/* Save */}
								<div className="flex justify-end pt-2 border-t border-sand-200">
									<button
										onClick={handleSave}
										disabled={saving || !ratioValid}
										className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
									>
										<Save className="w-4 h-4" />
										저장
									</button>
								</div>
							</motion.div>
						) : (
							<div className="bg-sand-50 rounded-xl border border-sand-200 p-8 text-center text-sand-500 text-sm">
								왼쪽에서 일식 항목을 선택하세요
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
