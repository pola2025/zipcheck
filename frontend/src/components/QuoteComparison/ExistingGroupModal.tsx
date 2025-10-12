import { motion } from 'framer-motion'
import { Clock, Plus, FileText, AlertCircle } from 'lucide-react'

interface GroupInfo {
	id: string
	group_name: string
	quote_count: number
	expires_at: string
	hours_remaining: number
}

interface PricingInfo {
	quoteCount: number
	totalPrice: number
	additionalPrice: number
	canAddMore: boolean
}

interface ExistingGroupModalProps {
	group: GroupInfo
	pricing: PricingInfo
	onAddToGroup: () => void
	onCreateNew: () => void
	onCancel: () => void
}

export default function ExistingGroupModal({
	group,
	pricing,
	onAddToGroup,
	onCreateNew,
	onCancel
}: ExistingGroupModalProps) {
	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 max-w-2xl w-full shadow-2xl"
			>
				{/* 헤더 */}
				<div className="text-center mb-6">
					<div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<FileText className="w-8 h-8 text-cyan-400" />
					</div>
					<h2 className="text-2xl font-bold mb-2">기존 프로젝트 발견!</h2>
					<p className="text-gray-400">48시간 내에 제출하신 견적이 있습니다</p>
				</div>

				{/* 그룹 정보 */}
				<div className="bg-gray-700/50 rounded-2xl p-6 mb-6">
					<div className="flex items-start justify-between mb-4">
						<div>
							<div className="text-sm text-gray-400 mb-1">프로젝트명</div>
							<div className="text-xl font-bold text-white">{group.group_name}</div>
						</div>
						<div className="text-right">
							<div className="text-sm text-gray-400 mb-1">등록된 견적</div>
							<div className="text-2xl font-bold text-cyan-400">{group.quote_count}개</div>
						</div>
					</div>

					<div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
						<Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
						<div className="text-sm">
							<span className="text-amber-400 font-semibold">{group.hours_remaining}시간 남음</span>
							<span className="text-gray-400"> (48시간 할인가 적용 가능)</span>
						</div>
					</div>
				</div>

				{/* 선택 옵션 */}
				<div className="grid md:grid-cols-2 gap-4 mb-6">
					{/* 기존 그룹에 추가 */}
					<button
						onClick={onAddToGroup}
						disabled={!pricing.canAddMore}
						className={`relative bg-gradient-to-br p-6 rounded-2xl border-2 transition-all text-left ${
							pricing.canAddMore
								? 'from-green-500/20 to-cyan-500/20 border-green-500/50 hover:from-green-500/30 hover:to-cyan-500/30 cursor-pointer'
								: 'from-gray-700/50 to-gray-800/50 border-gray-600/30 opacity-50 cursor-not-allowed'
						}`}
					>
						{pricing.canAddMore && (
							<div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
								추천
							</div>
						)}
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
								<Plus className="w-5 h-5 text-green-400" />
							</div>
							<div className="text-lg font-bold">기존 프로젝트에 추가</div>
						</div>

						{pricing.canAddMore ? (
							<>
								<div className="text-3xl font-bold text-green-400 mb-2">
									+{pricing.additionalPrice.toLocaleString()}원
								</div>
								<div className="text-sm text-gray-300">
									총 {pricing.totalPrice.toLocaleString()}원 ({pricing.quoteCount}개 견적 비교)
								</div>
								<div className="text-xs text-green-400 mt-2 font-semibold">
									💰 개별 분석 대비 {(30000 - pricing.additionalPrice).toLocaleString()}원 절감!
								</div>
							</>
						) : (
							<div className="text-sm text-gray-400">최대 3개까지만 비교 가능합니다</div>
						)}
					</button>

					{/* 새 프로젝트 시작 */}
					<button
						onClick={onCreateNew}
						className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 hover:from-purple-500/30 hover:to-pink-500/30 p-6 rounded-2xl transition-all text-left"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
								<FileText className="w-5 h-5 text-purple-400" />
							</div>
							<div className="text-lg font-bold">새 프로젝트 시작</div>
						</div>
						<div className="text-3xl font-bold text-purple-400 mb-2">30,000원</div>
						<div className="text-sm text-gray-300">다른 프로젝트로 분리하여 분석</div>
					</button>
				</div>

				{/* 안내 */}
				{pricing.canAddMore && (
					<div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
						<div className="flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
							<div className="text-sm text-gray-300">
								<p className="font-semibold text-blue-400 mb-1">추천 안내</p>
								<p>
									같은 공간에 대한 여러 업체 견적이라면 <span className="text-green-400 font-semibold">기존
									프로젝트에 추가</span>하여 비교 분석하는 것이 유리합니다.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* 취소 버튼 */}
				<button
					onClick={onCancel}
					className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl font-semibold transition-all"
				>
					취소
				</button>
			</motion.div>
		</div>
	)
}
