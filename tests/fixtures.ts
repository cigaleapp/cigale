import { mkdir, rm } from 'node:fs/promises';
import { test as base, type Locator } from '@playwright/test';

import type { Settings } from '$lib/database';
import type { IDBDatabaseType } from '$lib/idb.svelte';
import type { RuntimeValue } from '$lib/schemas/metadata';
import type { ExportedProtocol } from '$lib/schemas/protocols';
import type { Toast } from '$lib/toasts.svelte.js';
import { safeJSONParse } from '$lib/utils';

import _fullProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import {
	appNavTabs,
	confirmDeletionModal,
	expectTooltipContent,
	getDatabaseRowByField,
	getDatabaseRowById,
	getPredownloadedModel,
	getSettings,
	getTab,
	goToTab,
	listTable,
	mockPredownloadedModels,
	mockProtocolSourceURL,
	modal,
	openSettings,
	setHardwareConcurrency,
	setSettings,
	sidepanelMetadataSectionFor,
	toast,
	tooltipOf,
	waitForLoadingEnd,
	waitForRoute,
	type NavigationTab,
	type PredownloadedModel
} from './utils/index.js';

const fullProtocol = _fullProtocol as ExportedProtocol;

type RemoveNamespace<Key extends `io.github.cigaleapp.arthropods.example.light__${string}`> =
	Key extends `io.github.cigaleapp.arthropods.example.light__${infer Rest}` ? Rest : never;

let arthropodaClassifierModel: PredownloadedModel | null = null;
let collembolaClassifierModel: PredownloadedModel | null = null;
let arthropodaDetectionModel: PredownloadedModel | null = null;

export type AppFixture = {
	db: {
		ready(): Promise<void>;
		refresh(): Promise<void>;
		protocol: {
			byId(id: string): Promise<IDBDatabaseType['Protocol']['value'] | undefined>;
			byName(name: string): Promise<IDBDatabaseType['Protocol']['value'] | undefined>;
		};
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
		metadata: {
			get(id: string): Promise<IDBDatabaseType['Metadata']['value'] | undefined>;
			values(args: {
				/** The image's filename */
				image?: string;
				/** The image's ID */
				imageId?: string;
				/** The observation's label */
				observation?: string;
				/** The session's name */
				session?: string;
				/** Remove namespace from metadata id (keys of returned object). By default, set to lightweight protocol's id */
				protocolId?: string | null;
			}): Promise<Record<string, RuntimeValue>>;
			set(
				/** The image's ID  */
				imageId: string,
				/** The metadata key. If not namespaced, it'll be namespaced to the lightweight protocol's id */
				key: RemoveNamespace<keyof typeof lightProtocol.metadata> | (string & {}),
				/** The new value to set it as. Use null to remove the value  */
				value: null | RuntimeValue | { confidence: number; value: RuntimeValue }
			): Promise<void>;
		};
	};
	modals: {
		byKey(key: `modal_${string}`): Locator;
		byTitle(message: string): Locator;
		/**
		 * Confirms deletion if a deletion-confirm modal is open
		 * @param type text to type before hitting confirm button
		 */
		confirmDeletion(key: `modal_${string}`, type?: string): Promise<void>;
	};
	toasts: {
		byMessage(type: Toast<unknown>['type'] | null, message: string): Locator;
		byType(type: Toast<unknown>['type']): Locator;
	};
	settings: {
		set(values: Partial<Settings>): Promise<void>;
		get(): Promise<Settings>;
		get<Key extends keyof Settings>(key: Key): Promise<Settings[Key]>;
		open(options?: Parameters<Locator['click']>[0]): Promise<void>;
	};
	tabs: {
		go(tab: NavigationTab): Promise<void>;
		get(tab: NavigationTab): Locator;
		hash(tab: NavigationTab): `#${string}`;
	};
	path: {
		wait(route: Parameters<typeof waitForRoute>[1]): Promise<void>;
		go(path: import('$app/types').ResolvedPathname): Promise<void>;
	};
	tooltips: {
		expectContent(element: Locator, content: string | RegExp): Promise<void>;
		trigger(element: Locator): Promise<Locator>;
	};
	loading: {
		wait(timeout?: number): Promise<void>;
		waitIn(area: Locator, timeout?: number): Promise<void>;
	};
	sidepanel: Locator & {
		metadataSection(label: string | RegExp): Locator;
	};
};

