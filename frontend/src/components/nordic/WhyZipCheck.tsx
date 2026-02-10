import { BarChart3, FileSearch, MessageCircle, ShieldCheck, type LucideIcon } from 'lucide-react'
import { nordicFeatures } from 'data/marketing'
import SectionLabel from './SectionLabel'

const iconMap: Record<string, LucideIcon> = {
	BarChart3,
	FileSearch,
	MessageCircle,
	ShieldCheck
}

export default function WhyZipCheck() {
	return (
		<section id="features" className="bg-sand-50 py-16 md:py-24">
			<div className="max-w-7xl mx-auto px-5 md:px-8">
				<div className="text-center mb-10 md:mb-16">
					<SectionLabel
						label="Why ZipCheck"
						title="왜 견적 분석이 필요할까요"
						subtitle="같은 공사도 업체마다 수백만 원 차이. 데이터로 확인하세요."
						align="center"
					/>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
					{nordicFeatures.map((feature) => {
						const Icon = iconMap[feature.icon]
						return (
							<div key={feature.title} className="nordic-card p-4 md:p-7 group">
								<div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-forest-50 flex items-center justify-center text-forest-600 mb-3 md:mb-5 group-hover:bg-forest-500 group-hover:text-white transition">
									{Icon && <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.8} />}
								</div>
								<h3 className="font-semibold text-sand-900 mb-1 md:mb-2 text-sm md:text-base">{feature.title}</h3>
								<p className="text-xs md:text-sm text-sand-600 leading-relaxed">
									{feature.description}
								</p>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
