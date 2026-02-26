import { ms } from 'convert';
import { PerformanceMetricsCollector } from 'playwright-performance-metrics';

import { assert, expect, test } from './fixtures.js';

test('startup @blank', async ({ page, browserName, app }) => {
	test.skip(browserName !== 'chromium', 'Performance metrics are only supported in Chromium');

	const collector = new PerformanceMetricsCollector();
	const start = Date.now();

	await page.goto('./');
	await app.db.ready();
	await assert(app.tabs.get('sessions')).toBeVisible({ timeout: ms('1min') });

	const end = Date.now();

	// TODO: lower this
	console.info('Startup time:', end - start, 'ms');
	expect(end - start).toBeLessThan(ms('10s'));

	const metrics = await collector.collectMetrics(page, {
		timeout: ms('10s')
	});

	expect(metrics.largestContentfulPaint).toBeLessThan(ms('5s'));
	expect(metrics.paint?.firstContentfulPaint).toBeLessThan(ms('250ms'));
	console.info('Startup performance metrics:', metrics);
});
