import YAML from 'yaml';
import { BUILTIN_METADATA_IDS, Schemas } from './database.js';
import { downloadAsFile } from './download.js';

/**
 * Ensures a metadata ID is namespaced to the given protocol ID
 * If the ID is already namespaced, the existing namespace is re-namespaced to the given protocol ID.
 * Built-in Metadata IDs are never namespaced.
 * @param {string} protocolId
 * @param {string} metadataId
 */
export function namespacedMetadataId(protocolId, metadataId) {
	if (metadataId in BUILTIN_METADATA_IDS) return metadataId;
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

export const ExportedProtocol = Schemas.ProtocolWithoutMetadata.and({
	metadata: {
		'[string]': Schemas.MetadataWithoutID
	}
}).pipe((protocol) => ({
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
 */
export async function exportProtocol(base, id) {
	// Importing is done here so that ./generate-json-schemas can be invoked with node (otherwise we get a '$state not defined' error)
	const { tables } = await import('./idb.svelte.js');

	const protocol = await tables.Protocol.get(id);
	if (!protocol) throw new Error(`Protocole ${id} introuvable`);

	const exportedProtocol = {
		$schema: `${window.location.origin}${base}/protocol.schema.json`,
		...protocol
	};
	await tables.Metadata.list()
		.then((defs) => defs.filter((def) => protocol?.metadata.includes(def.id)))
		.then((defs) => Object.fromEntries(defs.map(({ id, ...def }) => [id, def])));

	const jsoned = jsonWithToplevelOrdering(exportedProtocol, [
		'$schema',
		'id',
		'name',
		'source',
		'authors',
		'metadata'
	]);
	downloadAsFile(jsoned, `${protocol.id}.json`, 'application/json');
}

/**
 * Imports a protocol from a JSON file.
 * Asks the user to select a file, then imports the protocol from that file.
 * @returns {Promise<typeof ExportedProtocol.infer>}
 */
export async function importProtocol() {
	// Imported here so that importing protocols.js from the JSON schema generator doesn't fail
	// (Node does not like .svelte.js files' runes)
	const { openTransaction } = await import('./idb.svelte.js');

	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			if (!input.files || !input.files[0]) return;
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = async () => {
				try {
					if (!reader.result) throw new Error('Fichier vide');
					if (reader.result instanceof ArrayBuffer) throw new Error('Fichier binaire');
					const protocol = ExportedProtocol.assert(YAML.parse(reader.result));
					await openTransaction(['Protocol', 'Metadata'], {}, (tx) => {
						tx.objectStore('Protocol').put({
							...protocol,
							metadata: Object.keys(protocol.metadata)
						});
						Object.entries(protocol.metadata).map(([id, metadata]) =>
							tx.objectStore('Metadata').put({ id, ...metadata })
						);
					});
					resolve(protocol);
				} catch (error) {
					reject(error);
				}
			};
			reader.readAsText(file);
		};
		input.click();
	});
}

/**
 *
 * @template {string} Keys
 * @param {Record<Keys, unknown>} object the object to serialize
 * @param {readonly Keys[]} keysOrder an array of keys in target order, for the top-level object
 * @returns
 */
function jsonWithToplevelOrdering(object, keysOrder) {
	return JSON.stringify(
		object,
		(_, value) => {
			if (value === null) return value;
			if (Array.isArray(value)) return value;
			if (typeof value !== 'object') return value;

			// @ts-expect-error
			if (Object.keys(value).every((key) => keysOrder.includes(key))) {
				return Object.fromEntries(keysOrder.map((key) => [key, value[key]]));
			}
			return value;
		},
		2
	);
}
