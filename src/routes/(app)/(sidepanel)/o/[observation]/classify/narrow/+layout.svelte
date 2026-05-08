<script lang="ts" module>
	export const narrowingState = $state({
		search: {
			describe: { query: '', resultsCount: 0 },
			candidates: { query: '', resultsCount: 0 },
		},
		//TODO
		// metadataGroup: "io.github.cigaleapp.arthropods.example__andrena",
		metadataGroup: 'andrena',
		focusedMetadataId: undefined as NamespacedMetadataID | undefined,
		// TODO persist by using the observation's metadata overrides
		choicesHistory: [] as NamespacedMetadataID[],
		metadataValues: {} as Record<NamespacedMetadataID, TypedMetadataValue<'enum'>>,

		get definitions() {
			return tables.Metadata.state.filter((m) => m.group === this.metadataGroup);
		} ,

		candidates: {
			all: [] as DB.MetadataEnumVariant[],
			remaining: [] as DB.MetadataEnumVariant[],
			get ratio() {
				return 1 - this.remaining.length / (this.all.length - 1 || 1);
			},
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
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import IconSearch from '~icons/ri/search-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import Logo from '$lib/Logo.svelte';
	import { serializeMetadataValue } from '$lib/metadata/serializing.js';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata/storage.js';
	import MetadataInput from '$lib/MetadataInput.svelte';
	import { observationMetadata } from '$lib/observations.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { compareBy, entries, fromEntries, transformObject } from '$lib/utils.js';

	import { fullscreenState } from '../../+layout@(app).svelte';
	import Subject from '../Subject.svelte';
	import { getAllCandidates, getMatchingCandidates, narrowingPower } from './candidates.js';

	const { children } = $props();

	let expandedSubject = $state(false);

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const images = $derived(
		tables.Image.state.filter((image) => observation?.images.includes(image.id))
	);

	const definitions = $derived(narrowingState.definitions);

	const metadataValues = $derived(narrowingState.metadataValues);

	const choices = $derived(
		entries(metadataValues).toSorted(
			compareBy(([id]) => {
				const idx = narrowingState.choicesHistory.indexOf(id);
				if (idx === -1) return Infinity;
				return -idx;
			})
		)
	);

	$effect(() => {
		narrowingState.focusedMetadataId =
			uiState.currentSession?.fullscreenClassifier.focusedMetadata ??
			uiState.classificationMetadataId;
	});

	$effect(() => {
		void (async () => {
			if (!narrowingState.focusedMetadataId) return;
			narrowingState.candidates.all = await getAllCandidates({
				narrowableGroup: narrowingState.metadataGroup,
				focusedMetadataId: narrowingState.focusedMetadataId,
			});
		})();
	});

	$effect(() => {
		narrowingState.candidates.remaining = getMatchingCandidates({
			allCandidates: narrowingState.candidates.all,
			choices: metadataValues,
		});
	});

	const focusedMetadata = $derived(
		tables.Metadata.getFromState(narrowingState.focusedMetadataId ?? '')
	);

	const focusedMetadataValue = $derived(
		observationMetadata({
			observation, 
			definitions: [focusedMetadata],
			images: tables.Image.state.filter((img) => observation?.images.includes(img.id)),
			filterType: 'enum',
		})[narrowingState.focusedMetadataId]
	)



	$effect(() => {
		// Only get values that are relevant to the narrowing view
		narrowingState.metadataValues = transformObject(
			observationMetadata({
				observation,
				definitions,
				images: tables.Image.state.filter((img) => observation?.images.includes(img.id)),
				filterType: 'enum',
			}),
			(id, value) => {
				if (definitions.some((d) => d.id === id)) {
					return [id, value];
				}

				return undefined;
			}
		);
	});

	let toggleFocusSearchBar = $state<() => void>();

	const tab = $derived.by(() => {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/describe':
				return 'describe';
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates':
				return 'candidates';
			default:
				// Unreachable
				return 'describe';
		}
	});

	defineKeyboardShortcuts('classification', {
		tab: {
			help: 'Basculer entre les onglets Décrire et Candidats',
			async do() {
				switch (page.route.id) {
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/describe':
						await goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates`,
							page.params
						);
						break;
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates':
						await goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/describe`,
							page.params
						);
						break;
				}
			},
		},
		'$mod+f': {
			help: 'Entrer dans la barre de recherche',
			do() {
				toggleFocusSearchBar?.();
			},
		},
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

				{#if focusedMetadata &&focusedMetadataValue}
				<li class=focused>
					<div class=metadata><OverflowableText text={focusedMetadata.label} /></div>
					<div class=input>
						<MetadataInput
						definition={focusedMetadata}
						id={focusedMetadata.id}
						validationErrors={undefined}
						options={undefined}
						value={focusedMetadataValue?.value}
						isCompactEnum={false}
						unit={undefined}
						onblur={async (value) => {
							if (!value) return;
							if (!observation) return;
							await storeMetadataValue({
								db: databaseHandle(),
								metadataId: focusedMetadata.id,
								subjectId: observation.id,
								sessionId: uiState.currentSession?.id,
								type: 'enum',
								value,
								confidence: 1,
								manuallyModified: true,
							});
						}}
						></MetadataInput>
					</div>
					<div class=todo></div>
					<div class=confidence>
						<ConfidencePercentage value={focusedMetadataValue.confidence} />
					</div>

					<div class=remove>
						<ButtonIcon
							help="Enlever ce choix"
							onclick={async () => {
								if (!observation) return;
								await deleteMetadataValue({
									db: databaseHandle(),
									subjectId: observation.id,
									metadataId: focusedMetadata.id,
									sessionId: uiState.currentSession?.id,
								});
							}}
						>
							<IconRemove />
						</ButtonIcon>
					</div>
				</li>
				{/if}

				{#each choices as [id, value], i (id)}
					{@const definition = definitions.find((d) => d.id === id)}
					{@const choicesBeforeThisOne = fromEntries(choices.slice(i + 1))}
					{@const narrowing = narrowingPower({
						allCandidates: narrowingState.candidates.all,
						currentChoices: choicesBeforeThisOne,
						choice: { metadataId: id, optionKey: value.value },
					})}

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
											sessionId: uiState.currentSession?.id,
											type: 'enum',
											value,
											confidence: 1,
											manuallyModified: true,
										});
									}}
								></MetadataInput>
							</div>
							<div class="todo"></div>
							<span class="filter-count">
								{narrowing.countAfterChoice}
							</span>
							<div class="remove">
								<ButtonIcon
									help="Enlever ce choix"
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
			<ButtonInk
				onclick={async () => {
					if (!observation) return;
					const obs = await tables.Observation.raw.get(observation.id);
					if (!obs) return;
					// Wipe all metadata values that are in the current metadata group
					await tables.Observation.update(
						observation.id,
						'metadataOverrides',
						transformObject(obs.metadataOverrides, (id, value) => {
							const def = definitions.find((d) => d.id === id);
							if (!def) return [id, value];
							if (def.group !== narrowingState.metadataGroup) return [id, value];

							return undefined;
						})
					);
				}}
			>
				<IconRestart />
				Recommencer
			</ButtonInk>
		</section>
	</aside>

	<div class="content-and-footer">
		<div class="progress">
			<ProgressBar progress={narrowingState.candidates.ratio} />
			<div class="remaining-count">
				{plural(narrowingState.candidates.remaining.length, ['# restant', '# restants'])}
			</div>
		</div>

		{#key page.route.id}
			<div class="content" in:fade={{ duration: 200 }}>
				{@render children()}
			</div>
		{/key}

		<footer>
			<search
				{@attach (node) => {
					const input = node.querySelector('input');
					if (!input) return;
					toggleFocusSearchBar = () => {
						if (document.activeElement === input) {
							input.blur();
						} else {
							input.focus();
						}
					};
				}}
			>
				<IconSearch />
				<InlineTextInput
					discreet
					label="Rechercher"
					placeholder="Rechercher"
					bind:value={narrowingState.search[tab].query}
				/>
				<KeyboardHint shortcut="$mod+F" />

				{#if narrowingState.search[tab].query}
					<span class="count"
						>{plural(narrowingState.search[tab].resultsCount, [
							'# résultat',
							'# résultats',
						])}</span
					>
				{/if}
			</search>
			<SegmentedGroup
				options={['describe', 'candidates']}
				bind:current={
					() => tab,
					(option) => {
						void goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/${option}`,
							page.params
						);
					}
				}
			>
				{#snippet option_describe({ current })}
					<div
						class="tab"
						use:tooltip={{ text: "Décrire l'observation", keyboard: 'tab' }}
					>
						Décrire
					</div>
				{/snippet}
				{#snippet option_candidates({ current })}
					<div
						class="tab"
						use:tooltip={{ text: 'Voir les candidats possibles', keyboard: 'tab' }}
					>
						Candidats
						<code class="candidates-count">
							{narrowingState.candidates.remaining.length}
						</code>
					</div>
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
		overflow: hidden;
	}

	aside {
		width: max(600px, 33%);
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

		li.focused {
			border-bottom: 1px solid var(--gray);
		}

		li:not(.empty) {
			gap: 0.5em;

			&,
			> * {
				display: flex;
				align-items: center;
			}

			.metadata {
				max-width: 40ch;
			}

			.input {
				margin-left: auto;
				width: 20ch;
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
			width: 90%;
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
		grid-template-rows: max-content 1fr max-content;
	}

	.content-and-footer .progress {
		width: 100%;

		/** We make the candidates count hang down over the content */
		--height: 0.25rem; /* Progress bar height */
		height: 0.25rem;
		overflow: visible;
		position: relative;

		.remaining-count {
			position: absolute;
			inset: var(--height) 0 auto 0;
			text-align: right;
			color: var(--fg-primary);
			padding: 0.25em 0.5em;
		}
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

		.tab {
			display: flex;
			align-items: center;
			gap: 0.5em;
		}
	}
</style>
