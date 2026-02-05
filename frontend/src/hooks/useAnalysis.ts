import { useState, useEffect, useCallback, useRef } from 'react'
import { getApiUrl } from '../lib/api-config'
import type { Analysis, AnalysisItem, DecisionLog, BenchmarkPrice, CategoryMapping } from '../types/analysis'

function getToken() {
	return localStorage.getItem('admin_token') || ''
}

function authHeaders() {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${getToken()}`,
	}
}

// ============================================
// Analysis CRUD
// ============================================

export function useAnalysisDetail(id: string | undefined) {
	const [analysis, setAnalysis] = useState<Analysis | null>(null)
	const [items, setItems] = useState<AnalysisItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetch_ = useCallback(async () => {
		if (!id) return
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}`), {
				headers: authHeaders(),
			})
			if (!res.ok) throw new Error(`${res.status}`)
			const result = await res.json()
			setAnalysis(result.data)
			setItems(result.data.items || [])
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}, [id])

	useEffect(() => { fetch_() }, [fetch_])

	return { analysis, items, loading, error, refetch: fetch_, setAnalysis, setItems }
}

// ============================================
// Analysis Patch (auto-save)
// ============================================

export function useAnalysisPatch(id: string | undefined) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [saving, setSaving] = useState(false)

	const patch = useCallback(async (data: Partial<Analysis>) => {
		if (!id) return
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}`), {
				method: 'PATCH',
				headers: authHeaders(),
				body: JSON.stringify(data),
			})
			if (!res.ok) throw new Error('패치 실패')
			return (await res.json()).data
		} finally {
			setSaving(false)
		}
	}, [id])

	const debouncedPatch = useCallback((data: Partial<Analysis>) => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => patch(data), 500)
	}, [patch])

	useEffect(() => {
		return () => { if (timerRef.current) clearTimeout(timerRef.current) }
	}, [])

	return { patch, debouncedPatch, saving }
}

// ============================================
// Item CRUD
// ============================================

export function useItemCrud(analysisId: string | undefined) {
	const [saving, setSaving] = useState(false)

	const createItem = useCallback(async (data: Partial<AnalysisItem>) => {
		if (!analysisId) return null
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${analysisId}/items`), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify(data),
			})
			if (!res.ok) throw new Error('항목 생성 실패')
			return (await res.json()).data as AnalysisItem
		} finally {
			setSaving(false)
		}
	}, [analysisId])

	const updateItem = useCallback(async (itemId: string, data: Partial<AnalysisItem>) => {
		if (!analysisId) return null
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${analysisId}/items/${itemId}`), {
				method: 'PUT',
				headers: authHeaders(),
				body: JSON.stringify(data),
			})
			if (!res.ok) throw new Error('항목 수정 실패')
			return (await res.json()).data as AnalysisItem
		} finally {
			setSaving(false)
		}
	}, [analysisId])

	const deleteItem = useCallback(async (itemId: string) => {
		if (!analysisId) return false
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${analysisId}/items/${itemId}`), {
				method: 'DELETE',
				headers: authHeaders(),
			})
			return res.ok
		} finally {
			setSaving(false)
		}
	}, [analysisId])

	const bulkImport = useCallback(async (items: Record<string, unknown>[]) => {
		if (!analysisId) return []
		setSaving(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${analysisId}/items/bulk`), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({ items }),
			})
			if (!res.ok) throw new Error('벌크 임포트 실패')
			return (await res.json()).data as AnalysisItem[]
		} finally {
			setSaving(false)
		}
	}, [analysisId])

	return { createItem, updateItem, deleteItem, bulkImport, saving }
}

// ============================================
// Decision Logs
// ============================================

export function useDecisionLogs(analysisId: string | undefined) {
	const [logs, setLogs] = useState<DecisionLog[]>([])
	const [loading, setLoading] = useState(false)

	const fetchLogs = useCallback(async () => {
		if (!analysisId) return
		setLoading(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${analysisId}/decisions`), {
				headers: authHeaders(),
			})
			if (res.ok) {
				const result = await res.json()
				setLogs(result.data || [])
			}
		} finally {
			setLoading(false)
		}
	}, [analysisId])

	const createLog = useCallback(async (data: Partial<DecisionLog>) => {
		if (!analysisId) return null
		const res = await fetch(getApiUrl(`/api/admin/analyses/${analysisId}/decisions`), {
			method: 'POST',
			headers: authHeaders(),
			body: JSON.stringify(data),
		})
		if (!res.ok) throw new Error('Decision Log 생성 실패')
		const result = await res.json()
		await fetchLogs()
		return result.data as DecisionLog
	}, [analysisId, fetchLogs])

	useEffect(() => { fetchLogs() }, [fetchLogs])

	return { logs, loading, fetchLogs, createLog }
}

// ============================================
// Benchmarks
// ============================================

export function useBenchmarkSearch() {
	const [results, setResults] = useState<BenchmarkPrice[]>([])
	const [searching, setSearching] = useState(false)

	const search = useCallback(async (params: Record<string, string>) => {
		setSearching(true)
		try {
			const res = await fetch(getApiUrl('/api/admin/benchmarks/search'), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify(params),
			})
			if (res.ok) {
				const result = await res.json()
				setResults(result.data || [])
			}
		} finally {
			setSearching(false)
		}
	}, [])

	return { results, searching, search }
}

// ============================================
// Category Mappings (Autocomplete)
// ============================================

export function useCategoryMappingSuggest() {
	const [suggestions, setSuggestions] = useState<CategoryMapping[]>([])

	const suggest = useCallback(async (name: string) => {
		if (!name || name.length < 2) {
			setSuggestions([])
			return
		}
		try {
			const res = await fetch(getApiUrl(`/api/admin/category-mappings/suggest?name=${encodeURIComponent(name)}`), {
				headers: authHeaders(),
			})
			if (res.ok) {
				const result = await res.json()
				setSuggestions(result.data || [])
			}
		} catch {
			// silent
		}
	}, [])

	return { suggestions, suggest }
}

// ============================================
// Complete Analysis
// ============================================

export function useCompleteAnalysis(id: string | undefined) {
	const [completing, setCompleting] = useState(false)

	const complete = useCallback(async (totalScore: number, scoreBreakdown: Record<string, unknown>) => {
		if (!id) return null
		setCompleting(true)
		try {
			const res = await fetch(getApiUrl(`/api/admin/analyses/${id}/complete`), {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({ total_score: totalScore, score_breakdown: scoreBreakdown }),
			})
			if (!res.ok) throw new Error('완료 처리 실패')
			return (await res.json()).data as Analysis
		} finally {
			setCompleting(false)
		}
	}, [id])

	return { complete, completing }
}
