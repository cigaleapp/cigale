<script lang="ts">
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { SvelteSet } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Logo from '$lib/Logo.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import { goto } from '$lib/paths.js';
	import { ensureNamespacedMetadataId, namespaceOfMetadataId } from '$lib/schemas/metadata.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/state.svelte.js';
	import { compareBy, mapKeys } from '$lib/utils.js';

	import { narrowingState } from '../+layout.svelte';
	import Descriptor from '../Descriptor.svelte';
	import { options } from '../OptionsLoader.svelte';
	import Searcher from '../Searcher.svelte';

	const expanded = new SvelteSet<NamespacedMetadataID>();

	const metadataValues = $derived(narrowingState.metadataValues);
	const definitions = $derived(
		narrowingState.definitions.filter((def) => def.id in metadataValues)
	);

	const observation = $derived(narrowingState.observation);

	const remainingMetadataValues = $derived.by<Record<NamespacedMetadataID, Set<string>>>(() => {
		const result: Record<NamespacedMetadataID, Set<string>> = Object.fromEntries(
			definitions
				// Don't consider metadata that has been chosen
				.filter((def) => !(narrowingState.choices.has(def.id)))
				.map((def) => [def.id, new Set()])
		);

		metadata: for (const { id } of definitions) {
			if (!(id in result)) continue;

			for (const candidate of narrowingState.remainingCandidates) {
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
			.toSorted(compareBy((def) => narrowingState.choicesHistory.indexOf(def.id)))
			.map((def) => def.id);
	}
</script>

<main>
	<Searcher
		{definitions}
		bind:scroll={narrowingState.scroll.choices}
		bind:query={narrowingState.search.choices.query}
		bind:resultsCount={narrowingState.search.choices.resultsCount}
	>
		{#snippet children(shownDefinitions, searchResults)}
			{#if isDebugMode()}
				<pre>choices = {JSON.stringify(
						Object.fromEntries(
							Array.from(narrowingState.choices.entries()).map(
								([metadataId, values]) => [metadataId, Array.from(values)]
							)
						),
						null,
						2
					)}</pre>
			{/if}

			{#if shownDefinitions.length > 0}
				<MetadataList
					bind:scroll={narrowingState.scroll.choices}
					definitions={shownDefinitions}
					values={metadataValues}
					ordering={metadataOrdering(searchResults)}
					groups={undefined}
				>
					{#snippet children(definition)}
						<div class="metadata">
							<Descriptor
								onchangeDelay={0}
								collapsible
								{expanded}
								{options}
								{definition}
								{remainingMetadataValues}
								{metadataValues}
							/>
						</div>
					{/snippet}
				</MetadataList>
			{:else}
				<div class="empty" in:fade={{ duration: 200 }}>
					<Logo variant="empty" />
					<p>Aucun choix effectué pour le moment</p>
					<ButtonSecondary
						onclick={async () => {
							await goto(
								'/(app)/(sidepanel)/o/[observation]/classify/narrow/describe',
								page.params
							);
						}}>
						Décrire l'observation
						</ButtonSecondary
					>
				</div>
			{/if}
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

	.empty {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;

		/* Logo size */
		--size: 5rem;
	}

	pre {
		font-size: 0.75rem;
	}
</style>
