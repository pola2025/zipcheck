import { expect, test } from '@playwright/test'
import { HOST } from './util'

test.describe('Marketing and AI routing', () => {
	test('allows navigation from the marketing header to the AI workspace', async ({ page }) => {
		await page.goto(`${HOST}/`)
		await expect(page.getByTestId('marketing-layout-root')).toBeVisible()
		await page.getByRole('link', { name: 'Open AI workspace' }).click()
		await page.waitForURL('**/ai/new')
		await expect(page.getByTestId('ai-workspace-root')).toBeVisible()
	})

	test('keeps hash-based sections stable on direct navigation', async ({ page }) => {
		await page.goto(`${HOST}/#pricing`)
		await expect(page).toHaveURL(/#pricing$/)
		await expect(page.getByTestId('marketing-pricing-section')).toBeVisible()
	})
})
