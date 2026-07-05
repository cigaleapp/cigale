import type { TempFilesFixture } from './fixtures/tempfiles.js';
import type { PredownloadedModel } from './utils/index.js';

import 'urlpattern-polyfill';

import type { AppFixture } from './fixtures/app.js';
import type { ONNXModelsFixture } from './fixtures/onnxmodels.js';

import { defineNetworkFixture } from '@msw/playwright';
import { test as base } from '@playwright/test';

import _fullProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { FixturePaths } from './filepaths.js';
import { app } from './fixtures/app.js';
import { forEachTest, forEachWorker } from './fixtures/foreachtest.js';
import { onnxmodels } from './fixtures/onnxmodels.js';
import { tempfiles } from './fixtures/tempfiles.js';
import { getPredownloadedModel } from './utils/index.js';

const fullProtocol = _fullProtocol;

let arthropodaClassifierModel: PredownloadedModel | null = null;
let collembolaClassifierModel: PredownloadedModel | null = null;
let arthropodaDetectionModel: PredownloadedModel | null = null;

const _test = base.extend<
	{
		forEachTest: void;
		app: AppFixture;
		tempfiles: TempFilesFixture;
		onnxmodels: ONNXModelsFixture;
		networkHandlers: Array<import('msw').AnyHandler>;
		network: import('@msw/playwright').NetworkFixture;
		storageState:
			| FixturePaths.Absolute<FixturePaths.StorageStates>
			| Exclude<import('@playwright/test').BrowserContextOptions['storageState'], string>;
	},
	{ forEachWorker: void }
>({
	tempfiles,
	async networkHandlers({}, use) {
		await use([]);
	},
	network: [
		async ({ context, networkHandlers: additionalHandlers }, use) => {
			const network = defineNetworkFixture({
				context,
				handlers: [
					// No default handlers for now, but, should we add some, they'd go here
					...additionalHandlers,
				],
			});

			await network.enable();
			await use(network);
			await network.disable();
		},
		{ auto: true },
	],
	onnxmodels,
	app,
	forEachWorker: [forEachWorker, { scope: 'worker', auto: true }],
	forEachTest: [forEachTest, { auto: true }],
});

// TODO: use worker-scoped fixtures instead of storageState ??

/**
 * Default test has a "empty" storage state, that has the protocol already imported but no sessions
 */
export const test = _test.extend({
	storageState: 'tests/fixtures/storage-states/empty.json',
});

/**
 * Test with a storage state set to basic (light example protocol, a session with photos imported and classified)
 */
export const testBasic = _test.extend({
	storageState: 'tests/fixtures/storage-states/basic.json',
});

/**
 * Test with a storage state set to kitchensink protocol
 */
export const testKitchensink = _test.extend({
	storageState: 'tests/fixtures/storage-states/kitchen-sink.json',
});

export { lightProtocol as exampleProtocol };

export { assert, expect } from './assertions.js';
