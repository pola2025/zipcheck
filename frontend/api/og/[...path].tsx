import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const API_URL = process.env.API_URL || 'https://zipcheck-api.zipcheck2025.workers.dev'
const BRAND_GREEN = '#2D5A3D'
const BRAND_SAND = '#F5F0EB'
const BRAND_DARK = '#1F2937'

interface MetaResponse {
	title: string
	description: string
	jsonLdType: string
	data?: Record<string, unknown>
}

type FontData = { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 }[]

async function loadGoogleFont(text: string, weight: number): Promise<ArrayBuffer> {
	const params = new URLSearchParams({
		family: `Noto Sans KR:wght@${weight}`,
		text,
	})
	const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
		headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
	}).then((res) => res.text())

	const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff2?)'\)/)
	if (!match?.[1]) throw new Error('Font URL not found')
	return fetch(match[1]).then((res) => res.arrayBuffer())
}

function truncate(text: string, max: number): string {
	return text.length <= max ? text : text.substring(0, max - 3) + '...'
}

// ─── Renderers ───

function renderHome(fonts: FontData) {
	return new ImageResponse(
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				height: '100%',
				background: BRAND_SAND,
				fontFamily: 'NotoSansKR',
			}}
		>
			{/* Top accent bar */}
			<div style={{ display: 'flex', width: '100%', height: 8, background: BRAND_GREEN }} />

			{/* Main content */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					flex: 1,
					padding: '40px 60px',
				}}
			>
				{/* Brand logo */}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="https://zcheck.co.kr/logo.png"
					width={280}
					height={118}
					style={{ marginBottom: 20 }}
				/>

				{/* Title */}
				<div
					style={{
						fontSize: 48,
						fontWeight: 700,
						color: BRAND_DARK,
						textAlign: 'center',
						lineHeight: 1.3,
					}}
				>
					내 인테리어 견적 분석
				</div>

				{/* Question */}
				<div
					style={{
						fontSize: 26,
						fontWeight: 700,
						color: BRAND_GREEN,
						marginTop: 20,
						textAlign: 'center',
					}}
				>
					지금 받은 견적, 적정 가격 맞습니까?
				</div>

				{/* Description */}
				<div
					style={{
						fontSize: 18,
						color: '#6B7280',
						marginTop: 16,
						textAlign: 'center',
						lineHeight: 1.6,
					}}
				>
					원가 기준으로 항목별 견적을 분석해드립니다
				</div>
			</div>

			{/* Footer */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px 60px',
					borderTop: '1px solid #E5E7EB',
				}}
			>
				<div style={{ display: 'flex', padding: '8px 24px', borderRadius: 8, background: BRAND_GREEN, color: 'white', fontSize: 16, fontWeight: 700 }}>
					집첵
				</div>
				<div style={{ fontSize: 14, color: '#9CA3AF' }}>zcheck.co.kr</div>
			</div>
		</div>,
		{ width: 1200, height: 630, fonts },
	)
}

function renderReview(data: Record<string, unknown>, fonts: FontData) {
	const companyName = truncate(String(data.companyName || ''), 20)
	const region = data.region ? String(data.region) : ''
	const projectType = data.projectType ? String(data.projectType) : ''
	const rating = Number(data.rating || 0)
	const ratingStr = rating.toFixed(1)
	const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))

	return new ImageResponse(
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				height: '100%',
				background: BRAND_SAND,
				fontFamily: 'NotoSansKR',
			}}
		>
			<div style={{ display: 'flex', width: '100%', height: 8, background: BRAND_GREEN }} />

			<div style={{ display: 'flex', flex: 1, padding: '48px 60px' }}>
				{/* Card */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						height: '100%',
						background: 'white',
						borderRadius: 20,
						padding: '48px 56px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
					}}
				>
					{/* Badge */}
					<div
						style={{
							display: 'flex',
							fontSize: 16,
							fontWeight: 700,
							color: BRAND_GREEN,
							letterSpacing: 2,
						}}
					>
						REVIEW
					</div>

					{/* Company name */}
					<div style={{ fontSize: 44, fontWeight: 700, color: BRAND_DARK, marginTop: 20 }}>{companyName}</div>

					{/* Stars */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
						<div style={{ fontSize: 32, color: '#F59E0B' }}>{stars}</div>
						<div style={{ fontSize: 28, fontWeight: 700, color: BRAND_DARK }}>{ratingStr} / 5.0</div>
					</div>

					{/* Info */}
					<div style={{ fontSize: 20, color: '#6B7280', marginTop: 16 }}>
						{region}
						{region && projectType ? ' · ' : ''}
						{projectType}
					</div>
				</div>
			</div>

			{/* Footer */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px 60px',
					borderTop: '1px solid #E5E7EB',
				}}
			>
				<div style={{ display: 'flex', padding: '8px 24px', borderRadius: 8, background: BRAND_GREEN, color: 'white', fontSize: 16, fontWeight: 700 }}>
					집첵
				</div>
				<div style={{ fontSize: 14, color: '#9CA3AF' }}>zcheck.co.kr</div>
			</div>
		</div>,
		{ width: 1200, height: 630, fonts },
	)
}

