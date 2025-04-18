import YAML from 'yaml';
import { Schemas } from './database.js';
import { downloadAsFile, stringifyWithToplevelOrdering } from './download.js';

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

export function removeNamespaceFromMetadataId(metadataId) {
	return metadataId.replace(/^.+__/, '');
}

export const ExportedProtocol = Schemas.ProtocolWithoutMetadata.in
	.and({
		metadata: {
			'[string]': Schemas.MetadataWithoutID.describe('Métadonnée du protocole')
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
		source: 'https://github.com/moi/mon-protocole',
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
