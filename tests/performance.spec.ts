import type { AppFixture } from './fixtures.js';
import type { Page, PlaywrightWorkerOptions } from '@playwright/test';

import { ms } from 'convert';
import { PerformanceMetricsCollector } from 'playwright-performance-metrics';

import { assert, expect, test } from './fixtures.js';

test.use({ storageState: { cookies: [], origins: [] } });

benchmark(`startup @blank`, {
	async prepare({ page }) {
		await page.goto('./', {
			waitUntil: 'commit',
		});
	},
	async run({ app }) {
		await app.db.ready();
		await assert(app.tabs.get('sessions')).toBeVisible({ timeout: ms('1min') });
	},
	largestContentfulPaint: '13s',
	firstContentfulPaint: '250ms',
	// TODO: lower this
	total: {
		chromium: '13s',
		webkit: '25s',
		firefox: '25s',
	},
});

benchmark('startup', {
	async prepare({ app }) {
		await app.db.ready();
		await assert(app.tabs.get('sessions')).toBeVisible({ timeout: ms('1min') });
	},
	async run({ page, app }) {
		await page.reload();
		await assert(app.tabs.get('sessions')).toBeVisible({ timeout: ms('1min') });
	},
	// TODO: lower this
	total: {
		chromium: '8s',
		webkit: '15s',
		firefox: '15s',
	},
});

function benchmark(
	testLabel: string,
	{
		run,
		prepare,
		...limits
	}: {
		total: {
			[browser in PlaywrightWorkerOptions['browserName']]: `${number}${'s' | 'ms' | 'min'}`;
		};
		largestContentfulPaint?: `${number}${'s' | 'ms' | 'min'}`;
		firstContentfulPaint?: `${number}${'s' | 'ms' | 'min'}`;
		/** Run before starting metrics collection */
		prepare?(arg: { page: Page; app: AppFixture }): Promise<void>;
		/** When the function returns, collect metrics */
		run(arg: { page: Page; app: AppFixture }): Promise<void>;
	}
) {
	test(testLabel, async ({ page, browserName, app }, testInfo) => {
		await prepare?.({ page, app });

		let collector: PerformanceMetricsCollector | undefined;
		if (browserName === 'chromium') {
			// playwright-performance-metrics only supports Chromium-based browsers
			collector = new PerformanceMetricsCollector();

			const sampleInterval = 10;
			const maxBufferSize = ms(limits.total.chromium) * sampleInterval;

			await page.evaluate(
				(params) => {
					window.profiler = new Profiler(params);
				},
				{ sampleInterval, maxBufferSize }
			);
		}

		const start = Date.now();

		await run({ page, app });

		const end = Date.now();

		console.info('Total time:', end - start, 'ms');

		expect(end - start).toBeLessThan(ms(limits.total[browserName]));

		if (collector) {
			const metrics = await collector.collectMetrics(page, {
				timeout: ms('10s'),
			});

			if (limits.largestContentfulPaint) {
				expect(metrics.largestContentfulPaint).toBeLessThan(
					ms(limits.largestContentfulPaint)
				);
			}

			if (limits.firstContentfulPaint) {
				expect(metrics.paint?.firstContentfulPaint).toBeLessThan(
					ms(limits.firstContentfulPaint)
				);
			}

			console.info('Startup performance metrics:', metrics);
		}

		const trace = await page.evaluate(async () => window.profiler?.stop());

		if (trace) {
			testInfo.attach('Trace', {
				body: JSON.stringify(trace),
				contentType: 'application/json',
			});
		}
	});
}
