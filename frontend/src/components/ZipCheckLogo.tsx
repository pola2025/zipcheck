import { cn } from 'lib/utils'

interface ZipCheckLogoProps {
	className?: string
}

export default function ZipCheckLogo({ className = '' }: ZipCheckLogoProps) {
	return (
		<svg
			className={cn('w-8 h-8', className)}
			viewBox="0 0 100 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Simple Z shape with navy blue color */}
			<path
				d="M20 20 L80 20 L80 35 L40 65 L80 65 L80 80 L20 80 L20 65 L60 35 L20 35 Z"
				fill="currentColor"
				className="text-[#0A1E3D]"
			/>
		</svg>
	)
}
