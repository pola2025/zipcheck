import {
	AnimatedBackground,
	ImmersiveHero,
	ScrollSection,
	StatCounter,
	MagneticButton
} from 'components/immersive'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import {
	Database,
	Clock,
	BarChart3,
	FileSearch,
	ShieldQuestion,
	Wand2,
	CheckCircle2,
	X,
	ArrowRight,
	Sparkles
} from 'lucide-react'
import {
	heroCopy,
	problemSolutionItems,
	featureItems,
	processSteps,
	plans,
	urgentPlans
} from 'data/marketing'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import QuoteExampleSection from 'components/marketing/QuoteExampleSection'
import GlowButton from 'components/ui/glow-button'
import AnimatedBorderButton from 'components/ui/animated-border-button'

export default function ZipCheckPage() {
	const navigate = useNavigate()
	const quoteExampleRef = useRef<HTMLDivElement>(null)

	const scrollToQuoteExample = () => {
		quoteExampleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated neon background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10">
				{/* Hero Section */}
				<ImmersiveHero
					title={heroCopy.title}
					subtitle={heroCopy.subtitle}
					ctaPrimary={{
						label: heroCopy.primaryCta.label,
						onClick: () => window.location.href = heroCopy.primaryCta.href
					}}
					ctaSecondary={{
						label: heroCopy.secondaryCta.label,
						onClick: scrollToQuoteExample
					}}
					showScrollHint
				/>

				{/* Stats Section */}
				<ScrollSection className="py-32 px-6">
					<div className="container mx-auto max-w-7xl">
						<motion.h2
							className="text-5xl md:text-7xl font-bold text-center mb-20 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							숫자로 보는 ZipCheck
						</motion.h2>

						<div className="grid md:grid-cols-3 gap-8">
							<StatCounter
								end={3000}
								suffix="+"
								label="누적 공사 데이터 학습"
								icon={<Database className="w-6 h-6" />}
							/>
							<StatCounter
								end={48}
								suffix="h"
								label="최대 응답 시간 보장"
								icon={<Clock className="w-6 h-6" />}
							/>
							<StatCounter
								end={20}
								suffix="년+"
								label="현업 경력 인테리어 대표"
								icon={<Sparkles className="w-6 h-6" />}
							/>
						</div>
					</div>
				</ScrollSection>

				{/* Problem Section */}
				<ScrollSection className="py-32 px-6 bg-gradient-to-b from-transparent via-red-900/10 to-cyan-900/10">
					<div className="container mx-auto max-w-5xl">
						{/* Section Title */}
						<motion.h2
							className="text-4xl md:text-6xl font-bold text-center mb-16 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							왜 ZipCheck인가?
						</motion.h2>

						<div className="space-y-12">
							{/* Problem Card */}
							<ScrollSection animation="slide-up">
								<div className="glass-strong rounded-3xl p-12 border-4 border-red-500/40 bg-gradient-to-br from-red-900/20 to-transparent">
									<div className="flex items-center justify-center gap-4 mb-8">
										<div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
											<X className="w-8 h-8 text-red-400" />
										</div>
										<h3 className="text-4xl font-bold text-red-400">문제</h3>
									</div>

									<h4 className="text-3xl font-bold mb-6 text-center">
										{problemSolutionItems[0].title}
									</h4>
									<p className="text-gray-300 text-lg mb-8 leading-relaxed text-center max-w-3xl mx-auto whitespace-pre-line">
										{problemSolutionItems[0].body}
									</p>

									<div className="flex flex-col items-center">
										<ul className="space-y-5 inline-block text-left">
											{problemSolutionItems[0].bullets.map((bullet, index) => (
												<motion.li
													key={index}
													className="flex items-start gap-4 text-gray-400 text-base"
													initial={{ opacity: 0, x: -20 }}
													whileInView={{ opacity: 1, x: 0 }}
													viewport={{ once: true }}
													transition={{ delay: index * 0.1 }}
												>
													<span className="text-red-400 mt-1 text-xl">•</span>
													<span>{bullet}</span>
												</motion.li>
											))}
										</ul>
									</div>
								</div>
							</ScrollSection>

							{/* Divider with Arrow */}
							<div className="flex justify-center">
								<motion.div
									className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-cyan-500 flex items-center justify-center"
									animate={{
										y: [0, 10, 0],
										boxShadow: [
											'0 0 20px rgba(10, 157, 170, 0.4)',
											'0 0 40px rgba(10, 157, 170, 0.8)',
											'0 0 20px rgba(10, 157, 170, 0.4)'
										]
									}}
									transition={{ duration: 2, repeat: Infinity }}
								>
									<ArrowRight className="w-8 h-8 text-white rotate-90" />
								</motion.div>
							</div>

							{/* Solution Card */}
							<ScrollSection animation="slide-up">
								<div className="glass-neon rounded-3xl p-12 border-4 border-cyan-500/50 bg-gradient-to-br from-cyan-900/20 to-transparent">
									<div className="flex items-center justify-center gap-4 mb-8">
										<div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center glow-cyan">
											<CheckCircle2 className="w-8 h-8 text-cyan-400" />
										</div>
										<h3 className="text-4xl font-bold text-cyan-400">해결책</h3>
									</div>

									<h4 className="text-3xl font-bold mb-6 text-glow-cyan text-center">
										{problemSolutionItems[1].title}
									</h4>
									<p className="text-gray-300 text-lg mb-8 leading-relaxed text-center max-w-3xl mx-auto whitespace-pre-line">
										{problemSolutionItems[1].body}
									</p>

									<div className="flex flex-col items-center">
										<ul className="space-y-5 inline-block text-left">
											{problemSolutionItems[1].bullets.map((bullet, index) => (
												<motion.li
													key={index}
													className="flex items-start gap-4 text-gray-300 text-base"
													initial={{ opacity: 0, x: 20 }}
													whileInView={{ opacity: 1, x: 0 }}
													viewport={{ once: true }}
													transition={{ delay: index * 0.1 }}
												>
													<CheckCircle2 className="w-6 h-6 text-cyan-400 mt-0.5 flex-shrink-0" />
													<span>{bullet}</span>
												</motion.li>
											))}
										</ul>
									</div>
								</div>
							</ScrollSection>
						</div>
					</div>
				</ScrollSection>

				{/* Quote Example Section */}
				<div ref={quoteExampleRef}>
				<QuoteExampleSection />
			</div>

				{/* Features Section */}
				<ScrollSection className="py-32 px-6">
					<div className="container mx-auto max-w-7xl">
						<motion.h2
							className="text-5xl md:text-7xl font-bold text-center mb-8 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							집첵 서비스의 장점
						</motion.h2>
						<p className="text-2xl text-gray-400 text-center max-w-3xl mx-auto mb-24 leading-relaxed">
							실제 유통망 원가 기준으로 자재, 인건비, 잡비 등 실무 비용을 모두 분석합니다
						</p>

						<div className="grid md:grid-cols-3 gap-8">
							{featureItems.map((feature, index) => {
								const icons: Record<string, React.ComponentType<{ className?: string }>> = {
									BarChart3,
									FileSearch,
									ShieldQuestion,
									Wand2,
									Clock,
									Database
								}
								const Icon = icons[feature.icon] || BarChart3

								return (
									<ScrollSection
										key={index}
										animation="slide-up"
										delay={index * 0.1}
									>
										<motion.div
											className="glass-neon rounded-2xl p-8 h-full neon-border"
											whileHover={{
												scale: 1.05,
												boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)'
											}}
											transition={{ type: 'spring', stiffness: 300 }}
										>
											<motion.div
												className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 glow-cyan"
												whileHover={{ rotate: 360 }}
												transition={{ duration: 0.6 }}
											>
												<Icon className="w-8 h-8 text-cyan-400" />
											</motion.div>

											<h3 className="text-2xl font-bold mb-4 text-glow-cyan">
												{feature.title}
											</h3>
											<p className="text-gray-400 leading-relaxed">
												{feature.description}
											</p>
										</motion.div>
									</ScrollSection>
								)
							})}
						</div>
					</div>
				</ScrollSection>

				{/* Process Section */}
				<ScrollSection className="py-32 px-6 bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent">
					<div className="container mx-auto max-w-6xl">
						<motion.h2
							className="text-5xl md:text-7xl font-bold text-center mb-24 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							간단한 4단계로 분석 완료
						</motion.h2>

						<div className="space-y-8">
							{processSteps.map((step, index) => (
								<ScrollSection key={index} animation="slide-right" delay={index * 0.2}>
									<motion.div
										className="glass-dark rounded-2xl p-8 flex items-start gap-6"
										whileHover={{ x: 10 }}
									>
										<motion.div
											className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl glow-cyan"
											animate={{
												boxShadow: [
													'0 0 20px rgba(6, 182, 212, 0.4)',
													'0 0 40px rgba(6, 182, 212, 0.6)',
													'0 0 20px rgba(6, 182, 212, 0.4)'
												]
											}}
											transition={{
												duration: 2,
												repeat: Infinity,
												delay: index * 0.3
											}}
										>
											{index + 1}
										</motion.div>

										<div className="flex-1">
											<h4 className="text-2xl font-bold mb-3 text-cyan-400">
												{step.title}
											</h4>
											<p className="text-gray-400 leading-relaxed">
												{step.description}
											</p>
										</div>

										<ArrowRight className="w-6 h-6 text-cyan-400 flex-shrink-0" />
									</motion.div>
								</ScrollSection>
							))}
						</div>
					</div>
				</ScrollSection>

				{/* Pricing Section */}
				<ScrollSection className="py-32 px-6">
					<div className="container mx-auto max-w-6xl">
						<motion.h2
							className="text-5xl md:text-7xl font-bold text-center mb-8 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							분석 요금제
						</motion.h2>
						<p className="text-2xl text-gray-400 text-center max-w-3xl mx-auto mb-24 leading-relaxed">
							필요한 시간에 맞춰 선택하세요
						</p>

						<div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
							{plans.map((plan, index) => (
								<ScrollSection
									key={index}
									animation="scale"
									delay={index * 0.1}
								>
									<motion.div
										className="relative flex flex-col glass-neon rounded-3xl p-10 h-full border-2 border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.3)]"
										style={{ zIndex: 0 }}
										whileHover={{
											boxShadow: '0 0 60px rgba(6, 182, 212, 0.5)'
										}}
										transition={{ type: 'spring', stiffness: 300 }}
									>
										<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold glow-cyan shadow-lg z-10">
											추천
										</div>

										<h3 className="text-4xl font-bold mb-3 text-glow-cyan mt-2">
											{plan.name}
										</h3>
										<div className="mb-6">
											<span className="text-5xl font-bold text-white">{plan.price}</span>
											<span className="text-gray-400 text-base ml-3">
												{plan.period}
											</span>
										</div>
										<p className="text-gray-300 text-lg mb-8 font-medium">
											{plan.description}
										</p>

										<ul className="space-y-4 mb-8 flex-grow">
											{plan.features.map((feature, i) => (
												<li key={i} className="flex items-start gap-3 text-base">
													<CheckCircle2 className="w-6 h-6 text-cyan-400 mt-0.5 flex-shrink-0" />
													<span className="text-gray-200">{feature}</span>
												</li>
											))}
										</ul>

										<AnimatedBorderButton
											onClick={() => navigate('/plan-selection')}
											className="w-full mt-auto"
											colors={['#0DD4E4', '#C798D4', '#F4D89C']}
											size="lg"
										>
											{plan.name} 신청하기
										</AnimatedBorderButton>
									</motion.div>
								</ScrollSection>
							))}
						</div>
					</div>
				</ScrollSection>

				{/* Urgent Pricing Section */}
				<ScrollSection className="py-32 px-6 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
					<div className="container mx-auto max-w-7xl">
						<motion.h2
							className="text-5xl md:text-7xl font-bold text-center mb-8 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #F4D89C, #C798D4, #0DD4E4)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							긴급 분석 신청
						</motion.h2>
						<p className="text-2xl text-gray-400 text-center max-w-3xl mx-auto mb-24 leading-relaxed">
							시간이 급할 때 빠른 대응이 필요하다면
						</p>

						<div className="grid md:grid-cols-3 gap-8">
							{urgentPlans.map((plan, index) => (
								<ScrollSection
									key={index}
									animation="slide-up"
									delay={index * 0.15}
								>
									<motion.div
										className="relative flex flex-col glass-strong rounded-2xl p-8 h-full border border-purple-500/30"
										style={{ zIndex: 0 }}
										whileHover={{
											boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)'
										}}
										transition={{ type: 'spring', stiffness: 300 }}
									>
										<h3 className="text-3xl font-bold mb-3 text-purple-400">
											{plan.name}
										</h3>
										<div className="mb-4">
											<span className="text-4xl font-bold text-white">{plan.price}</span>
										</div>
										<p className="text-gray-400 text-sm mb-2">
											{plan.period}
										</p>
										<p className="text-gray-300 text-base mb-6 font-medium">
											{plan.description}
										</p>

										<ul className="space-y-3 mb-6 flex-grow">
											{plan.features.map((feature, i) => (
												<li key={i} className="flex items-start gap-2 text-sm">
													<CheckCircle2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
													<span className="text-gray-300">{feature}</span>
												</li>
											))}
										</ul>

										<AnimatedBorderButton
											onClick={() => navigate('/plan-selection')}
											className="w-full mt-auto"
											colors={['#A855F7', '#EC4899']}
											size="md"
										>
											긴급 신청하기
										</AnimatedBorderButton>
									</motion.div>
								</ScrollSection>
							))}
						</div>
					</div>
				</ScrollSection>

				{/* Final CTA */}
				<ScrollSection className="py-32 px-6">
					<div className="container mx-auto max-w-5xl text-center">
						<motion.div
							className="glass-strong rounded-3xl p-20 neon-border"
							whileHover={{ scale: 1.02 }}
						>
							<motion.h2
								className="text-4xl md:text-6xl font-bold mb-10 text-glow-cyan"
								style={{
									background: 'linear-gradient(135deg, #0DD4E4, #C798D4, #F4D89C)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent'
								}}
								animate={{
									textShadow: [
										'0 0 20px rgba(17, 193, 213, 0.5)',
										'0 0 40px rgba(17, 193, 213, 0.8)',
										'0 0 20px rgba(17, 193, 213, 0.5)'
									]
								}}
								transition={{ duration: 2, repeat: Infinity }}
							>
								3만원으로 수천만원 절약!
							</motion.h2>

							<p className="text-2xl md:text-3xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
								수천만원의 비용과 몇개월의 시간 낭비를 막으세요.
								<br />
								48시간 내 전문가 분석 결과를 받아보세요.
							</p>

							<div className="flex flex-col sm:flex-row gap-6 justify-center">
								<GlowButton
									onClick={() => navigate('/plan-selection')}
									size="lg"
									glowColor="#FF6B35"
								>
									견적 분석 신청하기
								</GlowButton>

								<MagneticButton
									className="px-14 py-6 glass-neon rounded-full font-bold text-2xl text-cyan-400 neon-border"
									onClick={scrollToQuoteExample}
									intensity={0.4}
								>
									분석 예시 보기
								</MagneticButton>
							</div>
						</motion.div>
					</div>
				</ScrollSection>

				{/* Footer */}
				<ZipCheckFooter />
			</div>
		</div>
	)
}
