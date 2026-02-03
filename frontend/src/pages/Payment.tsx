import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, Lock, CheckCircle2, ArrowRight, AlertTriangle, Check } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { calculatePrice, PLANS, type PlanId } from '../lib/pricing'

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

	useEffect(() => {
		if (!paymentState) {
			alert('요금제를 먼저 선택해주세요.')
			navigate('/plan-selection')
		}
	}, [paymentState, navigate])

	if (!paymentState) {
		return null
	}

	const plan = PLANS[paymentState.planId]
	const priceCalc = calculatePrice(paymentState.planId)

	const handlePayment = async () => {
		if (!customerName || !customerPhone || !customerEmail) {
			alert('모든 정보를 입력해주세요.')
			return
		}
		if (!agreeTerms) {
			alert('이용약관에 동의해주세요.')
			return
		}

		setProcessing(true)
		await new Promise(resolve => setTimeout(resolve, 2000))

		const mockPaymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`

		navigate('/quote-submission', {
			state: {
				paymentId: mockPaymentId,
				planId: paymentState.planId,
				planName: paymentState.planName,
				quantity: 1,
				price: priceCalc.totalAmount,
				originalAmount: priceCalc.basePrice,
				discountAmount: 0,
				customerName,
				customerPhone,
				customerEmail
			}
		})
	}

	return (
		<div className="min-h-screen bg-sand-50">
			<PageSEO
				title="결제"
				description="안전한 결제로 인테리어 견적 AI 분석을 시작하세요."
				path="/payment"
				noindex
			/>
			<NordicNavigation />

			{/* Hero */}
			<div className="pt-28 pb-10 md:pt-36 md:pb-14 bg-gradient-to-b from-sand-100 to-sand-50">
				<div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
					<div className="flex items-center justify-center gap-3 mb-6">
						<div className="w-8 h-[2px] bg-forest-500" />
						<span className="text-forest-600 font-medium text-xs tracking-widest uppercase">
							Payment
						</span>
						<div className="w-8 h-[2px] bg-forest-500" />
					</div>
					<h1 className="font-outfit text-3xl md:text-5xl font-bold text-sand-900 tracking-tight mb-4">
						결제하기
					</h1>
					<p className="text-sand-600 text-base md:text-lg max-w-md mx-auto">
						결제 후 바로 견적 분석을 신청하실 수 있습니다
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-5 md:px-8 pb-20">
				<div className="grid md:grid-cols-2 gap-8">
					{/* Left: Customer Info Form */}
					<div className="space-y-6">
						{/* Customer Information */}
						<div className="nordic-card rounded-2xl p-6 md:p-8">
							<h2 className="text-xl font-bold text-sand-900 mb-6 flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
									<CreditCard className="w-5 h-5 text-forest-600" />
								</div>
								고객 정보
							</h2>

							<div className="space-y-5">
								<div>
									<label htmlFor="name" className="block text-sm font-semibold mb-2 text-sand-700">
										이름 <span className="text-red-500">*</span>
									</label>
									<input
										id="name"
										type="text"
										value={customerName}
										onChange={(e) => setCustomerName(e.target.value)}
										placeholder="홍길동"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
								<div>
									<label htmlFor="phone" className="block text-sm font-semibold mb-2 text-sand-700">
										전화번호 <span className="text-red-500">*</span>
									</label>
									<input
										id="phone"
										type="tel"
										value={customerPhone}
										onChange={(e) => setCustomerPhone(e.target.value)}
										placeholder="010-1234-5678"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>
								<div>
									<label htmlFor="email" className="block text-sm font-semibold mb-2 text-sand-700">
										이메일 <span className="text-red-500">*</span>
									</label>
									<input
										id="email"
										type="email"
										value={customerEmail}
										onChange={(e) => setCustomerEmail(e.target.value)}
										placeholder="example@email.com"
										className="w-full px-4 py-3 bg-white border border-sand-200 rounded-xl text-sand-900 placeholder-sand-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
									/>
								</div>

								{/* Payment Method */}
								<div className="pt-4">
									<label className="block text-sm font-semibold mb-3 text-sand-700">결제 수단</label>
									<div className="rounded-xl p-4 border border-sand-200 bg-white">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-lg bg-forest-50 flex items-center justify-center">
													<CreditCard className="w-5 h-5 text-forest-600" />
												</div>
												<div>
													<p className="font-semibold text-sand-900">토스페이먼츠</p>
													<p className="text-xs text-sand-500">카드 / 계좌이체 / 간편결제</p>
												</div>
											</div>
											<CheckCircle2 className="w-5 h-5 text-forest-500" />
										</div>
									</div>
									<p className="text-xs text-sand-400 mt-2">
										※ 토스페이먼츠 승인 후 실제 결제 기능이 연동됩니다
									</p>
								</div>

								{/* Refund Policy */}
								<div className="pt-2">
									<div className="rounded-xl p-4 border border-red-200 bg-red-50">
										<div className="flex items-start gap-3">
											<AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-semibold text-red-600 mb-1">환불 불가 안내</p>
												<p className="text-xs text-red-500/80 leading-relaxed">
													본 서비스는 <span className="font-semibold text-red-600">견적 분석 결과를 제공하는 서비스</span>로,
													분석 결과가 제공된 이후에는 <span className="font-semibold text-red-600">결제 취소 및 환불이 불가능</span>합니다.
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Terms Agreement */}
								<div className="pt-2">
									<label className="flex items-start gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={agreeTerms}
											onChange={(e) => setAgreeTerms(e.target.checked)}
											className="mt-1 w-5 h-5 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
										/>
										<span className="text-sm text-sand-600">
											<span className="text-forest-600 font-semibold">이용약관</span>,{' '}
											<span className="text-forest-600 font-semibold">개인정보처리방침</span> 및{' '}
											<span className="text-red-500 font-semibold">환불 불가 정책</span>에 동의합니다
										</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* Right: Order Summary */}
					<div>
						<div className="nordic-card rounded-2xl p-6 md:p-8 sticky top-28">
							<h2 className="text-xl font-bold text-sand-900 mb-6">주문 내역</h2>

							{/* Selected Plan Card */}
							<div className="rounded-xl p-5 bg-sand-100 border border-sand-200 mb-6">
								<div className="flex justify-between items-start mb-4">
									<div>
										<h3 className="font-bold text-lg text-sand-900">{plan.name}</h3>
										<p className="text-sm text-sand-500 mt-1">{plan.description}</p>
									</div>
									<span className="text-xl font-bold text-sand-900 font-outfit whitespace-nowrap">
										{priceCalc.basePrice.toLocaleString()}원
									</span>
								</div>
								<ul className="space-y-2">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2 text-sm">
											<Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-forest-500" />
											<span className="text-sand-600">{feature}</span>
										</li>
									))}
								</ul>
							</div>

							{/* Price Breakdown */}
							<div className="space-y-3 py-4 border-t border-b border-sand-200">
								<div className="flex justify-between text-sm">
									<span className="text-sand-500">분석 요금</span>
									<span className="text-sand-900">{priceCalc.basePrice.toLocaleString()}원</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-sand-500">부가세 (VAT 10%)</span>
									<span className="text-sand-900">{priceCalc.vatAmount.toLocaleString()}원</span>
								</div>
							</div>

							<div className="flex justify-between items-center mt-6 mb-5">
								<span className="text-base font-semibold text-sand-700">최종 결제 금액</span>
								<span className="text-3xl font-bold text-forest-600 font-outfit whitespace-nowrap">
									{priceCalc.totalAmount.toLocaleString()}원
								</span>
							</div>

							{/* Refund Warning */}
							<div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200">
								<p className="text-xs text-red-500 text-center font-medium">
									분석 결과 제공 후 환불 불가
								</p>
							</div>

							<button
								type="button"
								onClick={handlePayment}
								disabled={processing || !customerName || !customerPhone || !customerEmail || !agreeTerms}
								className="w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500 bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-600/15"
							>
								{processing ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
										결제 처리 중...
									</>
								) : (
									<>
										<Lock className="w-5 h-5" />
										{priceCalc.totalAmount.toLocaleString()}원 결제하기
										<ArrowRight className="w-5 h-5" />
									</>
								)}
							</button>

							<div className="mt-5 rounded-xl p-4 bg-sand-100 border border-sand-200">
								<div className="flex items-start gap-3">
									<Lock className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-semibold text-sand-800 mb-0.5">안전한 결제</p>
										<p className="text-xs text-sand-500">
											SSL 보안 프로토콜로 안전하게 보호됩니다
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Notice */}
				<div className="mt-10 nordic-card rounded-2xl p-6 md:p-8 border border-wood-200 bg-wood-50/50">
					<h3 className="font-semibold text-sand-900 mb-3">안내사항</h3>
					<ul className="text-sm text-sand-600 space-y-1.5">
						<li>• 결제 완료 후 견적서를 제출하시면 분석이 시작됩니다.</li>
						<li>• SLA 시간은 견적서 제출 시점부터 계산됩니다.</li>
						<li>• 부가세(VAT)는 별도이며, 결제 시 자동 적용됩니다.</li>
						<li>• 영업시간: 평일 09:00~18:00 (주말·공휴일 제외)</li>
						<li className="text-red-500 font-medium">
							• 본 서비스는 견적 분석 결과 제공 서비스이므로, 분석 결과 제공 후 환불이 불가합니다.
						</li>
					</ul>
				</div>
			</div>

			<NordicFooter />
		</div>
	)
}
