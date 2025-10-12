import type { FeatureItem } from 'data/marketing'
import SectionHeading from './SectionHeading'
import { useState } from 'react'
import {
	BarChart3,
	FileSearch,
	ShieldQuestion,
	Wand2,
	Clock3,
	Handshake,
	LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
	BarChart3,
	FileSearch,
	ShieldQuestion,
	Wand2,
	Clock3,
	Handshake
}

type FeatureGridProps = {
	items: FeatureItem[]
}

// Feature card with Huly.io-style mouse-following glow effect
function FeatureCard({ feature, Icon }: { feature: FeatureItem; Icon: LucideIcon }) {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

	const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		setMousePosition({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		})
	}

	return (
		<article
			onMouseMove={handleMouseMove}
			className='marketing-card relative flex h-full flex-col gap-4 rounded-2xl border border-[hsla(var(--glass-border),0.22)] px-6 py-7 transition hover:-translate-y-1 hover:border-[hsla(var(--glow-mint),0.4)] overflow-hidden'
		>
			{/* Mouse-following glow effect */}
			<div
				className='absolute -z-10 flex w-[204px] items-center justify-center transition-transform duration-200 pointer-events-none opacity-40'
				style={{
					transform: `translateX(${mousePosition.x}px) translateY(${mousePosition.y}px) translateZ(0px)`,
					left: '-102px',
					top: '-60px'
				}}
			>
				{/* Blue radial gradient */}
				<div
					className='absolute h-[121px] w-[121px]'
					style={{
						background: 'radial-gradient(50% 50% at 50% 50%, rgba(71,139,235,0.6) 0%, rgba(71,139,235,0.3) 50%, rgba(71,139,235,0) 100%)'
					}}
				/>
				{/* Blur effect layer */}
				<div
					className='absolute h-[103px] w-[204px] blur-[20px]'
					style={{
						background: 'radial-gradient(43.3% 44.23% at 50% 49.51%, rgba(71,139,235,0.5) 29%, rgba(71,139,235,0.3) 60%, rgba(71,139,235,0) 100%)'
					}}
				/>
			</div>

			<span className='marketing-icon-button size-12 text-accent relative z-10'>
				<Icon className='size-6' aria-hidden />
			</span>
			<h3 className='text-lg font-semibold text-foreground relative z-10'>{feature.title}</h3>
			<p className='text-sm leading-relaxed text-muted-foreground relative z-10'>
				{feature.description}
			</p>
		</article>
	)
}

export default function FeatureGrid({ items }: FeatureGridProps) {
	return (
		<section
			aria-labelledby='features-heading'
			className='marketing-section space-y-12'
		>
			<SectionHeading
				id='features-heading'
				eyebrow='Features'
				title='데이터 기반으로 정교해진 ZipCheck만의 솔루션'
				subtitle='실무에서 검증된 프로세스를 토대로 진단부터 시뮬레이션, 실시간 모니터링까지 한 번에 제공합니다.'
				align='center'
				className='max-w-4xl'
			/>
			<div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
				{items.map(feature => {
					const Icon = iconMap[feature.icon] ?? Wand2
					return <FeatureCard key={feature.title} feature={feature} Icon={Icon} />
				})}
			</div>
		</section>
	)
}
