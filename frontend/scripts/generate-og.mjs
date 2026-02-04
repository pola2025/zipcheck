import { ImageResponse } from '@vercel/og'
import fs from 'fs'

async function loadGoogleFont(text, weight) {
	const params = new URLSearchParams({ family: `Noto Sans KR:wght@${weight}`, text })
	const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
		headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
	}).then((r) => r.text())

	const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff2?)'\)/)
	if (!match || !match[1]) throw new Error('Font URL not found')
	return fetch(match[1]).then((r) => r.arrayBuffer())
}

async function main() {
	const allText = '집첵 ZipCheck 원가 기준 인테리어 견적 분석 지금 받은 견적 적정 가격 맞습니까? 원가 기준으로 항목별 견적을 분석해드립니다 zcheck.co.kr'
	const uniqueChars = [...new Set(allText)].join('')

	const [fontBold, fontRegular] = await Promise.all([
		loadGoogleFont(uniqueChars, 700),
		loadGoogleFont(uniqueChars, 400),
	])

	const fonts = [
		{ name: 'NotoSansKR', data: fontBold, weight: 700 },
		{ name: 'NotoSansKR', data: fontRegular, weight: 400 },
	]

	// Logo: 1182x496 원본 → 비율 2.383:1 유지, 폭 340px → 높이 143px
	const LOGO_W = 340
	const LOGO_H = Math.round(LOGO_W / (1182 / 496))

	const res = new ImageResponse(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					background: '#F5F0EB',
					fontFamily: 'NotoSansKR',
				},
				children: [
					// 상단 그린 바
					{
						type: 'div',
						props: { style: { display: 'flex', width: '100%', height: '10px', background: '#2D5A3D' } },
					},
					// 메인 콘텐츠
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								flex: '1',
								padding: '20px 60px',
							},
							children: [
								// 로고 이미지 (원본 비율 유지)
								{
									type: 'img',
									props: {
										src: 'https://zcheck.co.kr/logo.png',
										width: LOGO_W,
										height: LOGO_H,
										style: { marginBottom: '28px' },
									},
								},
								// 메인 타이틀
								{
									type: 'div',
									props: {
										style: {
											fontSize: '58px',
											fontWeight: 700,
											color: '#1F2937',
											textAlign: 'center',
											lineHeight: '1.2',
										},
										children: '원가 기준 인테리어 견적 분석',
									},
								},
								// 서브 타이틀
								{
									type: 'div',
									props: {
										style: {
											fontSize: '30px',
											fontWeight: 700,
											color: '#2D5A3D',
											marginTop: '24px',
											textAlign: 'center',
										},
										children: '지금 받은 견적, 적정 가격 맞습니까?',
									},
								},
								// 설명
								{
									type: 'div',
									props: {
										style: {
											fontSize: '22px',
											color: '#6B7280',
											marginTop: '18px',
											textAlign: 'center',
										},
										children: '원가 기준으로 항목별 견적을 분석해드립니다',
									},
								},
							],
						},
					},
					// 하단 푸터
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '18px 60px',
								borderTop: '1px solid #E5E7EB',
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											padding: '10px 28px',
											borderRadius: '10px',
											background: '#2D5A3D',
											color: 'white',
											fontSize: '18px',
											fontWeight: 700,
										},
										children: '집첵',
									},
								},
								{
									type: 'div',
									props: {
										style: { fontSize: '18px', color: '#9CA3AF' },
										children: 'zcheck.co.kr',
									},
								},
							],
						},
					},
				],
			},
		},
		{ width: 1200, height: 630, fonts },
	)

	const buf = Buffer.from(await res.arrayBuffer())
	fs.writeFileSync('public/og-image.png', buf)
	console.log(`OG image generated: ${buf.length} bytes → public/og-image.png`)
}

main().catch((e) => console.error('Error:', e))
