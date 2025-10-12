import type { OverallGrade } from 'types/quote'
import { motion } from 'framer-motion'

type GradeBadgeProps = {
	grade: OverallGrade
	displayText?: string
	size?: 'sm' | 'md' | 'lg'
}

const gradeConfig = {
	WARNING: {
		label: '주의',
		bgClass: 'bg-gradient-to-r from-red-600 to-red-500',
		textClass: 'text-white',
		borderClass: 'border-red-400',
		glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]'
	},
	APPROPRIATE_A: {
		label: '적정 A',
		bgClass: 'bg-gradient-to-r from-green-600 to-emerald-500',
		textClass: 'text-white',
		borderClass: 'border-green-400',
		glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]'
	},
	APPROPRIATE_B: {
		label: '적정 B',
		bgClass: 'bg-gradient-to-r from-cyan-600 to-cyan-500',
		textClass: 'text-white',
		borderClass: 'border-cyan-400',
		glowClass: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]'
	},
	APPROPRIATE_C: {
		label: '적정 C',
		bgClass: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
		textClass: 'text-white',
		borderClass: 'border-yellow-400',
		glowClass: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]'
	},
	PREMIUM: {
		label: '프리미엄',
		bgClass: 'bg-gradient-to-r from-purple-600 to-pink-600',
		textClass: 'text-white',
		borderClass: 'border-purple-400',
		glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]'
	}
}

const sizeConfig = {
	sm: {
		padding: 'px-3 py-1',
		fontSize: 'text-sm',
		borderWidth: 'border'
	},
	md: {
		padding: 'px-6 py-2',
		fontSize: 'text-base',
		borderWidth: 'border-2'
	},
	lg: {
		padding: 'px-8 py-3',
		fontSize: 'text-2xl',
		borderWidth: 'border-2'
	}
}

export default function GradeBadge({ grade, displayText, size = 'md' }: GradeBadgeProps) {
	const config = gradeConfig[grade]
	const sizeStyles = sizeConfig[size]

	return (
		<motion.div
			className={`
				inline-flex items-center justify-center gap-2 rounded-full font-bold
				${config.bgClass} ${config.textClass} ${config.borderClass} ${config.glowClass}
				${sizeStyles.padding} ${sizeStyles.fontSize} ${sizeStyles.borderWidth}
			`}
			whileHover={{
				scale: 1.05,
				boxShadow: config.glowClass.match(/rgba\([^)]+\)/)?.[0]
					? `0 0 30px ${config.glowClass.match(/rgba\([^)]+\)/)?.[0]}`
					: undefined
			}}
			transition={{ type: 'spring', stiffness: 300 }}
		>
			{displayText || config.label}
		</motion.div>
	)
}
