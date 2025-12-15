import { dependencyURI, list } from '$lib/idb.svelte.js';
import { metadataOptionsKeyRange } from '$lib/metadata.js';
import { namespacedMetadataId } from '$lib/schemas/metadata.js';

export async function load({ params, parent, depends }) {
	const parentData = await parent();

	const options = await list(
		'MetadataOption',
		metadataOptionsKeyRange(params.id, params.metadata)
	);

	depends(dependencyURI('Metadata', namespacedMetadataId(params.id, params.metadata), 'options'));

	return { ...parentData, options };
}
