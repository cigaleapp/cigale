import YAML from 'yaml';
import { BUILTIN_METADATA_IDS, Schemas } from './database.js';
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
 * @param {'json' | 'yaml'} [format='json']
 */
export async function exportProtocol(base, id, format = 'json') {
	// Importing is done here so that ./generate-json-schemas can be invoked with node (otherwise we get a '$state not defined' error)
	const { tables } = await import('./idb.svelte.js');

	const protocol = await tables.Protocol.get(id);
	if (!protocol) throw new Error(`Protocole ${id} introuvable`);

	downloadProtocol(base, format, {
		...protocol,
		metadata: await tables.Metadata.list()
			.then((defs) => defs.filter((def) => protocol?.metadata.includes(def.id)))
			.then((defs) => Object.fromEntries(defs.map(({ id, ...def }) => [id, def])))
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
		'metadata'
	]);

	// application/yaml is finally a thing, see https://www.rfc-editor.org/rfc/rfc9512.html
	downloadAsFile(jsoned, `${exportedProtocol.id}.${format}`, `application/${format}`);
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
		input.accept = ['.json', '.yaml', 'application/json'].join(',');
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
