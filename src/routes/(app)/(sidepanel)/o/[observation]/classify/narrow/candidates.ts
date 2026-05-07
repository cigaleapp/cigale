import type * as DB from '$lib/database.js';
import type { TypedMetadataValue } from '$lib/metadata/index.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import { listByIndex } from '$lib/idb.svelte.js';
import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
import { entries } from '$lib/utils.js';

export async function getAllCandidates({ narrowableGroup }: { narrowableGroup: string }) {
	// TODO: metadata group names should be namespaced!
	return listByIndex('MetadataOption', '_narrowableIn', narrowableGroup);
}

export function getMatchingCandidates({
	allCandidates,
	choices,
}: {
	allCandidates: DB.MetadataEnumVariant[];
	choices: Record<NamespacedMetadataID, TypedMetadataValue<'enum'>>;
}) {

	return allCandidates.filter((c) =>
		entries(choices).every(([metadataId, { value: optionKey }]) => {
			// if (c.metadataId !== metadataId) return false;
			const cascadeValue = c.cascade?.[removeNamespaceFromMetadataId(metadataId)];
			return !cascadeValue || cascadeValue === optionKey.toString();
		})
	);
}
