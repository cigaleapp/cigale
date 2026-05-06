<script lang="ts" module>
	export const narrowingState = $state({
		search: { query: '', resultsCount: 0 },
		//TODO
		// metadataGroup: "io.github.cigaleapp.arthropods.example__andrena",
		metadataGroup: 'andrena',
		// TODO persist by using the observation's metadata overrides
		choicesHistory: [] as NamespacedMetadataID[],
		metadataValues: {} as Record<NamespacedMetadataID, TypedMetadataValue<'enum'>>,
		definitions: [] as DB.Metadata[],

		candidates: {
			all: [] as DB.MetadataEnumVariant[],
			remaining: [] as DB.MetadataEnumVariant[],
		},
	});
</script>

<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { TypedMetadataValue } from '$lib/metadata/types.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { fade } from 'svelte/transition';

	import IconRemove from '~icons/ri/close-line';
	import IconRestart from '~icons/ri/restart-line';
	import IconSearch from '~icons/ri/search-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Logo from '$lib/Logo.svelte';
	import { serializeMetadataValue } from '$lib/metadata/serializing.js';
	import MetadataInput from '$lib/MetadataInput.svelte';
	import { observationMetadata } from '$lib/observations.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { compareBy, entries } from '$lib/utils.js';

	import { fullscreenState } from '../../+layout@(app).svelte';
	import Subject from '../Subject.svelte';
	import { storeMetadataValue, deleteMetadataValue } from '$lib/metadata/storage.js';
	import { uiState } from '$lib/state.svelte.js';

	const { children } = $props();

	let expandedSubject = $state(false);

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const images = $derived(
		tables.Image.state.filter((image) => observation?.images.includes(image.id))
	);

	const definitions = $derived(narrowingState.definitions);

	const metadataValues = $derived(narrowingState.metadataValues);
	$inspect(definitions);

	$effect(() => {
		narrowingState.definitions = tables.Metadata.state
			.filter((m) => m.group === narrowingState.metadataGroup)
			.map((m) => ({
				...m,
				group: '',
			}));
	});

	$effect(() => {
		narrowingState.metadataValues = observationMetadata({
			observation,
			definitions,
			images: tables.Image.state.filter((img) => observation?.images.includes(img.id)),
			filterType: 'enum',
		});
	});
</script>

