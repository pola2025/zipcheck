import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default function handler(req: VercelRequest) {
	const { searchParams } = new URL(req.url || '', 'https://zcheck.co.kr')
	const title = searchParams.get('title') || '집첵 블로그'
	const category = searchParams.get('category') || '인테리어 가이드'

	const isWarning = category === '피해예방'
	const accentColor = isWarning ? '#EF4444' : '#2D5A3D'
	const bgGradient = isWarning
		? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
		: 'linear-gradient(135deg, #F5F0EB 0%, #E8F5E9 100%)'

	return new ImageResponse(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					background: bgGradient,
					padding: '60px',
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								marginBottom: '40px',
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											width: '48px',
											height: '48px',
											borderRadius: '12px',
											background: '#2D5A3D',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
											fontSize: '24px',
											fontWeight: 700,
										},
										children: 'Z',
									},
								},
								{
									type: 'div',
									props: {
										style: { fontSize: '24px', color: '#6B7280', fontWeight: 500 },
										children: '집첵 블로그',
									},
								},
							],
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								flex: 1,
								alignItems: 'center',
							},
							children: {
								type: 'div',
								props: {
									style: {
										fontSize: '52px',
										fontWeight: 800,
										color: '#111827',
										lineHeight: 1.3,
										maxWidth: '900px',
										wordBreak: 'keep-all',
									},
									children: title,
								},
							},
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											padding: '8px 20px',
											borderRadius: '999px',
											background: accentColor,
											color: 'white',
											fontSize: '20px',
											fontWeight: 600,
										},
										children: category,
									},
								},
								{
									type: 'div',
									props: {
										style: { fontSize: '20px', color: '#9CA3AF' },
										children: 'zcheck.co.kr',
									},
								},
							],
						},
					},
				],
			},
		},
		{ width: 1200, height: 630 },
	)
}
