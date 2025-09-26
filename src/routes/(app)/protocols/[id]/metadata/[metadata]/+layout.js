import { tables } from '$lib/idb.svelte.js';
import { namespacedMetadataId } from '$lib/schemas/metadata.js';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, depends }) {
	const protocol = await parent();
	const id = namespacedMetadataId(protocol.id, params.metadata);

	depends(`idb://Metadata/${id}`);

	const metadata = await tables.Metadata.get(id);
	if (!metadata) error(404, `Metadata ${id} for protocol ${protocol.id} not found`);

	return {
		protocol,
		metadata
	};
}
