import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Eye } from 'lucide-react'
import { getApiUrl } from '../../lib/api-config'

interface BeforeAfterGalleryProps {
	beforeImages?: string[]
	afterImages?: string[]
	/** @deprecated Use beforeImages and afterImages instead */
	images?: string[]
	imageBaseUrl?: string
}

type TabId = 'before' | 'after' | 'compare'

interface TabDef {
	id: TabId
	label: string
}

const TABS: TabDef[] = [
	{ id: 'before', label: 'Before' },
	{ id: 'after', label: 'After' },
	{ id: 'compare', label: '비교' },
]

export default function BeforeAfterGallery({
	beforeImages: beforeImagesProp,
	afterImages: afterImagesProp,
	images: legacyImages,
	imageBaseUrl,
}: BeforeAfterGalleryProps) {
	// Support legacy single-array prop: treat all as "before" images
	const beforeImages = beforeImagesProp ?? legacyImages ?? []
	const afterImages = afterImagesProp ?? []

	const [activeTab, setActiveTab] = useState<TabId>('before')
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
	const [lightboxList, setLightboxList] = useState<string[]>([])
	const [lightboxIndex, setLightboxIndex] = useState(0)

	const baseUrl = imageBaseUrl ?? getApiUrl('/images/')

	const resolveUrl = useCallback(
		(src: string) => {
			if (src.startsWith('http://') || src.startsWith('https://')) return src
			return `${baseUrl}${src}`
		},
		[baseUrl]
	)

	// Close lightbox on Escape key
	useEffect(() => {
		if (!lightboxSrc) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setLightboxSrc(null)
			} else if (e.key === 'ArrowLeft') {
				navigateLightbox(-1)
			} else if (e.key === 'ArrowRight') {
				navigateLightbox(1)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		// Prevent body scroll when lightbox is open
		document.body.style.overflow = 'hidden'

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lightboxSrc, lightboxIndex, lightboxList])

	const openLightbox = useCallback(
		(src: string, list: string[], index: number) => {
			setLightboxSrc(resolveUrl(src))
			setLightboxList(list)
			setLightboxIndex(index)
		},
		[resolveUrl]
	)

	const closeLightbox = useCallback(() => {
		setLightboxSrc(null)
	}, [])

	const navigateLightbox = useCallback(
		(direction: -1 | 1) => {
			const newIndex = lightboxIndex + direction
			if (newIndex < 0 || newIndex >= lightboxList.length) return
			setLightboxIndex(newIndex)
			setLightboxSrc(resolveUrl(lightboxList[newIndex]))
		},
		[lightboxIndex, lightboxList, resolveUrl]
	)

	const hasBefore = beforeImages.length > 0
	const hasAfter = afterImages.length > 0
	const hasComparison = hasBefore && hasAfter

	if (!hasBefore && !hasAfter) return null

	// Build comparison pairs: zip before and after by index
	const comparisonPairs = Array.from(
		{ length: Math.max(beforeImages.length, afterImages.length) },
		(_, i) => ({
			before: beforeImages[i] ?? null,
			after: afterImages[i] ?? null,
		})
	)

	const renderImageGrid = (images: string[], labelPrefix: string) => (
		<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
			{images.map((src, idx) => (
				<button
					key={idx}
					type="button"
					onClick={() => openLightbox(src, images, idx)}
					className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 hover:border-[#0A9DAA]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A9DAA]/50 focus:ring-offset-2"
					aria-label={`${labelPrefix} ${idx + 1}번 사진 크게 보기`}
				>
					<img
						src={resolveUrl(src)}
						alt={`${labelPrefix} ${idx + 1}`}
						className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>
					<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
						<Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
					</div>
				</button>
			))}
		</div>
	)

	const renderComparisonView = () => (
		<div className="space-y-4">
			{comparisonPairs.map((pair, idx) => (
				<div
					key={idx}
					className="grid grid-cols-2 gap-2 md:gap-3"
				>
					{/* Before */}
					<div className="relative">
						{pair.before ? (
							<button
								type="button"
								onClick={() =>
									openLightbox(pair.before!, beforeImages, beforeImages.indexOf(pair.before!))
								}
								className="group w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 hover:border-[#0A9DAA]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A9DAA]/50 focus:ring-offset-2"
								aria-label={`시공 전 ${idx + 1}번 사진 크게 보기`}
							>
								<img
									src={resolveUrl(pair.before)}
									alt={`시공 전 ${idx + 1}`}
									className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
									loading="lazy"
								/>
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
							</button>
						) : (
							<div className="w-full aspect-[4/3] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
								<span className="text-xs text-gray-400">이미지 없음</span>
							</div>
						)}
						<div className="absolute top-2 left-2 bg-gray-800/75 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider z-10">
							Before
						</div>
					</div>

					{/* After */}
					<div className="relative">
						{pair.after ? (
							<button
								type="button"
								onClick={() =>
									openLightbox(pair.after!, afterImages, afterImages.indexOf(pair.after!))
								}
								className="group w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 hover:border-[#0A9DAA]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A9DAA]/50 focus:ring-offset-2"
								aria-label={`시공 후 ${idx + 1}번 사진 크게 보기`}
							>
								<img
									src={resolveUrl(pair.after)}
									alt={`시공 후 ${idx + 1}`}
									className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
									loading="lazy"
								/>
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
							</button>
						) : (
							<div className="w-full aspect-[4/3] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
								<span className="text-xs text-gray-400">이미지 없음</span>
							</div>
						)}
						<div className="absolute top-2 left-2 bg-[#0A9DAA]/85 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider z-10">
							After
						</div>
					</div>
				</div>
			))}
		</div>
	)

	return (
		<div>
			{/* Tab Navigation */}
			<div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg" role="tablist">
				{TABS.map((tab) => {
					// Hide comparison tab when there are no pairs to compare
					if (tab.id === 'compare' && !hasComparison) return null
					// Hide before/after tabs when empty
					if (tab.id === 'before' && !hasBefore) return null
					if (tab.id === 'after' && !hasAfter) return null

					const isActive = activeTab === tab.id
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`tabpanel-${tab.id}`}
							onClick={() => setActiveTab(tab.id)}
							className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-medium rounded-md transition-all ${
								isActive
									? 'bg-white text-[#0A9DAA] shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							{tab.label}
							{tab.id === 'before' && (
								<span className="ml-1.5 text-xs text-gray-400">
									{beforeImages.length}
								</span>
							)}
							{tab.id === 'after' && (
								<span className="ml-1.5 text-xs text-gray-400">
									{afterImages.length}
								</span>
							)}
						</button>
					)
				})}
			</div>

			{/* Tab Panels */}
			<div
				id={`tabpanel-${activeTab}`}
				role="tabpanel"
				aria-label={`${TABS.find((t) => t.id === activeTab)?.label} 탭 내용`}
			>
				{activeTab === 'before' && hasBefore && renderImageGrid(beforeImages, '시공 전')}
				{activeTab === 'after' && hasAfter && renderImageGrid(afterImages, '시공 후')}
				{activeTab === 'compare' && hasComparison && renderComparisonView()}
			</div>

			{/* Lightbox Modal */}
			{lightboxSrc && (
				<div
					className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
					onClick={closeLightbox}
					role="dialog"
					aria-modal="true"
					aria-label="이미지 크게 보기"
				>
					{/* Close button */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							closeLightbox()
						}}
						className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white z-50 transition-colors"
						aria-label="닫기"
					>
						<X className="w-8 h-8" />
					</button>

					{/* Previous button */}
					{lightboxIndex > 0 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								navigateLightbox(-1)
							}}
							className="absolute left-2 md:left-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white z-50 transition-colors"
							aria-label="이전 이미지"
						>
							<ChevronLeft className="w-10 h-10" />
						</button>
					)}

					{/* Next button */}
					{lightboxIndex < lightboxList.length - 1 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								navigateLightbox(1)
							}}
							className="absolute right-2 md:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white z-50 transition-colors"
							aria-label="다음 이미지"
						>
							<ChevronRight className="w-10 h-10" />
						</button>
					)}

					{/* Image */}
					<img
						src={lightboxSrc}
						alt={`사진 ${lightboxIndex + 1}`}
						className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
						onClick={(e) => e.stopPropagation()}
					/>

					{/* Counter */}
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/80 text-sm px-4 py-1.5 rounded-full">
						{lightboxIndex + 1} / {lightboxList.length}
					</div>
				</div>
			)}
		</div>
	)
}
