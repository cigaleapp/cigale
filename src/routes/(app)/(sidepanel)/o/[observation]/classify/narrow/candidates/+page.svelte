<script lang="ts">
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import Fuse from 'fuse.js';

	import IconChoose from '~icons/ri/check-line';
	import IconNoImage from '~icons/ri/question-line';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Lightbox from '$lib/Lightbox.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import { scrollfader } from '$lib/scrollfader.js';
	import { uiState } from '$lib/state.svelte.js';

	import { fullscreenState } from '../../../+layout@(app).svelte';
	import { narrowingState } from '../+layout.svelte';

	const candidates = $derived(narrowingState.candidates.remaining);

	const searcher = $derived(
		new Fuse(candidates, {
			keys: ['label', 'description', 'key', 'learnMore'],
			includeMatches: true,
		})
	);

	const searchResults = $derived.by(() => {
		if (!searcher) return candidates;
		if (!narrowingState.search.candidates.query) return candidates;

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

	$effect(() => {
		narrowingState.search.candidates.resultsCount = searchResults.length;
	});
</script>

<main>
	<VirtualList items={searchResults} let:item>
		{@const candidate = item as (typeof candidates)[number]}
		<article>
			<div class="image" class:empty={!candidate.images?.[0]}>
				{#if candidate.images?.at(0)}
					<Lightbox>
						{#snippet trigger()}
							<img
								src={candidate.images?.at(0)}
								alt="Image de {candidate.label}"
								class="specimen"
							/>
						{/snippet}
						{#snippet content()}
							<img
								src={candidate.images?.at(0)}
								alt="Image de {candidate.label}"
								class="specimen-fullscreen"
							/>
						{/snippet}
					</Lightbox>
				{:else}
					<p>
						<IconNoImage />
					</p>
				{/if}
			</div>
			<div class="info">
				<span class="label">{candidate.label}</span>
				<div class="description" {@attach scrollfader}>
					<Markdown source={candidate.description ?? ''} />
				</div>
				<div class="actions">
					<div class="learn-more">
						{#if candidate.learnMore}
							<LearnMoreLink href={candidate.learnMore} />
						{/if}
					</div>

					<div class="pick">
						<ButtonSecondary
							onclick={async () => {
								if (!page.params.observation) return;
								if (!narrowingState.focusedMetadataId) return;

								await storeMetadataValue({
									db: databaseHandle(),
									subjectId: page.params.observation,
									sessionId: uiState.currentSessionId,
									metadataId: narrowingState.focusedMetadataId,
									type: 'enum',
									value: candidate.key,
								});
							}}
						>
							<IconChoose />
							Choisir
						</ButtonSecondary>
					</div>
				</div>
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
		gap: 2em;
		padding: 2em;
		border-bottom: 1px solid var(--gray);

		.image {
			width: 10rem;
			height: 10rem;
			flex-shrink: 0;

			&.empty {
				border-radius: var(--corner-radius);
				border: 2px dashed var(--gray);
				color: var(--gray);
				display: flex;
				align-items: center;
				justify-content: center;
				text-align: center;
				font-size: 2em;
			}
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			&.specimen {
				border-radius: var(--corner-radius);
			}
		}

		.label {
			font-weight: bold;
			font-size: 1.3em;
		}

		.description {
			height: 10lh;
			overflow: hidden;
		}

		.info {
			display: flex;
			flex-direction: column;
			gap: 1em;
			width: 100%;
			max-width: 67ch;
		}

		.actions {
			width: 100%;
			display: flex;
			align-items: center;
			gap: 2em;
			justify-content: space-between;
		}

		&:not(:hover):not(:focus-within) .actions .pick {
			opacity: 0;
			pointer-events: none;
		}
	}
</style>
