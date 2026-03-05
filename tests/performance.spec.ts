import { ms } from 'convert';
import { PerformanceMetricsCollector } from 'playwright-performance-metrics';

import { assert, expect, test } from './fixtures.js';

test('startup @blank', async ({ page, browserName, app }) => {
	let collector: PerformanceMetricsCollector | undefined;
	if (browserName === 'chromium') {
		// playwright-performance-metrics only supports Chromium-based browsers
		collector = new PerformanceMetricsCollector();
	}

	const start = Date.now();

	await page.goto('./');
	await app.db.ready();
	await assert(app.tabs.get('sessions')).toBeVisible({ timeout: ms('1min') });

	const end = Date.now();

	console.info('Startup time:', end - start, 'ms');

	// TODO: lower this
	expect(end - start).toBeLessThan(
		{
			chromium: ms('10s'),
			webkit: ms('17s'),
			firefox: ms('17s')
		}[browserName]
	);

	if (collector) {
		const metrics = await collector.collectMetrics(page, {
			timeout: ms('10s')
		});

		expect(metrics.largestContentfulPaint).toBeLessThan(ms('5s'));
		expect(metrics.paint?.firstContentfulPaint).toBeLessThan(ms('250ms'));
		console.info('Startup performance metrics:', metrics);
	}
});
