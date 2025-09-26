import { tables } from '$lib/idb.svelte.js';
import { metadataDefinitionComparator } from '$lib/metadata.js';
import { nonnull } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

export async function load({ params, depends }) {
	const protocol = await tables.Protocol.get(params.id);
	console.info('Loaded protocol from load function', protocol);
	if (!protocol) error(404, `Protocole ${params.id} introuvable`);

	depends(`idb://Protocol/${params.id}`);
	protocol.metadata.map((m) => depends(`idb://Metadata/${m}`));

	const { crop, metadataOrder } = protocol;

	return {
		...protocol,
		metadataDefinitions: await Promise.all(
			protocol.metadata
				.filter((k) => ![crop.metadata, crop.confirmationMetadata].includes(k))
				.toSorted(metadataDefinitionComparator({ metadataOrder }))
				.map(async (id) => tables.Metadata.get(id))
		).then((defs) => defs.filter(nonnull))
	};
}
