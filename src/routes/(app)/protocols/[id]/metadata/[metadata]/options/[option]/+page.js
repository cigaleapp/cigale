import { error } from '@sveltejs/kit';

import { get, list, tables } from '$lib/idb.svelte.js';
import { metadataOptionsKeyRange } from '$lib/metadata/index.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { entries } from '$lib/utils.js';

export async function load({ parent, params }) {
	if (!params.id) throw error(400, 'Protocol ID is required');

	const { protocol, metadata } = await parent();

	const option = await get(
		'MetadataOption',
		metadataOptionId(namespacedMetadataId(params.id, params.metadata), params.option)
	);

	if (!option) error(404, 'Option not found');

	const cascades = await Promise.all(
		entries(option.cascade ?? {}).map(async ([targetMetadata, value]) => {
			const fullMetadataId = namespacedMetadataId(params.id, targetMetadata);
			const metadata = await tables.Metadata.get(fullMetadataId);
			if (!metadata) return { metadataId: fullMetadataId };

			/** @type {import('$lib/database').MetadataEnumVariant | undefined} */
			let option = undefined;
			if (metadata.type === 'enum') {
				option = await get('MetadataOption', metadataOptionId(fullMetadataId, value));
			}

			return {
				metadataId: fullMetadataId,
				metadata,
				option,
				value
			};
		})
	);

	const reverseCascades = await Promise.all(
		protocol.metadata.flatMap(async (mid) => {
			const metadata = await tables.Metadata.get(namespacedMetadataId(params.id, mid));
			if (!metadata) return [];
			if (metadata.type !== 'enum') return [];

			const options = await list('MetadataOption', metadataOptionsKeyRange(params.id, mid));
			return options
				.filter((o) => o.cascade?.[params.metadata] === option.key)
				.map((o) => ({
					value: o.key,
					metadataId: metadata.id,
					metadata,
					option: o
				}));
		})
	).then((results) => results.flat());

	return {
		protocol,
		metadata,
		option,
		cascades,
		reverseCascades
	};
}
