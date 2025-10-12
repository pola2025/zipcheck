import React from 'react'

interface PaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	theme?: 'cyan' | 'red'
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	theme = 'cyan'
}) => {
	if (totalPages <= 1) return null

	const themeColors = {
		cyan: {
			border: 'border-cyan-500/30',
			hover: 'hover:border-cyan-400/50 hover:bg-cyan-500/10',
			active: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 glow-cyan'
		},
		red: {
			border: 'border-red-500/30',
			hover: 'hover:border-red-400/50 hover:bg-red-500/10',
			active: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
		}
	}

	const colors = themeColors[theme]

	return (
		<div className='flex justify-center gap-3 mt-8'>
			<button
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				className={`px-5 py-3 glass-dark border ${colors.border} rounded-xl ${colors.hover} disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold`}
			>
				이전
			</button>

			{[...Array(totalPages)].map((_, i) => (
				<button
					key={i + 1}
					onClick={() => onPageChange(i + 1)}
					className={`px-5 py-3 rounded-xl font-semibold transition-all ${
						currentPage === i + 1
							? colors.active
							: `glass-dark border ${colors.border} ${colors.hover} text-gray-300`
					}`}
				>
					{i + 1}
				</button>
			))}

			<button
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				className={`px-5 py-3 glass-dark border ${colors.border} rounded-xl ${colors.hover} disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold`}
			>
				다음
			</button>
		</div>
	)
}

export default Pagination
