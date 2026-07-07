import type { Locator, Page } from '@playwright/test';
import type { FixturePaths } from '$e2e/filepaths.js';
import type { NavigationTab } from '$e2e/utils/navigation.js';
import type { GalleryCardSpecifier } from '$e2e/utils/observations.js';
import type * as DB from '$lib/database.js';
import type { MetadataValue } from '$lib/database.js';
import type { IDBDatabaseType } from '$lib/idb.svelte.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';
import type { Toast } from '$lib/toasts.svelte.js';

import { ms } from 'convert';

import {
	confirmDeletionModal,
	DontWait,
	galleryCard,
	getDatabaseRowByField,
	getDatabaseRowById,
	getSettings,
	getTab,
	goToTab,
	listTable,
	metadataSections,
	modal,
	setSettings,
	toast,
	waitForLoadingEnd,
	waitForRoute,
} from '$e2e/utils/index.js';
import { safeJSONParse } from '$lib/utils';

import lightProtocol from '../../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };

type RemoveNamespace<Key extends `io.github.cigaleapp.arthropods.example.light__${string}`> =
	Key extends `io.github.cigaleapp.arthropods.example.light__${infer Rest}` ? Rest : never;

export type AppFixture = {
	wait: (ms: number | `${number}${'ms' | 's'}`) => Promise<void>;
	metadata: ReturnType<typeof metadataSections>;
	db: {
		ready(): Promise<void>;
		refresh(): Promise<void>;
		list<T extends keyof IDBDatabaseType>(name: T): Promise<IDBDatabaseType[T]['value'][]>;
		get<T extends keyof IDBDatabaseType>(
			name: T,
			key: string
		): Promise<undefined | IDBDatabaseType[T]['value']>;
		count(name: keyof IDBDatabaseType): Promise<number>;
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
			byFilename(
				filename: FixturePaths.Photos | (string & {})
			): Promise<IDBDatabaseType['Image']['value'] | undefined>;
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
			of(args: {
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
			}): Promise<
				Record<
					string,
					Omit<MetadataValue, 'value'> & { rawValue: string; parsedValue: RuntimeValue }
				>
			>;
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
				/** The image/observation's ID  */
				subjectId: string,
				/** The metadata key. If not namespaced, it'll be namespaced to the lightweight protocol's id */
				key: RemoveNamespace<keyof typeof lightProtocol.metadata> | (string & {}),
				/** The new value to set it as. Use null to remove the value  */
				value: null | RuntimeValue | { confidence: number; value?: RuntimeValue }
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
		byMessage(type: Toast<unknown>['type'] | null, message: string | RegExp): Locator;
		byType(type: Toast<unknown>['type']): Locator;
	};
	settings: {
		set(values: Partial<DB.Settings>): Promise<void>;
		get(): Promise<DB.Settings>;
		get<Key extends keyof DB.Settings>(key: Key): Promise<DB.Settings[Key]>;
		open(options?: Parameters<Locator['click']>[0]): Promise<void>;
	};
	tabs: {
		go(tab: NavigationTab, options?: Parameters<typeof goToTab>[2]): Promise<void>;
		get(tab: NavigationTab): Locator;
	};
	path: {
		wait(route: Parameters<typeof waitForRoute>[1]): Promise<void>;
		go(path: import('$app/types').ResolvedPathname): Promise<void>;
	};
	loading: {
		wait(timeout?: number): Promise<void>;
		/** Don't wait for loading text to appear, only wait for it to disappear */
		maybeWait(timeout?: number): Promise<void>;
		waitIn(area: Locator, timeout?: number): Promise<void>;
	};
	sidepanel: Locator;
	gallery: {
		area: Locator;
		/** Get a gallery card in the observations area. Use null to get a locator for all cards */
		card: (specifier: GalleryCardSpecifier | null) => Locator;
		/** Get all cards in the observations area. */
		cards: () => AsyncIterable<Locator>;
		/** Select cards. Clears any previous selection. Use continueSelecting to select without clearing */
		select: (...specifiers: GalleryCardSpecifier[]) => Promise<void>;
		/** Add to selected cards. Previously selected cards remain selected */
		selectMore: (...specifiers: GalleryCardSpecifier[]) => Promise<void>;
	};
};

