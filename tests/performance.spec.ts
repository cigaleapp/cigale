import { minutesToMilliseconds } from 'date-fns';
import { PerformanceMetricsCollector } from 'playwright-performance-metrics';

import { assert, expect, test } from './fixtures.js';

test('startup @blank', async ({ page, browserName, app }) => {
	test.skip(browserName !== 'chromium', 'Performance metrics are only supported in Chromium');

	const collector = new PerformanceMetricsCollector();
	const start = Date.now();

	await page.goto('./');
	await app.db.ready();
	await assert(app.tabs.get('sessions')).toBeVisible({ timeout: minutesToMilliseconds(1) });

	const end = Date.now();

	// TODO: lower this
	console.info('Startup time:', end - start, 'ms');
	expect(end - start).toBeLessThan(10_000);

	const metrics = await collector.collectMetrics(page, {
		timeout: 10_000
	});

	expect(metrics.largestContentfulPaint).toBeLessThan(5_000);
	expect(metrics.paint?.firstContentfulPaint).toBeLessThan(250);
	console.info('Startup performance metrics:', metrics);
});
