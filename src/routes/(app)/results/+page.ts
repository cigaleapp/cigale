import { openDatabase } from '$lib/idb.svelte.js';
import { resolveDefaults } from '$lib/metadata/defaults.js';
import { uiState } from '$lib/state.svelte.js';

export async function load({ parent }) {
	await parent();
	await resolveDefaults({
		db: await openDatabase(),
		metadataToConsider: uiState.currentProtocol!.sessionMetadata,
		sessionId: uiState.currentSession!.id,
	});
}
