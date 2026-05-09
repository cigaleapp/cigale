import { writeFileSync } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';

type NetworkProfile = '4g';

const MEBIBIT = 1024 * 1024;

const networkProfiles: Record<
	NetworkProfile,
	{
		latency: number;
		downloadThroughput: number;
		uploadThroughput: number;
		connectionType:
			| 'none'
			| 'cellular2g'
			| 'cellular3g'
			| 'cellular4g'
			| 'bluetooth'
			| 'ethernet'
			| 'wifi'
			| 'wimax'
			| 'other';
	}
> = {
	/** Similar to Chrome DevTools "Regular 4G". Throughputs are in bytes/second. */
	'4g': {
		latency: 20,
		downloadThroughput: Math.round((4 * MEBIBIT) / 8), // 4 Mbps
		uploadThroughput: Math.round((3 * MEBIBIT) / 8), // 3 Mbps
		connectionType: 'cellular4g',
	},
};

export async function emulateNetworkProfile(page: Page, profile: NetworkProfile = '4g') {
	if (page.context().browser()?.browserType().name() !== 'chromium') {
		return;
	}

	const client = await page.context().newCDPSession(page);
	await client.send('Network.enable');
	await client.send('Network.emulateNetworkConditions', {
		offline: false,
		...networkProfiles[profile],
	});
}

export async function collectChromeDevtoolsTrace(
	page: Page,
	testInfo: TestInfo,
	callback: (measure: {
		start: (track: string, label: string) => Promise<void>;
		end: (track: string, label: string, data?: Record<string, string>) => Promise<void>;
	}) => Promise<void>
) {
	if (page.context().browser()?.browserType().name() !== 'chromium') {
		return callback({
			async start() {
				// no-op
			},
			async end() {
				// no-op
			},
		});
	}

	const client = await page.context().newCDPSession(page);
	if (!client) throw new Error('Failed to create CDP session');
	const tracingComplete = new Promise<string>((resolve, reject) => {
		client!.once('Tracing.tracingComplete', async ({ stream }) => {
			if (stream === undefined) {
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

	await callback({
		async start(track, label) {
			await page.evaluate(
				({ label, track }) => {
					console.debug('[Playwright custom tracing]', 'Start', track, '/', label);
					performance.mark(label);
				},
				{ label, track }
			);
		},
		async end(track, label, data = {}) {
			await page.evaluate(
				({ track, label, data }) => {
					console.debug('[Playwright custom tracing]', 'End', track, '/', label, data);
					performance.measure(label, {
						start: label,
						detail: {
							devtools: {
								dataType: 'track-entry',
								track: track,
								trackGroup: 'Playwright',
								properties: Object.entries(data),
								tooltipText: 'Added via Playwright (collectChromeDevtoolsTrace)',
							},
						},
					});
				},
				{ track, label, data }
			);
		},
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

	if (client && tracingComplete) {
		await client.send('Tracing.end');
		const trace = await tracingComplete;
		console.info('Attaching timeline trace');
		writeFileSync('trace.timeline.json', trace);
		testInfo.attach('Timeline trace', {
			body: trace,
			contentType: 'application/json',
		});
	}
}
