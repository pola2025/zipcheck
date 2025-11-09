import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
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

const planColorClasses = {
	cyan: {
		border: 'border-cyan-500',
		borderMuted: 'border-cyan-500/30',
		hoverBorder: 'hover:border-cyan-500/60',
		text: 'text-cyan-400',
		iconBg: 'bg-cyan-500/20',
		badgeBg: 'bg-cyan-500'
	},
	purple: {
		border: 'border-purple-500',
		borderMuted: 'border-purple-500/30',
		hoverBorder: 'hover:border-purple-500/60',
		text: 'text-purple-400',
		iconBg: 'bg-purple-500/20',
		badgeBg: 'bg-purple-500'
	},
	orange: {
		border: 'border-orange-500',
		borderMuted: 'border-orange-500/30',
		hoverBorder: 'hover:border-orange-500/60',
		text: 'text-orange-400',
		iconBg: 'bg-orange-500/20',
		badgeBg: 'bg-orange-500'
	},
	indigo: {
		border: 'border-indigo-500',
		borderMuted: 'border-indigo-500/30',
		hoverBorder: 'hover:border-indigo-500/60',
		text: 'text-indigo-400',
		iconBg: 'bg-indigo-500/20',
		badgeBg: 'bg-indigo-500'
	},
	pink: {
		border: 'border-pink-500',
		borderMuted: 'border-pink-500/30',
		hoverBorder: 'hover:border-pink-500/60',
		text: 'text-pink-400',
		iconBg: 'bg-pink-500/20',
		badgeBg: 'bg-pink-500'
	}
} as const

type PlanColorKey = keyof typeof planColorClasses

const getColorClasses = (color: PlanOption['color']) => {
	const key = color as PlanColorKey
	return planColorClasses[key] ?? planColorClasses.cyan
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
									const colorClasses = getColorClasses(plan.color)
									const cardStyle = isSelected ? { boxShadow: `0 0 40px ${plan.glowColor}` } : undefined

									return (
										<motion.div
											key={plan.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.1 * index }}
											whileHover={{ scale: 1.02 }}
											onClick={() => handleSelectPlan(plan.id)}
											className={clsx(
												'cursor-pointer glass-neon rounded-3xl p-8 border-2 transition-all',
												isSelected ? colorClasses.border : colorClasses.borderMuted,
												!isSelected && colorClasses.hoverBorder
											)}
											style={cardStyle}
										>
											{/* Selected Badge */}
											{isSelected && (
												<div className="absolute top-4 right-4">
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														className={clsx(
															'w-8 h-8 rounded-full flex items-center justify-center',
															colorClasses.badgeBg
														)}
													>
														<CheckCircle2 className="w-5 h-5 text-white" />
													</motion.div>
												</div>
											)}

											<div className="flex items-center gap-4 mb-6">
												<motion.div
													className={clsx(
														'w-16 h-16 rounded-full flex items-center justify-center',
														colorClasses.iconBg
													)}
													whileHover={{ rotate: 360 }}
													transition={{ duration: 0.6 }}
												>
													<Icon className={clsx('w-8 h-8', colorClasses.text)} />
												</motion.div>
												<div>
													<h3 className={clsx('text-3xl font-bold', colorClasses.text)}>{plan.name}</h3>
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
														<CheckCircle2
															className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', colorClasses.text)}
														/>
														<span className="text-gray-200">{feature}</span>
													</li>
												))}
											</ul>
									</motion.div>
								)
							})}
						</div>
					</div>

					{/* TODO: 긴급 요금제 - 추후 오픈 예정
					     현재는 숨김 처리. 자세한 내용은 .claude/docs/features/urgent-analysis-plan.md 참조
					*/}
					{/* Urgent Plans */}
					{false && (
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
										const colorClasses = getColorClasses(plan.color)
										const cardStyle = isSelected ? { boxShadow: `0 0 30px ${plan.glowColor}` } : undefined

										return (
											<motion.div
												key={plan.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.5 + 0.1 * index }}
												whileHover={{ scale: 1.02 }}
												onClick={() => handleSelectPlan(plan.id)}
												className={clsx(
													'cursor-pointer glass-strong rounded-2xl p-6 border transition-all',
													isSelected ? colorClasses.border : colorClasses.borderMuted,
													!isSelected && colorClasses.hoverBorder
												)}
												style={cardStyle}
											>
												{/* Selected Badge */}
												{isSelected && (
													<div className="absolute top-3 right-3">
														<motion.div
															initial={{ scale: 0 }}
															animate={{ scale: 1 }}
															className={clsx(
																'w-7 h-7 rounded-full flex items-center justify-center',
																colorClasses.badgeBg
															)}
														>
															<CheckCircle2 className="w-4 h-4 text-white" />
														</motion.div>
													</div>
												)}

												<div className="flex items-center gap-3 mb-4">
													<div
														className={clsx(
															'w-12 h-12 rounded-full flex items-center justify-center',
															colorClasses.iconBg
														)}
													>
														<Icon className={clsx('w-6 h-6', colorClasses.text)} />
													</div>
													<h3 className={clsx('text-2xl font-bold', colorClasses.text)}>{plan.name}</h3>
												</div>

												<div className="mb-4">
													<span className="text-4xl font-bold text-white">{plan.price}</span>
												<p className="text-xs text-gray-400 mt-1">{plan.period}</p>
												<p className="text-sm text-gray-300 mt-2 font-medium">{plan.description}</p>
											</div>

												<ul className="space-y-2">
													{plan.features.map((feature, i) => (
														<li key={i} className="flex items-start gap-2 text-xs">
															<CheckCircle2
																className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', colorClasses.text)}
															/>
															<span className="text-gray-300">{feature}</span>
														</li>
													))}
												</ul>
											</motion.div>
									)
								})}
							</div>
						</div>
					)}

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
