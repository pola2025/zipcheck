import { Star, AlertTriangle, ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import BlogHeader from 'components/blog/BlogHeader'
import BlogFooter from 'components/blog/BlogFooter'
import PageSEO from 'components/PageSEO'
import { getSubdomain, getSubdomainUrl } from '../../lib/subdomain'
import { BLOG_POSTS } from '../../data/blogPosts'

export default function BlogLanding() {
	const subdomain = getSubdomain()
	const featured = BLOG_POSTS[0]
	const gridPosts = BLOG_POSTS.slice(1)

	function postLink(slug: string) {
		return subdomain === 'blog' ? `/blog/${slug}` : `/blog/${slug}`
	}

	function categoryStyle(category: string) {
		if (category === '피해예방') return 'text-red-400'
		return 'text-forest-400'
	}

	function categoryBadgeStyle(category: string) {
		if (category === '피해예방') return 'bg-red-500/15 text-red-300 border border-red-500/20'
		return 'bg-forest-500 text-white'
	}

	return (
		<div className="min-h-screen bg-sand-900">
			<PageSEO
				title="집첵 블로그 | 인테리어 견적비교 가이드 & 정보"
				description="인테리어 견적비교, 가격비교, 리모델링 견적비교 정보를 제공합니다. 현명한 인테리어를 위한 필수 가이드."
				path="/"
				baseUrl="https://blog.zcheck.co.kr"
				jsonLd={[
					{
						'@context': 'https://schema.org',
						'@type': 'Blog',
						name: '집첵 블로그',
						description: '인테리어 견적비교, 인테리어 가격비교, 인테리어 리모델링 견적비교 가이드 & 정보',
						url: 'https://blog.zcheck.co.kr',
						keywords: '인테리어 견적비교, 인테리어 가격비교, 인테리어 리모델링 견적비교, 인테리어 가이드',
						inLanguage: 'ko-KR',
						isPartOf: { '@type': 'WebSite', name: 'ZipCheck', url: 'https://zcheck.co.kr' },
					},
				]}
			/>
			<BlogHeader />

			{/* Dark Hero */}
			<div className="pt-20 md:pt-24">
				<div className="max-w-3xl mx-auto px-5 md:px-8 pt-8 pb-4">
					<h1 className="text-white text-lg md:text-xl font-extrabold tracking-widest uppercase mb-1">
						ZIPCHECK <span className="text-forest-400">BLOG</span>
					</h1>
					<p className="text-sand-500 text-sm">인테리어 가이드 & 피해예방 정보</p>
				</div>

				{/* Featured Card */}
				{featured && (
					<div className="max-w-3xl mx-auto px-5 md:px-8 pb-4">
						<Link
							to={postLink(featured.slug)}
							className="block bg-gradient-to-br from-forest-700 to-forest-900 rounded-2xl p-6 md:p-8 relative overflow-hidden group"
						>
							<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
							<div className="relative z-10 flex flex-col justify-end min-h-[180px] md:min-h-[220px]">
								<span className={`${categoryBadgeStyle(featured.category)} text-[10px] font-extrabold px-2.5 py-1 rounded w-fit mb-3`}>
									{featured.category}
								</span>
								<h2 className="text-white text-xl md:text-2xl font-extrabold leading-snug tracking-tight mb-2">
									{featured.title}
								</h2>
								<p className="text-forest-300 text-sm leading-relaxed mb-3 max-w-lg">
									{featured.excerpt}
								</p>
								<div className="flex items-center gap-3 text-forest-400 text-xs">
									<span className="flex items-center gap-1"><Clock size={12} />{featured.readTime} 읽기</span>
									<span>{featured.date}</span>
								</div>
							</div>
							<ArrowRight className="absolute bottom-6 right-6 text-white/30 group-hover:text-white/70 transition-colors" size={24} />
						</Link>
					</div>
				)}

				{/* Grid Cards */}
				<div className="max-w-3xl mx-auto px-5 md:px-8 pb-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{gridPosts.map((post) => (
							<Link
								key={post.slug}
								to={postLink(post.slug)}
								className="bg-sand-800 rounded-2xl overflow-hidden group hover:bg-sand-700/80 transition-colors"
							>
								{post.thumbnail ? (
									<img src={post.thumbnail} alt={post.title} className="w-full h-32 md:h-36 object-cover" />
								) : (
									<div className="bg-sand-700 h-32 md:h-36" />
								)}
								<div className="p-4">
									<span className={`${categoryStyle(post.category)} text-[10px] font-bold`}>
										{post.category}
									</span>
									<h3 className="text-white text-sm font-bold mt-1.5 leading-snug line-clamp-2 group-hover:text-forest-300 transition-colors">
										{post.title}
									</h3>
									<p className="text-sand-500 text-xs mt-2 line-clamp-2 leading-relaxed">
										{post.excerpt}
									</p>
									<div className="flex items-center gap-2 text-sand-600 text-[10px] mt-3">
										<span className="flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
										<span>{post.date}</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>

				{/* CTA Section */}
				<div className="max-w-3xl mx-auto px-5 md:px-8 pb-12">
					<div className="bg-gradient-to-br from-forest-600 to-forest-500 rounded-2xl p-6 md:p-8">
						<p className="text-white font-bold text-base md:text-lg mb-1">경험을 나눠주세요</p>
						<p className="text-forest-200 text-sm mb-5">인테리어 후기 & 피해사례 공유</p>
						<div className="flex flex-col sm:flex-row gap-3">
							<a
								href={getSubdomainUrl('review') + '/write/review'}
								className="flex-1 bg-white text-forest-700 py-3.5 rounded-xl font-bold text-sm text-center hover:bg-sand-100 transition-colors flex items-center justify-center gap-2"
							>
								<Star size={16} className="fill-forest-500 text-forest-500" />
								후기 작성하기
							</a>
							<a
								href={getSubdomainUrl('report') + '/write/damage-case'}
								className="flex-1 bg-red-500 text-white py-3.5 rounded-xl font-bold text-sm text-center hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
							>
								<AlertTriangle size={16} />
								피해사례 등록
							</a>
						</div>
					</div>
				</div>
			</div>

			<BlogFooter />
		</div>
	)
}
