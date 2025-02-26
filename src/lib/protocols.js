import { Schemas } from './database.js';
import { tables } from './idb.js';

export const ExportedProtocol = Schemas.ProtocolWithoutMetadata.and({
	metadata: Schemas.Metadata.array()
}).pipe((protocol) => ({
	...protocol,
	metadata: protocol.metadata.map((metadata) => ({
		...metadata,
		id: `${protocol.id}__${metadata.id}`
	}))
}));

/**
 * Exports a protocol by ID into a JSON file, and triggers a download of that file.
 * @param {string} base base path of the app - import `base` from `$app/paths`
 * @param {import("./database").ID} id
 */
export async function exportProtocol(base, id) {
	let protocol = await tables.Protocol.get(id);
	if (!protocol) throw new Error(`Protocole ${id} introuvable`);

	protocol = {
		$schema: `${window.location.origin}${base}/protocol.schema.json`,
		...protocol,
		// @ts-ignore
		metadata: await Promise.all(protocol.metadata.map((id) => tables.Metadata.get(id))).then((m) =>
			m.filter((m) => m)
		)
	};

	const blob = new Blob([JSON.stringify(protocol, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${id}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Imports a protocol from a JSON file.
 * Asks the user to select a file, then imports the protocol from that file.
 * @returns {Promise<typeof ExportedProtocol.infer>}
 */
export async function importProtocol() {
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
					const protocol = ExportedProtocol.assert(JSON.parse(reader.result));
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
