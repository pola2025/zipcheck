import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getSubdomain, getSubdomainUrl } from '../../lib/subdomain'

export default function BlogHeader() {
	const subdomain = getSubdomain()
	const blogHome = subdomain === 'blog' ? '/' : '/blog'

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-sand-900/90 backdrop-blur-lg border-b border-sand-700/30">
			<div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
				<Link to={blogHome} className="flex items-center gap-2.5">
					<img src="/logo.png" alt="집첵" className="h-8 w-auto" />
					<span className="text-sand-400 text-xs font-medium tracking-wider uppercase hidden sm:inline">Blog</span>
				</Link>
				<div className="flex items-center gap-4">
					<Link
						to={blogHome}
						className="flex items-center gap-1.5 text-sand-500 hover:text-sand-300 text-xs font-medium transition-colors"
					>
						<ArrowLeft size={14} />
						<span>블로그 홈</span>
					</Link>
					<a
						href={getSubdomainUrl('main')}
						className="text-sand-600 hover:text-sand-400 text-xs transition-colors"
					>
						집첵 메인
					</a>
				</div>
			</div>
		</header>
	)
}
