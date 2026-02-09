import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navLinks = [
	{ label: '서비스', hash: '#features' },
	{ label: '분석 예시', hash: '#examples' },
	{ label: '요금', hash: '#pricing' },
	{ label: '커뮤니티', href: '/community' }
]

export default function NordicNavigation() {
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const toggleRef = useRef<HTMLButtonElement>(null)
	const { pathname } = useLocation()
	const isLanding = pathname === '/'

	// Escape key closes mobile menu
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape' && open) {
			setOpen(false)
			toggleRef.current?.focus()
		}
	}, [open])

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])

	// Close mobile menu on route change
	useEffect(() => { setOpen(false) }, [pathname])

	// Hash link: on landing page scroll to section, on other pages navigate to /#hash
	const renderNavLink = (link: typeof navLinks[number], mobile = false) => {
		const cls = mobile
			? 'py-3 text-sand-700 font-medium hover:text-forest-600 transition'
			: 'hover:text-forest-600 transition font-medium'

		if (link.href) {
			return (
				<Link
					key={link.href}
					to={link.href}
					className={cls}
					onClick={() => setOpen(false)}
				>
					{link.label}
				</Link>
			)
		}

		// Hash link
		const target = isLanding ? link.hash! : `/${link.hash}`
		if (isLanding) {
			return (
				<a
					key={link.hash}
					href={link.hash}
					className={cls}
					onClick={() => setOpen(false)}
				>
					{link.label}
				</a>
			)
		}
		return (
			<Link
				key={link.hash}
				to={target}
				className={cls}
				onClick={() => setOpen(false)}
			>
				{link.label}
			</Link>
		)
	}

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-sand-50/85 backdrop-blur-lg border-b border-sand-300/50" aria-label="메인 네비게이션">
			<div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
				<Link to="/" className="flex items-center">
					<img src="/logo.png" alt="집첵 홈" className="h-12 w-auto" />
				</Link>

				{/* Desktop nav */}
				<div className="hidden md:flex items-center gap-8 text-sm text-sand-700">
					{navLinks.map((link) => renderNavLink(link))}
					<Link
						to="/quote-submission"
						className="px-6 py-2.5 bg-forest-600 text-white rounded-xl font-semibold hover:bg-forest-700 transition text-sm shadow-sm"
					>
						무료 분석 받기 <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full" aria-hidden="true">FREE</span>
					</Link>
				</div>

				{/* Mobile hamburger */}
				<button
					ref={toggleRef}
					className="md:hidden p-2 -mr-2 text-sand-700"
					onClick={() => setOpen(!open)}
					aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
					aria-expanded={open}
					aria-controls="mobile-menu"
				>
					{open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
				</button>
			</div>

			{/* Mobile menu */}
			{open && (
				<div id="mobile-menu" ref={menuRef} role="menu" className="md:hidden bg-sand-50/95 backdrop-blur-lg border-t border-sand-300/50 px-5 pb-5">
					<div className="flex flex-col gap-1 pt-2">
						{navLinks.map((link) => renderNavLink(link, true))}
						<Link
							to="/quote-submission"
							className="mt-2 py-3 bg-forest-600 text-white rounded-xl font-semibold text-center hover:bg-forest-700 transition text-sm shadow-sm"
							onClick={() => setOpen(false)}
						>
							무료 분석 받기
						</Link>
					</div>
				</div>
			)}
		</nav>
	)
}
