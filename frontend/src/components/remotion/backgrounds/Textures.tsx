import { useCurrentFrame, interpolate } from 'remotion'

// ─── Base64 Noise PNG (128x128, grayscale) ───
// Pre-generated static noise tile. Lightweight (~1KB decoded), browser-cached.
// Using background-position shift per frame for organic grain variation.
const NOISE_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAH' +
	'G0lEQVR4nO2d23LbOBBF6f//aGcS27IuBEhc+gFkSXacZDKZVFf1LGWJAPZ2A6Qs+fX1ZQ8PD/' +
	'b29maPj4/29vZmr6+v9vLyYs/Pz/b09GRfvnyx5f+/fv1qy+f+97//2T///GN///23/fPPP/bX' +
	'X3/Z8v5ff/1ly8f++ecfW96/fP7//vuf//u5v/76y5aP//PPP/b6+mrL+x8eHuz5+dmW9z89Pdn7' +
	'+7stH3t5ebHlc5f3L5+3PJblNSyvsXz+8rHl/cvnLM+zvIbl85fPX55neR/vL8+1PNfyfy+vZ3m/' +
	'53v//GNPjw/29PRkLy8v9vz8bMvzLe9bPm95Hct7l9exvH/5vOU1Ls+9fP7y3Mv3sPx7+dzl///+' +
	'+297fHy0t7c3e39/t+XjGxsb9vDwYG9vb7a8f3n88fHRXl9fbfm+lq9bvq/l+1ue5+XlxZ6fn215' +
	'nuV7XL6/5ftf3l4+vrx/+dzl717e//j4aMvXLX+3fOz19dWWr1++n+V5ls9b/v/Lv5fPXd5e3n97' +
	'e7Pn52d7enqy5X3L17y+vv7/+V5eXuzp6cmW17p8//K+5Xte3l7+fflel/9/e3uz5euXjy3Pv7x/' +
	'+dzy/MvHl+daPn95vuV7Wl7z8t7l+5bXufz78rHl85fXtnz98v/La1ue+/X11Zavf319/b9/D4+P' +
	'tvzbw8ODPT4+2uPjoy2vsbyOp6cne3l5sff3d1tey/J1y+Mvn7e8huV1LK9xeY3L+5evW17r8nzL' +
	'cz89Pdny8eX9y/uWz1k+Z/n48jrfXl9t+XkPDw+2PO/y+peP/f3337Y87/J9L5+7fP3yNcvfLe9f' +
	'/n/59+V7Wb7X5TVfXvT7+7stX7t83cPDgy2f+/r6asv3+/b2ZsvjW1tb9vT0ZMv/L69xeY3Lcyzf' +
	'w/KxW7du2d27d+3OnTv29PRky2tbvn75+PK6lo8t71/ev3z+8n0tf7e8/vf3d1ueZ/neludbXuPy2p' +
	'fXsjz38nzLa1xex/L5y/uX51++5+V7X17D8lqX93/58sWWz1v+ffm65XOXxy5fv7y9/N3b25st/7' +
	'+85uVjy+ctX7N8fHmu5XUuz7k89/Ia/g2U5e+Wz1k+b/m75fuW17U8z/Lcy/uXz1++Znnf8n0t79' +
	'/c3LSHhwdbfqbl/U9PT/8H4PLvxcbGhi0fW55ned7l65ePLe9fPnf5+PK85e+Wjy3/v/z78jXLcyxf' +
	's/zd8n0tX7+8b/n4xsbG/4/j8vr+BcDys+F/l5+/fP/yf8vr39rasoe/M+D5+dmW17h8/vK5y/uX' +
	'17q8xuU5l+db/v/l5cWWv19e1/J3y+cuH1++b/l3e3hY7MUeHh7+73e2fP/yNcv7l89fvn/5nuV5' +
	'l89ZXsfy8eX/ltexPPcfWYfHx0d7enqy5fUtX7O8f/napyfb2Niwp6cnW/5ueR3Ley6vafm8lxd7' +
	'fX215d+Xjy1fv3z/y2t7e3uz5Xte3u7u7trm5qYtj2d5/8PDg729vdnb25stf7d8b8u/Lc+1fN7y' +
	'dy8vL/b4+GjLz1s+Z3m+5XOXP5d/X/5+ec7le1n+Xv5/ebvb3bWNjQ1bPufh4cGW17y85uU1L89j' +
	'e7u2vb1tOzs7tr+/bwcHB3Z4eGhHR0d2fHxsp6endnZ2ZhcXF3Z5eWnX19d2e3tr9/f39vj4aK+v' +
	'r/b+/m7LW2xubs7m5uZsbW3N1tbWbG1tzdbW1mx1ddVWVlZsZWXFVlZWbHV11VZXV211ddXW1tbs' +
	'dn3dtre3bWdnx/b29uzg4MCOjo7s5OTEzs7O7OLiwq6uruz29tbu7+/t8fHRXl9f7f393RYbG7a5' +
	'uWmbm5u2tbVlW1tbtrOzY/v7+3Z0dGSnp6d2fn5ul5eXdnNzY/f39/b09GSvr6/2/v5uy5sMwC0f' +
	'X15jeV3Lx5e/W17D8rUvLy/29PRky9cuH3t7e7P7+3u7vr62m5sbu7y8tIuLCzs/P7fT01M7OTmx' +
	'4+NjOzo6sqOjIzs8PLSDgwPb39+3/f1929vbs729Pdvd3bXd3V3b3d213d1d29nZsZ2dHdve3radnR' +
	'3b3t627e1t29nZsb29Pdvf37eDgwM7Ojqy4+NjOz09tfPzc7u8vLTr62u7u7uzh4cHW+bi8vFbW1u2' +
	'u7tre3t7dnBwYCcnJ3ZxcWG3t7f28PBgy1u8v7/b8+Ojvb6+2vv7uy1vsQBg+ffl85a/W/5u+drl' +
	'/y8vL7Y8/vLyYq+vr7Y8j+W51Ov1rNFo2MOHD/b09GTP/wLg7u7OLi8v7fr62u7v72358+npyZ6f' +
	'n2153OXjy+cvn7d8fPn35f+Wv3t5ebb39+W5F3t7e7Pl//n+/m4PDw/2+vr6f/8HjMF9JHXV+B0A' +
	'AAABJRU5ErkJggg=='

