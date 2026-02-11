import { useParams, Link } from 'react-router-dom'
import { ArrowRight, Clock, User, Tag, ChevronLeft } from 'lucide-react'
import BlogHeader from 'components/blog/BlogHeader'
import BlogFooter from 'components/blog/BlogFooter'
import PageSEO from 'components/PageSEO'
import { getBlogPostBySlug, getRelatedPosts, getCTAConfig } from '../../data/blogPosts'
import { getSubdomain, getSubdomainUrl } from '../../lib/subdomain'
import { BlogChart, PRESET_CHARTS } from 'components/blog/charts/BlogCharts'

export default function BlogPostDetail() {
	const { slug } = useParams<{ slug: string }>()
	const subdomain = getSubdomain()
	const blogHome = subdomain === 'blog' ? '/' : '/blog'

	const post = slug ? getBlogPostBySlug(slug) : undefined

	if (!post) {
		return (
			<div className="min-h-screen bg-sand-900 flex items-center justify-center">
				<div className="text-center">
					<p className="text-sand-400 text-lg font-semibold mb-2">게시글을 찾을 수 없습니다</p>
					<Link to={blogHome} className="text-forest-400 hover:text-forest-300 text-sm underline">
						블로그 홈으로 돌아가기
					</Link>
				</div>
			</div>
		)
	}

	const relatedPosts = getRelatedPosts(post.slug, 3)
	const cta = getCTAConfig(post.category)
	const ctaUrl = getSubdomainUrl(cta.subdomain) + cta.path

	const categoryStyle =
		post.category === '피해예방'
			? 'bg-red-500/15 text-red-400 border-red-500/20'
			: 'bg-forest-500/15 text-forest-400 border-forest-500/20'

	return (
		<div className="min-h-screen bg-sand-900">
			<PageSEO
				title={`${post.title} | 집첵 블로그`}
				description={post.excerpt}
				path={`/blog/${post.slug}`}
				baseUrl="https://blog.zcheck.co.kr"
				jsonLd={[
					{
						'@context': 'https://schema.org',
						'@type': 'BlogPosting',
						headline: post.title,
						description: post.excerpt,
						datePublished: post.date.replace(/\./g, '-'),
						dateModified: post.date.replace(/\./g, '-'),
						author: { '@type': 'Person', name: post.author },
						publisher: {
							'@type': 'Organization',
							name: '집첵',
							url: 'https://zcheck.co.kr',
						},
						mainEntityOfPage: {
							'@type': 'WebPage',
							'@id': `https://blog.zcheck.co.kr/blog/${post.slug}`,
						},
						image: post.thumbnail || 'https://zcheck.co.kr/og-image.png',
						wordCount: post.content.replace(/<[^>]*>/g, '').length,
						articleSection: post.category,
						keywords: [...post.tags, '인테리어 견적비교', '인테리어 가격비교', '인테리어 리모델링 견적비교'].join(', '),
						inLanguage: 'ko-KR',
						isPartOf: {
							'@type': 'Blog',
							name: '집첵 블로그',
							url: 'https://blog.zcheck.co.kr',
						},
					},
					{
						'@context': 'https://schema.org',
						'@type': 'BreadcrumbList',
						itemListElement: [
							{ '@type': 'ListItem', position: 1, name: '블로그', item: 'https://blog.zcheck.co.kr' },
							{ '@type': 'ListItem', position: 2, name: post.category, item: 'https://blog.zcheck.co.kr' },
							{ '@type': 'ListItem', position: 3, name: post.title, item: `https://blog.zcheck.co.kr/blog/${post.slug}` },
						],
					},
				]}
			/>

			<BlogHeader />

			{/* Article */}
			<article className="pt-20 pb-12">
				<div className="max-w-3xl mx-auto px-5 md:px-8">

					{/* Breadcrumb */}
					<nav className="flex items-center gap-2 text-xs text-sand-600 mb-6 pt-4">
						<Link to={blogHome} className="hover:text-sand-400 transition-colors">블로그</Link>
						<ChevronLeft size={12} className="rotate-180" />
						<span className="text-sand-500">{post.category}</span>
					</nav>

					{/* Post Header */}
					<header className="mb-8">
						<span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border mb-4 ${categoryStyle}`}>
							{post.category}
						</span>
						<h1 className="text-white text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-4">
							{post.title}
						</h1>
						<p className="text-sand-400 text-sm leading-relaxed mb-5">
							{post.excerpt}
						</p>
						<div className="flex flex-wrap items-center gap-4 text-sand-500 text-xs">
							<span className="flex items-center gap-1.5">
								<User size={13} />
								{post.author}
							</span>
							<span className="flex items-center gap-1.5">
								<Clock size={13} />
								{post.readTime} 읽기
							</span>
							<span>{post.date}</span>
						</div>
					</header>

					{/* Thumbnail placeholder */}
					<div className="bg-sand-800 rounded-2xl h-48 md:h-64 mb-10 flex items-center justify-center border border-sand-700/30 overflow-hidden">
						{post.thumbnail ? (
							<img
								src={post.thumbnail}
								alt={post.title}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="text-center">
								<div className="w-12 h-12 bg-sand-700 rounded-xl flex items-center justify-center mx-auto mb-2">
									<Tag size={20} className="text-sand-500" />
								</div>
								<p className="text-sand-600 text-xs">이미지 준비중</p>
							</div>
						)}
					</div>

					{/* Article Content */}
					<div
						className="blog-content"
						dangerouslySetInnerHTML={{ __html: post.content }}
					/>

					{/* Embedded Charts */}
					{post.chartIds && post.chartIds.length > 0 && (
						<div className="mt-6">
							{post.chartIds.map((chartId) => {
								const chartConfig = PRESET_CHARTS[chartId]
								if (!chartConfig) return null
								return <BlogChart key={chartId} config={chartConfig} />
							})}
						</div>
					)}

					{/* Tags */}
					<div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-sand-800">
						{post.tags.map((tag) => (
							<span
								key={tag}
								className="text-[11px] text-sand-500 bg-sand-800 px-3 py-1 rounded-full border border-sand-700/40"
							>
								#{tag}
							</span>
						))}
					</div>

					{/* CTA Section */}
					<div className={`mt-10 rounded-2xl p-6 md:p-8 border ${
						cta.color === 'forest'
							? 'bg-forest-900/40 border-forest-600/20'
							: 'bg-red-900/20 border-red-500/15'
					}`}>
						<span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 ${
							cta.color === 'forest'
								? 'bg-forest-500/20 text-forest-400'
								: 'bg-red-500/15 text-red-400'
						}`}>
							{cta.badge}
						</span>
						<h3 className="text-white text-lg font-bold mb-2">{cta.title}</h3>
						<p className="text-sand-400 text-sm mb-5 leading-relaxed">{cta.description}</p>
						<a
							href={ctaUrl}
							className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:translate-y-[-1px] shadow-lg ${
								cta.color === 'forest'
									? 'bg-gradient-to-r from-forest-600 to-forest-500 hover:from-forest-500 hover:to-forest-400 shadow-forest-500/20'
									: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/20'
							}`}
						>
							{cta.buttonText}
							<ArrowRight size={16} />
						</a>
					</div>

					{/* Related Posts */}
					{relatedPosts.length > 0 && (
						<section className="mt-12">
							<h2 className="text-white text-base font-bold mb-4">관련 글</h2>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{relatedPosts.map((related) => {
									const detailPath = subdomain === 'blog' ? `/blog/${related.slug}` : `/blog/${related.slug}`
									return (
										<Link
											key={related.slug}
											to={detailPath}
											className="bg-sand-800 rounded-xl p-4 hover:bg-sand-700/80 transition-colors group border border-sand-700/20"
										>
											<span className={`text-[10px] font-bold ${
												related.category === '피해예방' ? 'text-red-400' : 'text-forest-400'
											}`}>
												{related.category}
											</span>
											<h3 className="text-sand-200 text-sm font-semibold mt-1.5 leading-snug line-clamp-2 group-hover:text-white transition-colors">
												{related.title}
											</h3>
											<p className="text-sand-600 text-xs mt-2 flex items-center gap-1">
												<Clock size={10} />
												{related.readTime}
											</p>
										</Link>
									)
								})}
							</div>
						</section>
					)}

					{/* Back to blog */}
					<div className="mt-10 text-center">
						<Link
							to={blogHome}
							className="inline-flex items-center gap-2 text-sand-500 hover:text-sand-300 text-sm font-medium transition-colors"
						>
							<ChevronLeft size={16} />
							블로그 목록으로 돌아가기
						</Link>
					</div>
				</div>
			</article>

			<BlogFooter />

			{/* Blog content styles */}
			<style>{`
				.blog-content {
					color: #d1ccc2;
					font-size: 0.9375rem;
					line-height: 1.85;
				}
				.blog-content h2 {
					color: #fafaf8;
					font-size: 1.3rem;
					font-weight: 800;
					margin-top: 2.5rem;
					margin-bottom: 0.75rem;
					padding-bottom: 0.5rem;
					border-bottom: 1px solid rgba(120, 113, 100, 0.15);
				}
				.blog-content h3 {
					color: #e8e4dc;
					font-size: 1.05rem;
					font-weight: 700;
					margin-top: 1.75rem;
					margin-bottom: 0.5rem;
				}
				.blog-content p {
					margin-bottom: 1rem;
				}
				.blog-content ul, .blog-content ol {
					margin-bottom: 1rem;
					padding-left: 1.25rem;
				}
				.blog-content li {
					margin-bottom: 0.4rem;
				}
				.blog-content li strong {
					color: #e8e4dc;
				}
				.blog-content strong {
					color: #f0ece4;
					font-weight: 600;
				}
				.blog-content blockquote {
					border-left: 3px solid #38755e;
					padding-left: 1rem;
					margin: 1.5rem 0;
					color: #b0a898;
					font-style: italic;
				}
				.blog-content a {
					color: #4ecb8f;
					text-decoration: underline;
					text-underline-offset: 2px;
				}
				.blog-content a:hover {
					color: #6ee4a8;
				}
				.blog-content img {
					border-radius: 0.75rem;
					margin: 1.5rem 0;
					width: 100%;
				}
				.blog-content table {
					width: 100%;
					border-collapse: collapse;
					margin: 1.5rem 0;
					font-size: 0.875rem;
				}
				.blog-content th {
					background: rgba(120, 113, 100, 0.1);
					color: #e8e4dc;
					font-weight: 600;
					padding: 0.625rem 0.75rem;
					text-align: left;
					border-bottom: 1px solid rgba(120, 113, 100, 0.2);
				}
				.blog-content td {
					padding: 0.5rem 0.75rem;
					border-bottom: 1px solid rgba(120, 113, 100, 0.08);
				}
			`}</style>
		</div>
	)
}
