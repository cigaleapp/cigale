// @ts-check
import { tz } from '@date-fns/tz';
import { defineConfig, devices } from '@playwright/test';
import arkenv from 'arkenv';
import { formatISO9075, minutesToMilliseconds } from 'date-fns';

/**
 * @import RPReporter from '@reportportal/agent-js-playwright';
 * @typedef {RPReporter['config']} ReportPortalConfig
 */

const env = arkenv({
	CI: 'boolean = false',
	'BASE_URL?': 'string.url',
	SHARDING: 'boolean = false',
	'REPORTPORTAL_API_KEY?': 'string',
	'REPORTPORTAL_DOMAIN?': 'string',
	'REPORTPORTAL_LAUNCH_ID?': 'string'
});

/** @typedef {NonNullable<import('@playwright/test').PlaywrightTestConfig['projects']>[number]} Project */

/** @type {Project} */
const chromium = {
	name: 'chromium',
	use: {
		...devices['Desktop Chrome'],
		contextOptions: {
			serviceWorkers: env.CI ? 'allow' : 'block'
		}
	}
};

/** @type {Project} */
const firefox = {
	name: 'firefox',
	use: { ...devices['Desktop Firefox'] }
};

/** @type {Project} */
const webkit = {
	name: 'webkit',
	use: {
		...devices['Desktop Safari'],
		contextOptions: {
			// See https://github.com/microsoft/playwright/issues/1090
			serviceWorkers: 'block'
		}
	}
};

const reportPortalReporter =
	env.REPORTPORTAL_API_KEY && env.REPORTPORTAL_DOMAIN && env.REPORTPORTAL_LAUNCH_ID
		? [
				/** @type {const} */
				([
					'@reportportal/agent-js-playwright',
					/** @type {ReportPortalConfig} */
					({
						apiKey: env.REPORTPORTAL_API_KEY,
						endpoint: `https://${env.REPORTPORTAL_DOMAIN}/api/v2`,
						project: 'CIGALE',
						launchId: env.REPORTPORTAL_LAUNCH_ID,
						includeTestSteps: true
						// debug: true,
					})
				])
			]
		: [];

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	/* Leave some time before github actions makes the job time out (1 hour), so the report can be deployed */
	globalTimeout: minutesToMilliseconds(10),
	timeout: dependsOnTarget({
		dev: minutesToMilliseconds(5),
		live: minutesToMilliseconds(1.2),
		built: minutesToMilliseconds(1.2)
	}),
	testDir: './tests',
	metadata: {
		generated: formatISO9075(new Date(), {
			in: tz('Europe/Paris')
		})
	},
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!env.CI,
	/* Retry on CI only */
	retries: env.CI ? 2 : 0,
	/* Opt out of parallel tests. */
	workers: 1,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: env.CI
		? [
				['json', { outputFile: 'test-results.json' }],
				[env.SHARDING ? 'blob' : 'html'],
				['github'],
				['list'],
				...reportPortalReporter
			]
		: [],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: dependsOnTarget({
			live: env.BASE_URL,
			dev: 'http://localhost:5173',
			built: 'http://localhost:4173'
		}),

		// See https://github.com/microsoft/playwright/issues/16357
		bypassCSP: dependsOnTarget({
			live: true,
			dev: false,
			built: false
		}),

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',

		// Right now, all tests assume French language.
		locale: 'fr-FR',

		// Ensure no TZ issues for assertions that depend on time
		timezoneId: 'Etc/UTC'
	},

	/* Configure projects for major browsers */
	projects: dependsOnTarget({
		live: [chromium],
		dev: [chromium, firefox, webkit],
		built: [chromium, webkit]
	}),

	/* Run your local dev server before starting the tests */
	webServer: dependsOnTarget({
		live: undefined,
		dev: {
			command: 'bun run dev',
			port: 5173,
			reuseExistingServer: true
		},
		built: {
			command: 'bun run preview',
			port: 4173,
			reuseExistingServer: false
		}
	})
});

/**
 *
 * @template L, D, B
 * @param {object} param0
 * @param {L} param0.live - Value to return if we're checking against a live URL (meaning $BASE_URL is set)
 * @param {D} param0.dev - Value to return if we're checking against a dev server (meaning $CI is not set)
 * @param {B} param0.built - Value to return if we're checking against a built version (meaning $CI is set)
 * @returns {L | D | B}
 */
function dependsOnTarget({ live, dev, built }) {
	if (env.BASE_URL) return live;
	if (env.CI) return built;
	return dev;
}
