import type { AppFixture } from './fixtures.js';
import type { CDPSession, Page, PlaywrightWorkerOptions } from '@playwright/test';

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
		let client: CDPSession | undefined;
		let tracingComplete: Promise<string> | undefined;
		if (browserName === 'chromium') {
			// playwright-performance-metrics only supports Chromium-based browsers
			collector = new PerformanceMetricsCollector();

			client = await page.context().newCDPSession(page);
			if (!client) throw new Error('Failed to create CDP session');
			tracingComplete = new Promise((resolve, reject) => {
				client!.once('Tracing.tracingComplete', async ({ stream }) => {
					if (stream === undefined)  {
						reject(new Error('Tracing complete event missing stream handle'));
						return;
					}

					try {
						let trace = '';
						while (true) {
							const chunk = await client!.send('IO.read', { handle: stream });
							trace += chunk.base64Encoded
								? Buffer.from(chunk.data, 'base64').toString('utf8')
								: chunk.data;
							if (chunk.eof) break;
						}

						await client!.send('IO.close', { handle: stream });
						resolve(trace);
					} catch (error) {
						reject(error);
					}
				});
			});

			await client.send('Tracing.start', {
				transferMode: 'ReturnAsStream',
				categories: [
					'toplevel',
					'devtools.timeline',
					'disabled-by-default-devtools.timeline',
					'disabled-by-default-devtools.timeline.frame',
					'v8.execute',
					'blink.user_timing',
					'blink.console',
					'loading',
					'disabled-by-default-v8.cpu_profiler',
				].join(','),
			});
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

		if (client && tracingComplete) {
			await client.send('Tracing.end');
			const trace = await tracingComplete;
			console.info('Attaching timeline trace');
			testInfo.attach('Timeline trace', {
				body: trace,
				contentType: 'application/json',
			});
		}
	});
}
