import YAML from 'yaml';
import { Schemas } from './database.js';
import { namespacedMetadataId } from './metadata.js';
import { downloadAsFile } from './download.js';

export const ExportedProtocol = Schemas.ProtocolWithoutMetadata.and({
	metadata: Schemas.Metadata.array()
}).pipe((protocol) => ({
	...protocol,
	metadata: protocol.metadata.map((metadata) => ({
		...metadata,
		id: namespacedMetadataId(protocol.id, metadata.id)
	}))
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
		...protocol,
		metadata: await tables.Metadata.list().then((defs) =>
			defs.filter((def) => protocol?.metadata.includes(def.id))
		)
	};

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
	const { tables } = await import('./idb.svelte.js');

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
					await Promise.all([
						...protocol.metadata.map((m) => tables.Metadata.set(m)),
						tables.Protocol.set({
							...protocol,
							metadata: protocol.metadata.map((m) => m.id)
						})
					]);
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