export async function app({ page }: { page: Page }, use: (fixture: AppFixture) => Promise<void>) {
	await use({
		async wait(duration) {
			await page.waitForTimeout(typeof duration === 'number' ? duration : ms(duration));
		},
		sidepanel: page.getByTestId('sidepanel'),
		metadata: metadataSections(page),
		db: {
			async ready() {
				await page.waitForFunction(() =>
					Boolean(window.devalue && window.DB && window.refreshDB)
				);
			},
			async refresh() {
				await page.evaluate(async () => {
					window.refreshDB();
				});
			},
			async list<T extends keyof IDBDatabaseType>(name: T) {
				return page.evaluate(async (name) => window.DB.getAll(name), name);
			},
			async get<T extends keyof IDBDatabaseType>(name: T, key: string) {
				return getDatabaseRowById(page, name, key);
			},
			async count(name) {
				return page.evaluate(async (name) => window.DB.count(name), name);
			},
			protocol: {
				byId: async (id) => getDatabaseRowById(page, 'Protocol', id),
				byName: async (name) => getDatabaseRowByField(page, 'Protocol', 'name', name),
			},
			observation: {
				list: async () => listTable(page, 'Observation'),
				byId: async (id) => getDatabaseRowById(page, 'Observation', id),
				byLabel: async (label) =>
					getDatabaseRowByField(page, 'Observation', 'label', label),
			},
			image: {
				list: async () => listTable(page, 'Image'),
				byId: async (id) => getDatabaseRowById(page, 'Image', id),
				byFilename: async (fname) =>
					getDatabaseRowByField(page, 'Image', 'filename', fname),
			},
			session: {
				list: async () => listTable(page, 'Session'),
				byId: async (id) => getDatabaseRowById(page, 'Session', id),
				byName: async (name) => getDatabaseRowByField(page, 'Session', 'name', name),
			},
			metadata: {
				get: async (id) => getDatabaseRowById(page, 'Metadata', id),
				async of({
					session,
					image,
					imageId,
					observation: obs,
					protocolId = lightProtocol.id,
				}) {
					let object:
						undefined | IDBDatabaseType['Image' | 'Observation' | 'Session']['value'];

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
						'metadataOverrides' in object ? object.metadataOverrides : object.metadata;

					return Object.fromEntries(
						Object.entries(values)
							.filter(([id]) =>
								protocolId ? id.startsWith(`${protocolId}__`) : true
							)
							.map(([id, { value, ...rest }]) => [
								protocolId ? id.replace(`${protocolId}__`, '') : id,
								{ ...rest, rawValue: value, parsedValue: safeJSONParse(value) },
							])
					);
				},
				async values(params) {
					const vals = await this.of(params);
					return Object.fromEntries(
						Object.entries(vals).map(([key, { parsedValue }]) => [key, parsedValue])
					);
				},
				async set(subjectId, key, value) {
					const original =
						(await getDatabaseRowById(page, 'Image', subjectId)) ??
						(await getDatabaseRowById(page, 'Observation', subjectId));
					if (!original) {
						throw new Error(`Could not find image or observation with ID ${subjectId}`);
					}

					const isObservation = 'metadataOverrides' in original;
					const subjectType = isObservation ? 'Observation' : 'Image';
					const property = isObservation ? 'metadataOverrides' : 'metadata';

					if (!key.includes('__')) {
						key = `${lightProtocol.id}__${key}`;
					}

					if (value === null) {
						await page.evaluate(
							async ([subjectType, subjectId, property, key]) => {
								const subject = await window.DB.get(subjectType, subjectId);
								if (!subject) {
									throw new Error(
										`Could not find ${subjectType} with ID ${subjectId}`
									);
								}

								delete subject[property][key];

								await window.DB.put(subjectType, subject);
							},
							[subjectType, subjectId, property, key]
						);
						return;
					}

					const newValue =
						typeof value === 'object' && 'value' in value
							? {
									confidence: value.confidence,
									value: JSON.stringify(value.value),
								}
							: typeof value === 'object' && 'confidence' in value
								? {
										confidence: value.confidence,
										value: original.metadata[key]?.value,
									}
								: { confidence: 1, value: JSON.stringify(value) };

					const updated: IDBDatabaseType['Image' | 'Observation']['value'] = {
						...original,
						[property]: {
							...original[property],
							[key]: {
								alternatives: [],
								confidences: { [newValue.value]: newValue.confidence },
								...newValue,
							},
						},
					};

					await page.evaluate(
						async ([subjectType, updated]) => {
							await window.DB.put(subjectType, updated);
						},
						[subjectType, updated]
					);
				},
			},
		},
		modals: {
			byKey: (key) => modal(page, { key }),
			byTitle: (message) => modal(page, { title: message }),
			confirmDeletion: async (key, type) =>
				confirmDeletionModal(page, { type, modalKey: key }),
		},
		toasts: {
			byMessage: (type, message) => toast(page, message, { type: type ?? undefined }),
			byType: (type) => toast(page, null, { type }),
		},
		settings: {
			open: async () => page.getByTestId('app-nav').getByLabel('Réglages').click(),
			set: async (values) => setSettings({ page }, values),
			get: async <Key extends keyof DB.Settings>(...maybeKey: [] | [Key]) => {
				const settings = await getSettings({ page });
				const key = maybeKey[0];
				return key ? settings[key] : settings;
			},
		},
		tabs: {
			go: async (tab, options) => goToTab(page, tab, options),
			get: (tab) => getTab(page, tab),
		},
		path: {
			wait: async (route) => waitForRoute(page, route),
			async go(path) {
				const fullPath = (process.env.BASE_PATH || '') + path;
				await page.goto(fullPath);
			},
		},
		loading: {
			wait: async (timeout) => waitForLoadingEnd(page, timeout),
			waitIn: async (area, timeout) => waitForLoadingEnd(area, timeout),
			maybeWait: async (timeout) =>
				waitForLoadingEnd(page, {
					begin: DontWait,
					...(timeout ? { finish: timeout } : {}),
				}),
		},
		gallery: {
			area: page.getByTestId('observations-area'),
			card: (specifier) => galleryCard(page, specifier),
			async *cards() {
				const cardsCount = await galleryCard(page, null).count();

				for (let i = 0; i < cardsCount; i++) {
					yield galleryCard(page, '#' + i);
				}
			},
			async selectMore(...specifiers) {
				await page.keyboard.down('ControlOrMeta');
				for (const specifier of specifiers) {
					await this.card(specifier).click();
				}
				await page.keyboard.up('ControlOrMeta');
			},
			async select(...specifiers) {
				const [first, ...rest] = specifiers;
				await this.card(first).click();
				await this.selectMore(...rest);
			},
		},
	});
}
