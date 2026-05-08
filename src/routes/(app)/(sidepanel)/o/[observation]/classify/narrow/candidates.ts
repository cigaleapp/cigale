import type * as DB from '$lib/database.js';
import type { TypedMetadataValue } from '$lib/metadata/index.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import { listByIndex } from '$lib/idb.svelte.js';
import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
import { entries } from '$lib/utils.js';

export async function getAllCandidates({ narrowableGroup, focusedMetadataId }: { narrowableGroup: string, focusedMetadataId: NamespacedMetadataID }) {
	// TODO: metadata group names should be namespaced!
	const narrowables = await listByIndex('MetadataOption', '_narrowableIn', narrowableGroup);
	return narrowables.filter(option => option.metadataId === focusedMetadataId);
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

export function narrowingPower({
	allCandidates,
	currentChoices,
	choice,
}: {
	allCandidates: DB.MetadataEnumVariant[];
	currentChoices: Record<NamespacedMetadataID, TypedMetadataValue<'enum'>>;
	choice: { metadataId: NamespacedMetadataID; optionKey: string };
}) {
	const candidatesBefore = getMatchingCandidates({ allCandidates, choices: currentChoices });

	const candidatesAfter = getMatchingCandidates({
		allCandidates,
		choices: {
			...currentChoices,
			[choice.metadataId]: { type: 'enum', value: choice.optionKey },
		},
	});

	return {
		countAfterChoice: candidatesAfter.length,
		ratio: candidatesAfter.length / candidatesBefore.length,
	};
}
