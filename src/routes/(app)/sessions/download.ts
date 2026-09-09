import type { Account } from '$lib/accounts/types.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

import { isSessionDependentReactiveTable, Tables } from '$lib/database.js';
import { tables } from '$lib/idb.svelte.js';
import { keys } from '$lib/utils.js';

export async function downloadRemoteSession({
	session: remoteSession,
	account,
	mutator,
}: {
	session: { id: SessionRemoteID; filesCount: number; protocol: string };
	account: Account;
	mutator: import('$lib/Card.svelte').Mutator;
}) {
	if (!account.id) return;

	const protocol = await tables.Protocol.get(remoteSession.protocol);
	if (!protocol) return;

	let sessionId: string | undefined = undefined;
	for await (const event of account.download(protocol, remoteSession.id)) {
		switch (event.message) {
			case 'session-id': {
				sessionId = event.databaseId;
				break;
			}
			case 'progress': {
				mutator({
					loading: event.total
						? `${event.action} (${event.done}/${event.total})`
						: `${event.action}…`,
				});
				break;
			}
		}
	}

	if (!sessionId) {
		throw new Error(`Impossible de télécharger la session (session-id was never set)`);
	}

	mutator({
		loading: 'Chargement…',
	});

	await tables.Session.refresh(sessionId);
	for (const table of keys(Tables)) {
		if (!isSessionDependentReactiveTable(table)) continue;
		await tables[table].refresh(sessionId, { sessionOnly: true });
	}

	return sessionId;
}