<div class="layout" class:expanded-subject={expandedSubject}>
	<aside>
		<section class="photo">
			<Subject
				buttons="top-left"
				{images}
				bind:expand={
					() => (expandedSubject ? 'subject' : 'none'),
					(value) => {
						expandedSubject = value === 'subject';
					}
				}
				bind:currentImage={
					() =>
						tables.Image.getFromState(fullscreenState.currentImage ?? '') ?? images[0],
					(image) => {
						fullscreenState.currentImage = image?.id;
					}
				}
			/>
		</section>
		<section class="choices">
			<ol>
				{#each entries(metadataValues).toSorted(compareBy(([id]) => {
						const idx = narrowingState.choicesHistory.indexOf(id);
						if (idx === -1) return Infinity;
						return -idx;
					})) as [id, value] (id)}
					{@const definition = definitions.find((d) => d.id === id)}
					{#if definition}
						<li>
							<div class="metadata"><OverflowableText text={definition.label} /></div>
							<div class="input">
								<MetadataInput
									{definition}
									{id}
									validationErrors={undefined}
									options={undefined}
									value={value?.value}
									isCompactEnum={false}
									unit={undefined}
									onblur={async (value) => {
										if (!value) return;
										if (!observation) return;
										await storeMetadataValue({
											db: databaseHandle(),
											metadataId: id,
											subjectId: observation.id,
											type: 'enum',
											value,
											confidence: 1,
											manuallyModified: true,
										})
									}}
								></MetadataInput>
							</div>
							<div class="todo"></div>
							<span class="filter-count"></span>
							<div class="remove">
								<ButtonIcon
									onclick={async () => {
										if (!observation) return;
										await deleteMetadataValue({
											db: databaseHandle(),
											subjectId: observation.id,
											metadataId: id,
											sessionId: uiState.currentSession?.id,
										});
									}}
								>
									<IconRemove />
								</ButtonIcon>
							</div>
						</li>
					{:else}
						<li>
							{id} not found
						</li>
					{/if}
				{:else}
					<li class="empty">
						<Logo variant="empty" />
						Aucun choix effectué pour l'instant
					</li>
				{/each}
			</ol>
		</section>
		<section class="restart">
			<ButtonInk>
				<IconRestart />
				Recommencer
			</ButtonInk>
		</section>
	</aside>

	<div class="content-and-footer">
		{#key page.route.id}
			<div class="content" in:fade={{ duration: 200 }}>
				{@render children()}
			</div>
		{/key}
		<footer>
			<search>
				<IconSearch />
				<InlineTextInput
					discreet
					label="Rechercher"
					placeholder="Rechercher"
					bind:value={narrowingState.search.query}
				/>

				{#if narrowingState.search.query}
					<span class="count"
						>{plural(narrowingState.search.resultsCount, [
							'# résultat',
							'# résultats',
						])}</span
					>
				{/if}
			</search>
			<SegmentedGroup
				options={['describe', 'candidates']}
				bind:current={
					() => page.route.id?.split('/').at(-1) as 'describe' | 'candidates',
					(option) => {
						void goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/${option}`,
							page.params
						);
					}
				}
			>
				{#snippet option_describe()}
					Décrire
				{/snippet}
				{#snippet option_candidates()}
					Candidats
					<code class="candidates-count">
						<!-- TODO -->
					</code>
				{/snippet}
			</SegmentedGroup>
		</footer>
	</div>
</div>

<style>
	/* FIXME: why is this necessary here but not in other full-screen pages? */
	:global(#app-layout > .contents) {
		scrollbar-gutter: initial;
	}

	.layout {
		display: flex;
		height: 100%;
	}

	aside {
		width: max(500px, 33%);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--gray);
		transition: width 250ms ease;
	}

	aside .choices {
		height: 100%;
		overflow: auto;
		padding: 0.5em;

		ol {
			list-style: none;
			padding: 0;
			height: 100%;
			display: flex;
			flex-direction: column;
			gap: 1em;
		}

		li:not(.empty) {
			gap: 0.25em;

			&,
			> * {
				display: flex;
				align-items: center;
			}

			.metadata {
				max-width: 20ch;
			}

			.input {
				margin-left: auto;
				width: 10ch;
			}
		}

		.empty {
			height: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 1em;
			/* Logo size */
			--size: 5em;
		}
	}

	aside .restart {
		margin-top: auto;
		display: flex;
		justify-content: flex-end;
		padding: 1em;
	}

	aside .photo {
		height: 40%;
		transition: height 250ms ease;
		border-bottom: 1px solid var(--gray);
	}

	.layout.expanded-subject {
		aside {
			width: 100%;
		}
		aside .photo {
			height: 90%;
		}

		aside > *:not(.photo),
		.content-and-footer {
			opacity: 0.25;
		}
	}

	.content-and-footer {
		height: 100%;
		width: 100%;
		display: grid;
		grid-template-rows: 1fr max-content;
	}

	.content {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
	}

	footer {
		background: var(--bg-neutral);
		display: flex;
		gap: 1em;
		padding: 1em;
		border-top: 1px solid var(--gray);
		align-items: center;
		justify-content: space-between;

		search {
			display: flex;
			gap: 0.5em;
			align-items: center;
			color: var(--fg-neutral);
			font-size: 1.2em;
		}

		search .count {
			display: inline-block;
			font-size: 1rem;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			/* XXX: otherwise the text ellipses wayyy to early */
			width: 100%;
		}

		.candidates-count {
			color: var(--fg-primary);
		}
	}
</style>