// ─── Reusable Background Layers ───

interface FilmGrainProps {
	opacity?: number
}

/** Animated film grain using a tiling noise PNG with per-frame position shift */
export function FilmGrain({ opacity = 0.03 }: FilmGrainProps) {
	const frame = useCurrentFrame()
	// Shift the tile position each frame for organic grain variation
	const offsetX = (frame * 37) % 128
	const offsetY = (frame * 53) % 128

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				opacity,
				backgroundImage: `url("${NOISE_PNG}")`,
				backgroundSize: '128px 128px',
				backgroundPosition: `${offsetX}px ${offsetY}px`,
				mixBlendMode: 'overlay',
			}}
		/>
	)
}

interface DotGridProps {
	color?: string
	dotSize?: number
	spacing?: number
	opacity?: number
}

/** Repeating dot grid pattern for data scenes */
export function DotGrid({ color = '#4A6741', dotSize = 0.8, spacing = 24, opacity = 0.03 }: DotGridProps) {
	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				opacity,
				backgroundImage: `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize}px)`,
				backgroundSize: `${spacing}px ${spacing}px`,
			}}
		/>
	)
}

interface DiagonalLinesProps {
	color?: string
	opacity?: number
	spacing?: number
}

/** Diagonal line pattern for alert/warning scenes */
export function DiagonalLines({ color = '#C45C5C', opacity = 0.02, spacing = 20 }: DiagonalLinesProps) {
	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				opacity,
				backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent ${spacing}px)`,
			}}
		/>
	)
}

interface HorizontalLinesProps {
	color?: string
	opacity?: number
	spacing?: number
}

/** Horizontal line pattern for caution scenes */
export function HorizontalLines({ color = '#C4A850', opacity = 0.02, spacing = 24 }: HorizontalLinesProps) {
	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				opacity,
				backgroundImage: `repeating-linear-gradient(0deg, ${color}, ${color} 1px, transparent 1px, transparent ${spacing}px)`,
			}}
		/>
	)
}

interface ScanLineProps {
	duration: number
	fromY?: number
	toY?: number
}

/** Horizontal scan line that moves vertically over the scene duration */
export function ScanLine({ duration, fromY = 20, toY = 80 }: ScanLineProps) {
	const frame = useCurrentFrame()
	const y = interpolate(frame, [0, duration], [fromY, toY], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	return (
		<div
			className="absolute pointer-events-none"
			style={{
				left: '35%',
				width: '30%',
				height: '1px',
				top: `${y}%`,
				background: 'linear-gradient(90deg, transparent, rgba(190,169,142,0.3), transparent)',
			}}
		/>
	)
}

/** Corner vignette for cinematic dark scenes */
export function Vignette() {
	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 50%, rgba(0,0,0,0.15) 100%)',
			}}
		/>
	)
}
