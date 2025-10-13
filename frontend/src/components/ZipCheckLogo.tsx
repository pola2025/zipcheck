import { cn } from 'lib/utils'

interface ZipCheckLogoProps {
	className?: string
}

export default function ZipCheckLogo({ className = '' }: ZipCheckLogoProps) {
	return (
		<img
			src="/logo_white.png"
			alt="집첵"
			className={cn('w-auto', className)}
		/>
	)
}
