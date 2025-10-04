import { type } from 'arktype';
import { downloadAsFile, stringifyWithToplevelOrdering } from './download.js';
import { namespacedMetadataId } from './schemas/metadata.js';
import { cachebust } from './utils.js';
import { promptForFiles } from './files.js';
import { errorMessage } from './i18n.js';

/**
 * @import { Schemas } from './database.js';
 */

/**
 *
 * @param {string} base base path of the app - import `base` from `$app/paths`
 */
export function jsonSchemaURL(base) {
	return `${window.location.origin}${base}/protocol.schema.json`;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('jsonSchemaURL', () => {
		// Mock window.location.origin
		const originalLocation = window.location;
		Object.defineProperty(window, 'location', {
			value: { origin: 'https://example.com' },
			writable: true
		});

		expect(jsonSchemaURL('')).toBe('https://example.com/protocol.schema.json');
		expect(jsonSchemaURL('/app')).toBe('https://example.com/app/protocol.schema.json');
		expect(jsonSchemaURL('/some/path')).toBe('https://example.com/some/path/protocol.schema.json');

		// Restore original location
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true
		});
	});
}

/**
 * Exports a protocol by ID into a JSON file, and triggers a download of that file.
 * @param {string} base base path of the app - import `base` from `$app/paths`
 * @param {import("./database").ID} id
 * @param {'json' | 'yaml'} [format='json']
 */
export async function exportProtocol(base, id, format = 'json') {
	// Importing is done here so that ./generate-json-schemas can be invoked with bun run (otherwise we get a '$state not defined' error)
	const { tables, ...idb } = await import('./idb.svelte.js');

	const protocol = await tables.Protocol.raw.get(id);
	if (!protocol) throw new Error(`Protocole ${id} introuvable`);

	const allMetadataOptions = await idb.list('MetadataOption');

	downloadProtocol(base, format, {
		...protocol,
		metadata: Object.fromEntries(
			await tables.Metadata.list().then((defs) =>
				defs
					.filter((def) => protocol?.metadata.includes(def.id))
					.map(({ id, ...def }) => [
						id,
						{
							...def,
							options: allMetadataOptions
								.filter((opt) => opt.id.startsWith(namespacedMetadataId(protocol.id, id) + ':'))
								.map(({ id: _, ...opt }) => opt)
						}
					])
			)
		)
	});
}

/**
 *
 * @param {string} base base path of the app - import `base` from `$app/paths`
 * @param {'json' | 'yaml'} format
 */
export async function downloadProtocolTemplate(base, format) {
	downloadProtocol(base, format, {
		id: 'mon-protocole',
		name: 'Mon protocole',
		learnMore: 'https://github.com/moi/mon-protocole',
		authors: [{ name: 'Prénom Nom', email: 'prenom.nom@example.com' }],
		description: 'Description de mon protocole',
		metadata: {
			'une-metadonnee': {
				label: 'Une métadonnée',
				description: 'Description de la métadonnée',
				learnMore: 'https://example.com',
				type: 'float',
				required: false,
				mergeMethod: 'average'
			}
		}
	});
}

/**
 * Downloads a protocol as a JSON file
 * @param {string} base base path of the app - import `base` from `$app/paths`
 * @param {'yaml'|'json'} format
 * @param {typeof import('./schemas/protocols.js').ExportedProtocol.infer} exportedProtocol
 */
function downloadProtocol(base, format, exportedProtocol) {
	let jsoned = stringifyWithToplevelOrdering(format, jsonSchemaURL(base), exportedProtocol, [
		'id',
		'name',
		'source',
		'authors',
		'exports',
		'metadata',
		'inference'
	]);

	// application/yaml is finally a thing, see https://www.rfc-editor.org/rfc/rfc9512.html
	downloadAsFile(jsoned, `${exportedProtocol.id}.${format}`, `application/${format}`);
}

/**
 * Imports protocol(s) from JSON file(s).
 * Asks the user to select files, then imports the protocols from those files.
 * @template {{id: string, name: string, version: number|undefined}} Out
 * @template {boolean|undefined} Multiple
 * @param {object} param0
 * @param {Multiple} param0.allowMultiple allow the user to select multiple files
 * @param {() => void} [param0.onInput] callback to call when the user selected files
 * @param {((input: {contents: string, isJSON: boolean}) => Promise<{id: string, name: string, version: number|undefined}>)} param0.importProtocol
 * @returns {Promise<Multiple extends true ? NoInfer<Out>[] : NoInfer<Out>>}
 */
export async function promptAndImportProtocol({
	allowMultiple,
	onInput = () => {},
	importProtocol
}) {
	const files = await promptForFiles({
		multiple: allowMultiple,
		accept: '.json,.yaml,application/json'
	});

	onInput();

	/** @type {Array<{id: string, name: string, version: number | undefined}>}  */
	const output = await Promise.all(
		[...files].map(async (file) => {
			console.time(`Reading file ${file.name}`);
			const reader = new FileReader();
			return new Promise((resolve) => {
				reader.onload = async () => {
					if (!reader.result) throw new Error('Fichier vide');
					if (reader.result instanceof ArrayBuffer) throw new Error('Fichier binaire');

					console.timeEnd(`Reading file ${file.name}`);
					const result = await importProtocol({
						contents: reader.result,
						isJSON: file.name.endsWith('.json')
					}).catch((err) => Promise.reject(new Error(errorMessage(err))));

					const { tables } = await import('./idb.svelte.js');
					await tables.Protocol.refresh();
					await tables.Metadata.refresh();

					resolve(result);
				};
				reader.readAsText(file);
			});
		})
	);

	return allowMultiple ? output : output[0];
}

