// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { minutesToMilliseconds } from 'date-fns';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	/* Leave some time before github actions makes the job time out (1 hour), so the report can be deployed */
	globalTimeout: minutesToMilliseconds(50),
	timeout: minutesToMilliseconds(1.2),
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI
		? [['json', { outputFile: 'test-results.json' }], ['html'], ['github'], ['list']]
		: [],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry'
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				contextOptions: {
					// See https://github.com/microsoft/playwright/issues/1090
					serviceWorkers: 'block'
				}
			}
		},

		// Firefox does not work in CI, see https://github.com/microsoft/playwright/issues/11566
		...(process.env.CI
			? []
			: [
					{
						name: 'firefox',
						use: { ...devices['Desktop Firefox'] }
					}
				]),

		{
			name: 'webkit',
			use: {
				...devices['Desktop Safari'],
				contextOptions: {
					// See https://github.com/microsoft/playwright/issues/1090
					serviceWorkers: 'block'
				}
			}
		}

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		...(process.env.CI
			? {
					command: 'npm run build && npm run preview',
					port: 4173
				}
			: {
					command: 'npm run dev',
					port: 5173
				}),
		reuseExistingServer: !process.env.CI
	}
});