export const test = base.extend<{ forEachTest: void; app: AppFixture }, { forEachWorker: void }>({
	app: async ({ page }, use) => {
		const sidepanel = page.getByTestId('sidepanel') as AppFixture['sidepanel'];
		sidepanel.metadataSection = (label) => sidepanelMetadataSectionFor(page, label);

		await use({
			sidepanel,
			db: {
				async ready() {
					await page.waitForFunction(() =>
						Boolean(window.devalue && window.DB && window.refreshDB)
					);
				},
				async refresh() {
					await page.evaluate(async () => {
						await window.refreshDB();
					});
				},
				protocol: {
					byId: async (id) => getDatabaseRowById(page, 'Protocol', id),
					byName: async (name) => getDatabaseRowByField(page, 'Protocol', 'name', name)
				},
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
				},
				metadata: {
					get: async (id) => getDatabaseRowById(page, 'Metadata', id),
					async values({
						session,
						image,
						imageId,
						observation: obs,
						protocolId = lightProtocol.id
					}) {
						let object:
							| undefined
							| IDBDatabaseType['Image' | 'Observation' | 'Session']['value'];

						if (imageId) {
							object = await getDatabaseRowById(page, 'Image', imageId);
						} else if (image) {
							object = await getDatabaseRowByField(page, 'Image', 'filename', image);
						} else if (obs) {
							object = await getDatabaseRowByField(page, 'Observation', 'label', obs);
						} else if (session) {
							object = await getDatabaseRowByField(page, 'Session', 'name', session);
						} else {
							throw new Error(
								'At least one of image, observation or session must be provided'
							);
						}

						if (!object) {
							throw new Error(
								`Could not find database object for provided parameters: ${JSON.stringify(
									{ session, image, observation: obs, imageId }
								)}`
							);
						}

						const values =
							'metadataOverrides' in object
								? object.metadataOverrides
								: object.metadata;

						return Object.fromEntries(
							Object.entries(values)
								.filter(([id]) =>
									protocolId ? id.startsWith(`${protocolId}__`) : true
								)
								.map(([id, { value }]) => [
									protocolId ? id.replace(`${protocolId}__`, '') : id,
									safeJSONParse(value)
								])
						);
					},
					async set(imageId, key, value) {
						const original = await getDatabaseRowById(page, 'Image', imageId);
						if (!original) {
							throw new Error(`Could not find image with ID ${imageId}`);
						}

						if (!key.includes('__')) {
							key = `${lightProtocol.id}__${key}`;
						}

						if (value === null) {
							await page.evaluate(
								async ([imageId, key]) => {
									const image = await window.DB.get('Image', imageId);
									if (!image) {
										throw new Error(`Could not find image with ID ${imageId}`);
									}

									delete image.metadata[key];

									await window.DB.put('Image', image);
								},
								[imageId, key]
							);
							return;
						}

						const newValue =
							typeof value === 'object' && 'value' in value
								? {
										confidence: value.confidence,
										value: JSON.stringify(value.value)
									}
								: { value: JSON.stringify(value) };

						const updated: IDBDatabaseType['Image']['value'] = {
							...original,
							metadata: {
								...original.metadata,
								[key]: {
									alternatives: {},
									confidence: 1,
									...newValue
								}
							}
						};

						await page.evaluate(
							async ([updated]) => {
								await window.DB.put('Image', updated);
							},
							[updated]
						);
					}
				}
			},
			modals: {
				byKey: (key) => modal(page, { key }),
				byTitle: (message) => modal(page, { title: message }),
				confirmDeletion: async (key, type) =>
					confirmDeletionModal(page, { type, modalKey: key })
			},
			toasts: {
				byMessage: (type, message) => toast(page, message, { type: type ?? undefined }),
				byType: (type) => toast(page, null, { type })
			},
			settings: {
				set: async (values) => setSettings({ page }, values),
				get: async <Key extends keyof Settings>(...maybeKey: [] | [Key]) => {
					const settings = await getSettings({ page });
					const key = maybeKey[0];
					return key ? settings[key] : settings;
				},
				open: async (options) => openSettings(page, options)
			},
			tabs: {
				go: async (tab) => goToTab(page, tab),
				get: (tab) => getTab(page, tab),
				hash: (tab) => appNavTabs()[tab].hash
			},
			path: {
				wait: async (route) => waitForRoute(page, route),
				async go(path) {
					const fullPath = (process.env.BASE_PATH || '') + path;
					await page.goto(fullPath);
				}
			},
			tooltips: {
				async expectContent(element, content) {
					return expectTooltipContent(page, element, content);
				},
				async trigger(element) {
					await element.hover({ force: true });
					return tooltipOf(page, element);
				}
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
		},
		{ scope: 'worker', auto: true }
	],
	forEachTest: [
		async ({ page, context, app }, use, { tags, annotations }) => {
			await rm('./tests/results', { recursive: true, force: true });
			await mkdir('./tests/results', { recursive: true });

			if (!tags.includes('@real-protocol')) {
				// @ts-expect-error we don't support non-string protocol source values for now
				await mockProtocolSourceURL(page, context, fullProtocol.source, {
					json: lightProtocol
				});

				await mockProtocolSourceURL(page, context, lightProtocol.source, {
					json: lightProtocol
				});
			}

			await mockPredownloadedModels(page, context, fullProtocol, {
				detection: [arthropodaDetectionModel],
				species: [collembolaClassifierModel, arthropodaClassifierModel]
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
			await app.db.ready();
			await use();
		},
		{ auto: true }
	]
});

export { expect } from '@playwright/test';
export { lightProtocol as exampleProtocol };
