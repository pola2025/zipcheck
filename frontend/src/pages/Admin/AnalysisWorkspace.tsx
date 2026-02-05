import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getApiUrl } from '../../lib/api-config'
import { adminPath } from '../../lib/admin-path'
import type { Analysis, AnalysisItem, ScoreBreakdown } from '../../types/analysis'

import AnalysisHeader from '../../components/analysis/AnalysisHeader'
import TabBar from '../../components/analysis/TabBar'
import BlindLabelingBanner from '../../components/analysis/BlindLabelingBanner'
import ParseTab from '../../components/analysis/tabs/ParseTab'
import NormalizeTab from '../../components/analysis/tabs/NormalizeTab'
import DebundleTab from '../../components/analysis/tabs/DebundleTab'
import VatTab from '../../components/analysis/tabs/VatTab'
import BenchmarkTab from '../../components/analysis/tabs/BenchmarkTab'
import ScoreTab from '../../components/analysis/tabs/ScoreTab'
import ConflictTab from '../../components/analysis/tabs/ConflictTab'

function authHeaders() {
	const token = localStorage.getItem('admin_token') || ''
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	}
}

export default function AnalysisWorkspace() {
	const { id } = useParams<{ id: string }>()
	const { token } = useAuth()
	const [analysis, setAnalysis] = useState<Analysis | null>(null)
	const [items, setItems] = useState<AnalysisItem[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState(1)
	const [saving, setSaving] = useState(false)
	const [completing, setCompleting] = useState(false)

	// URL query tab sync
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const tab = parseInt(params.get('tab') || '1')
		if (tab >= 1 && tab <= 7) setActiveTab(tab)
	}, [])

	useEffect(() => {
		if (id) fetchAnalysis()
	}, [id])

	const fetchAnalysis = async () => {
		setLoading(true)
		try {
			const response = await fetch(getApiUrl(`/api/admin/analyses/${id}`), {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (!response.ok) throw new Error('분석 로드 실패')
			const result = await response.json()
			setAnalysis(result.data)
			setItems(result.data.items || [])
		} catch (error) {
			console.error('Failed to fetch analysis:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleTabChange = (tab: number) => {
		setActiveTab(tab)
		const url = new URL(window.location.href)
		url.searchParams.set('tab', String(tab))
		window.history.replaceState({}, '', url.toString())
	}

	// ============================================
	// Analysis Patch (debounced)
	// ============================================
	const patchTimerRef = { current: null as ReturnType<typeof setTimeout> | null }

	const patchAnalysis = useCallback((data: Partial<Analysis>) => {
		if (!id) return
		// Optimistic update
		setAnalysis((prev) => prev ? { ...prev, ...data, updated_at: new Date().toISOString() } as Analysis : prev)

		if (patchTimerRef.current) clearTimeout(patchTimerRef.current)
		patchTimerRef.current = setTimeout(async () => {
			try {
				await fetch(getApiUrl(`/api/admin/analyses/${id}`), {
					method: 'PATCH',
					headers: authHeaders(),
					body: JSON.stringify(data),
				})
			} catch (e) {
				console.error('Patch failed:', e)
			}
		}, 500)
	}, [id])

	// ============================================
	// Item CRUD
	// ============================================
	const updateItem = useCallback(async (itemId: string, data: Partial<AnalysisItem>): Promise<AnalysisItem | null> => {
		if (!id) return null
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}/items/${itemId}`), {
				method: 'PUT',
				headers: authHeaders(),
				body: JSON.stringify(data),
			})
			if (!res.ok) throw new Error('항목 수정 실패')
			const result = await res.json()
			const updated = result.data as AnalysisItem
			setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)))
			return updated
		} catch (e) {
			console.error('Update item failed:', e)
			return null
		} finally {
			setSaving(false)
		}
	}, [id])

	const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
		if (!id) return false
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}/items/${itemId}`), {
				method: 'DELETE',
				headers: authHeaders(),
			})
			if (res.ok) {
				setItems((prev) => prev.filter((i) => i.id !== itemId))
				return true
			}
			return false
		} finally {
			setSaving(false)
		}
	}, [id])

	const bulkImport = useCallback(async (importItems: Record<string, unknown>[]): Promise<AnalysisItem[]> => {
		if (!id) return []
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}/items/bulk`), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({ items: importItems }),
			})
			if (!res.ok) throw new Error('벌크 임포트 실패')
			const result = await res.json()
			const imported = (result.data || []) as AnalysisItem[]
			setItems((prev) => [...prev, ...imported])
			return imported
		} finally {
			setSaving(false)
		}
	}, [id])

	// ============================================
	// Complete Analysis
	// ============================================
	const completeAnalysis = useCallback(async (totalScore: number, scoreBreakdown: ScoreBreakdown): Promise<Analysis | null> => {
		if (!id) return null
		setCompleting(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}/complete`), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({ total_score: totalScore, score_breakdown: scoreBreakdown }),
			})
			if (!res.ok) throw new Error('완료 처리 실패')
			const result = await res.json()
			setAnalysis(result.data)
			return result.data as Analysis
		} catch (e) {
			console.error('Complete failed:', e)
			alert('분석 완료 처리에 실패했습니다.')
			return null
		} finally {
			setCompleting(false)
		}
	}, [id])

	// ============================================
	// Render
	// ============================================
	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<RefreshCw className="w-12 h-12 mx-auto mb-4 text-forest-300 animate-spin" />
					<p className="text-sand-700 text-sm">분석 데이터 로딩 중...</p>
				</div>
			</div>
		)
	}

	if (!analysis) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<p className="text-sand-700 mb-4">분석을 찾을 수 없습니다.</p>
					<Link
						to={adminPath('/analyses')}
						className="px-4 py-2 bg-forest-600 text-white rounded-xl text-sm font-semibold hover:bg-forest-700 transition-all"
					>
						목록으로 돌아가기
					</Link>
				</div>
			</div>
		)
	}

	const renderTab = () => {
		switch (activeTab) {
			case 1:
				return (
					<ParseTab
						analysis={analysis}
						items={items}
						onImportItems={bulkImport}
						onUpdateItem={updateItem}
						onDeleteItem={deleteItem}
						onUpdateAnalysis={patchAnalysis}
						saving={saving}
					/>
				)
			case 2:
				return (
					<NormalizeTab
						analysis={analysis}
						items={items}
						onUpdateItem={updateItem}
						saving={saving}
					/>
				)
			case 3:
				return (
					<DebundleTab
						items={items}
						onUpdateItem={updateItem}
						saving={saving}
					/>
				)
			case 4:
				return (
					<VatTab
						analysis={analysis}
						items={items}
						onUpdateAnalysis={patchAnalysis}
						onUpdateItem={updateItem}
					/>
				)
			case 5:
				return (
					<BenchmarkTab
						analysis={analysis}
						items={items}
						onUpdateItem={updateItem}
						saving={saving}
					/>
				)
			case 6:
				return (
					<ScoreTab
						analysis={analysis}
						items={items}
						onComplete={completeAnalysis}
						completing={completing}
					/>
				)
			case 7:
				return (
					<ConflictTab
						analysis={analysis}
						items={items}
					/>
				)
			default:
				return null
		}
	}

	return (
		<div className="space-y-4">
			<AnalysisHeader analysis={analysis} itemCount={items.length} />
			<BlindLabelingBanner isBlind={analysis.is_blind_labeling} />
			<TabBar activeTab={activeTab} onTabChange={handleTabChange} />

			{/* Tab Content */}
			<div className="bg-white rounded-2xl border border-sand-300 p-6 min-h-[400px]">
				{renderTab()}
			</div>
		</div>
	)
}
