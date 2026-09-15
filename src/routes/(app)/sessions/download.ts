import type { Account } from '$lib/accounts/types.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

import { errorMessage } from '$lib/i18n.js';
import { openTransaction, set, tables } from '$lib/idb.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';

export async function downloadRemoteSession({
	session,
	account,
	mutator,
}: {
	session: { id: SessionRemoteID; filesCount: number; protocol: string };
	account: Account;
	mutator: import('$lib/Card.svelte').Mutator;
}) {
	if (!account.id) return;

	const protocol = await tables.Protocol.get(session.protocol);
	if (!protocol) return;

	const ses = await account.session(protocol, session.id);

	mutator({ loading: 'Sauvegarde…' });
	const dbsession = await tables.Session.add({
		account: account.id,
		...ses,
	});

	try {
		let i = 0;
		mutator({
			loading: `Fichiers (${i}/${session.filesCount})…`,
		});

		for await (const file of account.files(protocol, dbsession)) {
			i++;

			mutator({
				loading: `Fichiers (${i}/${session.filesCount})…`,
			});
			await set('MetadataValueFile', {
				sessionId: dbsession.id,
				...file,
			});
		}

		mutator({ loading: 'Images…' });

		const { files, observations, images } = await account.items(
			protocol,
			dbsession,
			(message) => mutator({ loading: message })
		);

		console.debug(`Storing items`, { files, observations, images });

		await openTransaction(
			['ImageFile', 'ImagePreviewFile', 'Observation', 'Image'],
			{ mode: 'readwrite' },
			(tx) => {
				for (const file of files) tx.objectStore('ImageFile').put(file);
				for (const obs of observations) tx.objectStore('Observation').put(obs);
				for (const img of images) tx.objectStore('Image').put(img);
			}
		);
	} catch (error) {
		console.error(error);
		toasts.error(errorMessage(error, 'Impossible de télécharger la session'));
		await tables.Session.remove(dbsession.id);
	}

	mutator({ loading: 'Ouverture…' });

	return dbsession.id;
}
