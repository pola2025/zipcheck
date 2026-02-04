import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { type SubdomainType, getSubdomainUrl } from '../lib/subdomain'

interface NavLink {
	label: string
	href: string
	isRoute?: boolean
	isExternal?: boolean
}

function getNavLinks(subdomain: SubdomainType): NavLink[] {
	if (subdomain === 'review') {
		return [
			{ label: '후기 목록', href: '/reviews', isRoute: true },
			{ label: '후기 작성', href: '/write/review', isRoute: true },
			{ label: '피해사례', href: getSubdomainUrl('report'), isExternal: true },
			{ label: '블로그', href: getSubdomainUrl('blog'), isExternal: true },
			{ label: '집첵 메인', href: getSubdomainUrl('main'), isExternal: true },
		]
	}
	if (subdomain === 'report') {
		return [
			{ label: '피해사례 목록', href: '/damage-cases', isRoute: true },
			{ label: '사례 등록', href: '/write/damage-case', isRoute: true },
			{ label: '블랙리스트 조회', href: '/blacklist-check', isRoute: true },
			{ label: '업체 후기', href: getSubdomainUrl('review'), isExternal: true },
			{ label: '집첵 메인', href: getSubdomainUrl('main'), isExternal: true },
		]
	}
	// blog subdomain
	return [
		{ label: '블로그', href: '/', isRoute: true },
		{ label: '업체 후기', href: getSubdomainUrl('review'), isExternal: true },
		{ label: '피해사례', href: getSubdomainUrl('report'), isExternal: true },
		{ label: '집첵 메인', href: getSubdomainUrl('main'), isExternal: true },
	]
}

function getCtaConfig(subdomain: SubdomainType) {
	if (subdomain === 'review') {
		return { label: '후기 작성', href: '/write/review', color: 'bg-forest-600 hover:bg-forest-700' }
	}
	if (subdomain === 'report') {
		return { label: '사례 등록', href: '/write/damage-case', color: 'bg-red-500 hover:bg-red-600' }
	}
	// blog
	return { label: '후기 작성', href: getSubdomainUrl('review') + '/write/review', color: 'bg-forest-600 hover:bg-forest-700', isExternal: true }
}

export default function SubdomainNavigation({ subdomain }: { subdomain: SubdomainType }) {
	const [open, setOpen] = useState(false)
	const navLinks = getNavLinks(subdomain)
	const cta = getCtaConfig(subdomain)
	const ctaIsExternal = 'isExternal' in cta && cta.isExternal

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-sand-50/85 backdrop-blur-lg border-b border-sand-300/50">
			<div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
				<Link to="/" className="flex items-center">
					<img src="/logo.png" alt="집첵" className="h-12 w-auto" />
				</Link>

				{/* Desktop nav */}
				<div className="hidden md:flex items-center gap-8 text-sm text-sand-700">
					{navLinks.map((link) =>
						link.isExternal ? (
							<a key={link.href} href={link.href} className="hover:text-forest-600 transition font-medium">
								{link.label}
							</a>
						) : (
							<Link key={link.href} to={link.href} className="hover:text-forest-600 transition font-medium">
								{link.label}
							</Link>
						)
					)}
					{ctaIsExternal ? (
						<a
							href={cta.href}
							className={`px-6 py-2.5 ${cta.color} text-white rounded-xl font-semibold transition text-sm shadow-sm`}
						>
							{cta.label}
						</a>
					) : (
						<Link
							to={cta.href}
							className={`px-6 py-2.5 ${cta.color} text-white rounded-xl font-semibold transition text-sm shadow-sm`}
						>
							{cta.label}
						</Link>
					)}
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
						{navLinks.map((link) =>
							link.isExternal ? (
								<a
									key={link.href}
									href={link.href}
									className="py-3 text-sand-700 font-medium hover:text-forest-600 transition"
									onClick={() => setOpen(false)}
								>
									{link.label}
								</a>
							) : (
								<Link
									key={link.href}
									to={link.href}
									className="py-3 text-sand-700 font-medium hover:text-forest-600 transition"
									onClick={() => setOpen(false)}
								>
									{link.label}
								</Link>
							)
						)}
						{ctaIsExternal ? (
							<a
								href={cta.href}
								className={`mt-2 py-3 ${cta.color} text-white rounded-xl font-semibold text-center transition text-sm shadow-sm`}
								onClick={() => setOpen(false)}
							>
								{cta.label}
							</a>
						) : (
							<Link
								to={cta.href}
								className={`mt-2 py-3 ${cta.color} text-white rounded-xl font-semibold text-center transition text-sm shadow-sm`}
								onClick={() => setOpen(false)}
							>
								{cta.label}
							</Link>
						)}
					</div>
				</div>
			)}
		</nav>
	)
}
