<script lang="ts">
	import VirtualList from '@sveltejs/svelte-virtual-list';

	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { scrollfader } from '$lib/scrollfader.js';

	import { narrowingState } from '../+layout.svelte';
	import Fuse from 'fuse.js';

	const candidates = $derived(narrowingState.candidates.remaining);

	const searcher = $derived(new Fuse(candidates, {
		keys: ['label', 'description', 'key', 'learnMore'],
		includeMatches: true,
	}))

const searchResults = $derived.by(() => {
	if (!searcher) return candidates;
	if (!narrowingState.search.candidates.query) return candidates;

	return searcher.search(narrowingState.search.candidates.query).map(({ item, matches: [label, description] }) => ({
		...item,
		highlights: {
			label,
			description,
		},
	}))});

	$effect(() => {
		narrowingState.search.candidates.resultsCount = searchResults.length;
	});
</script>



<main>
	<VirtualList items={searchResults} let:item>
	{@const candidate = item as typeof candidates[number]}
		<article>
			<div class="image">
				{#if candidate.images?.at(0)}
					<img src={candidate.images?.at(0)} alt="Image de {candidate.label}" class="specimen" />
				{/if}
			</div>
			<div class="info">
				<span class="label">{candidate.label}</span>
				<div class="description" {@attach scrollfader}>
					<Markdown source={candidate.description ?? ''} />
				</div>
				{#if candidate.learnMore}
					<LearnMoreLink href={candidate.learnMore} />
				{/if}
			</div>
		</article>
	</VirtualList>
</main>

<style>
	main {
		overflow: auto;
		height: 100%;
	}

	article {
		display: flex;
		gap: 1em;
		padding: 2em;
		max-width: calc(67ch + 10em + 2em);

		.image {
			width: 10em;
			height: 10em;
			flex-shrink: 0;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			border-radius: var(--corner-radius);
		}

		.description {
			height: 10lh;
			overflow: hidden;
		}

		.info {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}
	}
</style>
