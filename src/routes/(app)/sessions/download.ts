import type { Account } from '$lib/accounts/types.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

import { formatBytesSize } from '$lib/i18n.js';
import { tables } from '$lib/idb.svelte.js';

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
				let withUnit = (x: number) => x.toString();

				if ('unit' in event && event.unit === 'bytes') {
					withUnit = (x: number) => formatBytesSize(x);
				}

				mutator({
					loading: event.total
						? `${event.action} (${event.done}/${withUnit(event.total)})`
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

	return sessionId;
}
