import { redirect } from '@sveltejs/kit';

import { openDatabase } from '$lib/idb.svelte.js';
import { resolveDefaults } from '$lib/metadata/defaults.js';
import { uiState } from '$lib/state.svelte.js';

export async function load({ parent }) {
	await parent();
	const protocol = uiState.currentProtocol;
	const session = uiState.currentSession;
	if (!session || !protocol) {
		redirect(307, '/');
	}

	await resolveDefaults({
		db: await openDatabase(),
		metadataToConsider: protocol.sessionMetadata,
		sessionId: session.id,
	});
}
