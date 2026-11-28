import type { DatabaseHandle } from '#lib/idb.svelte.js';

import { metadataOptionsKeyRange } from '#lib/metadata/storage.ts';
import { namespacedMetadataId } from '#lib/schemas/metadata.js';
import { getSetting, setSetting } from '#lib/settings.svelte.js';
import { prefixIDBKeyRange } from '#lib/utils.ts';

import { dependentProtocols } from './dependencies.ts';

export async function uninstallProtocol(db: DatabaseHandle, id: string) {
	const dependants = await dependentProtocols(db, id);

	const tx = db.transaction(['Protocol', 'Metadata', 'MetadataOption'], 'readwrite');

	tx.objectStore('Protocol').delete(id);
	tx.objectStore('Metadata').delete(prefixIDBKeyRange(namespacedMetadataId(id, '')));
	tx.objectStore('MetadataOption').delete(metadataOptionsKeyRange(id, null));

	for (const id of dependants) {
		await uninstallProtocol(db, id);
	}

	const autoUpdates = await getSetting('autoUpdateProtocols');
	delete autoUpdates[id];
	await setSetting('autoUpdateProtocols', autoUpdates);
}
