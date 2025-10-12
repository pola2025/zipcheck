import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Zap, Moon, Calendar } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { plans, urgentPlans } from 'data/marketing'

interface PlanOption {
	id: string
	name: string
	price: string
	priceValue: number
	period: string
	description: string
	features: string[]
	icon: any
	color: string
	glowColor: string
}

export default function PlanSelection() {
	const navigate = useNavigate()
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

	// Convert plans to PlanOption format
	const allPlans: PlanOption[] = [
		{
			id: 'basic',
			...plans[0],
			priceValue: 30000,
			icon: Clock,
			color: 'cyan',
			glowColor: 'rgba(6, 182, 212, 0.4)'
		},
		{
			id: 'fast',
			...plans[1],
			priceValue: 45000,
			icon: Zap,
			color: 'purple',
			glowColor: 'rgba(168, 85, 247, 0.4)'
		},
		{
			id: 'urgent',
			...urgentPlans[0],
			priceValue: 60000,
			icon: Zap,
			color: 'orange',
			glowColor: 'rgba(249, 115, 22, 0.4)'
		},
		{
			id: 'midnight',
			...urgentPlans[1],
			priceValue: 120000,
			icon: Moon,
			color: 'indigo',
			glowColor: 'rgba(99, 102, 241, 0.4)'
		},
		{
			id: 'holiday',
			...urgentPlans[2],
			priceValue: 120000,
			icon: Calendar,
			color: 'pink',
			glowColor: 'rgba(236, 72, 153, 0.4)'
		}
	]

	const handleSelectPlan = (planId: string) => {
		setSelectedPlan(planId)
	}

	const handleProceedToPayment = () => {
		if (!selectedPlan) {
			alert('요금제를 선택해주세요.')
			return
		}

		const plan = allPlans.find(p => p.id === selectedPlan)
		if (!plan) return

		// Navigate to payment page with plan info
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
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated neon background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-7xl">
					{/* Page Title */}
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1
							className="text-5xl md:text-7xl font-bold mb-6 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0A9DAA, #9B6BA8, #C9A86A)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							요금제 선택
						</h1>
						<p className="text-xl md:text-2xl text-gray-300">프로젝트 일정에 맞는 요금제를 선택하세요</p>
					</motion.div>

					{/* Standard Plans */}
					<div className="mb-16">
						<motion.h2
							className="text-3xl md:text-4xl font-bold mb-8 text-cyan-400"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
						>
							일반 요금제
						</motion.h2>
						<div className="grid md:grid-cols-2 gap-8">
							{allPlans.slice(0, 2).map((plan, index) => {
								const Icon = plan.icon
								const isSelected = selectedPlan === plan.id

								return (
									<motion.div
										key={plan.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 * index }}
										whileHover={{ scale: 1.02 }}
										onClick={() => handleSelectPlan(plan.id)}
										className={`cursor-pointer glass-neon rounded-3xl p-8 border-2 transition-all ${
											isSelected
												? `border-${plan.color}-500 shadow-[0_0_40px_${plan.glowColor}]`
												: `border-${plan.color}-500/30 hover:border-${plan.color}-500/60`
										}`}
									>
										{/* Selected Badge */}
										{isSelected && (
											<div className="absolute top-4 right-4">
												<motion.div
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													className={`w-8 h-8 rounded-full bg-${plan.color}-500 flex items-center justify-center`}
												>
													<CheckCircle2 className="w-5 h-5 text-white" />
												</motion.div>
											</div>
										)}

										<div className="flex items-center gap-4 mb-6">
											<motion.div
												className={`w-16 h-16 rounded-full bg-${plan.color}-500/20 flex items-center justify-center`}
												whileHover={{ rotate: 360 }}
												transition={{ duration: 0.6 }}
											>
												<Icon className={`w-8 h-8 text-${plan.color}-400`} />
											</motion.div>
											<div>
												<h3 className={`text-3xl font-bold text-${plan.color}-400`}>{plan.name}</h3>
												<p className="text-sm text-gray-400">{plan.period}</p>
											</div>
										</div>

										<div className="mb-6">
											<span className="text-5xl font-bold text-white">{plan.price}</span>
											<p className="text-lg text-gray-300 mt-2 font-medium">{plan.description}</p>
										</div>

										<ul className="space-y-3">
											{plan.features.map((feature, i) => (
												<li key={i} className="flex items-start gap-3 text-sm">
													<CheckCircle2 className={`w-5 h-5 text-${plan.color}-400 mt-0.5 flex-shrink-0`} />
													<span className="text-gray-200">{feature}</span>
												</li>
											))}
										</ul>
									</motion.div>
								)
							})}
						</div>
					</div>

					{/* Urgent Plans */}
					<div className="mb-16">
						<motion.h2
							className="text-3xl md:text-4xl font-bold mb-8 text-orange-400"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4 }}
						>
							긴급 요금제
						</motion.h2>
						<div className="grid md:grid-cols-3 gap-6">
							{allPlans.slice(2).map((plan, index) => {
								const Icon = plan.icon
								const isSelected = selectedPlan === plan.id

								return (
									<motion.div
										key={plan.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 + 0.1 * index }}
										whileHover={{ scale: 1.02 }}
										onClick={() => handleSelectPlan(plan.id)}
										className={`cursor-pointer glass-strong rounded-2xl p-6 border transition-all ${
											isSelected
												? `border-${plan.color}-500 shadow-[0_0_30px_${plan.glowColor}]`
												: `border-${plan.color}-500/30 hover:border-${plan.color}-500/60`
										}`}
									>
										{/* Selected Badge */}
										{isSelected && (
											<div className="absolute top-3 right-3">
												<motion.div
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													className={`w-7 h-7 rounded-full bg-${plan.color}-500 flex items-center justify-center`}
												>
													<CheckCircle2 className="w-4 h-4 text-white" />
												</motion.div>
											</div>
										)}

										<div className="flex items-center gap-3 mb-4">
											<div className={`w-12 h-12 rounded-full bg-${plan.color}-500/20 flex items-center justify-center`}>
												<Icon className={`w-6 h-6 text-${plan.color}-400`} />
											</div>
											<h3 className={`text-2xl font-bold text-${plan.color}-400`}>{plan.name}</h3>
										</div>

										<div className="mb-4">
											<span className="text-4xl font-bold text-white">{plan.price}</span>
											<p className="text-xs text-gray-400 mt-1">{plan.period}</p>
											<p className="text-sm text-gray-300 mt-2 font-medium">{plan.description}</p>
										</div>

										<ul className="space-y-2">
											{plan.features.map((feature, i) => (
												<li key={i} className="flex items-start gap-2 text-xs">
													<CheckCircle2 className={`w-4 h-4 text-${plan.color}-400 mt-0.5 flex-shrink-0`} />
													<span className="text-gray-300">{feature}</span>
												</li>
											))}
										</ul>
									</motion.div>
								)
							})}
						</div>
					</div>

					{/* CTA Button */}
					<motion.div
						className="flex justify-center"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8 }}
					>
						<motion.button
							onClick={handleProceedToPayment}
							disabled={!selectedPlan}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="px-16 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full font-bold text-2xl shadow-2xl glow-cyan transition-all"
						>
							{selectedPlan ? '결제하기' : '요금제를 선택하세요'}
						</motion.button>
					</motion.div>

					{/* Notice */}
					<motion.div
						className="mt-12 glass-strong rounded-2xl p-8 border border-amber-500/30 max-w-4xl mx-auto"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1 }}
					>
						<h3 className="text-xl font-bold text-amber-300 mb-4">💡 안내사항</h3>
						<ul className="text-sm text-gray-300 space-y-2">
							<li>• 결제 완료 후 견적서를 제출하시면 분석이 시작됩니다.</li>
							<li>• SLA 시간은 견적서 제출 시점부터 계산됩니다.</li>
							<li>• 부가세(VAT)는 별도이며, 결제 시 자동 적용됩니다.</li>
							<li>• 영업시간: 평일 09:00~18:00 (주말·공휴일 제외)</li>
						</ul>
					</motion.div>
				</div>
			</div>

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
