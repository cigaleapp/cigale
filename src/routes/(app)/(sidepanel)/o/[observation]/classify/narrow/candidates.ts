import type * as DB from '$lib/database.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import { listByIndex } from '$lib/idb.svelte.js';
import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
import { avg, entries } from '$lib/utils.js';

export async function getAllCandidates({
	narrowableGroup,
	focusedMetadataId,
}: {
	narrowableGroup: string;
	focusedMetadataId: NamespacedMetadataID;
}) {
	// TODO: metadata group names should be namespaced!
	const narrowables = await listByIndex('MetadataOption', '_narrowableIn', narrowableGroup);
	return narrowables.filter((option) => option.metadataId === focusedMetadataId);
}

export type Descriptors = Map<string, Map<NamespacedMetadataID, Set<string>>>;

/** A map of option sets */
export function computeDescriptors({
	allCandidates,
	options,
	signal,
}: {
	allCandidates: DB.MetadataEnumVariant[];
	/** Options of all narrowable metadata */
	options: Record<NamespacedMetadataID, Map<string, DB.MetadataEnumVariant>>;
	signal: AbortSignal;
}): Descriptors {
	const descriptors: Descriptors = new Map();

	console.time('computeDescriptors');

	for (const candidate of allCandidates) {
		const descriptions = new Map<NamespacedMetadataID, Set<string>>();

		for (const [id, opts] of entries(options)) {
			signal.throwIfAborted();

			const keys = candidate.cascade?.[removeNamespaceFromMetadataId(id)];
			descriptions.set(id, keys ? new Set(keys) : new Set(opts.keys()));
		}

		descriptors.set(candidate.key, descriptions);
	}

	console.timeEnd('computeDescriptors');

	console.debug('Computed descriptors for narrowing classifier', descriptors);

	return descriptors;
}

export function matches({
	descriptors,
	within,
	choices,
}: {
	descriptors: Descriptors;
	choices: Map<NamespacedMetadataID, Set<string>>;
	/** Keys of candidates that we want to filter from. */
	within: Set<string>;
}): Set<string> {
	const matching = new Set<string>();

	candidates: for (const key of within) {
		const descriptor = descriptors.get(key);
		if (!descriptor) continue;

		for (const [metadata, picks] of choices) {
			const description = descriptor.get(metadata);
			if (!description) continue;

			if (picks.intersection(description).size === 0) {
				continue candidates;
			}
		}

		matching.add(key);
	}

	return matching;
}

export function narrowingPower({
	candidates,
	descriptors,
	metadata,
	options,
}: {
	candidates: Set<string>;
	descriptors: Descriptors;
	metadata: NamespacedMetadataID;
	/** All option keys for the given metadata */
	options: IteratorObject<string>;
}) {
	return avg(
		options.map(
			(option) =>
				candidates
					.values()
					.filter((candidate) => descriptors.get(candidate)?.get(metadata)?.has(option))
					.toArray().length
		)
	);
}
