import { motion } from 'framer-motion'

interface Props {
	isBlind: boolean
}

export default function BlindLabelingBanner({ isBlind }: Props) {
	if (!isBlind) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
		>
			<div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
				<span className="text-amber-700 font-bold text-sm">B</span>
			</div>
			<div>
				<p className="text-sm font-semibold text-amber-800">Blind Labeling 모드</p>
				<p className="text-xs text-amber-600">
					AI 제안/자동완성이 비활성화됩니다. 직접 판단으로 라벨링하세요.
				</p>
			</div>
		</motion.div>
	)
}
