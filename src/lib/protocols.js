import { type } from 'arktype';
import YAML from 'yaml';
import { Schemas } from './database.js';
import { downloadAsFile, stringifyWithToplevelOrdering } from './download.js';
import { cachebust, omit } from './utils.js';
import { metadataOptionId } from './schemas/metadata.js';

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
 * @template {string} ProtocolID
 * @param {ProtocolID} protocolId
 * @param {string} metadataId
 * @returns {`${ProtocolID}__${string}`}
 */
export function namespacedMetadataId(protocolId, metadataId) {
	metadataId = metadataId.replace(/^.+__/, '');
	return `${protocolId}__${metadataId}`;
}

/**
 * Ensures a metadata ID is namespaced to the given protocol ID. If the metadata ID is not namespaced, it will be prefixed with the protocol ID. If it already is namespaced, it will stay as is.
 * @param {string} metadataId the metadata ID to ensure is namespaced
 * @param {string} fallbackProtocolId the protocol ID to use if the metadata ID is not namespaced
 */
export function ensureNamespacedMetadataId(metadataId, fallbackProtocolId) {
	if (isNamespacedToProtocol(fallbackProtocolId, metadataId)) return metadataId;
	return namespacedMetadataId(fallbackProtocolId, metadataId);
}

/**
 * Checks if a given metadata ID is namespaced to a given protocol ID
 * @template {string} ProtocolID
 * @param {ProtocolID} protocolId
 * @param {string} metadataId
 * @returns {metadataId is `${ProtocolID}__${string}` }
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

/**
 *
 * @param {string} metadataId
 * @returns
 */
export function namespaceOfMetadataId(metadataId) {
	const parts = metadataId.split('__');
	if (parts.length < 2) return undefined;
	return parts.slice(0, -1).join('__');
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
 * @template {{id: string, name: string, version?: number}} Out
 * @template {boolean|undefined} Multiple
 * @param {object} param0
 * @param {Multiple} [param0.allowMultiple] allow the user to select multiple files
 * @param {() => void} [param0.onInput] callback to call when the user selected files
 * @param {((input: {contents: string, isJSON: boolean}) => Promise<{id: string, name: string, version: number|undefined}>)} param0.importProtocol
 * @returns {Promise<Multiple extends true ? NoInfer<Out>[] : NoInfer<Out>>}
 */
export async function promptAndImportProtocol({
	allowMultiple,
	onInput = () => {},
	importProtocol
}) {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = allowMultiple ?? false;
		input.accept = ['.json', '.yaml', 'application/json'].join(',');
		input.onchange = async () => {
			if (!input.files || !input.files[0]) return;
			onInput();
			/** @type {Array<{id: string, name: string, version?: number}>}  */
			const output = await Promise.all(
				[...input.files].map(async (file) => {
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
							}).catch((err) =>
								reject(
									new Error(
										`Protocole invalide: ${err?.toString()?.replace(/^Traversal Error: /, '') ?? 'Erreur inattendue'}`
									)
								)
							);
							const { tables } = await import('./idb.svelte.js');
							await tables.Protocol.refresh();
							await tables.Metadata.refresh();
							resolve(result);
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

export const ProtocolImportPhase = type.enumerated(
	'parsing',
	'filtering-builtin-metadata',
	'input-validation',
	'write-protocol',
	'write-metadata',
	'write-metadata-options',
	'output-validation'
);

/**
 *
 * @param {string} contents
 * @param {Object} [options]
 * @param {boolean} [options.json=false] parse as JSON instead of YAML, useful for performance if you're sure the contents represents JSON and not just YAML
 * @param {(state: typeof ProtocolImportPhase.infer, detail?: string) => void} [options.onLoadingState] callback to call when the protocol is being parsed, useful for showing a loading message
 * @param {typeof import('./idb.svelte.js').openTransaction} [options.openTransaction] function to use to open a transaction, defaults to the one from the IDB module
 */
export async function importProtocol(
	contents,
	{ json = false, onLoadingState, openTransaction } = {}
) {
	// Use the provided openTransaction or import the default one
	openTransaction ??= (await import('./idb.svelte.js')).openTransaction;

	onLoadingState?.('parsing');
	console.time('Parsing protocol');
	let parsed = json ? JSON.parse(contents) : YAML.parse(contents);
	console.timeEnd('Parsing protocol');

	console.info(`Importing protocol ${parsed.id}`);
	console.info(parsed);
	onLoadingState?.('filtering-builtin-metadata');

	const builtinMetadata = Object.entries(parsed.metadata ?? {})
		.filter(([, value]) => value === 'builtin')
		.map(([id]) => id);

	parsed.metadata = Object.fromEntries(
		Object.entries(parsed.metadata ?? {}).filter(([, value]) => value !== 'builtin')
	);

	onLoadingState?.('input-validation');
	console.time('Validating protocol');
	const protocol = ExportedProtocol.in.assert(parsed);
	console.timeEnd('Validating protocol');

	await openTransaction(['Protocol', 'Metadata', 'MetadataOption'], {}, (tx) => {
		onLoadingState?.('write-protocol');
		console.time('Storing Protocol');
		tx.objectStore('Protocol').put({
			...protocol,
			metadata: [...Object.keys(protocol.metadata), ...builtinMetadata]
		});
		console.timeEnd('Storing Protocol');

		for (const [id, metadata] of Object.entries(protocol.metadata)) {
			if (typeof metadata === 'string') continue;

			onLoadingState?.('write-metadata', metadata.label || id);
			console.time(`Storing Metadata ${id}`);
			tx.objectStore('Metadata').put({ id, ...omit(metadata, 'options') });
			console.timeEnd(`Storing Metadata ${id}`);

			console.time(`Storing Metadata Options for ${id}`);
			const total = metadata.options?.length ?? 0;
			let done = 0;
			for (const option of metadata.options ?? []) {
				done++;
				if (done % 1000 === 0) {
					onLoadingState?.(
						'write-metadata-options',
						`${metadata.label || id} > ${option.label || option.key} (${done}/${total})`
					);
				}
				tx.objectStore('MetadataOption').put({
					id: metadataOptionId(namespacedMetadataId(protocol.id, id), option.key),
					metadataId: namespacedMetadataId(protocol.id, id),
					...option
				});
			}
			console.timeEnd(`Storing Metadata Options for ${id}`);
		}
	});

	onLoadingState?.('output-validation');
	console.time('Validating protocol after storing');
	const validated = ExportedProtocol.assert(protocol);
	console.timeEnd('Validating protocol after storing');

	return validated;
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
