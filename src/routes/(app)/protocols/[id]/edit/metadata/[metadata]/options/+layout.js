import { databaseHandle, dependencyURI } from '$lib/idb.svelte.js';
import { metadataOptionsOf } from '$lib/metadata/index.js';
import { namespacedMetadataId } from '$lib/schemas/metadata.js';

export async function load({ params, parent, depends }) {
	const parentData = await parent();

	depends(dependencyURI('Metadata', namespacedMetadataId(params.id, params.metadata), 'options'));

	return {
		...parentData,
		options: await metadataOptionsOf(databaseHandle(), params.id, params.metadata),
	};
}
