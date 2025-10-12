import { Button } from 'components/ui/button'
import { Link } from 'react-router-dom'
import { useState } from 'react'

import type { CTA } from 'data/marketing'
import { cn } from 'lib/utils'
import type { ComponentProps } from 'react'

type CTAGroupProps = {
	primary: CTA
	secondary?: CTA
	className?: string
}

const isExternal = (href: string, target?: string) =>
	target === '_blank' || /^https?:\/\//.test(href) || href.startsWith('mailto:')

const getLinkProps = (cta: CTA): ComponentProps<'a'> => ({
	href: cta.href,
	target: cta.target,
	rel: cta.target === '_blank' ? 'noopener noreferrer' : undefined
})

export default function CTAGroup({ primary, secondary, className }: CTAGroupProps) {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		setMousePosition({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		})
	}

	const HulyButton = ({ children, ...props }: ComponentProps<'a'> | ComponentProps<typeof Link>) => (
		<div
			className="relative inline-block overflow-hidden rounded-full"
			onMouseMove={handleMouseMove}
		>
			{/* Huly.io 스타일 섬광 효과 */}
			<div
				className="absolute -z-10 flex w-[204px] items-center justify-center transition-transform duration-200 pointer-events-none"
				style={{
					transform: `translateX(${mousePosition.x}px) translateY(${mousePosition.y}px) translateZ(0px)`,
					left: '-102px',
					top: '50%',
					marginTop: '-60px'
				}}
			>
				{/* 주황색 radial gradient */}
				<div
					className="absolute top-1/2 h-[121px] w-[121px] -translate-y-1/2"
					style={{
						background: 'radial-gradient(50% 50% at 50% 50%, #FFFFF5 3.5%, #FFAA81 26.5%, #FFDA9F 37.5%, rgba(255,170,129,0.50) 49%, rgba(210,106,58,0.00) 92.5%)'
					}}
				/>
				{/* 블러 효과 레이어 */}
				<div
					className="absolute top-1/2 h-[103px] w-[204px] -translate-y-1/2 blur-[5px]"
					style={{
						background: 'radial-gradient(43.3% 44.23% at 50% 49.51%, #FFFFF7 29%, #FFFACD 48.5%, #F4D2BF 60.71%, rgba(214,211,210,0.00) 100%)'
					}}
				/>
			</div>

			{'to' in props ? (
				<Link
					{...props as ComponentProps<typeof Link>}
					className="relative z-10 inline-flex items-center justify-center h-10 px-8 text-base font-bold uppercase tracking-tight text-[#5A250A] bg-[#d1d1d1] border border-white/60 rounded-full transition-colors duration-200 hover:bg-[#e1e1e1]"
				>
					{children}
				</Link>
			) : (
				<a
					{...props as ComponentProps<'a'>}
					className="relative z-10 inline-flex items-center justify-center h-10 px-8 text-base font-bold uppercase tracking-tight text-[#5A250A] bg-[#d1d1d1] border border-white/60 rounded-full transition-colors duration-200 hover:bg-[#e1e1e1]"
				>
					{children}
				</a>
			)}
		</div>
	)

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-4 text-sm font-medium',
				className
			)}
		>
			{isExternal(primary.href, primary.target) ? (
				<HulyButton {...getLinkProps(primary)}>
					{primary.label}
				</HulyButton>
			) : (
				<HulyButton to={primary.href}>
					{primary.label}
				</HulyButton>
			)}
			{secondary ? (
				isExternal(secondary.href, secondary.target) ? (
					<Button
						asChild
						variant='ghost'
						size='lg'
						className='marketing-ghost-button px-6 py-3 text-base font-semibold'
					>
						<a {...getLinkProps(secondary)}>{secondary.label}</a>
					</Button>
				) : (
					<Button
						asChild
						variant='ghost'
						size='lg'
						className='marketing-ghost-button px-6 py-3 text-base font-semibold'
					>
						<Link to={secondary.href}>{secondary.label}</Link>
					</Button>
				)
			) : null}
		</div>
	)
}
