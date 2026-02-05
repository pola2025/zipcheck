import { getSubdomainUrl } from '../../lib/subdomain'

export default function BlogFooter() {
	return (
		<footer className="bg-sand-900 border-t border-sand-800/60">
			<div className="max-w-3xl mx-auto px-5 py-8">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2.5">
						<img src="/logo_white.png" alt="집첵" className="h-5 w-auto opacity-60" />
						<span className="text-sand-600 text-xs">&copy; {new Date().getFullYear()} 집첵 (ZipCheck)</span>
					</div>
					<div className="flex items-center gap-4 text-xs text-sand-600">
						<a href={getSubdomainUrl('main') + '/privacy'} className="hover:text-sand-400 transition-colors">
							개인정보처리방침
						</a>
						<a href={getSubdomainUrl('main') + '/terms'} className="hover:text-sand-400 transition-colors">
							이용약관
						</a>
						<a href={getSubdomainUrl('main')} className="hover:text-sand-400 transition-colors">
							집첵 메인
						</a>
					</div>
				</div>
			</div>
		</footer>
	)
}
