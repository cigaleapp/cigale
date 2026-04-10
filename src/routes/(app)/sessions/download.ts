import type { Account } from '$lib/accounts/types.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

import { set, tables } from '$lib/idb.svelte.js';

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
	const { id } = await tables.Session.add({
		account: account.id,
		...ses,
	});

	let i = 0;
	mutator({
		loading: `Fichiers (${i}/${session.filesCount})…`,
	});

	for await (const file of account.files(protocol, session.id)) {
		i++;

		mutator({
			loading: `Fichiers (${i}/${session.filesCount})…`,
		});
		await set('MetadataValueFile', {
			sessionId: id,
			...file,
		});
	}

	mutator({ loading: 'Ouverture…' });

	return id;
}
