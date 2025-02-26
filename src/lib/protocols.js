import { tables } from './idb';
import { toasts } from './toasts.svelte';

/**
 * Exports a protocol by ID into a JSON file, and triggers a download of that file.
 * @param {import("./database").ID} id
 */
export async function exportProtocol(id) {
	let protocol = await tables.Protocol.get(id);
	if (!protocol) throw new Error(`Protocole ${id} introuvable`);
	protocol = {
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
	a.download = `${protocol.id}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Imports a protocol from a JSON file.
 * Asks the user to select a file, then imports the protocol from that file.
 */
export async function importProtocol() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.onchange = async () => {
		if (!input.files || !input.files[0]) return;
		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = async () => {
			const protocol = JSON.parse(reader.result);
			try {
				await Promise.all([
					...protocol.metadata.map((m) => tables.Metadata.set(m)),
					tables.Protocol.set({
						...protocol,
						metadata: protocol.metadata.map((m) => m.id)
					})
				]);
				toasts.success(
					`Protocole ${protocol.name} (dont ${protocol.metadata.length} métadonnées) importé`
				);
			} catch (e) {
				toasts.error(e.toString());
			}
		};
		reader.readAsText(file);
	};
	input.click();
}
