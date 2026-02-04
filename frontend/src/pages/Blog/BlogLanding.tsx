import { Star, AlertTriangle, ArrowRight, BookOpen, Clock } from 'lucide-react'
import SubdomainNavigation from 'components/SubdomainNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import PageSEO from 'components/PageSEO'
import { getSubdomain, getSubdomainUrl } from '../../lib/subdomain'
import NordicNavigation from 'components/nordic/NordicNavigation'

interface BlogPost {
	id: string
	title: string
	excerpt: string
	category: string
	categoryColor: string
	readTime: string
	date: string
	featured?: boolean
}

const MOCK_POSTS: BlogPost[] = [
	{
		id: '1',
		title: '2026년 아파트 리모델링, 이것만은 꼭 확인하세요',
		excerpt: '인테리어 견적 시 흔히 놓치는 5가지 항목과 적정 가격 범위를 알려드립니다.',
		category: 'GUIDE',
		categoryColor: 'bg-forest-500 text-white',
		readTime: '5분',
		date: '2026.02.03',
		featured: true,
	},
	{
		id: '2',
		title: '업체 선택 시 꼭 물어봐야 할 질문 7가지',
		excerpt: '계약 전 이 질문들만 던져도 부실업체를 거를 수 있습니다.',
		category: '후기 팁',
		categoryColor: 'text-forest-400',
		readTime: '4분',
		date: '2026.01.30',
	},
	{
		id: '3',
		title: '계약서 작성 전 반드시 확인할 체크리스트',
		excerpt: '피해 사례의 80%는 계약서 미비에서 시작됩니다. 필수 확인사항을 정리했습니다.',
		category: '피해 예방',
		categoryColor: 'text-red-400',
		readTime: '3분',
		date: '2026.01.28',
	},
	{
		id: '4',
		title: '30평대 전체 리모델링 평균 비용은?',
		excerpt: '2026년 기준 지역별, 시공 범위별 평균 비용을 데이터로 분석했습니다.',
		category: '비용 가이드',
		categoryColor: 'text-forest-400',
		readTime: '6분',
		date: '2026.01.25',
	},
	{
		id: '5',
		title: '올바른 자재 선택법 A to Z',
		excerpt: '바닥재부터 페인트까지, 자재별 특성과 가격대를 비교 분석합니다.',
		category: '시공 가이드',
		categoryColor: 'text-amber-400',
		readTime: '7분',
		date: '2026.01.22',
	},
]

export default function BlogLanding() {
	const subdomain = getSubdomain()
	const featured = MOCK_POSTS.find((p) => p.featured)
	const gridPosts = MOCK_POSTS.filter((p) => !p.featured)

	return (
		<div className="min-h-screen bg-sand-900">
			<PageSEO
				title="집첵 블로그 | 인테리어 가이드 & 정보"
				description="인테리어 트렌드, 비용 가이드, 피해 예방 정보를 제공합니다. 현명한 인테리어를 위한 필수 가이드."
				path="/"
				jsonLd={[
					{
						'@context': 'https://schema.org',
						'@type': 'Blog',
						name: '집첵 블로그',
						description: '인테리어 가이드 & 정보',
						url: 'https://blog.zcheck.co.kr',
						isPartOf: { '@type': 'WebSite', name: 'ZipCheck', url: 'https://zcheck.co.kr' },
					},
				]}
			/>
			{subdomain === 'blog' ? <SubdomainNavigation subdomain="blog" /> : <NordicNavigation />}

			{/* Dark Hero */}
			<div className="pt-24 md:pt-28">
				<div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 pb-4">
					<h1 className="text-white text-lg md:text-xl font-extrabold tracking-widest uppercase mb-1">
						ZIPCHECK <span className="text-forest-400">BLOG</span>
					</h1>
					<p className="text-sand-500 text-sm">인테리어 가이드 & 트렌드 정보</p>
				</div>

				{/* Featured Card */}
				{featured && (
					<div className="max-w-6xl mx-auto px-5 md:px-8 pb-4">
						<div className="bg-gradient-to-br from-forest-700 to-forest-900 rounded-2xl p-6 md:p-8 relative overflow-hidden group cursor-pointer">
							<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
							<div className="relative z-10 flex flex-col justify-end min-h-[180px] md:min-h-[220px]">
								<span className={`${featured.categoryColor} text-[10px] font-extrabold px-2.5 py-1 rounded w-fit mb-3`}>
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
						</div>
					</div>
				)}

				{/* Grid Cards */}
				<div className="max-w-6xl mx-auto px-5 md:px-8 pb-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{gridPosts.map((post) => (
							<div
								key={post.id}
								className="bg-sand-800 rounded-2xl overflow-hidden group cursor-pointer hover:bg-sand-700/80 transition-colors"
							>
								<div className="bg-sand-700 h-32 md:h-36" />
								<div className="p-4">
									<span className={`${post.categoryColor} text-[10px] font-bold`}>
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
							</div>
						))}
					</div>
				</div>

				{/* Coming Soon Note */}
				<div className="max-w-6xl mx-auto px-5 md:px-8 pb-6">
					<div className="bg-sand-800/60 rounded-xl p-5 text-center border border-sand-700/50">
						<BookOpen className="mx-auto mb-2 text-sand-600" size={28} />
						<p className="text-sand-400 text-sm font-medium mb-1">더 많은 콘텐츠가 준비 중입니다</p>
						<p className="text-sand-600 text-xs">인테리어 가이드, 비용 분석, 피해 예방 정보를 곧 만나보세요</p>
					</div>
				</div>

				{/* CTA Section */}
				<div className="max-w-6xl mx-auto px-5 md:px-8 pb-12">
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

			<NordicFooter />
		</div>
	)
}
