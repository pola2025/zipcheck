import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuoteForm from 'components/marketing/QuoteForm'
import type { ContactCopy } from 'data/marketing'
import { vi } from 'vitest'

const mockSubmit = vi.fn()

vi.mock('api/marketing', () => ({
	submitQuoteRequest: (...args: unknown[]) => mockSubmit(...args)
}))

const contactCopy: ContactCopy = {
	title: '견적 문의',
	subtitle: '테스트 카피',
	supportEmail: 'contact@zipcheck.kr',
	privacyUrl: '/privacy'
}

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.type(screen.getByLabelText('이름'), '홍길동')
	await user.type(screen.getByLabelText('이메일'), 'user@example.com')
	await user.type(
		screen.getByLabelText('프로젝트 내용'),
		'테스트 프로젝트 설명입니다.'
	)
	const checkbox = screen.getByTestId('quote-privacy-checkbox')
	await user.click(checkbox)
	await waitFor(() =>
		expect(checkbox).toHaveAttribute('data-state', 'checked')
	)
	const hiddenCheckbox = screen
		.getAllByRole('checkbox', { hidden: true })
		.find(element => element.tagName.toLowerCase() === 'input') as
		| HTMLInputElement
		| undefined
	if (hiddenCheckbox) {
		hiddenCheckbox.checked = true
		fireEvent.input(hiddenCheckbox, { target: { checked: true } })
		fireEvent.change(hiddenCheckbox, { target: { checked: true } })
	}
}

describe('QuoteForm', () => {
	beforeEach(() => {
		mockSubmit.mockReset()
	})

	it('submits successfully and resets the form', async () => {
		const user = userEvent.setup()
		mockSubmit.mockResolvedValueOnce({ requestId: 'req-1' })
		render(<QuoteForm copy={contactCopy} />)

		await fillRequiredFields(user)
		await user.click(screen.getByRole('button', { name: '견적 상담 신청' }))

		await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1))

		expect(
			await screen.findByText(
				'요청이 접수되었습니다. 담당 매니저가 빠르게 연락드리겠습니다.'
			)
		).toBeInTheDocument()

		expect(mockSubmit).toHaveBeenCalledWith({
			name: '홍길동',
			email: 'user@example.com',
			phone: '',
			message: '테스트 프로젝트 설명입니다.'
		})

		expect((screen.getByLabelText('이름') as HTMLInputElement).value).toBe('')
	})

	it('shows error message when submission fails', async () => {
		const user = userEvent.setup()
		mockSubmit.mockRejectedValueOnce(new Error('네트워크 오류'))
		render(<QuoteForm copy={contactCopy} />)

		await fillRequiredFields(user)
		await user.click(screen.getByRole('button', { name: '견적 상담 신청' }))

		await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1))

		expect(await screen.findByRole('alert')).toHaveTextContent('네트워크 오류')
	})

	it('falls back to default error message for unknown errors', async () => {
		const user = userEvent.setup()
		mockSubmit.mockRejectedValueOnce('unknown')
		render(<QuoteForm copy={contactCopy} />)

		await fillRequiredFields(user)
		await user.click(screen.getByRole('button', { name: '견적 상담 신청' }))

		await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1))

		expect(
			await screen.findByText('견적 요청 중 문제가 발생했습니다. 다시 시도해 주세요.')
		).toBeInTheDocument()
	})
})
