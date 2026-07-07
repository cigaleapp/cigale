import { mkdir, rm } from 'node:fs/promises';
import type { ExtraTestArgs } from '$e2e/fixtures.js';
import type { PredownloadedModel } from '$e2e/utils/index.js';
import type { ExportedProtocol } from '$lib/schemas/protocols.js';

import {
	type PlaywrightTestArgs,
	type PlaywrightTestOptions,
	type PlaywrightWorkerArgs,
	type TestInfo,
} from '@playwright/test';

import {
	dumpDatabase,
	getPredownloadedModel,
	mockPredownloadedModels,
	mockProtocolSourceURL,
	mockUrl,
	setHardwareConcurrency,
} from '$e2e/utils/index.js';
import { restoreOPFSState } from '$e2e/utils/opfs.js';

import _fullProtocol from '../../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightProtocol from '../../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };

const fullProtocol = _fullProtocol as (typeof ExportedProtocol)['inferIn'];

let arthropodaClassifierModel: PredownloadedModel | null = null;
let collembolaClassifierModel: PredownloadedModel | null = null;
let arthropodaDetectionModel: PredownloadedModel | null = null;

export async function forEachTest(
	{ page, context, app, opfsState }: PlaywrightTestArgs & PlaywrightTestOptions & ExtraTestArgs,
	use: () => Promise<void>,
	info: TestInfo
) {
	if (opfsState) {
		await restoreOPFSState(page, opfsState);
	}

	await context.route('**/*', async (route) => {
		const request = route.request();
		if (request.resourceType() !== 'document') {
			return route.fallback();
		}

		const url = new URL(request.url());
		const isLocalhost =
			url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
		if (!isLocalhost) {
			return route.fallback();
		}

		const response = await route.fetch();
		const headers = {
			...response.headers(),
			'Document-Policy': 'js-profiling',
		};

		await route.fulfill({ response, headers });
	});

	if (process.env.DEBUG_WORKERS) {
		let wwcount = 0;
		page.on('worker', (worker) => {
			console.debug(`Created WebWorker n°${wwcount + 1} with ${worker.url()}`);
			wwcount++;

			worker.on('close', () => {
				console.debug(`Closing WebWorker n°${wwcount}`);
				wwcount--;
			});
		});
	}

	await rm('./tests/results', { recursive: true, force: true });
	await mkdir('./tests/results', { recursive: true });

	// XXX: 404 all other protocols so that no other built-in protocols appears before the Example: one in the protocols list
	// TODO: modify newSession/etc in the tests to target lightProtocol by default instead, test failures happened on main and I was doing sth else
	const ALLOWED_PROTOCOLS = [fullProtocol.source, lightProtocol.source];
	await mockUrl(
		page,
		context,
		(u) =>
			Boolean(
				new URLPattern('https://*/**/*.cigaleprotocol.*').test(u) &&
				!ALLOWED_PROTOCOLS.some((source) => {
					if (typeof source !== 'string') return false;
					const src = new URL(source);
					return new URLPattern({
						hostname: src.hostname,
						pathname: src.pathname.replace(
							'cigaleapp/cigale/main/',
							'cigaleapp/cigale/:branch/'
						),
					}).test(u);
				})
			),
		{
			status: 404,
			body: '',
		}
	);

	if (!info.tags.includes('@real-protocol')) {
		// @ts-expect-error we don't support non-string protocol source values for now
		await mockProtocolSourceURL(page, context, fullProtocol.source, {
			json: lightProtocol,
		});

		await mockProtocolSourceURL(page, context, lightProtocol.source, {
			json: lightProtocol,
		});
	}

	await mockPredownloadedModels(page, context, fullProtocol, {
		crop: [arthropodaDetectionModel],
		species: [collembolaClassifierModel, arthropodaClassifierModel],
	});

	const concurrency = info.annotations.find((a) => a.type === 'concurrency')?.description;
	if (concurrency) {
		await setHardwareConcurrency(page, Number.parseInt(concurrency));
	}

	if (
		info.tags.includes('@webkit-no-parallelization') &&
		context.browser()?.browserType().name() === 'webkit'
	) {
		await setHardwareConcurrency(page, 1);
	}

	if (!info.tags.includes('@blank')) {
		await page.goto('./');
		await app.db.ready();
	}

	await use();

	if (info.status !== info.expectedStatus) {
		info.attach('database snapshot', {
			body: await dumpDatabase(page),
		});

		info.attach('UI state', {
			body: await page.evaluate(() =>
				JSON.stringify(window.uiState?.snapshot() ?? null, null, 2)
			),
		});
	}
}

// oxlint-disable-next-line no-empty-pattern required by playwright
export async function forEachWorker({}: PlaywrightWorkerArgs, use: () => Promise<void>) {
	arthropodaClassifierModel = await getPredownloadedModel(
		'classifier-collembola.onnx',
		'classifier-collembola-classmapping.txt'
	);
	collembolaClassifierModel = await getPredownloadedModel(
		'classifier-arthropoda.onnx',
		'classifier-arthropoda-classmapping.txt'
	);
	arthropodaDetectionModel = await getPredownloadedModel('detector-arthropoda.onnx');
	await use();
}
