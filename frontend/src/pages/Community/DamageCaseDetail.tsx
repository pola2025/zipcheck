import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Building, Phone, FileText, ArrowLeft, Calendar, User, DollarSign, Image as ImageIcon } from 'lucide-react'
import { AnimatedBackground } from 'components/immersive'
import ZipCheckHeader from 'components/marketing/ZipCheckHeader'
import ZipCheckFooter from 'components/marketing/ZipCheckFooter'
import { getApiUrl } from '../../lib/api-config'

interface DamageCase {
	id: string
	company_name: string
	company_phone?: string
	business_number?: string
	damage_type: string
	damage_amount?: string
	case_description: string
	evidence_urls?: string[]
	status: 'pending' | 'approved' | 'rejected'
	created_at: string
	reporter_name?: string
	view_count: number
}

export default function DamageCaseDetail() {
	const navigate = useNavigate()
	const { id } = useParams<{ id: string }>()
	const [damageCase, setDamageCase] = useState<DamageCase | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selectedImage, setSelectedImage] = useState<string | null>(null)

	useEffect(() => {
		loadDamageCase()
	}, [id])

	const loadDamageCase = async () => {
		try {
			setLoading(true)
			const response = await fetch(getApiUrl(`/api/damage-cases/${id}`))

			if (!response.ok) {
				throw new Error('피해사례를 불러올 수 없습니다.')
			}

			const data = await response.json()
			setDamageCase(data)
			setLoading(false)
		} catch (err) {
			console.error('Failed to load damage case:', err)
			setError(err instanceof Error ? err.message : '피해사례를 불러오는 중 오류가 발생했습니다.')
			setLoading(false)
		}
	}

	const getDamageTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			'시공 불량': 'text-red-400',
			'계약 위반': 'text-orange-400',
			'금전 사기': 'text-pink-400',
			'자재 불량': 'text-yellow-400',
			'공사 지연': 'text-blue-400',
			'사후 서비스 불이행': 'text-purple-400',
			'기타': 'text-gray-400'
		}
		return colors[type] || 'text-cyan-400'
	}

	if (loading) {
		return (
			<div className="relative min-h-screen bg-black text-white flex items-center justify-center">
				<ZipCheckHeader />
				<AnimatedBackground />
				<div className="relative z-10 flex flex-col items-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400" style={{
						boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)'
					}}></div>
					<p className="mt-6 text-lg text-cyan-400">피해사례를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	if (error || !damageCase) {
		return (
			<div className="relative min-h-screen bg-black text-white">
				<ZipCheckHeader />
				<AnimatedBackground />
				<div className="relative z-10 pt-32 pb-20 px-6">
					<div className="container mx-auto max-w-3xl">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-neon rounded-2xl p-12 text-center border-2 border-red-500/50 bg-red-900/20"
						>
							<p className="text-xl text-red-300 mb-6">{error || '피해사례를 찾을 수 없습니다.'}</p>
							<motion.button
								onClick={() => navigate('/community?tab=damage-cases')}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold shadow-lg transition-all"
								style={{
									boxShadow: '0 4px 30px rgba(6, 182, 212, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)'
								}}
							>
								커뮤니티로 돌아가기
							</motion.button>
						</motion.div>
					</div>
				</div>
				<ZipCheckFooter />
			</div>
		)
	}

	return (
		<div className="relative min-h-screen bg-black text-white">
			{/* Header */}
			<ZipCheckHeader />

			{/* Animated background */}
			<AnimatedBackground />

			{/* Content */}
			<div className="relative z-10 pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-4xl">
					{/* Back Button */}
					<motion.button
						onClick={() => navigate('/community?tab=damage-cases')}
						className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<ArrowLeft className="w-5 h-5" />
						<span>커뮤니티로 돌아가기</span>
					</motion.button>

					{/* Damage Case Content */}
					<motion.div
						className="glass-neon rounded-3xl p-8 border-2 border-cyan-500/30 mb-6"
						style={{
							boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.05)'
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{/* Warning Badge */}
						<div className="flex items-center justify-between mb-6 pb-6 border-b border-cyan-500/20">
							<div className="flex items-start gap-4">
								<div className="p-3 bg-red-500/20 rounded-xl">
									<AlertTriangle className="w-8 h-8 text-red-400" />
								</div>
								<div>
									<div className="flex items-center gap-3 mb-2">
										<span className={`px-4 py-1 rounded-full text-sm font-bold border ${getDamageTypeColor(damageCase.damage_type)} border-current`}>
											{damageCase.damage_type}
										</span>
										{damageCase.damage_amount && (
											<div className="flex items-center gap-1 text-yellow-400">
												<DollarSign className="w-4 h-4" />
												<span className="font-semibold">{damageCase.damage_amount}</span>
											</div>
										)}
									</div>
									<h1 className="text-3xl font-bold" style={{
										background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
										WebkitBackgroundClip: 'text',
										WebkitTextFillColor: 'transparent',
										filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
									}}>
										{damageCase.company_name}
									</h1>
								</div>
							</div>
						</div>

						{/* Company Info */}
						<div className="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-cyan-500/20">
							{damageCase.company_phone && (
								<div className="flex items-center gap-3 text-gray-300">
									<Phone className="w-5 h-5 text-cyan-400" />
									<div>
										<p className="text-sm text-gray-400">업체 전화번호</p>
										<p className="font-semibold">{damageCase.company_phone}</p>
									</div>
								</div>
							)}
							{damageCase.business_number && (
								<div className="flex items-center gap-3 text-gray-300">
									<FileText className="w-5 h-5 text-cyan-400" />
									<div>
										<p className="text-sm text-gray-400">사업자번호</p>
										<p className="font-semibold">{damageCase.business_number}</p>
									</div>
								</div>
							)}
						</div>

						{/* Case Description */}
						<div className="mb-6">
							<h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
								<AlertTriangle className="w-5 h-5" />
								피해 내용
							</h2>
							<div className="bg-black/40 rounded-xl p-6 border border-cyan-500/20">
								<p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
									{damageCase.case_description}
								</p>
							</div>
						</div>

						{/* Evidence Images */}
						{damageCase.evidence_urls && damageCase.evidence_urls.length > 0 && (
							<div className="mb-6">
								<h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
									<ImageIcon className="w-5 h-5" />
									증거 사진
								</h2>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									{damageCase.evidence_urls.map((url, index) => (
										<motion.div
											key={index}
											whileHover={{ scale: 1.05 }}
											className="cursor-pointer"
											onClick={() => setSelectedImage(url)}
										>
											<img
												src={url}
												alt={`증거 ${index + 1}`}
												className="w-full h-48 object-cover rounded-lg border-2 border-cyan-500/30 hover:border-cyan-400 transition-colors"
											/>
										</motion.div>
									))}
								</div>
							</div>
						)}

						{/* Metadata */}
						<div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-cyan-500/20">
							<div className="flex items-center gap-3 text-gray-300">
								<Calendar className="w-5 h-5 text-cyan-400" />
								<div>
									<p className="text-sm text-gray-400">제보일</p>
									<p className="font-semibold">
										{new Date(damageCase.created_at).toLocaleDateString('ko-KR')}
									</p>
								</div>
							</div>
							{damageCase.reporter_name && (
								<div className="flex items-center gap-3 text-gray-300">
									<User className="w-5 h-5 text-cyan-400" />
									<div>
										<p className="text-sm text-gray-400">제보자</p>
										<p className="font-semibold">{damageCase.reporter_name}</p>
									</div>
								</div>
							)}
							<div className="flex items-center gap-3 text-gray-300">
								<Building className="w-5 h-5 text-cyan-400" />
								<div>
									<p className="text-sm text-gray-400">조회수</p>
									<p className="font-semibold">{damageCase.view_count}회</p>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Warning Notice */}
					<motion.div
						className="glass-neon rounded-2xl p-6 border border-yellow-500/30 bg-yellow-900/10"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
							<div>
								<p className="text-yellow-300 font-semibold mb-2">⚠️ 주의사항</p>
								<p className="text-sm text-gray-300 leading-relaxed">
									본 피해사례는 제보자의 주관적 경험을 바탕으로 작성되었습니다.
									해당 업체에 대한 계약이나 거래 시 신중한 판단이 필요하며,
									추가 확인 및 검증을 권장합니다. 법적 분쟁이 있는 경우 전문가의 도움을 받으시기 바랍니다.
								</p>
							</div>
						</div>
					</motion.div>
				</div>
			</div>

			{/* Image Modal */}
			{selectedImage && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
					onClick={() => setSelectedImage(null)}
				>
					<motion.img
						initial={{ scale: 0.8 }}
						animate={{ scale: 1 }}
						src={selectedImage}
						alt="증거 사진 상세"
						className="max-w-full max-h-full object-contain rounded-lg"
					/>
					<button
						onClick={() => setSelectedImage(null)}
						className="absolute top-6 right-6 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</motion.div>
			)}

			{/* Footer */}
			<ZipCheckFooter />
		</div>
	)
}
