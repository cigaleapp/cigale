<script lang="ts">
	import { dequal } from 'dequal';
	import Fuse from 'fuse.js';
	import { Previous } from 'runed';

	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Logo from '$lib/Logo.svelte';
	import { goto } from '$lib/paths.js';
	import VirtualList from '$lib/VirtualList.svelte';

	import { maximumListableCandidates, narrowingState } from '../+layout.svelte';
	import Candidate from '../Candidate.svelte';

	const searcher = $derived(
		new Fuse(narrowingState.allCandidates, {
			keys: ['label', 'description', 'key', 'learnMore'],
			includeMatches: true,
		})
	);

	const searchResults = $derived.by(() => {
		if (!searcher) return narrowingState.remainingCandidates;
		if (!narrowingState.search.candidates.query) return narrowingState.remainingCandidates;

		return searcher
			.search(narrowingState.search.candidates.query)
			.map(({ item, matches: [label, description] }) => ({
				...item,
				highlights: {
					label,
					description,
				},
			}));
	});

	const previousSearchResults = new Previous(() => searchResults);

	$effect(() => {
		narrowingState.search.candidates.resultsCount = searchResults.length;
	});

	$effect(() => {
		if (!previousSearchResults.current) return;
		const currentKeys = searchResults.map((r) => r.key);
		const previousKeys = previousSearchResults.current.map((r) => r.key);
		if (dequal(currentKeys, previousKeys)) return;
		narrowingState.scroll.candidates.y = 0;
	});
</script>

<main>
	{#if searchResults.length <= maximumListableCandidates}
		<VirtualList items={searchResults} bind:scroll={narrowingState.scroll.candidates}>
			{#snippet item(candidate)}
				<Candidate {candidate} />
			{/snippet}
		</VirtualList>
	{:else}
		<div class="too-many">
			<Logo variant="error" />
			<p>Trop de candidats à afficher</p>
			<ButtonSecondary
				onclick={async () => {
					await goto(
						'/(app)/(sidepanel)/o/[observation]/classify/narrow/describe/',
						page.params
					);
				}}>Décrire</ButtonSecondary
			>
		</div>
	{/if}
</main>

<style>
	main {
		overflow: auto;
		height: 100%;
	}

	.too-many {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		padding: 4em 2em;
		text-align: center;
		font-size: 1.125em;

		/* Logo size */
		--size: 4em;
		height: 100%;
	}
</style>
