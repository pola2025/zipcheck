import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	theme?: 'forest' | 'red'
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	theme = 'forest'
}) => {
	if (totalPages <= 1) return null

	const themeColors = {
		forest: {
			active: 'bg-forest-600 text-white shadow-sm',
			inactive: 'bg-white text-sand-700 border border-sand-200 hover:bg-forest-50 hover:border-forest-300 hover:text-forest-700',
			disabled: 'bg-sand-50 text-sand-300 border border-sand-200 cursor-not-allowed'
		},
		red: {
			active: 'bg-red-500 text-white shadow-sm',
			inactive: 'bg-white text-sand-700 border border-sand-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600',
			disabled: 'bg-sand-50 text-sand-300 border border-sand-200 cursor-not-allowed'
		}
	}

	const colors = themeColors[theme]

	// Show max 5 page buttons with ellipsis
	const getPageNumbers = () => {
		const pages: (number | 'ellipsis')[] = []
		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) pages.push(i)
		} else {
			pages.push(1)
			if (currentPage > 3) pages.push('ellipsis')
			const start = Math.max(2, currentPage - 1)
			const end = Math.min(totalPages - 1, currentPage + 1)
			for (let i = start; i <= end; i++) pages.push(i)
			if (currentPage < totalPages - 2) pages.push('ellipsis')
			pages.push(totalPages)
		}
		return pages
	}

	return (
		<div className='flex justify-center items-center gap-2 mt-10'>
			<button
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				className={`p-2.5 rounded-lg transition-all ${
					currentPage === 1 ? colors.disabled : colors.inactive
				}`}
				aria-label="이전 페이지"
			>
				<ChevronLeft size={18} />
			</button>

			{getPageNumbers().map((page, i) =>
				page === 'ellipsis' ? (
					<span key={`ellipsis-${i}`} className="px-2 text-sand-400">...</span>
				) : (
					<button
						key={page}
						onClick={() => onPageChange(page)}
						className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all ${
							currentPage === page ? colors.active : colors.inactive
						}`}
					>
						{page}
					</button>
				)
			)}

			<button
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				className={`p-2.5 rounded-lg transition-all ${
					currentPage === totalPages ? colors.disabled : colors.inactive
				}`}
				aria-label="다음 페이지"
			>
				<ChevronRight size={18} />
			</button>
		</div>
	)
}

export default Pagination
