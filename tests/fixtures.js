import { mkdir, rm } from 'node:fs/promises';
import { test as base } from '@playwright/test';

import fullProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import {
	getPredownloadedModel,
	mockPredownloadedModels,
	mockProtocolSourceURL,
	setHardwareConcurrency
} from './utils';

/**
 * @type {import('./utils').PredownloadedModel|null}
 */
let classification80Model = null;
/**
 * @type {import('./utils').PredownloadedModel|null}
 */
let classification17kModel = null;
/**
 * @type {import('./utils').PredownloadedModel|null}
 */
let detectionModel = null;

/**
 * @import { Fixtures, TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
 */

/**
 * @type {TestType<{ forEachTest: void} & PlaywrightTestArgs & PlaywrightTestOptions, { forEachWorker: void  } & PlaywrightWorkerArgs & PlaywrightWorkerOptions >}
 */
export const test = base.extend(
	/**
	 * @type {Fixtures<{forEachTest: void}, {forEachWorker: void}, PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>}
	 */
	({
		forEachWorker: [
			async ({}, use) => {
				classification80Model = await getPredownloadedModel('model_classif.onnx');
				classification17kModel = await getPredownloadedModel(
					'classification-arthropoda-polymny-2025-04-11.onnx'
				);
				detectionModel = await getPredownloadedModel(
					'arthropod_detector_yolo11n_conf0.437.onnx'
				);
				await use();
			},
			{ scope: 'worker', auto: true }
		],
		forEachTest: [
			async ({ page, context }, use, { tags, annotations }) => {
				// https://playwright.dev/docs/service-workers-experimental
				process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

				await rm('./tests/results', { recursive: true, force: true });
				await mkdir('./tests/results', { recursive: true });

				if (!tags.includes('@real-protocol')) {
					await mockProtocolSourceURL(page, context, fullProtocol.source, {
						json: lightProtocol
					});
				}

				await mockPredownloadedModels(page, context, fullProtocol, {
					detection: [detectionModel],
					species: [classification17kModel, classification80Model]
				});

				const concurrency = annotations.find((a) => a.type === 'concurrency')?.description;
				if (concurrency) {
					await setHardwareConcurrency(page, Number.parseInt(concurrency));
				}

				if (
					tags.includes('@webkit-no-parallelization') &&
					context.browser()?.browserType().name() === 'webkit'
				) {
					await setHardwareConcurrency(page, 1);
				}

				await page.goto('./');
				await page.waitForFunction(() =>
					Boolean(window.devalue && window.DB && window.refreshDB)
				);
				await use();
			},
			{ auto: true }
		]
	})
);

export { expect } from '@playwright/test';
export { lightProtocol as exampleProtocol };
