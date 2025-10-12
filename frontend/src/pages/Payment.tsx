import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, CheckCircle2, ArrowRight } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'

interface PaymentState {
	planId: string
	planName: string
	price: number
	priceDisplay: string
}

export default function Payment() {
	const navigate = useNavigate()
	const location = useLocation()
	const paymentState = location.state as PaymentState

	const [processing, setProcessing] = useState(false)
	const [customerName, setCustomerName] = useState('')
	const [customerPhone, setCustomerPhone] = useState('')
	const [customerEmail, setCustomerEmail] = useState('')
	const [agreeTerms, setAgreeTerms] = useState(false)

	// Redirect if no payment info
	useEffect(() => {
		if (!paymentState) {
			alert('요금제를 먼저 선택해주세요.')
			navigate('/plan-selection')
		}
	}, [paymentState, navigate])

	if (!paymentState) {
		return null
	}

	// VAT 계산
	const vatAmount = Math.floor(paymentState.price * 0.1)
	const totalAmount = paymentState.price + vatAmount

	const handlePayment = async () => {
		// Validation
		if (!customerName || !customerPhone || !customerEmail) {
			alert('모든 정보를 입력해주세요.')
			return
		}

		if (!agreeTerms) {
			alert('이용약관에 동의해주세요.')
			return
		}

		setProcessing(true)

		// Mock payment processing (2초 딜레이)
		await new Promise(resolve => setTimeout(resolve, 2000))

		// Mock payment success - generate payment ID
		const mockPaymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`

		// Navigate to quote submission with payment info
		navigate('/quote-submission', {
			state: {
				paymentId: mockPaymentId,
				planId: paymentState.planId,
				planName: paymentState.planName,
				price: totalAmount,
				customerName,
				customerPhone,
				customerEmail
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
				<div className="container mx-auto max-w-4xl">
					{/* Page Title */}
					<motion.div
						className="text-center mb-12"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1
							className="text-5xl md:text-6xl font-bold mb-4 text-glow-cyan"
							style={{
								background: 'linear-gradient(135deg, #0A9DAA, #9B6BA8, #C9A86A)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							결제하기
						</h1>
						<p className="text-lg text-gray-300">결제 후 바로 견적 분석을 신청하실 수 있습니다</p>
					</motion.div>

					<div className="grid md:grid-cols-2 gap-8">
						{/* Left: Payment Info Form */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
						>
							<div className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30 neon-border">
								<h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-glow-cyan">
									<CreditCard className="w-7 h-7 text-cyan-400" />
									결제 정보
								</h2>

								<div className="space-y-5">
									<div>
										<label className="block text-sm font-semibold mb-2 text-cyan-300">
											이름 <span className="text-red-400">*</span>
										</label>
										<input
											type="text"
											value={customerName}
											onChange={(e) => setCustomerName(e.target.value)}
											placeholder="홍길동"
											className="w-full px-4 py-3 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold mb-2 text-cyan-300">
											전화번호 <span className="text-red-400">*</span>
										</label>
										<input
											type="tel"
											value={customerPhone}
											onChange={(e) => setCustomerPhone(e.target.value)}
											placeholder="010-1234-5678"
											className="w-full px-4 py-3 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold mb-2 text-cyan-300">
											이메일 <span className="text-red-400">*</span>
										</label>
										<input
											type="email"
											value={customerEmail}
											onChange={(e) => setCustomerEmail(e.target.value)}
											placeholder="example@email.com"
											className="w-full px-4 py-3 glass-dark border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
										/>
									</div>

									{/* Mock Payment Method Section */}
									<div className="pt-4">
										<label className="block text-sm font-semibold mb-3 text-cyan-300">
											결제 수단
										</label>
										<div className="glass-strong rounded-xl p-4 border border-cyan-500/20">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
														<CreditCard className="w-6 h-6 text-cyan-400" />
													</div>
													<div>
														<p className="font-semibold text-white">토스페이먼츠</p>
														<p className="text-xs text-gray-400">카드·계좌이체·간편결제</p>
													</div>
												</div>
												<CheckCircle2 className="w-6 h-6 text-cyan-400" />
											</div>
										</div>
										<p className="text-xs text-gray-400 mt-2">
											※ 토스페이먼츠 승인 후 실제 결제 기능이 연동됩니다
										</p>
									</div>

									{/* Terms Agreement */}
									<div className="pt-4">
										<label className="flex items-start gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={agreeTerms}
												onChange={(e) => setAgreeTerms(e.target.checked)}
												className="mt-1 w-5 h-5 rounded border-cyan-500/30 text-cyan-500 focus:ring-cyan-500"
											/>
											<span className="text-sm text-gray-300">
												<span className="text-cyan-400 font-semibold">이용약관</span> 및{' '}
												<span className="text-cyan-400 font-semibold">개인정보처리방침</span>에 동의합니다
											</span>
										</label>
									</div>
								</div>
							</div>
						</motion.div>

						{/* Right: Order Summary */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.3 }}
						>
							<div className="glass-strong rounded-3xl p-8 border border-purple-500/30 sticky top-32">
								<h2 className="text-2xl font-bold mb-6 text-purple-400">주문 내역</h2>

								<div className="space-y-4 mb-6">
									<div className="glass-dark rounded-xl p-5 border border-purple-500/20">
										<div className="flex justify-between items-start mb-2">
											<h3 className="font-bold text-lg text-white">{paymentState.planName}</h3>
											<span className="text-xl font-bold text-purple-400">{paymentState.priceDisplay}</span>
										</div>
										<p className="text-sm text-gray-400">견적 분석 서비스</p>
									</div>
								</div>

								<div className="space-y-3 py-4 border-t border-b border-gray-700">
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">상품 금액</span>
										<span className="text-white">{paymentState.price.toLocaleString()}원</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">부가세 (VAT 10%)</span>
										<span className="text-white">{vatAmount.toLocaleString()}원</span>
									</div>
								</div>

								<div className="flex justify-between items-center mt-6 mb-8">
									<span className="text-lg font-semibold text-gray-300">최종 결제 금액</span>
									<span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
										{totalAmount.toLocaleString()}원
									</span>
								</div>

								<motion.button
									onClick={handlePayment}
									disabled={processing || !customerName || !customerPhone || !customerEmail || !agreeTerms}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className="w-full py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-xl shadow-lg glow-cyan transition-all flex items-center justify-center gap-3"
								>
									{processing ? (
										<>
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
											결제 처리 중...
										</>
									) : (
										<>
											<Lock className="w-6 h-6" />
											결제하기
											<ArrowRight className="w-6 h-6" />
										</>
									)}
								</motion.button>

								<div className="mt-6 glass-dark rounded-xl p-4 border border-cyan-500/20">
									<div className="flex items-start gap-3">
										<Lock className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
										<div>
											<p className="text-sm font-semibold text-cyan-300 mb-1">안전한 결제</p>
											<p className="text-xs text-gray-400">
												SSL 보안 프로토콜로 안전하게 보호됩니다
											</p>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</div>

					{/* Bottom Notice */}
					<motion.div
						className="mt-12 glass-strong rounded-2xl p-6 border border-amber-500/30"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
					>
						<h3 className="text-lg font-bold text-amber-300 mb-3">📋 결제 안내</h3>
						<ul className="text-sm text-gray-300 space-y-2">
							<li>• 결제 완료 후 견적서 제출 페이지로 자동 이동합니다</li>
							<li>• 견적서 제출 시점부터 SLA 시간이 시작됩니다</li>
							<li>• 영업일 기준으로 응답 시간이 계산됩니다 (평일 09:00~18:00)</li>
							<li>• 결제 영수증은 이메일로 자동 발송됩니다</li>
						</ul>
					</motion.div>
				</div>
			</div>
		</div>
	)
}
