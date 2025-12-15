import { error } from '@sveltejs/kit';

import { dependencyURI, tables } from '$lib/idb.svelte.js';
import { metadataDefinitionComparator } from '$lib/metadata.js';
import { nonnull } from '$lib/utils.js';

export async function load({ params, depends }) {
	const protocol = await tables.Protocol.get(params.id);
	console.info('Loaded protocol from load function', protocol);
	if (!protocol) error(404, `Protocole ${params.id} introuvable`);

	depends(dependencyURI('Protocol', params.id));
	protocol.metadata.map((m) => depends(dependencyURI('Metadata', m)));

	const { metadataOrder } = protocol;

	return {
		...protocol,
		metadataDefinitions: await Promise.all(
			protocol.metadata
				.toSorted(metadataDefinitionComparator({ metadataOrder }))
				.map(async (id) => tables.Metadata.get(id))
		).then((defs) => defs.filter(nonnull))
	};
}
