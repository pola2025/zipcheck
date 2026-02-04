import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'ZipCheck'
const BASE_URL = 'https://zcheck.co.kr'
const DEFAULT_IMAGE = `${BASE_URL}/api/og/home`

interface PageSEOProps {
	title: string
	description: string
	path?: string
	noindex?: boolean
	ogImage?: string
	ogType?: string
	jsonLd?: object | object[]
}

export default function PageSEO({
	title,
	description,
	path = '/',
	noindex = false,
	ogImage,
	ogType = 'website',
	jsonLd
}: PageSEOProps) {
	const fullTitle = path === '/' ? '원가 기준 인테리어 견적 분석' : `${title} | ${SITE_NAME}`
	const url = `${BASE_URL}${path}`
	const imageUrl = ogImage || `${BASE_URL}/api/og${path === '/' ? '/home' : path}`

	const jsonLdScripts = jsonLd
		? Array.isArray(jsonLd)
			? jsonLd
			: [jsonLd]
		: null

	return (
		<Helmet>
			<title>{fullTitle}</title>
			<meta name="description" content={description} />
			<link rel="canonical" href={url} />
			{noindex && <meta name="robots" content="noindex,nofollow" />}

			{/* Open Graph */}
			<meta property="og:type" content={ogType} />
			<meta property="og:title" content={fullTitle} />
			<meta property="og:description" content={description} />
			<meta property="og:url" content={url} />
			<meta property="og:image" content={imageUrl} />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta property="og:site_name" content="집첵" />
			<meta property="og:locale" content="ko_KR" />

			{/* Twitter Card */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={fullTitle} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={imageUrl} />

			{/* JSON-LD Structured Data */}
			{jsonLdScripts?.map((schema, i) => (
				<script key={i} type="application/ld+json">
					{JSON.stringify(schema)}
				</script>
			))}
		</Helmet>
	)
}
