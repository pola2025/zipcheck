import { Hono } from 'hono'
import type { Env, Variables } from '../types'

const meta = new Hono<{ Bindings: Env; Variables: Variables }>()

// Meta 제거 콜백 (Deauthorize Callback)
meta.post('/deauthorize', async (c) => {
	console.log('Meta deauthorize callback received')
	return c.json({ success: true })
})

// Meta 데이터 삭제 콜백 (Data Deletion Request)
meta.post('/delete', async (c) => {
	const confirmationCode = crypto.randomUUID()
	console.log('Meta data deletion request received, code:', confirmationCode)
	return c.json({
		url: 'https://zcheck.co.kr',
		confirmation_code: confirmationCode,
	})
})

export default meta
