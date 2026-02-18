import { error } from '@sveltejs/kit';

import * as idb from '$lib/idb.svelte.js';
import { tables } from '$lib/idb.svelte.js';
import { resolveDefaults } from '$lib/metadata/defaults.js';
import { metadataOptionsKeyRange } from '$lib/metadata/index.js';
import { compareBy } from '$lib/utils.js';

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
			counts: { observations: 0, images: 0 }
		};
	}

	// const sessionMetadataDefs = await Promise.all(
	// 	protocol.sessionMetadata.map((mdId) => tables.Metadata.get(mdId))
	// ).then((defs) => defs.filter(nonnull));
	const sessionMetadataDefs = await tables.Metadata.getMany([
		...protocol.sessionMetadata,
		...protocol.importedMetadata.filter((imp) => imp.sessionwide).map((imp) => imp.source)
	]);

	sessionMetadataDefs.forEach(({ id }) => depends(idb.dependencyURI('Metadata', id)));

	sessionMetadataDefs.sort(compareBy(({ id }) => protocol.metadataOrder?.indexOf(id) ?? -1));

	const sessionMetadataOptions = await Promise.all(
		sessionMetadataDefs.map(async (def) => [
			def.id,
			def.type === 'enum'
				? await idb.list('MetadataOption', metadataOptionsKeyRange(protocol.id, def.id))
				: []
		])
	).then((options) => Object.fromEntries(options));

	const counts = {
		observations: await idb
			.listByIndex('Observation', 'sessionId', session.id)
			.then((obs) => obs.length),
		images: await idb.listByIndex('Image', 'sessionId', session.id).then((imgs) => imgs.length)
	};

	await resolveDefaults({
		db: idb.databaseHandle(),
		sessionId: session.id,
		metadataToConsider: sessionMetadataDefs.map(({ id }) => id)
	});

	session = await tables.Session.get(id);
	if (!session) error(404, 'Session not found');

	const sessionMetadata = sessionMetadataDefs.map((def) => ({
		def,
		value: session.metadata?.[def.id]
	}));

	return { session, protocol, sessionMetadata, sessionMetadataOptions, counts };
}
