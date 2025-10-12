import Logo from 'components/Logo'
import { Button } from 'components/ui/button'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from 'lib/utils'

type NavItem = {
	label: string
	hash: string
}

const NAV_ITEMS: NavItem[] = [
	{ label: '서비스 소개', hash: 'hero' },
	{ label: '문제 해결', hash: 'problem-solution' },
	{ label: '핵심 기능', hash: 'features' },
	{ label: '고객 후기', hash: 'testimonials' },
	{ label: '요금제', hash: 'pricing' }
]

export default function MarketingHeader() {
	const [open, setOpen] = useState(false)
	const location = useLocation()
	const isLanding = location.pathname === '/'
	const currentHash = location.hash.replace('#', '')

	useEffect(() => {
		setOpen(false)
	}, [location.pathname, location.hash])

	const isActive = (item: NavItem) => {
		if (!isLanding) {
			return false
		}
		if (!currentHash) {
			return item.hash === 'hero'
		}
		return currentHash === item.hash
	}

	return (
		<header className='sticky top-0 z-50 backdrop-blur-[18px]'>
			<div className='marketing-header-surface container mx-auto flex items-center justify-between gap-6 px-6 py-4 transition-all md:px-8'>
				<Link to='/' className='flex items-center gap-3' aria-label='ZipCheck 홈'>
					<Logo className='w-28 text-white' />
					<span className='text-sm font-semibold uppercase tracking-[0.35em] text-white/80'>
						ZipCheck
					</span>
				</Link>
				<nav className='hidden items-center gap-6 lg:flex'>
					{NAV_ITEMS.map(item => (
						<Link
							key={item.label}
							to={{ pathname: '/', hash: `#${item.hash}` }}
							className={cn('neon-link text-sm font-medium', isActive(item) && 'neon-link--active')}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className='hidden items-center gap-4 lg:flex'>
					<Link
						to='/ai'
						className='neon-link text-sm font-medium'
						aria-label='Open AI workspace'
						data-testid='marketing-ai-link'
					>
						로그인
					</Link>
					<Button asChild className='marketing-glow marketing-cta-gradient'>
						<Link to='/plan-selection'>견적 문의</Link>
					</Button>
				</div>
				<button
					type='button'
					onClick={() => setOpen(prev => !prev)}
					className='marketing-icon-button size-10 lg:hidden'
					aria-expanded={open}
					aria-controls='mobile-nav'
					aria-label='내비게이션 열기'
				>
					<Menu className='size-5' aria-hidden />
				</button>
			</div>
			{open ? (
				<nav id='mobile-nav' data-testid='marketing-mobile-nav' className='marketing-mobile-nav px-6 py-4 lg:hidden'>
					<ul className='flex flex-col gap-4 text-sm font-medium text-slate-200/75'>
						{NAV_ITEMS.map(item => (
							<li key={item.label}>
								<Link
									to={{ pathname: '/', hash: `#${item.hash}` }}
									className='neon-link block rounded-lg px-2 py-2 transition-colors hover:bg-[rgba(16,24,40,0.72)]'
									onClick={() => setOpen(false)}
								>
									{item.label}
								</Link>
							</li>
						))}
						<li className='flex items-center gap-4 pt-2'>
							<Link
								to='/ai'
								className='neon-link'
								aria-label='Open AI workspace'
								data-testid='marketing-ai-link'
								onClick={() => setOpen(false)}
							>
									로그인
							</Link>
							<Button asChild className='flex-1 marketing-glow marketing-cta-gradient'>
								<Link to='/quote-request' onClick={() => setOpen(false)}>
									견적 문의
								</Link>
							</Button>
						</li>
					</ul>
				</nav>
			) : null}
		</header>
	)
}
