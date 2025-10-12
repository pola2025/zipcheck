import { Outlet, useLocation } from 'react-router-dom'
import MarketingHeader from './MarketingHeader'
import MarketingFooter from './MarketingFooter'
import { useEffect } from 'react'

const MAX_SCROLL_ATTEMPTS = 8

function findScrollTarget(hash: string): HTMLElement | null {
	const sanitizedHash = hash.replace('#', '')
	if (!sanitizedHash) {
		return null
	}
	const directMatch = document.getElementById(sanitizedHash)
	if (directMatch instanceof HTMLElement) {
		return directMatch
	}
	const dataAttributeMatch = document.querySelector<HTMLElement>(
		`[data-scroll-target="${sanitizedHash}"]`
	)
	return dataAttributeMatch ?? null
}

export default function MarketingLayout() {
	const location = useLocation()

	useEffect(() => {
		const { hash } = location
		if (!hash) {
			window.scrollTo({ top: 0 })
			return
		}

		let rafId: number | null = null
		let canceled = false

		const attemptScroll = (attemptsLeft: number) => {
			if (canceled || attemptsLeft <= 0) {
				return
			}

			const target = findScrollTarget(hash)
			if (target) {
				if (typeof target.scrollIntoView === 'function') {
					target.scrollIntoView({ behavior: 'smooth', block: 'start' })
				}
				return
			}

			rafId = requestAnimationFrame(() => attemptScroll(attemptsLeft - 1))
		}

		rafId = requestAnimationFrame(() => attemptScroll(MAX_SCROLL_ATTEMPTS))

		return () => {
			canceled = true
			if (rafId !== null) {
				cancelAnimationFrame(rafId)
			}
		}
	}, [location.hash, location.pathname])

	return (
		<div
			className='marketing-theme min-h-screen text-foreground'
			data-testid='marketing-layout-root'
		>
			<a
				className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#050B18]'
				href='#main-content'
			>
				본문으로 바로가기
			</a>
			<MarketingHeader />
			<main id='main-content'>
				<Outlet />
			</main>
			<MarketingFooter />
		</div>
	)
}
