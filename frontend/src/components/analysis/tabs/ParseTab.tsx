import { useState } from 'react'
import { Download, Plus, Trash2, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Analysis, AnalysisItem } from '../../../types/analysis'
import { getApiUrl } from '../../../lib/api-config'
import ItemCard from '../ItemCard'

interface Props {
	analysis: Analysis
	items: AnalysisItem[]
	onImportItems: (items: Record<string, unknown>[]) => Promise<AnalysisItem[]>
	onUpdateItem: (itemId: string, data: Partial<AnalysisItem>) => Promise<AnalysisItem | null>
	onDeleteItem: (itemId: string) => Promise<boolean>
	onUpdateAnalysis: (data: Partial<Analysis>) => void
	saving: boolean
}

export default function ParseTab({
	analysis, items, onImportItems, onUpdateItem, onDeleteItem, onUpdateAnalysis, saving
}: Props) {
	const [importing, setImporting] = useState(false)
	const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null)
	const selectedItem = items.find((i) => i.id === selectedItemId)

	const handleImport = async () => {
		if (items.length > 0 && !confirm('기존 항목이 있습니다. 추가로 가져오시겠습니까?')) return

		setImporting(true)
		try {
			// quote_request에서 items를 가져옴
			if (!analysis.quote_request_id) {
				alert('연결된 견적 요청이 없습니다.')
				return
			}

			const token = localStorage.getItem('admin_token')
			const res = await fetch(
				getApiUrl(`/api/quote-requests/admin/${analysis.quote_request_id}`),
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			if (!res.ok) throw new Error('견적 요청 로드 실패')

			const qr = await res.json()
			const qrItems = qr.items || []
			if (qrItems.length === 0) {
				alert('견적 요청에 항목이 없습니다.')
				return
			}

			const imported = await onImportItems(qrItems)
			if (imported.length > 0) {
				setSelectedItemId(imported[0].id)
			}
		} catch (error) {
			alert('항목 가져오기 실패: ' + (error instanceof Error ? error.message : String(error)))
		} finally {
			setImporting(false)
		}
	}

	const handleDeleteItem = async (itemId: string) => {
		if (!confirm('이 항목을 삭제하시겠습니까?')) return
		const ok = await onDeleteItem(itemId)
		if (ok && selectedItemId === itemId) {
			setSelectedItemId(items.find((i) => i.id !== itemId)?.id || null)
		}
	}

	return (
		<div className="space-y-4">
			{/* Metadata Form */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<div>
					<label className="text-xs text-sand-600 mb-1 block">건물유형</label>
					<select
						value={analysis.property_type || ''}
						onChange={(e) => onUpdateAnalysis({ property_type: e.target.value })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
					>
						<option value="">선택</option>
						<option value="아파트">아파트</option>
						<option value="빌라">빌라</option>
						<option value="오피스텔">오피스텔</option>
						<option value="단독주택">단독주택</option>
						<option value="상가">상가</option>
					</select>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">면적 (㎡)</label>
					<input
						type="number"
						value={analysis.property_size_sqm || ''}
						onChange={(e) => onUpdateAnalysis({ property_size_sqm: e.target.value ? Number(e.target.value) : null })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
						placeholder="㎡"
					/>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">지역</label>
					<select
						value={analysis.region || ''}
						onChange={(e) => onUpdateAnalysis({ region: e.target.value })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
					>
						<option value="">선택</option>
						<option value="서울">서울</option>
						<option value="경기">경기</option>
						<option value="지방">지방</option>
					</select>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">완전성</label>
					<select
						value={analysis.completeness || 'full'}
						onChange={(e) => onUpdateAnalysis({ completeness: e.target.value as 'full' | 'partial' | 'minimal' })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
					>
						<option value="full">완전</option>
						<option value="partial">부분</option>
						<option value="minimal">최소</option>
					</select>
				</div>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<div>
					<label className="text-xs text-sand-600 mb-1 block">업체명</label>
					<input
						type="text"
						value={analysis.contractor_name || ''}
						onChange={(e) => onUpdateAnalysis({ contractor_name: e.target.value })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
						placeholder="시공업체명"
					/>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">가격유형</label>
					<select
						value={analysis.pricing_type || 'itemized'}
						onChange={(e) => onUpdateAnalysis({ pricing_type: e.target.value as 'itemized' | 'lump_sum' | 'mixed' })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
					>
						<option value="itemized">항목별</option>
						<option value="lump_sum">일괄</option>
						<option value="mixed">혼합</option>
					</select>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">견적서 발행일</label>
					<input
						type="date"
						value={analysis.quote_date || ''}
						onChange={(e) => onUpdateAnalysis({ quote_date: e.target.value || null })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
					/>
				</div>
				<div>
					<label className="text-xs text-sand-600 mb-1 block">착공월</label>
					<select
						value={analysis.construction_start_month || ''}
						onChange={(e) => onUpdateAnalysis({ construction_start_month: e.target.value ? Number(e.target.value) : null })}
						className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm text-sand-900 focus:outline-none focus:border-forest-300"
					>
						<option value="">선택</option>
						{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
							<option key={m} value={m}>{m}월</option>
						))}
					</select>
				</div>
			</div>

			{/* Import Button */}
			{analysis.quote_request_id && (
				<div className="flex items-center gap-3">
					<button
						onClick={handleImport}
						disabled={importing}
						className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
							importing
								? 'bg-sand-100 text-sand-600 cursor-not-allowed'
								: 'bg-forest-600 hover:bg-forest-700 text-white'
						}`}
					>
						<Download className="w-4 h-4" />
						{importing ? '가져오는 중...' : '견적 항목 가져오기'}
					</button>
					<span className="text-xs text-sand-600">
						견적요청 ID: {analysis.quote_request_id}
					</span>
				</div>
			)}

			{/* Items List */}
			<div className="grid lg:grid-cols-2 gap-4">
				{/* Left: Item List */}
				<div className="space-y-2">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-semibold text-sand-800">
							파싱된 항목 ({items.length}개)
						</h3>
					</div>
					<div className="space-y-2 max-h-[500px] overflow-y-auto">
						{items.length === 0 ? (
							<div className="text-center py-8 text-sand-500 text-sm">
								항목이 없습니다. "견적 항목 가져오기"를 클릭하세요.
							</div>
						) : (
							items.map((item) => (
								<div key={item.id} className="relative group">
									<ItemCard
										item={item}
										isSelected={selectedItemId === item.id}
										onClick={() => setSelectedItemId(item.id)}
									/>
									<button
										onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id) }}
										className="absolute top-2 right-2 p-1 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							))
						)}
					</div>
				</div>

				{/* Right: Item Detail */}
				<div>
					{selectedItem ? (
						<motion.div
							key={selectedItem.id}
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							className="bg-sand-50 rounded-xl p-4 border border-sand-200 space-y-3"
						>
							<h3 className="text-sm font-semibold text-sand-800">항목 상세</h3>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs text-sand-600 block mb-1">카테고리</label>
									<input
										value={selectedItem.original_category || ''}
										readOnly
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900"
									/>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">항목명</label>
									<input
										value={selectedItem.original_item_name || ''}
										readOnly
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900"
									/>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">수량</label>
									<input
										value={selectedItem.original_quantity ?? ''}
										readOnly
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900"
									/>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">단위</label>
									<input
										value={selectedItem.original_unit || ''}
										readOnly
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900"
									/>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">단가</label>
									<input
										value={(selectedItem.original_unit_price || 0).toLocaleString()}
										readOnly
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900"
									/>
								</div>
								<div>
									<label className="text-xs text-sand-600 block mb-1">금액</label>
									<input
										value={(selectedItem.original_total_price || 0).toLocaleString()}
										readOnly
										className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900 font-semibold"
									/>
								</div>
							</div>

							{selectedItem.original_notes && (
								<div>
									<label className="text-xs text-sand-600 block mb-1">비고</label>
									<p className="text-sm text-sand-700 bg-white border border-sand-300 rounded-lg p-3">
										{selectedItem.original_notes}
									</p>
								</div>
							)}

							<div>
								<label className="text-xs text-sand-600 block mb-1">에러 분류</label>
								<select
									value={selectedItem.error_type || ''}
									onChange={async (e) => {
										const val = e.target.value || null
										await onUpdateItem(selectedItem.id, { error_type: val as AnalysisItem['error_type'] })
									}}
									className="w-full px-3 py-2 bg-white border border-sand-300 rounded-lg text-sm text-sand-900 focus:outline-none focus:border-forest-300"
								>
									<option value="">없음</option>
									<option value="parsing_error">파싱 에러</option>
									<option value="reasoning_error">추론 에러</option>
								</select>
							</div>
						</motion.div>
					) : (
						<div className="bg-sand-50 rounded-xl p-8 border border-sand-200 text-center text-sand-500 text-sm">
							왼쪽에서 항목을 선택하세요
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
