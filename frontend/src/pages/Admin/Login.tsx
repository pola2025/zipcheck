import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, LogIn, AlertCircle, Mail, Shield, ArrowLeft, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../contexts/AuthContext'
import { adminPath } from '../../lib/admin-path'

type LoginStep = 'email' | 'totp_code' | 'totp_setup'

const Login: React.FC = () => {
	const [step, setStep] = useState<LoginStep>('email')
	const [email, setEmail] = useState('')
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	// TOTP setup state
	const [sessionToken, setSessionToken] = useState('')
	const [totpSecret, setTotpSecret] = useState('')
	const [otpauthUri, setOtpauthUri] = useState('')

	const navigate = useNavigate()
	const { loginStep1, loginStep2 } = useAuth()
	const codeInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if ((step === 'totp_code' || step === 'totp_setup') && codeInputRef.current) {
			codeInputRef.current.focus()
		}
	}, [step])

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!email) {
			setError('이메일을 입력해주세요.')
			return
		}

		setLoading(true)
		try {
			const result = await loginStep1(email)
			setSessionToken(result.sessionToken)

			if (result.step === 'totp_setup') {
				setTotpSecret(result.secret || '')
				setOtpauthUri(result.otpauthUri || '')
				setStep('totp_setup')
			} else {
				setStep('totp_code')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const handleTotpSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!code || code.length !== 6) {
			setError('6자리 인증 코드를 입력해주세요.')
			return
		}

		setLoading(true)
		try {
			await loginStep2(
				code,
				sessionToken,
				step === 'totp_setup' ? totpSecret : undefined
			)
			navigate(adminPath())
		} catch (err) {
			setError(err instanceof Error ? err.message : '인증에 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const handleCopySecret = async () => {
		try {
			await navigator.clipboard.writeText(totpSecret)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			// Fallback
			const el = document.createElement('textarea')
			el.value = totpSecret
			document.body.appendChild(el)
			el.select()
			document.execCommand('copy')
			document.body.removeChild(el)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	const handleBack = () => {
		setStep('email')
		setCode('')
		setError(null)
		setSessionToken('')
		setTotpSecret('')
		setOtpauthUri('')
	}

	const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 6)
		setCode(value)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				{/* Logo/Header */}
				<div className="text-center mb-8">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
						className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl"
					>
						{step === 'email' ? (
							<Lock className="w-10 h-10 text-white" />
						) : (
							<Shield className="w-10 h-10 text-white" />
						)}
					</motion.div>
					<h1 className="text-3xl font-bold text-white mb-2">
						{step === 'email' && '관리자 로그인'}
						{step === 'totp_code' && '2단계 인증'}
						{step === 'totp_setup' && '2단계 인증 설정'}
					</h1>
					<p className="text-gray-400">
						{step === 'email' && 'ZipCheck 관리자 페이지에 접속합니다'}
						{step === 'totp_code' && '인증 앱에 표시된 6자리 코드를 입력하세요'}
						{step === 'totp_setup' && '인증 앱으로 QR코드를 스캔하세요'}
					</p>
				</div>

				{/* Login Form */}
				<motion.div
					key={step}
					initial={{ opacity: 0, x: step === 'email' ? -20 : 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3 }}
					className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8"
				>
					{/* Step: Email */}
					{step === 'email' && (
						<form onSubmit={handleEmailSubmit}>
							<div className="mb-6">
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									관리자 이메일
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
									<input
										type="email"
										id="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
										placeholder="이메일을 입력하세요"
										disabled={loading}
										autoComplete="email"
									/>
								</div>
							</div>

							{error && <ErrorMessage message={error} />}

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
							>
								{loading ? <Spinner label="확인 중..." /> : (
									<>
										<LogIn className="w-5 h-5 mr-2" />
										다음
									</>
								)}
							</button>
						</form>
					)}

					{/* Step: TOTP Setup (first-time) */}
					{step === 'totp_setup' && (
						<form onSubmit={handleTotpSubmit}>
							<div className="mb-6 space-y-4">
								{/* QR Code */}
								<div className="flex justify-center p-4 bg-white rounded-xl">
									<QRCodeSVG value={otpauthUri} size={200} />
								</div>

								{/* Instructions */}
								<div className="text-sm text-gray-400 space-y-2">
									<p className="font-medium text-gray-300">설정 방법:</p>
									<ol className="list-decimal list-inside space-y-1">
										<li>Google Authenticator 또는 인증 앱 설치</li>
										<li>앱에서 QR코드 스캔</li>
										<li>표시된 6자리 코드 입력</li>
									</ol>
								</div>

								{/* Secret key (manual entry) */}
								<div>
									<label className="block text-xs font-medium text-gray-500 mb-1">
										수동 입력 키
									</label>
									<div className="flex items-center gap-2">
										<code className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-300 font-mono break-all select-all">
											{totpSecret}
										</code>
										<button
											type="button"
											onClick={handleCopySecret}
											className="flex-shrink-0 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
											aria-label="복사"
										>
											{copied ? (
												<Check className="w-4 h-4 text-green-400" />
											) : (
												<Copy className="w-4 h-4 text-gray-400" />
											)}
										</button>
									</div>
								</div>

								{/* TOTP code input */}
								<div>
									<label
										htmlFor="totp-code"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										인증 코드
									</label>
									<input
										ref={codeInputRef}
										type="text"
										id="totp-code"
										inputMode="numeric"
										autoComplete="one-time-code"
										value={code}
										onChange={handleCodeChange}
										className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-500 transition-all"
										placeholder="000000"
										maxLength={6}
										disabled={loading}
									/>
								</div>
							</div>

							{error && <ErrorMessage message={error} />}

							<button
								type="submit"
								disabled={loading || code.length !== 6}
								className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-3"
							>
								{loading ? <Spinner label="등록 중..." /> : (
									<>
										<Shield className="w-5 h-5 mr-2" />
										등록 완료
									</>
								)}
							</button>

							<button
								type="button"
								onClick={handleBack}
								className="w-full text-gray-400 hover:text-white py-2 flex items-center justify-center transition-colors text-sm"
							>
								<ArrowLeft className="w-4 h-4 mr-1" />
								뒤로
							</button>
						</form>
					)}

					{/* Step: TOTP Code (returning user) */}
					{step === 'totp_code' && (
						<form onSubmit={handleTotpSubmit}>
							<div className="mb-6">
								<label
									htmlFor="totp-code"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									인증 코드
								</label>
								<input
									ref={codeInputRef}
									type="text"
									id="totp-code"
									inputMode="numeric"
									autoComplete="one-time-code"
									value={code}
									onChange={handleCodeChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-500 transition-all"
									placeholder="000000"
									maxLength={6}
									disabled={loading}
								/>
								<p className="mt-2 text-xs text-gray-500">
									인증 앱에 표시된 6자리 코드를 입력하세요
								</p>
							</div>

							{error && <ErrorMessage message={error} />}

							<button
								type="submit"
								disabled={loading || code.length !== 6}
								className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-3"
							>
								{loading ? <Spinner label="인증 중..." /> : (
									<>
										<Shield className="w-5 h-5 mr-2" />
										인증하기
									</>
								)}
							</button>

							<button
								type="button"
								onClick={handleBack}
								className="w-full text-gray-400 hover:text-white py-2 flex items-center justify-center transition-colors text-sm"
							>
								<ArrowLeft className="w-4 h-4 mr-1" />
								뒤로
							</button>
						</form>
					)}
				</motion.div>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="text-center mt-6 text-gray-500 text-sm"
				>
					<p>&copy; 2024 ZipCheck. All rights reserved.</p>
				</motion.div>
			</motion.div>
		</div>
	)
}

function ErrorMessage({ message }: { message: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start"
		>
			<AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
			<p className="text-red-400 text-sm">{message}</p>
		</motion.div>
	)
}

function Spinner({ label }: { label: string }) {
	return (
		<>
			<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
			{label}
		</>
	)
}

export default Login
