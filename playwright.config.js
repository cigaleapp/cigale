// @ts-check
import { tz } from '@date-fns/tz';
import { defineConfig, devices } from '@playwright/test';
import { formatISO9075, minutesToMilliseconds } from 'date-fns';

/** @typedef {NonNullable<import('@playwright/test').PlaywrightTestConfig['projects']>[number]} Project */

/** @type {Project} */
const chromium = {
	name: 'chromium',
	use: {
		...devices['Desktop Chrome'],
		contextOptions: {
			serviceWorkers: process.env.CI ? 'allow' : 'block'
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
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests. */
	workers: 1,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI
		? [
				['json', { outputFile: 'test-results.json' }],
				[process.env.SHARDING ? 'blob' : 'html'],
				['github'],
				['list'],
				['./tests/reporters/pleye.js', pleyeConfig()]
			]
		: [],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: dependsOnTarget({
			live: process.env.BASE_URL,
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
 * @returns {import('./tests/reporters/pleye').PleyeParams}
 */
function pleyeConfig() {
	return {
		debug: process.env.PLEYE_DEBUG === 'debug',
		apiKey: process.env.PLEYE_API_KEY || '',
		serverOrigin: 'https://pleye.gwen.works',
		repositoryGitHubId: Number(process.env.GITHUB_REPOSITORY_ID) || 0,
		githubJobId: Number(process.env.GITHUB_JOB_ID) || 0,
		githubRunId: Number(process.env.GITHUB_RUN_ID) || 0,
		// Careful: use GITHUB_WORKSPACE and NOT ${{ github.workspace }}, see
		// https://github.com/actions/runner/issues/2058
		baseDirectory: process.env.GITHUB_WORKSPACE || process.cwd() || '',
		commitSha: process.env.GITHUB_COMMIT_SHA || '',
		branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '',
		pullRequestNumber: process.env.GITHUB_PR_NUMBER
			? Number(process.env.GITHUB_PR_NUMBER)
			: undefined
	};
}

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
	if (process.env.BASE_URL) return live;
	if (process.env.CI) return built;
	return dev;
}
