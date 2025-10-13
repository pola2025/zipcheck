import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, CheckCircle2, ArrowRight, Package, AlertTriangle } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import { calculatePrice, type PlanId, type Quantity } from '../lib/pricing'

interface PaymentState {
	planId: PlanId
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
	const [quantity, setQuantity] = useState<Quantity>(1)

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

	// 실시간 가격 계산 (할인 적용)
	const priceCalculation = calculatePrice(paymentState.planId, quantity)

	// VAT 계산
	const vatAmount = Math.floor(priceCalculation.totalAmount * 0.1)
	const totalAmount = priceCalculation.totalAmount + vatAmount

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
				quantity,
				price: totalAmount,
				originalAmount: priceCalculation.originalAmount,
				discountAmount: priceCalculation.discountAmount,
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
				<div className="container mx-auto max-w-6xl">
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
								background: 'linear-gradient(135deg, #11998e, #38ef7d)',
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
							className="space-y-6"
						>
							{/* Quantity Selection */}
							<div className="glass-neon rounded-3xl p-8 border-2 border-[#11998e]/30 neon-border">
								<h2 className="text-2xl font-bold mb-3 flex items-center gap-3" style={{
									background: 'linear-gradient(135deg, #11998e, #38ef7d)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent'
								}}>
									<Package className="w-7 h-7 text-[#38ef7d]" />
									견적 분석 건수
								</h2>
								<p className="text-sm text-gray-400 mb-6">
									여러 업체의 견적을 동시에 비교하면 <span className="text-[#38ef7d] font-semibold">할인 혜택</span>이 적용됩니다
								</p>

								<div className="grid grid-cols-3 gap-4">
									{([1, 2, 3] as const).map((qty) => {
										const calc = calculatePrice(paymentState.planId, qty)
										const isSelected = quantity === qty
										return (
											<motion.button
												key={qty}
												onClick={() => setQuantity(qty)}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className={`relative p-5 rounded-2xl border-2 transition-all ${
													isSelected
														? 'border-[#38ef7d] bg-[#11998e]/20 shadow-[0_0_20px_rgba(56,239,125,0.3)]'
														: 'border-[#11998e]/30 bg-black/40 hover:border-[#11998e]/60'
												}`}
											>
												{qty > 1 && calc.discountAmount > 0 && (
													<div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
														{calc.discountAmount.toLocaleString()}원 할인
													</div>
												)}
												<div className="text-center">
													<div className={`text-3xl font-bold mb-2 ${
														isSelected ? 'text-[#38ef7d]' : 'text-gray-400'
													}`}>
														{qty}건
													</div>
													<div className={`text-lg font-semibold whitespace-nowrap ${
														isSelected ? 'text-white' : 'text-gray-500'
													}`}>
														{calc.totalAmount.toLocaleString()}원
													</div>
													{qty > 1 && (
														<div className="text-xs text-gray-400 mt-1">
															<span className="line-through">{calc.originalAmount.toLocaleString()}원</span>
														</div>
													)}
												</div>
											</motion.button>
										)
									})}
								</div>

