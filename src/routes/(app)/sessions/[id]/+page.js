import { error } from '@sveltejs/kit';

import * as idb from '$lib/idb.svelte.js';
import { tables } from '$lib/idb.svelte.js';

export async function load({ params: { id }, depends }) {
	depends(idb.dependencyURI('Session', id));
	let session = await tables.Session.get(id);
	if (!session) {
		error(404, 'Session not found');
	}

	depends(idb.dependencyURI('Protocol', session.protocol));
	const protocol = await tables.Protocol.get(session.protocol);
	if (!protocol) {
		return {
			session,
			protocol: null,
			sessionMetadata: [],
			sessionMetadataOptions: {},
			counts: { observations: 0, images: 0 },
		};
	}

	const counts = {
		observations: await idb
			.listByIndex('Observation', 'sessionId', session.id)
			.then((obs) => obs.length),
		images: await idb.listByIndex('Image', 'sessionId', session.id).then((imgs) => imgs.length),
	};

	session = await tables.Session.get(id);
	if (!session) error(404, 'Session not found');

	return { session, protocol, counts };
}
