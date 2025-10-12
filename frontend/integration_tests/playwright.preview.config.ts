import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './integration_tests',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [['github'], ['html']] : 'html',
	use: {
		trace: 'on-first-retry',
		screenshot: 'on'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'pnpm exec vite preview --host 127.0.0.1 --port 4173',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: true,
		timeout: 60_000
	}
})
