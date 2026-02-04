import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default function handler() {
	return new ImageResponse(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
					height: '100%',
					background: '#F5F0EB',
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								width: '80px',
								height: '80px',
								borderRadius: '20px',
								background: '#2D5A3D',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white',
								fontSize: '40px',
								fontWeight: 700,
							},
							children: 'Z',
						},
					},
					{
						type: 'div',
						props: {
							style: {
								fontSize: '48px',
								fontWeight: 700,
								color: '#1F2937',
								marginTop: '20px',
							},
							children: 'ZipCheck Test',
						},
					},
				],
			},
		},
		{ width: 1200, height: 630 },
	)
}
