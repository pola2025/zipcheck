import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from 'App'
import renderWithProviders from 'testUtils'
import { vi } from 'vitest'

describe('Marketing integration flows', () => {
	beforeEach(() => {
		window.history.replaceState({}, 'Home', '/')
	})

	const renderApp = () => {
		renderWithProviders(<App />, false)
	}

	it('renders quote request page when history navigates to /quote-request', async () => {
		renderApp()

		await screen.findByTestId('marketing-layout-root')

		await act(async () => {
			window.history.pushState({}, 'Quote Request', '/quote-request')
			window.dispatchEvent(new PopStateEvent('popstate'))
		})

		await waitFor(() =>
			expect(screen.getByTestId('quote-request-page')).toBeInTheDocument()
		)
	})

	it('scrolls target section into view when hash is present', async () => {
		const originalRAF = window.requestAnimationFrame
		const originalCancelRAF = window.cancelAnimationFrame
		const originalScrollIntoView = Element.prototype.scrollIntoView

		const scrollSpy = vi.fn()
		const immediateRAF = vi.fn((callback: FrameRequestCallback) => {
			callback(performance.now())
			return 1
		})
		const cancelSpy = vi.fn()

		window.requestAnimationFrame = immediateRAF
		window.cancelAnimationFrame = cancelSpy
		Element.prototype.scrollIntoView = scrollSpy

		try {
			renderApp()

			await screen.findByTestId('marketing-layout-root')

			await act(async () => {
				window.history.pushState({}, 'Pricing', '/#pricing')
				window.dispatchEvent(new PopStateEvent('popstate'))
			})

			await waitFor(() => expect(scrollSpy).toHaveBeenCalled())
		} finally {
			window.requestAnimationFrame = originalRAF
			window.cancelAnimationFrame = originalCancelRAF
			Element.prototype.scrollIntoView = originalScrollIntoView
		}
	})

	it('navigates to the AI workspace when selecting the header link', async () => {
		const user = userEvent.setup()

		renderApp()

		await screen.findByTestId('marketing-layout-root')

		const aiLink = await screen.findByTestId('marketing-ai-link')

		await user.click(aiLink)

		await waitFor(() =>
			expect(window.location.pathname).toBe('/ai/new')
		)
		await screen.findByTestId('ai-workspace-root')
	})

	it('keeps shared AI routes without redirecting to /ai/new', async () => {
		window.history.replaceState({}, 'Shared AI', '/ai/shared/example')

		renderApp()

		await waitFor(() =>
			expect(window.location.pathname).toBe('/ai/shared/example')
		)
		await screen.findByTestId('ai-workspace-root')
	})
})
