import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'ZipCheck'
const BASE_URL = 'https://zcheck.co.kr'
const DEFAULT_IMAGE = `${BASE_URL}/logo.png`

interface PageSEOProps {
	title: string
	description: string
	path?: string
	noindex?: boolean
}

export default function PageSEO({
	title,
	description,
	path = '/',
	noindex = false
}: PageSEOProps) {
	const fullTitle = path === '/' ? `${SITE_NAME} | AI 인테리어 견적 분석 서비스` : `${title} | ${SITE_NAME}`
	const url = `${BASE_URL}${path}`

	return (
		<Helmet>
			<title>{fullTitle}</title>
			<meta name="description" content={description} />
			<link rel="canonical" href={url} />
			{noindex && <meta name="robots" content="noindex,nofollow" />}
			<meta property="og:title" content={fullTitle} />
			<meta property="og:description" content={description} />
			<meta property="og:url" content={url} />
			<meta property="og:image" content={DEFAULT_IMAGE} />
			<meta property="twitter:title" content={fullTitle} />
			<meta property="twitter:description" content={description} />
		</Helmet>
	)
}
