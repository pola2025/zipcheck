import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Clock, Zap } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { plans } from 'data/marketing'

interface PlanOption {
	id: string
	name: string
	price: string
	priceValue: number
	period: string
	description: string
	features: string[]
	icon: typeof Clock
	highlighted?: boolean
}

const allPlans: PlanOption[] = [
	{
		id: 'basic',
		...plans[0],
		priceValue: 30000,
		icon: Clock
	},
	{
		id: 'fast',
		...plans[1],
		priceValue: 45000,
		icon: Zap
	}
]


export default function PlanSelection() {
	const navigate = useNavigate()
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

	const handleProceedToPayment = () => {
		if (!selectedPlan) {
			alert('요금제를 선택해주세요.')
			return
		}
		const plan = allPlans.find((p) => p.id === selectedPlan)
		if (!plan) return
		navigate('/payment', {
			state: {
				planId: plan.id,
				planName: plan.name,
				price: plan.priceValue,
				priceDisplay: plan.price
			}
		})
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="분석 플랜 선택"
				description="기본 분석(48시간, 3만원) 또는 빠른 분석(24시간, 4.5만원) 중 선택하세요. AI가 인테리어 견적서를 항목별로 분석합니다."
				path="/plan-selection"
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-12 md:pt-36 md:pb-16 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">
							Plan Selection
						</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						분석 요금제 선택
					</h1>
					<p className="text-sand-600 text-base md:text-lg max-w-md mx-auto">
						프로젝트 일정에 맞는 요금제를 선택하세요
					</p>
				</div>
			</div>

			{/* Plan Cards */}
			<div className="max-w-4xl mx-auto px-5 md:px-8 -mt-2">
				<div className="grid md:grid-cols-2 gap-6">
					{allPlans.map((plan) => {
						const Icon = plan.icon
						const isSelected = selectedPlan === plan.id
						return (
							<button
								key={plan.id}
								type="button"
								onClick={() => setSelectedPlan(plan.id)}
								className={`relative text-left nordic-card rounded-2xl p-7 md:p-8 transition-all cursor-pointer ${
									isSelected
										? 'border-2 border-forest-600 shadow-lg shadow-forest-600/10'
										: 'border border-sand-200 hover:border-forest-400 hover:shadow-md'
								}`}
							>
								{/* Selected indicator */}
								{isSelected && (
									<div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-forest-600 flex items-center justify-center">
										<Check className="w-4 h-4 text-white" />
									</div>
								)}

								{plan.highlighted && !isSelected && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-forest-700 text-white">
										추천
									</div>
								)}

								<div className="flex items-center gap-4 mb-5">
									<div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center">
										<Icon className="w-5 h-5 text-forest-600" />
									</div>
									<div>
										<h3 className="text-xl font-bold text-sand-900">{plan.name}</h3>
										<p className="text-xs text-sand-500">{plan.period}</p>
									</div>
								</div>

								<div className="mb-5">
									<span className="text-3xl md:text-4xl font-bold text-sand-900 font-outfit">
										{plan.price}
									</span>
									<span className="text-sm text-sand-500 ml-2">VAT 별도</span>
								</div>

								<p className="text-sm text-sand-600 mb-5">{plan.description}</p>

								<ul className="space-y-2.5">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2.5 text-sm">
											<Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-forest-500" />
											<span className="text-sand-700">{feature}</span>
										</li>
									))}
								</ul>
							</button>
						)
					})}
				</div>
			</div>

			{/* CTA */}
			<div className="max-w-4xl mx-auto px-5 md:px-8 mt-10 mb-6">
				<button
					onClick={handleProceedToPayment}
					disabled={!selectedPlan}
					className="w-full py-4 rounded-2xl font-semibold text-lg transition-all disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
				>
					{selectedPlan ? '결제하기' : '요금제를 선택하세요'}
				</button>
			</div>

			{/* Notice */}
			<div className="max-w-4xl mx-auto px-5 md:px-8 pb-20">
				<div className="nordic-card rounded-2xl p-6 md:p-8 border border-wood-200 bg-wood-50/50">
					<h3 className="font-semibold text-sand-900 mb-3">안내사항</h3>
					<ul className="text-sm text-sand-600 space-y-1.5">
						<li>• 결제 완료 후 견적서를 제출하시면 분석이 시작됩니다.</li>
						<li>• SLA 시간은 견적서 제출 시점부터 계산됩니다.</li>
						<li>• 부가세(VAT)는 별도이며, 결제 시 자동 적용됩니다.</li>
						<li>• 영업시간: 평일 09:00~18:00 (주말·공휴일 제외)</li>
					</ul>
				</div>
			</div>

			<NordicFooter />
		</div>
	)
}
