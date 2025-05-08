import { type } from 'arktype';
import YAML from 'yaml';
import { Schemas } from './database.js';
import { downloadAsFile, stringifyWithToplevelOrdering } from './download.js';
import { cachebust } from './utils.js';

/**
 *
 * @param {string} base base path of the app - import `base` from `$app/paths`
 */
export function jsonSchemaURL(base) {
	return `${window.location.origin}${base}/protocol.schema.json`;
}

/**
 * Ensures a metadata ID is namespaced to the given protocol ID
 * If the ID is already namespaced, the existing namespace is re-namespaced to the given protocol ID.
 * @param {string} protocolId
 * @param {string} metadataId
 */
export function namespacedMetadataId(protocolId, metadataId) {
	metadataId = metadataId.replace(/^.+__/, '');
	return `${protocolId}__${metadataId}`;
}

/**
 * Checks if a given metadata ID is namespaced to a given protocol ID
 * @param {string} protocolId
 * @param {string} metadataId
 */
export function isNamespacedToProtocol(protocolId, metadataId) {
	return metadataId.startsWith(`${protocolId}__`);
}

/**
 *
 * @param {string} metadataId
 * @returns {string}
 */
export function removeNamespaceFromMetadataId(metadataId) {
	return metadataId.replace(/^.+__/, '');
}

export const ExportedProtocol = Schemas.Protocol.omit('metadata')
	.in.and({
		metadata: {
			'[string]': Schemas.Metadata.omit('id').describe('Métadonnée du protocole')
		}
	})
	.pipe((protocol) => ({
		...protocol,
		metadata: Object.fromEntries(
			Object.entries(protocol.metadata).map(([id, metadata]) => [
				namespacedMetadataId(protocol.id, id),
				metadata
			])
		)
	}));

/**
 * Exports a protocol by ID into a JSON file, and triggers a download of that file.
 * @param {string} base base path of the app - import `base` from `$app/paths`
 * @param {import("./database").ID} id
 * @param {'json' | 'yaml'} [format='json']
 */
export async function exportProtocol(base, id, format = 'json') {
	// Importing is done here so that ./generate-json-schemas can be invoked with node (otherwise we get a '$state not defined' error)
	const { tables } = await import('./idb.svelte.js');

	const protocol = await tables.Protocol.raw.get(id);
	if (!protocol) throw new Error(`Protocole ${id} introuvable`);

	downloadProtocol(base, format, {
		...protocol,
		metadata: Object.fromEntries(
			await tables.Metadata.list().then((defs) =>
				defs.filter((def) => protocol?.metadata.includes(def.id)).map(({ id, ...def }) => [id, def])
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
 * @param {typeof ExportedProtocol.infer} exportedProtocol
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
 * @template {boolean|undefined} Multiple
 * @param {object} param0
 * @param {Multiple} [param0.allowMultiple=true] allow the user to select multiple files
 * @returns {Promise<Multiple extends true ? Array<typeof ExportedProtocol.infer> : typeof ExportedProtocol.infer>}
 */
export async function promptAndImportProtocol({ allowMultiple } = {}) {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = allowMultiple ?? false;
		input.accept = ['.json', '.yaml', 'application/json'].join(',');
		input.onchange = async () => {
			if (!input.files || !input.files[0]) return;
			/** @type {Array<typeof ExportedProtocol.infer>}  */
			const output = await Promise.all(
				[...input.files].map(async (file) => {
					const reader = new FileReader();
					return new Promise((resolve) => {
						reader.onload = async () => {
							if (!reader.result) throw new Error('Fichier vide');
							if (reader.result instanceof ArrayBuffer) throw new Error('Fichier binaire');
							importProtocol(reader.result)
								.then(resolve)
								.catch((err) =>
									reject(
										new Error(
											`Protocole invalide: ${err?.toString()?.replace(/^Traversal Error: /, '') ?? 'Erreur inattendue'}`
										)
									)
								);
						};
						reader.readAsText(file);
					});
				})
			);
			if (allowMultiple) resolve(output);
			else resolve(output[0]);
		};
		input.click();
	});
}

/**
 *
 * @param {string} contents
 */
export async function importProtocol(contents) {
	// Imported here so that importing protocols.js from the JSON schema generator doesn't fail
	// (Node does not like .svelte.js files' runes)
	const { openTransaction } = await import('./idb.svelte.js');
	let parsed = YAML.parse(contents);

	console.info(`Importing protocol ${parsed.id}`);
	console.info(parsed);

	const builtinMetadata = Object.entries(parsed.metadata ?? {})
		.filter(([, value]) => value === 'builtin')
		.map(([id]) => id);

	parsed.metadata = Object.fromEntries(
		Object.entries(parsed.metadata ?? {}).filter(([, value]) => value !== 'builtin')
	);

	const protocol = ExportedProtocol.in.assert(parsed);

	await openTransaction(['Protocol', 'Metadata'], {}, (tx) => {
		tx.objectStore('Protocol').put({
			...protocol,
			metadata: [...Object.keys(protocol.metadata), ...builtinMetadata]
		});
		Object.entries(protocol.metadata).map(
			([id, metadata]) =>
				typeof metadata === 'string' || tx.objectStore('Metadata').put({ id, ...metadata })
		);
	});
	return ExportedProtocol.assert(protocol);
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
	if (typeof source !== 'string')
		throw new Error('Les requêtes HTTP ne sont pas encore supportées, utilisez une URL');

	const response = await fetch(cachebust(source), {
		headers: {
			Accept: 'application/json'
		}
	})
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
 *
 * @param {Pick<typeof Schemas.Protocol.infer, 'version'|'source'|'id'>} protocol
 */
export async function upgradeProtocol({ version, source, id }) {
	if (!source) throw new Error("Le protocole n'a pas de source");
	if (!version) throw new Error("Le protocole n'a pas de version");
	if (!id) throw new Error("Le protocole n'a pas d'identifiant");
	if (typeof source !== 'string')
		throw new Error('Les requêtes HTTP ne sont pas encore supportées, utilisez une URL');

	const response = await fetch(cachebust(source), {
		headers: {
			Accept: 'application/json'
		}
	}).then((r) => r.text());

	return importProtocol(response);
}
