export type QuoteRequestPayload = {
	name: string
	email: string
	phone?: string
	message: string
}

export type QuoteRequestResponse = {
	requestId?: string
	status?: string
}

const DEFAULT_ERROR_MESSAGE =
	'견적 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'

export async function submitQuoteRequest(
	payload: QuoteRequestPayload
): Promise<QuoteRequestResponse | undefined> {
	try {
		const response = await fetch('http://localhost:3001/api/quote-requests/submit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(payload)
		})

		const isJson =
			response.headers.get('content-type')?.includes('application/json') ?? false
		const data = isJson ? await response.json() : undefined

		if (!response.ok) {
			const message =
				(data as { message?: string })?.message ??
				(data as { error?: string })?.error ??
				DEFAULT_ERROR_MESSAGE
			throw new Error(message)
		}

		return data as QuoteRequestResponse | undefined
	} catch (error) {
		if (error instanceof Error) {
			const message = error.message?.toLowerCase().includes('fetch')
				? DEFAULT_ERROR_MESSAGE
				: error.message
			throw new Error(message || DEFAULT_ERROR_MESSAGE)
		}

		throw new Error(DEFAULT_ERROR_MESSAGE)
	}
}