								{/* Price Breakdown */}
								{quantity > 1 && priceCalculation.discountAmount > 0 && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										className="mt-6 glass-dark rounded-xl p-4 border border-[#11998e]/20"
									>
										<h4 className="text-sm font-semibold text-[#38ef7d] mb-3">가격 상세</h4>
										<div className="space-y-2 text-sm">
											{priceCalculation.breakdown.map((item) => (
												<div key={item.index} className="flex justify-between items-center">
													<span className="text-gray-400">{item.index}번째 견적</span>
													<div className="text-right">
														<span className="text-white font-semibold">{item.price.toLocaleString()}원</span>
														{item.discount > 0 && (
															<span className="text-xs text-amber-400 ml-2">
																(-{item.discount.toLocaleString()}원)
															</span>
														)}
													</div>
												</div>
											))}
											<div className="pt-2 mt-2 border-t border-gray-700 flex justify-between font-bold">
												<span className="text-gray-300">합계</span>
												<span className="text-[#38ef7d]">{priceCalculation.totalAmount.toLocaleString()}원</span>
											</div>
										</div>
									</motion.div>
								)}
							</div>

							{/* Customer Information */}
							<div className="glass-neon rounded-3xl p-8 border-2 border-[#11998e]/30 neon-border">
								<h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{
									background: 'linear-gradient(135deg, #11998e, #38ef7d)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent'
								}}>
									<CreditCard className="w-7 h-7 text-[#38ef7d]" />
									고객 정보
								</h2>

								<div className="space-y-5">
									<div>
										<label className="block text-sm font-semibold mb-2 text-[#38ef7d]">
											이름 <span className="text-red-400">*</span>
										</label>
										<input
											type="text"
											value={customerName}
											onChange={(e) => setCustomerName(e.target.value)}
											placeholder="홍길동"
											className="w-full px-4 py-3 bg-black/60 border border-[#11998e]/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#38ef7d] focus:shadow-[0_0_20px_rgba(56,239,125,0.3)] transition-all"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold mb-2 text-[#38ef7d]">
											전화번호 <span className="text-red-400">*</span>
										</label>
										<input
											type="tel"
											value={customerPhone}
											onChange={(e) => setCustomerPhone(e.target.value)}
											placeholder="010-1234-5678"
											className="w-full px-4 py-3 bg-black/60 border border-[#11998e]/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#38ef7d] focus:shadow-[0_0_20px_rgba(56,239,125,0.3)] transition-all"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold mb-2 text-[#38ef7d]">
											이메일 <span className="text-red-400">*</span>
										</label>
										<input
											type="email"
											value={customerEmail}
											onChange={(e) => setCustomerEmail(e.target.value)}
											placeholder="example@email.com"
											className="w-full px-4 py-3 bg-black/60 border border-[#11998e]/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#38ef7d] focus:shadow-[0_0_20px_rgba(56,239,125,0.3)] transition-all"
										/>
									</div>

									{/* Mock Payment Method Section */}
									<div className="pt-4">
										<label className="block text-sm font-semibold mb-3 text-[#38ef7d]">
											결제 수단
										</label>
										<div className="glass-strong rounded-xl p-4 border border-[#11998e]/20">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 rounded-lg bg-[#11998e]/20 flex items-center justify-center">
														<CreditCard className="w-6 h-6 text-[#38ef7d]" />
													</div>
													<div>
														<p className="font-semibold text-white">토스페이먼츠</p>
														<p className="text-xs text-gray-400">카드·계좌이체·간편결제</p>
													</div>
												</div>
												<CheckCircle2 className="w-6 h-6 text-[#38ef7d]" />
											</div>
										</div>
										<p className="text-xs text-gray-400 mt-2">
											※ 토스페이먼츠 승인 후 실제 결제 기능이 연동됩니다
										</p>
									</div>

									{/* Refund Policy Notice */}
									<div className="pt-4">
										<div className="glass-dark rounded-xl p-4 border border-red-500/30 bg-red-500/5">
											<div className="flex items-start gap-3">
												<AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
												<div>
													<p className="text-sm font-semibold text-red-400 mb-2">환불 불가 안내</p>
													<p className="text-xs text-gray-300 leading-relaxed">
														본 서비스는 <span className="text-white font-semibold">견적 분석 결과를 제공하는 서비스</span>로,
														분석 결과가 제공된 이후에는 <span className="text-red-300 font-semibold">결제 취소 및 환불이 불가능</span>합니다.
														결제 전 요금제와 건수를 신중히 선택해주시기 바랍니다.
													</p>
												</div>
											</div>
										</div>
									</div>

									{/* Terms Agreement */}
									<div className="pt-4">
										<label className="flex items-start gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={agreeTerms}
												onChange={(e) => setAgreeTerms(e.target.checked)}
												className="mt-1 w-5 h-5 rounded border-[#11998e]/30 text-[#38ef7d] focus:ring-[#38ef7d]"
											/>
											<span className="text-sm text-gray-300">
												<span className="text-[#38ef7d] font-semibold">이용약관</span>, {' '}
												<span className="text-[#38ef7d] font-semibold">개인정보처리방침</span> 및 {' '}
												<span className="text-red-400 font-semibold">환불 불가 정책</span>에 동의합니다
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
							<div className="glass-strong rounded-3xl p-8 border border-[#11998e]/30 sticky top-32">
								<h2 className="text-2xl font-bold mb-6" style={{
									background: 'linear-gradient(135deg, #11998e, #38ef7d)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent'
								}}>주문 내역</h2>

								<div className="space-y-4 mb-6">
									<div className="glass-dark rounded-xl p-5 border border-[#11998e]/20">
										<div className="flex justify-between items-start mb-2">
											<div>
												<h3 className="font-bold text-lg text-white">{paymentState.planName}</h3>
												<p className="text-sm text-gray-400 mt-1">
													{quantity}건 견적 비교 분석
												</p>
											</div>
											<span className="text-xl font-bold text-[#38ef7d] whitespace-nowrap">
												{priceCalculation.basePrice.toLocaleString()}원<span className="text-sm text-gray-400">/건</span>
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-3 py-4 border-t border-b border-gray-700">
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">정상 금액 ({quantity}건)</span>
										<span className="text-white">{priceCalculation.originalAmount.toLocaleString()}원</span>
									</div>
									{priceCalculation.discountAmount > 0 && (
										<div className="flex justify-between text-sm">
											<span className="text-amber-400 font-semibold">다건 할인</span>
											<span className="text-amber-400 font-semibold">-{priceCalculation.discountAmount.toLocaleString()}원</span>
										</div>
									)}
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">할인 적용 금액</span>
										<span className="text-white font-semibold">{priceCalculation.totalAmount.toLocaleString()}원</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">부가세 (VAT 10%)</span>
										<span className="text-white">{vatAmount.toLocaleString()}원</span>
									</div>
								</div>

								<div className="flex justify-between items-center mt-6 mb-4">
									<span className="text-lg font-semibold text-gray-300">최종 결제 금액</span>
									<span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#11998e] to-[#38ef7d] whitespace-nowrap">
										{totalAmount.toLocaleString()}원
									</span>
								</div>

								{/* Refund Warning */}
								<div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
									<p className="text-xs text-red-300 text-center font-medium">
										⚠️ 분석 결과 제공 후 환불 불가
									</p>
								</div>

								<motion.button
									onClick={handlePayment}
									disabled={processing || !customerName || !customerPhone || !customerEmail || !agreeTerms}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className="w-full py-5 bg-gradient-to-r from-[#11998e] to-[#38ef7d] hover:from-[#0d7a73] hover:to-[#2dd169] disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-3"
									style={{
										boxShadow: '0 4px 20px rgba(17, 153, 142, 0.4)'
									}}
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

								<div className="mt-6 glass-dark rounded-xl p-4 border border-[#11998e]/20">
									<div className="flex items-start gap-3">
										<Lock className="w-5 h-5 text-[#38ef7d] mt-0.5 flex-shrink-0" />
										<div>
											<p className="text-sm font-semibold text-[#38ef7d] mb-1">안전한 결제</p>
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
							<li className="text-red-300 font-semibold">
								• ⚠️ 본 서비스는 견적 분석 결과를 제공하는 서비스이므로, 분석 결과 제공 후에는 결제 취소 및 환불이 불가능합니다
							</li>
						</ul>
					</motion.div>
				</div>
			</div>
		</div>
	)
}