function renderDamageCase(data: Record<string, unknown>, fonts: FontData) {
	const title = truncate(String(data.title || ''), 30)
	const category = data.category ? String(data.category) : ''
	const severityLabel = data.severityLabel ? String(data.severityLabel) : ''
	const severityColors: Record<string, string> = {
		'경미': '#10B981',
		'보통': '#F59E0B',
		'심각': '#F97316',
		'매우 심각': '#EF4444',
	}
	const sevColor = severityColors[severityLabel] || '#6B7280'

	return new ImageResponse(
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				height: '100%',
				background: BRAND_SAND,
				fontFamily: 'NotoSansKR',
			}}
		>
			<div style={{ display: 'flex', width: '100%', height: 8, background: BRAND_GREEN }} />

			<div style={{ display: 'flex', flex: 1, padding: '48px 60px' }}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						height: '100%',
						background: 'white',
						borderRadius: 20,
						padding: '48px 56px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
					}}
				>
					{/* Badge row */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', letterSpacing: 2 }}>DAMAGE CASE</div>
						{severityLabel && (
							<div
								style={{
									display: 'flex',
									padding: '4px 16px',
									borderRadius: 16,
									background: `${sevColor}20`,
									color: sevColor,
									fontSize: 14,
									fontWeight: 700,
								}}
							>
								{severityLabel}
							</div>
						)}
					</div>

					{/* Title */}
					<div style={{ fontSize: 40, fontWeight: 700, color: BRAND_DARK, marginTop: 28, lineHeight: 1.3 }}>{title}</div>

					{/* Category */}
					{category && (
						<div
							style={{
								display: 'flex',
								marginTop: 20,
								padding: '8px 20px',
								borderRadius: 18,
								background: '#FEF3C7',
								color: '#92400E',
								fontSize: 18,
								fontWeight: 600,
							}}
						>
							{category}
						</div>
					)}
				</div>
			</div>

			{/* Footer */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px 60px',
					borderTop: '1px solid #E5E7EB',
				}}
			>
				<div style={{ display: 'flex', padding: '8px 24px', borderRadius: 8, background: BRAND_GREEN, color: 'white', fontSize: 16, fontWeight: 700 }}>
					집첵
				</div>
				<div style={{ fontSize: 14, color: '#9CA3AF' }}>zcheck.co.kr</div>
			</div>
		</div>,
		{ width: 1200, height: 630, fonts },
	)
}

function renderGeneric(title: string, fonts: FontData) {
	const safeTitle = truncate(title, 30)

	return new ImageResponse(
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				height: '100%',
				background: BRAND_SAND,
				fontFamily: 'NotoSansKR',
			}}
		>
			<div style={{ display: 'flex', width: '100%', height: 8, background: BRAND_GREEN }} />

			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					flex: 1,
				}}
			>
				<div style={{ fontSize: 48, fontWeight: 700, color: BRAND_DARK, textAlign: 'center' }}>{safeTitle}</div>
				<div style={{ fontSize: 22, color: '#6B7280', marginTop: 16 }}>집첵에서 확인하세요</div>
			</div>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px 60px',
					borderTop: '1px solid #E5E7EB',
				}}
			>
				<div style={{ display: 'flex', padding: '8px 24px', borderRadius: 8, background: BRAND_GREEN, color: 'white', fontSize: 16, fontWeight: 700 }}>
					집첵
				</div>
				<div style={{ fontSize: 14, color: '#9CA3AF' }}>zcheck.co.kr</div>
			</div>
		</div>,
		{ width: 1200, height: 630, fonts },
	)
}

// ─── Main Handler ───

export default async function handler(req: Request) {
	const url = new URL(req.url)
	const rawPath = url.pathname.replace('/api/og/', '').replace('/api/og', '')
	const path = '/' + (rawPath || 'home')

	try {
		// Collect all text for font subsetting
		let allText =
			'내 인테리어 견적 분석 집첵 zcheck.co.kr 지금 받은 견적, 적정 가격 맞습니까? 원가 기준으로 항목별 견적을 분석해드립니다 REVIEW DAMAGE CASE 확인하세요 ★☆ / 5.0 · 경미 보통 심각 매우'

		// Fetch metadata from backend
		let meta: MetaResponse | null = null
		try {
			const metaRes = await fetch(`${API_URL}/api/seo/meta?path=${encodeURIComponent(path)}`, {
				headers: { Accept: 'application/json' },
			})
			if (metaRes.ok) {
				meta = await metaRes.json()
				if (meta?.data) {
					const textValues = Object.values(meta.data)
						.filter((v): v is string => typeof v === 'string')
						.join(' ')
					allText += ' ' + textValues
				}
				if (meta?.title) allText += ' ' + meta.title
			}
		} catch {
			// Backend unavailable, use defaults
		}

		// Deduplicate characters for efficient font loading
		const uniqueChars = [...new Set(allText)].join('')

		// Load fonts (Korean + Latin)
		const [fontBold, fontRegular] = await Promise.all([loadGoogleFont(uniqueChars, 700), loadGoogleFont(uniqueChars, 400)])

		const fonts: FontData = [
			{ name: 'NotoSansKR', data: fontBold, weight: 700 },
			{ name: 'NotoSansKR', data: fontRegular, weight: 400 },
		]

		// Route to renderer
		if (path === '/home' || path === '/') {
			return renderHome(fonts)
		}

		if (meta?.jsonLdType === 'Review' && meta?.data) {
			return renderReview(meta.data, fonts)
		}

		if (meta?.jsonLdType === 'Article' && meta?.data) {
			return renderDamageCase(meta.data, fonts)
		}

		return renderGeneric(meta?.title || 'ZipCheck', fonts)
	} catch (error) {
		console.error('OG image generation error:', error)
		// Minimal fallback without Korean fonts
		return new ImageResponse(
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
					height: '100%',
					background: BRAND_SAND,
				}}
			>
				<div
					style={{
						display: 'flex',
						width: 64,
						height: 64,
						borderRadius: 16,
						background: BRAND_GREEN,
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontSize: 32,
						fontWeight: 700,
					}}
				>
					Z
				</div>
				<div style={{ fontSize: 48, fontWeight: 700, color: BRAND_DARK, marginTop: 20 }}>ZipCheck</div>
			</div>,
			{ width: 1200, height: 630 },
		)
	}
}
