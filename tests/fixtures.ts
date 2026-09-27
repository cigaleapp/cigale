import type { TempFilesFixture } from './fixtures/tempfiles.js';

import 'urlpattern-polyfill';

import type { AppFixture } from './fixtures/app.js';
import type { ONNXModelsFixture } from './fixtures/onnxmodels.js';
import type { OPFSTestArg } from './utils/opfs.js';
import type { NetworkFixture } from '@msw/playwright';

import { defineNetworkFixture } from '@msw/playwright';
import { test as base } from '@playwright/test';
import { http, HttpResponse } from 'msw';

import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { FixturePaths } from './filepaths.js';
import { app } from './fixtures/app.js';
import { forEachTest, forEachWorker } from './fixtures/foreachtest.js';
import { onnxmodels } from './fixtures/onnxmodels.js';
import { tempfiles } from './fixtures/tempfiles.js';

export type ExtraTestArgs = {
	forEachTest: void;
	app: AppFixture;
	tempfiles: TempFilesFixture;
	onnxmodels: ONNXModelsFixture;
	network: import('@msw/playwright').NetworkFixture;
	/** 
	 * Just like network, but can also mock assets, meaning routes that end in a file extension.
	 * Required when mocking an API that happens to have a route ending with a asset-looking path segment 
	 * This has perf implications, so only use it when necessary 
	 * See https://claude.ai/share/9b09b767-2e90-4f9e-b0e5-a4e286000830
	 */
	networkWithAssets: import('@msw/playwright').NetworkFixture;
	opfsState?: OPFSTestArg;
	storageState:
		| FixturePaths.Absolute<FixturePaths.StorageStates>
		| Exclude<import('@playwright/test').BrowserContextOptions['storageState'], string>;
};

const _test = base.extend<ExtraTestArgs, { forEachWorker: void }>({
	tempfiles,
	network: async ({ context }, use: (network: NetworkFixture) => Promise<void>) => {
		const network = defineNetworkFixture({
			context,
			handlers: [http.get('https://example.com/is-mocked', () => HttpResponse.json(true))],
		});

		await network.enable();
		await use(network);
		await network.disable();
	},
	networkWithAssets: async ({ context }, use: (network: NetworkFixture) => Promise<void>) => {
		const network = defineNetworkFixture({
			context,
			handlers: [http.get('https://example.com/is-mocked', () => HttpResponse.json(true))],
			// See https://claude.ai/share/9b09b767-2e90-4f9e-b0e5-a4e286000830
			skipAssetRequests: false,
		});

		await network.enable();
		await use(network);
		await network.disable();
	},
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
	opfsState: 'tests/fixtures/opfs-states/empty.json',
});

/**
 * Test with a storage state set to basic (light example protocol, a session with photos imported and classified)
 */
export const testBasic = _test.extend({
	storageState: 'tests/fixtures/storage-states/basic.json',
	opfsState: 'tests/fixtures/opfs-states/basic.json',
});

/**
 * Test with a storage state set to kitchensink protocol
 */
export const testKitchensink = _test.extend({
	storageState: 'tests/fixtures/storage-states/kitchen-sink.json',
	opfsState: 'tests/fixtures/opfs-states/kitchen-sink.json',
});

export { lightProtocol as exampleProtocol };

export { assert, expect } from './assertions.js';
