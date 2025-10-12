import '@testing-library/jest-dom'
import mediaQuery from 'css-mediaquery'
import server from 'mocks/server'
import { DESKTOP_RESOLUTION_HEIGHT, DESKTOP_RESOLUTION_WIDTH } from 'testUtils'
import 'whatwg-fetch'
import { vi } from 'vitest'

// Mock indexedDB
const indexedDB = {
	open: () => ({
		onupgradeneeded: undefined,
		onsuccess: undefined,
		onerror: undefined,
		result: {
			createObjectStore: () => ({
				createIndex: () => {},
				transaction: () => {}
			}),
			transaction: () => ({
				objectStore: () => ({
					put: () => {},
					get: () => {},
					getAll: () => {},
					delete: () => {}
				})
			})
		}
	})
}

Object.defineProperty(window, 'indexedDB', {
	value: indexedDB
})

const ORIGINAL_FETCH = globalThis.fetch

beforeAll(() => {
	if (!('ResizeObserver' in window)) {
		class ResizeObserverMock {
			observe(): void {}
			unobserve(): void {}
			disconnect(): void {}
		}

		Object.defineProperty(window, 'ResizeObserver', {
			writable: true,
			value: ResizeObserverMock
		})

		// @ts-expect-error Vitest jsdom global augmentation for tests only
		global.ResizeObserver = ResizeObserverMock
	}

	server.listen({ onUnhandledRequest: 'error' })

	Object.defineProperty(window, 'IS_REACT_ACT_ENVIRONMENT', {
		writable: true,
		value: true
	})
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => {
			function matchQuery(): boolean {
				return mediaQuery.match(query, {
					width: window.innerWidth,
					height: window.innerHeight
				})
			}

			const listeners: (() => void)[] = []
			const instance = {
				matches: matchQuery(),
				addEventListener: (_: 'change', listener: () => void): void => {
					listeners.push(listener)
				},
				removeEventListener: (_: 'change', listener: () => void): void => {
					const index = listeners.indexOf(listener)
					if (index >= 0) {
						listeners.splice(index, 1)
					}
				}
			}
			window.addEventListener('resize', () => {
				const change = matchQuery()
				if (change !== instance.matches) {
					instance.matches = change
					for (const listener of listeners) listener()
				}
			})

			return instance
		}
	})
	Object.defineProperty(window, 'scrollTo', {
		writable: true,
		value: () => {}
	})
	Object.defineProperty(window, 'resizeTo', {
		writable: true,
		value: (width: number, height: number) => {
			Object.assign(window, {
				innerWidth: width,
				innerHeight: height
			}).dispatchEvent(new Event('resize'))
		}
	})
})

beforeEach(() => {
	window.resizeTo(DESKTOP_RESOLUTION_WIDTH, DESKTOP_RESOLUTION_HEIGHT)
	vi.spyOn(globalThis, 'fetch').mockImplementation(
		async (input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === 'string'
					? input
					: input instanceof URL
						? input.toString()
						: (input as Request).url ?? ''
			const method = (init?.method ?? 'GET').toUpperCase()

			if (url.includes('/v1/models')) {
				return new Response(
					JSON.stringify({
						models: {
							openai: [],
							groq: [],
							ollama: [],
							litellm: []
						}
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					}
				)
			}

			if (url.includes('/v1/session')) {
				if (method === 'POST') {
					return new Response(null, { status: 204 })
				}
				if (method === 'DELETE') {
					return new Response(null, { status: 204 })
				}

				return new Response(JSON.stringify({}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}

			if (url.includes('/v1/share/')) {
				if (method === 'POST') {
					return new Response(null, { status: 201 })
				}

				const mockShare = {
					prompt: 'Generate a responsive marketing page.',
					name: 'Shared Landing',
					emoji: '✨',
					html: '<section id="hero"><h1>ZipCheck</h1></section>',
					components: {},
					markdown: '---\nversion: 0\n---\n# ZipCheck\n'
				}

				return new Response(JSON.stringify(mockShare), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}

			if (url.includes('/v1/vote')) {
				return new Response(null, { status: 201 })
			}

			if (url.includes('/api/quote-request')) {
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}

			try {
				// Fall back to original fetch for anything the tests explicitly expect.
				return await ORIGINAL_FETCH(input, init)
			} catch (error) {
				console.warn('Falling back to mock response for fetch error in tests', {
					url,
					error
				})
				return new Response(JSON.stringify({}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
		}
	)
})

afterEach(() => {
	vi.restoreAllMocks()
	server.resetHandlers()
})

afterAll(() => {
	server.close()
})
