import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MarketingHeader from 'components/marketing/MarketingHeader'

const renderHeader = (initialEntries: string[]) =>
	render(
		<MemoryRouter initialEntries={initialEntries}>
			<MarketingHeader />
		</MemoryRouter>
	)

describe('MarketingHeader', () => {
	it('marks current hash navigation item as active on landing page', () => {
		renderHeader(['/#problem-solution'])

		const activeLink = screen.getAllByText('문제 해결')[0]
		expect(activeLink).toHaveClass('text-accent')

		const inactiveLink = screen.getAllByText('핵심 기능')[0]
		expect(inactiveLink).not.toHaveClass('text-accent')
	})

	it('does not mark any nav item active on non-landing routes', () => {
		renderHeader(['/quote-request'])

		const heroLink = screen.getAllByText('서비스 소개')[0]
		const featureLink = screen.getAllByText('핵심 기능')[0]
		expect(heroLink).not.toHaveClass('text-accent')
		expect(featureLink).not.toHaveClass('text-accent')
	})

	it('opens mobile menu and closes it after navigation', async () => {
		const user = userEvent.setup()
		renderHeader(['/'])

		expect(screen.queryByTestId('marketing-mobile-nav')).toBeNull()

		const menuButton = screen.getByRole('button', { name: '메뉴 열기' })
		await user.click(menuButton)

		await waitFor(() =>
			expect(menuButton).toHaveAttribute('aria-expanded', 'true')
		)

		const mobileNav = await screen.findByTestId('marketing-mobile-nav')

		const mobileNavWithin = within(mobileNav)
		await user.click(mobileNavWithin.getByText('서비스 소개'))

		await waitFor(() => {
			expect(screen.queryByTestId('marketing-mobile-nav')).toBeNull()
		})
	})
})
