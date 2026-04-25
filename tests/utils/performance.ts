import { writeFileSync } from 'node:fs';
import type { CDPSession, Page, TestInfo } from '@playwright/test';

export async function collectChromeDevtoolsTrace(
	page: Page,
	testInfo: TestInfo,
	callback: (measure: {
		start: (track: string, label: string) => Promise<void>;
		end: (track: string, label: string, data?: Record<string, string>) => Promise<void>;
	}) => Promise<void>
) {
	let tracingComplete: Promise<string> | undefined;
	let client: CDPSession | undefined;
	if (page.context().browser()?.browserType().name() === 'chromium') {
		client = await page.context().newCDPSession(page);
		if (!client) throw new Error('Failed to create CDP session');
		tracingComplete = new Promise((resolve, reject) => {
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
						console.debug(
							'[Playwright custom tracing]',
							'End',
							track,
							'/',
							label,
							data
						);
						performance.measure(label, {
							start: label,
							detail: {
								devtools: {
									dataType: 'track-entry',
									track: track,
									trackGroup: 'Playwright',
									properties: Object.entries(data),
									tooltipText:
										'Added via Playwright (collectChromeDevtoolsTrace)',
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
	}

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
