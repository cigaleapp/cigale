<script lang="ts">
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { ms } from 'convert';

	import { page } from '$app/state';
	import { tables } from '$lib/idb.svelte.js';
	import MetadataList from '$lib/MetadataList.svelte';
	import { ensureNamespacedMetadataId, namespaceOfMetadataId } from '$lib/schemas/metadata.js';
	import { uiState } from '$lib/state.svelte.js';
	import { compareBy, mapKeys } from '$lib/utils.js';

	import { narrowingState } from '../../+layout.svelte';
	import { options } from '../+layout.svelte';
	import Descriptor from '../Descriptor.svelte';
	import Searcher from '../Searcher.svelte';

	const metadataValues = $derived(narrowingState.metadataValues);
	const definitions = $derived(
		narrowingState.definitions(uiState.currentSession?.fullscreenClassifier.narrowableGroup)
	);

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const remainingMetadataValues = $derived.by<Record<NamespacedMetadataID, Set<string>>>(() => {
		const result: Record<NamespacedMetadataID, Set<string>> = Object.fromEntries(
			definitions
				// Don't consider metadata that has been chosen
				.filter((def) => !(def.id in (observation?.metadataOverrides ?? {})))
				.map((def) => [def.id, new Set()])
		);

		metadata: for (const { id } of definitions) {
			if (!(id in result)) continue;

			for (const candidate of narrowingState.candidates.remaining) {
				const cascades = mapKeys(candidate.cascade ?? {}, (metadataId) =>
					ensureNamespacedMetadataId(metadataId, namespaceOfMetadataId(id))
				);

				// If the candidate doesn't have a cascade for this metadata, it means that all options are still possible
				// Go immediately to the next metadata
				if (!(id in cascades)) {
					delete result[id];
					continue metadata;
				}

				result[id].add(cascades[id].toString());
			}
		}

		return result;
	});

	function metadataOrdering(searchResults?: NamespacedMetadataID[]) {
		if (searchResults) return searchResults;

		if (!Object.keys(remainingMetadataValues).length)
			return uiState.currentProtocol?.metadataOrder ?? [];

		return definitions
			.toSorted(
				compareBy((def) => {
					// TODO
					return 1;
				})
			)
			.map((def) => def.id);
	}
</script>

<main>
	<Searcher
		{definitions}
		bind:scroll={narrowingState.scroll.describe}
		bind:query={narrowingState.search.describe.query}
		bind:resultsCount={narrowingState.search.describe.resultsCount}
	>
		{#snippet children(shownDefinitions, searchResults)}
			<MetadataList
				// virtualize
				bind:scroll={narrowingState.scroll.describe}
				values={metadataValues}
				definitions={searchResults
					? shownDefinitions
					: shownDefinitions.filter((def) => !(def.id in metadataValues))}
				ordering={metadataOrdering(searchResults)}
				groups={undefined}
			>
				{#snippet children(definition)}
					<div class="metadata">
						<Descriptor
							onchangeDelay={ms('2s')}
							{options}
							{definition}
							{remainingMetadataValues}
							{metadataValues}
						/>
					</div>
				{/snippet}
			</MetadataList>
		{/snippet}
	</Searcher>
</main>

<style>
	main {
		height: 100%;
	}

	.metadata {
		/* 
		Fiddled with manually in order to get approx. 66 chars/line max 
		See https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
		*/
		border-bottom: 1px solid var(--gray);
		padding: 1rem;
	}
</style>
