<script lang="ts">
	import { dequal } from 'dequal';
	import Fuse from 'fuse.js';
	import { Previous } from 'runed';

	import IconChoose from '~icons/ri/check-line';
	import IconNoImage from '~icons/ri/question-line';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Lightbox from '$lib/Lightbox.svelte';
	import Logo from '$lib/Logo.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import { goto } from '$lib/paths.js';
	import { scrollfader } from '$lib/scrollfader.js';
	import { uiState } from '$lib/state.svelte.js';
	import VirtualList from '$lib/VirtualList.svelte';

	import { maximumListableCandidates, narrowingState } from '../+layout.svelte';

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

	const previousSearchResults = new Previous(() => searchResults);

	$effect(() => {
		narrowingState.search.candidates.resultsCount = searchResults.length;
	});

	$effect(() => {
		if (!previousSearchResults.current) return;
		const currentKeys = searchResults.map((r) => r.key);
		const previousKeys = previousSearchResults.current.map((r) => r.key);
		if (dequal(currentKeys, previousKeys)) return;
		narrowingState.scroll.candidates = 0;
	});
</script>

<main>
	{#if searchResults.length <= maximumListableCandidates}
		<VirtualList items={searchResults} bind:scroll={narrowingState.scroll.candidates}>
			{#snippet item(candidate)}
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
			{/snippet}
		</VirtualList>
	{:else}
		<div class="too-many">
			<Logo variant="error" />
			<p>Trop de candidats à afficher</p>
			<ButtonSecondary
				onclick={async () => {
					await goto(
						'/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe/',
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
			visibility: hidden;
		}
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
