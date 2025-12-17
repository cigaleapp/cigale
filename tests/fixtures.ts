import { mkdir, rm } from 'node:fs/promises';
import { test as base, type Locator } from '@playwright/test';

import type { Settings } from '$lib/database';
import type { IDBDatabaseType } from '$lib/idb.svelte';
import type { ExportedProtocol } from '$lib/schemas/protocols';
import type { Toast } from '$lib/toasts.svelte.js';

import fullProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import {
	confirmDeletionModal,
	expectTooltipContent,
	getDatabaseRowByField,
	getDatabaseRowById,
	getPredownloadedModel,
	getSettings,
	goToTab,
	listTable,
	mockPredownloadedModels,
	mockProtocolSourceURL,
	modal,
	setHardwareConcurrency,
	setSettings,
	sidepanelMetadataSectionFor,
	toast,
	waitForLoadingEnd,
	type NavigationTab,
	type PredownloadedModel
} from './utils';

let classification80Model: PredownloadedModel | null = null;
let classification17kModel: PredownloadedModel | null = null;
let detectionModel: PredownloadedModel | null = null;

type Fixtures = {
	db: {
		observation: {
			byLabel(label: string): Promise<IDBDatabaseType['Observation']['value'] | undefined>;
			byId(id: string): Promise<IDBDatabaseType['Observation']['value'] | undefined>;
			list(): Promise<IDBDatabaseType['Observation']['value'][]>;
		};
		image: {
			byFilename(filename: string): Promise<IDBDatabaseType['Image']['value'] | undefined>;
			byId(id: string): Promise<IDBDatabaseType['Image']['value'] | undefined>;
			list(): Promise<IDBDatabaseType['Image']['value'][]>;
		};
		session: {
			byName(label: string): Promise<IDBDatabaseType['Session']['value'] | undefined>;
			byId(id: string): Promise<IDBDatabaseType['Session']['value'] | undefined>;
			list(): Promise<IDBDatabaseType['Session']['value'][]>;
		};
	};
	modals: {
		byKey(key: `modal_${string}`): Locator;
		byMessage(message: string): Locator;
		/**
		 * Confirms deletion if a deletion-confirm modal is open
		 * @param type text to type before hitting confirm button
		 */
		confirmDeletion(key: `modal_${string}`, type?: string): Promise<void>;
	};
	toasts: {
		byMessage(type: Toast<unknown>['type'] | null, message: string): Locator;
	};
	settings: {
		set(values: Partial<Settings>): Promise<void>;
		get(): Promise<Settings>;
	};
	tabs: {
		go(tab: NavigationTab): Promise<void>;
	};
	tooltips: {
		expectContent(element: Locator, content: string | RegExp): Promise<void>;
	};
	loading: {
		wait(timeout?: number): Promise<void>;
		waitIn(area: Locator, timeout?: number): Promise<void>;
	};
	sidepanel: Locator & {
		metadataSection(label: string): Locator;
	};
};

export const test = base.extend<{ forEachTest: void; app: Fixtures }, { forEachWorker: void }>({
	app: async ({ page }, use) => {
		const sidepanel = page.getByTestId('sidepanel') as Fixtures['sidepanel'];
		sidepanel.metadataSection = (label) => sidepanelMetadataSectionFor(page, label);

		await use({
			sidepanel,
			db: {
				observation: {
					list: async () => listTable(page, 'Observation'),
					byId: async (id) => getDatabaseRowById(page, 'Observation', id),
					byLabel: async (label) =>
						getDatabaseRowByField(page, 'Observation', 'label', label)
				},
				image: {
					list: async () => listTable(page, 'Image'),
					byId: async (id) => getDatabaseRowById(page, 'Image', id),
					byFilename: async (fname) =>
						getDatabaseRowByField(page, 'Image', 'filename', fname)
				},
				session: {
					list: async () => listTable(page, 'Session'),
					byId: async (id) => getDatabaseRowById(page, 'Session', id),
					byName: async (name) => getDatabaseRowByField(page, 'Session', 'name', name)
				}
			},
			modals: {
				byKey: (key) => modal(page, { key }),
				byMessage: (message) => modal(page, { title: message }),
				confirmDeletion: async (key, type) =>
					confirmDeletionModal(page, { type, modalKey: key })
			},
			toasts: {
				byMessage: (type, message) => toast(page, message, { type: type ?? undefined })
			},
			settings: {
				set: async (values) => setSettings({ page }, values),
				get: async () => getSettings({ page })
			},
			tabs: {
				go: async (tab) => goToTab(page, tab)
			},
			tooltips: {
				expectContent: async (element, content) =>
					expectTooltipContent(page, element, content)
			},
			loading: {
				wait: async (timeout) => waitForLoadingEnd(page, timeout),
				waitIn: async (area, timeout) => waitForLoadingEnd(area, timeout)
			}
		});
	},
	forEachWorker: [
		// oxlint-disable-next-line no-empty-pattern required by playwright
		async ({}, use) => {
			classification80Model = await getPredownloadedModel(
				'model_classif.onnx',
				'lightweight-80-classmapping.txt'
			);
			classification17kModel = await getPredownloadedModel(
				'classification-arthropoda-polymny-2025-04-11.onnx',
				'polymny-17k-classmapping.txt'
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
				await mockProtocolSourceURL(
					page,
					context,
					(fullProtocol as ExportedProtocol).source as string,
					{
						json: lightProtocol
					}
				);
			}

			await mockPredownloadedModels(page, context, fullProtocol as ExportedProtocol, {
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
});

export { expect } from '@playwright/test';
export { lightProtocol as exampleProtocol };
