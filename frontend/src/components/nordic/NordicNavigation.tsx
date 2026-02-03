import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navLinks = [
	{ label: '서비스', href: '#features' },
	{ label: '분석 예시', href: '#examples' },
	{ label: '요금', href: '#pricing' }
]

export default function NordicNavigation() {
	const [open, setOpen] = useState(false)

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-sand-50/85 backdrop-blur-lg border-b border-sand-300/50">
			<div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
				<Link to="/" className="flex items-center">
					<img src="/logo.png" alt="집첵" className="h-7 w-auto" />
				</Link>

				{/* Desktop nav */}
				<div className="hidden md:flex items-center gap-8 text-sm text-sand-700">
					{navLinks.map((link) => (
						<a key={link.href} href={link.href} className="hover:text-forest-600 transition font-medium">
							{link.label}
						</a>
					))}
					<Link
						to="/plan-selection"
						className="px-6 py-2.5 bg-forest-600 text-white rounded-xl font-semibold hover:bg-forest-700 transition text-sm shadow-sm"
					>
						견적 분석 신청
					</Link>
				</div>

				{/* Mobile hamburger */}
				<button
					className="md:hidden p-2 -mr-2 text-sand-700"
					onClick={() => setOpen(!open)}
					aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
				>
					{open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
				</button>
			</div>

			{/* Mobile menu */}
			{open && (
				<div className="md:hidden bg-sand-50/95 backdrop-blur-lg border-t border-sand-300/50 px-5 pb-5">
					<div className="flex flex-col gap-1 pt-2">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="py-3 text-sand-700 font-medium hover:text-forest-600 transition"
								onClick={() => setOpen(false)}
							>
								{link.label}
							</a>
						))}
						<Link
							to="/plan-selection"
							className="mt-2 py-3 bg-forest-600 text-white rounded-xl font-semibold text-center hover:bg-forest-700 transition text-sm shadow-sm"
							onClick={() => setOpen(false)}
						>
							견적 분석 신청
						</Link>
					</div>
				</div>
			)}
		</nav>
	)
}