/**
 *
 * @param {Pick<typeof Schemas.Protocol.infer, 'version'|'source'|'id'>} protocol
 * @returns {Promise< { upToDate: boolean; newVersion: number }>}
 */
export async function hasUpgradeAvailable({ version, source, id }) {
	if (!source) throw new Error("Le protocole n'a pas de source");
	if (!version) throw new Error("Le protocole n'a pas de version");
	if (!id) throw new Error("Le protocole n'a pas d'identifiant");

	const response = await fetch(
		cachebust(typeof source === 'string' ? source : source.url),
		typeof source !== 'string'
			? source
			: {
					headers: {
						Accept: 'application/json'
					}
				}
	)
		.then((r) => r.json())
		.then(
			type({
				'version?': 'number',
				id: 'string'
			}).assert
		);

	if (!response.version) throw new Error("Le protocole n'a plus de version");
	if (response.id !== id) throw new Error("Le protocole a changé d'identifiant");
	if (response.version > version) {
		return {
			upToDate: false,
			newVersion: response.version
		};
	}

	return {
		upToDate: true,
		newVersion: response.version
	};
}

if (import.meta.vitest) {
	const { vi, describe, test, expect } = import.meta.vitest;
	describe('hasUpgradeAvailable', () => {
		test('should return upToDate: false if the version is lower', async () => {
			const fetch = vi.fn(async () => ({
				json: async () => ({
					version: 2,
					id: 'mon-protocole'
				})
			}));

			vi.stubGlobal('fetch', fetch);

			const result = await hasUpgradeAvailable({
				version: 1,
				source: 'https://example.com/protocol.json',
				id: 'mon-protocole'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('https://example.com/protocol.json?v='),
				{
					headers: {
						Accept: 'application/json'
					}
				}
			);
			expect(result).toEqual({ upToDate: false, newVersion: 2 });
		});

		test('should return upToDate: true if the version is the same', async () => {
			const fetch = vi.fn(async () => ({
				json: async () => ({
					version: 1,
					id: 'mon-protocole'
				})
			}));

			vi.stubGlobal('fetch', fetch);

			const result = await hasUpgradeAvailable({
				version: 1,
				source: 'https://example.com/protocol.json',
				id: 'mon-protocole'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('https://example.com/protocol.json?v='),
				{
					headers: {
						Accept: 'application/json'
					}
				}
			);
			expect(result).toEqual({ upToDate: true, newVersion: 1 });
		});

		test('should throw an error if the protocol ID is different', async () => {
			const fetch = vi.fn(async () => ({
				json: async () => ({
					version: 2,
					id: 'autre-protocole'
				})
			}));

			vi.stubGlobal('fetch', fetch);

			await expect(
				hasUpgradeAvailable({
					version: 1,
					source: 'https://example.com/protocol.json',
					id: 'mon-protocole'
				})
			).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole a changé d'identifiant]`);
		});

		test('should throw an error if the remote protocol has no version', async () => {
			const fetch = vi.fn(async () => ({
				json: async () => ({
					id: 'mon-protocole'
				})
			}));

			vi.stubGlobal('fetch', fetch);

			await expect(
				hasUpgradeAvailable({
					version: 1,
					source: 'https://example.com/protocol.json',
					id: 'mon-protocole'
				})
			).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a plus de version]`);
		});

		test('should throw an error if the protocol has no source', async () => {
			await expect(
				// @ts-expect-error
				hasUpgradeAvailable({
					version: 1,
					source: undefined,
					id: 'mon-protocole'
				})
			).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a pas de source]`);
		});

		test('should throw an error if the local protocol has no version', async () => {
			await expect(
				// @ts-expect-error
				hasUpgradeAvailable({
					version: undefined,
					source: 'https://example.com/protocol.json',
					id: 'mon-protocole'
				})
			).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a pas de version]`);
		});

		test('should throw an error if the protocol has no ID', async () => {
			await expect(
				// @ts-expect-error
				hasUpgradeAvailable({
					version: 1,
					source: 'https://example.com/protocol.json'
				})
			).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a pas d'identifiant]`);
		});
	});
}

/**
 * @param {object} param0
 * @param {number} [param0.version]
 * @param {import('$lib/database.js').HTTPRequest} param0.source
 * @param {string} param0.id
 * @param {import('swarpc').SwarpcClient<typeof import('../web-worker-procedures.js').PROCEDURES>} param0.swarpc
 */
export async function upgradeProtocol({ version, source, id, swarpc }) {
	if (!source) throw new Error("Le protocole n'a pas de source");
	if (!version) throw new Error("Le protocole n'a pas de version");
	if (!id) throw new Error("Le protocole n'a pas d'identifiant");
	if (typeof source !== 'string')
		throw new Error('Les requêtes HTTP ne sont pas encore supportées, utilisez une URL');

	const { tables } = await import('./idb.svelte.js');

	const contents = await fetch(cachebust(source), {
		headers: {
			Accept: 'application/json'
		}
	}).then((r) => r.text());

	const result = await swarpc.importProtocol({ contents });
	tables.Protocol.refresh();
	tables.Metadata.refresh();

	const { version: newVersion, ...rest } = result;

	if (newVersion === undefined)
		throw new Error("Le protocole a été importé mais n'a plus de version");

	return { version: newVersion, ...rest };
}