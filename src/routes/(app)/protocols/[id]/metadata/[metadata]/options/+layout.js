import { list } from '$lib/idb.svelte.js';
import { metadataOptionsKeyRange } from '$lib/metadata.js';

export async function load({ params, parent }) {
	const parentData = await parent();

	const options = await list('MetadataOption', metadataOptionsKeyRange(params.id, params.metadata));

	return { ...parentData, options };
}
