/** @type {import('tailwindcss').Config} */

module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}'
	],
	prefix: '',
	theme: {
		fontFamily: {
			sans: ['"Noto Sans KR"', 'sans-serif'],
			noto: ['"Noto Sans KR"', 'sans-serif'],
			outfit: ['Outfit', 'sans-serif']
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				forest: {
					50: '#F0F5EE', 100: '#E1EBdd', 200: '#C3D7BB', 300: '#8BAF82',
					400: '#6B9960', 500: '#4A6741', 600: '#3D5A35', 700: '#2E4628',
					800: '#1F301A', 900: '#111A0E'
				},
				wood: {
					50: '#FBF8F4', 100: '#F5EDE0', 200: '#EBDBC1',
					300: '#D4B896', 400: '#C4956A', 500: '#A87B4F'
				},
				sand: {
					50: '#FEFCF9', 100: '#FBF7F0', 200: '#F5F0E8', 300: '#EDEAE5',
					400: '#DDD8D0', 500: '#C4BEB4', 600: '#9B9588', 700: '#6B6B6B',
					800: '#3D3D3D', 900: '#1A1A1A'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'slide-in': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(-100%)' }
				},
				'wiggle-zoom': {
					'0%, 100%': { transform: 'rotate(-3deg) scale(1)' },
					'50%': { transform: 'rotate(3deg) scale(1.15)' }
				},
				'rotate-180': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(180deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'rotate-180': 'rotate-180 1s ease-in-out',
				'wiggle-zoom': 'wiggle-zoom 0.5s ease-in-out infinite',
				'slide-in': 'slide-in 0.2s ease-out forwards',
				'slide-out': 'slide-out 0.2s ease-in forwards',
				'slide-in-right': 'slide-in-right 0.2s ease-out forwards'
			}
		}
	},
	plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')]
}
