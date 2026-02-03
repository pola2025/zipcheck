/**
 * Gemini AI 인테리어 이미지 생성 스크립트
 * Usage: node scripts/generate-images.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// .env 파일에서 API 키 읽기
const envContent = readFileSync(join(ROOT, '.env'), 'utf-8')
const API_KEY = envContent
	.split('\n')
	.find((l) => l.startsWith('GEMINI_API_KEY='))
	?.split('=')[1]
	?.trim()

if (!API_KEY) {
	console.error('GEMINI_API_KEY not found in .env')
	process.exit(1)
}

const OUTPUT_DIR = join(ROOT, 'frontend', 'public', 'images', 'interior')
mkdirSync(OUTPUT_DIR, { recursive: true })

const MODEL = 'gemini-2.5-flash-image'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

const BASE_STYLE =
	'Ultra-realistic interior photography, shot with Canon EOS R5 and 24-70mm f/2.8 lens, natural daylight streaming through windows, warm color temperature 4500K, shallow depth of field, editorial magazine quality, 8K resolution.'

const IMAGES = [
	{
		name: 'hero-living',
		prompt: `${BASE_STYLE} A spacious modern natural Korean apartment living room with warm wood-tone oak flooring, light beige linen sofa, minimalist wooden coffee table, indoor plants (monstera, ficus), floor-to-ceiling windows with sheer curtains, warm afternoon sunlight. Scandinavian-Korean fusion style. Portrait orientation 3:4 ratio.`
	},
	{
		name: 'concept-living',
		prompt: `${BASE_STYLE} Wide angle shot of a luxurious modern natural living room, warm walnut wood panels on accent wall, cream-colored boucle sofa, natural stone side table, soft area rug, potted olive tree, brass floor lamp. Cozy and sophisticated atmosphere. Landscape 16:9 ratio.`
	},
	{
		name: 'concept-kitchen',
		prompt: `${BASE_STYLE} Open-plan modern Korean kitchen with natural wood cabinetry, white quartz countertops, brass hardware, pendant lights over island, fresh herbs on windowsill, morning light. Clean and inviting. Landscape 4:3 ratio.`
	},
	{
		name: 'concept-bedroom',
		prompt: `${BASE_STYLE} Scandinavian-inspired bedroom with linen bedding in soft earth tones, light ash wood bed frame, minimalist nightstands, dried pampas grass in ceramic vase, diffused morning light through gauze curtains. Calm and serene. Landscape 4:3 ratio.`
	},
	{
		name: 'style-modern-natural',
		prompt: `${BASE_STYLE} Modern natural interior detail shot, warm oak wood shelf with ceramic pottery, linen cushions, woven basket, soft natural light. Minimal and warm. Portrait 3:4 ratio.`
	},
	{
		name: 'style-classic-elegance',
		prompt: `${BASE_STYLE} Classic elegant Korean apartment interior, detailed crown molding, marble-pattern accent wall, velvet emerald armchair, crystal chandelier, antique brass mirror. Luxurious yet refined. Portrait 3:4 ratio.`
	},
	{
		name: 'style-scandinavian',
		prompt: `${BASE_STYLE} Pure Scandinavian living space, all-white walls, light birch furniture, pastel mint and blush pink accent cushions, simple geometric art, maximized natural light. Airy and bright. Portrait 3:4 ratio.`
	},
	{
		name: 'style-industrial',
		prompt: `${BASE_STYLE} Industrial loft interior, exposed concrete ceiling, black metal frame shelving, raw wood dining table, Edison bulb pendant lights, leather sofa, large factory windows. Urban and edgy. Portrait 3:4 ratio.`
	},
	{
		name: 'style-modern-luxury',
		prompt: `${BASE_STYLE} Modern luxury dark interior, charcoal walls, gold accent lighting, dark marble floor, plush velvet sofa in deep navy, statement art piece, moody ambient lighting. Sophisticated and dramatic. Portrait 3:4 ratio.`
	},
	{
		name: 'process-wood-bg',
		prompt: `${BASE_STYLE} Close-up detail of warm natural oak wood grain texture with soft diffused light, subtle honey tones, smooth surface. Suitable as subtle background. Soft focus. Landscape 16:9 ratio.`
	}
]

async function generateImage(item) {
	const outputPath = join(OUTPUT_DIR, `${item.name}.jpg`)

	if (existsSync(outputPath)) {
		console.log(`  ⏭  ${item.name} - already exists, skipping`)
		return true
	}

	console.log(`  🎨 Generating: ${item.name}...`)

	try {
		const res = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: item.prompt }] }],
				generationConfig: {
					responseModalities: ['IMAGE', 'TEXT'],
					temperature: 1.0
				}
			})
		})

		if (!res.ok) {
			const err = await res.text()
			console.error(`  ❌ ${item.name} - API error ${res.status}: ${err.slice(0, 200)}`)
			return false
		}

		const data = await res.json()
		const parts = data.candidates?.[0]?.content?.parts || []
		const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'))

		if (!imagePart) {
			console.error(`  ❌ ${item.name} - No image in response`)
			const textPart = parts.find((p) => p.text)
			if (textPart) console.error(`     Text: ${textPart.text.slice(0, 100)}`)
			return false
		}

		const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
		writeFileSync(outputPath, buffer)
		console.log(`  ✅ ${item.name} - saved (${(buffer.length / 1024).toFixed(0)}KB)`)
		return true
	} catch (err) {
		console.error(`  ❌ ${item.name} - ${err.message}`)
		return false
	}
}

async function main() {
	console.log('🖼  Gemini AI Interior Image Generation')
	console.log(`   Output: ${OUTPUT_DIR}`)
	console.log(`   Images: ${IMAGES.length}\n`)

	let success = 0
	let fail = 0

	// Generate sequentially to avoid rate limits
	for (const item of IMAGES) {
		const ok = await generateImage(item)
		if (ok) success++
		else fail++

		// Small delay between requests
		if (IMAGES.indexOf(item) < IMAGES.length - 1) {
			await new Promise((r) => setTimeout(r, 2000))
		}
	}

	console.log(`\n📊 Results: ${success} success, ${fail} failed`)
	if (fail > 0) {
		console.log('   Re-run the script to retry failed images.')
	}
}

main()
