import { error } from '@sveltejs/kit';

import { databaseHandle, dependencyURI, tables } from '$lib/idb.svelte.js';
import { metadataOptionsKeyRange } from '$lib/metadata.js';
import { namespacedMetadataId } from '$lib/schemas/metadata.js';

export async function load({ params, parent, depends }) {
	const protocol = await parent();
	const id = namespacedMetadataId(protocol.id, params.metadata);

	depends(dependencyURI('Metadata', id));

	const metadata = await tables.Metadata.get(id);
	if (!metadata) error(404, `Metadata ${id} for protocol ${protocol.id} not found`);

	const optionsCount = await databaseHandle().count(
		'MetadataOption',
		metadataOptionsKeyRange(protocol.id, params.metadata)
	);

	return {
		protocol,
		metadata,
		optionsCount
	};
}
