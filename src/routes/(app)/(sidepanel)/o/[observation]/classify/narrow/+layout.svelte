<script lang="ts" module>
	export const narrowingState = $state({
		search: {
			describe: { query: '', resultsCount: 0 },
			choices: { query: '', resultsCount: 0 },
			candidates: { query: '', resultsCount: 0 },
		},
		scroll: {
			describe: { y: 0 },
			choices: { y: 0 },
			candidates: { y: 0 },
		},
		focusedMetadataId: undefined as NamespacedMetadataID | undefined,
		// TODO persist by using the observation's metadata overrides
		choicesHistory: [] as NamespacedMetadataID[],
		metadataValues: {} as Record<NamespacedMetadataID, TypedMetadataValue<'enum'>>,
		get choices() {
			return new Map(
				entries(this.metadataValues).map(([id, { value, alternatives }]) => [
					id,
					new Set([value.toString(), ...Object.keys(alternatives ?? {}).map(k => safeJSONParse(k).toString())]),
				] )
			);
		},

		definitions(narrowableGroup: string | undefined) {
			return tables.Metadata.state.filter((m) => m.group === narrowableGroup);
		},

		candidates: {
			all: [] as DB.MetadataEnumVariant[],
			get allIds() {
				return new Set(this.all.map((c) => c.key));
			},
			// remaining: [] as DB.MetadataEnumVariant[],
			remainingIds: new Set<string>(),
			get remaining() {
				return this.all.filter((c) => this.remainingIds.has(c.key));
			},
			get ratio() {
				return 1 - this.remaining.length / (this.all.length - 1 || 1);
			},
		},

		descriptors: new Map() as Descriptors,
	});

	export const maximumListableCandidates = 5_000;
</script>

<script lang="ts">
	import type { Descriptors } from './candidates.js';
	import type * as DB from '$lib/database.js';
	import type { TypedMetadataValue } from '$lib/metadata/types.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { SvelteSet } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconRemove from '~icons/ri/close-line';
	import IconRestart from '~icons/ri/restart-line';
	import IconSearch from '~icons/ri/search-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import { plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import Logo from '$lib/Logo.svelte';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata/storage.js';
	import MetadataInput from '$lib/MetadataInput.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import RadialProgress from '$lib/RadialProgress.svelte';
	import { scrollfader } from '$lib/scrollfader.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { entries, fromEntries, mapKeys, safeJSONParse, transformObject } from '$lib/utils.js';

	import { fullscreenState } from '../../+layout@(app).svelte';
	import Subject from '../Subject.svelte';
	import { computeDescriptors, getAllCandidates, matches, narrowingPower } from './candidates.js';
	import NarrowableGroupPicker from './NarrowableGroupPicker.svelte';
	import OptionsLoader, { options } from './OptionsLoader.svelte';

	const { children } = $props();

	const narrowableGroup = $derived(
		uiState.currentSession?.fullscreenClassifier.narrowableGroup || undefined
	);

	let expandedSubject = $state(false);

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const images = $derived(
		tables.Image.state.filter((image) => observation?.images.includes(image.id))
	);

	const definitions = $derived(
		narrowingState.definitions(uiState.currentSession?.fullscreenClassifier.narrowableGroup)
	);

	const metadataValues = $derived(narrowingState.metadataValues);

	const choices = $derived([
		...narrowingState.choicesHistory
			.toReversed()
			.filter((id) => id in metadataValues)
			.map((id) => [id, metadataValues[id]] as const),
		...entries(metadataValues).filter(([id]) => !narrowingState.choicesHistory.includes(id)),
	]);

	$effect(() => {
		narrowingState.focusedMetadataId =
			uiState.currentSession?.fullscreenClassifier.focusedMetadata ??
			uiState.classificationMetadataId;
	});

	$effect(() => {
		void (async () => {
			if (!narrowableGroup) return;
			if (!narrowingState.focusedMetadataId) return;
			narrowingState.candidates.all = await getAllCandidates({
				narrowableGroup,
				focusedMetadataId: narrowingState.focusedMetadataId,
			});
		})();
	});

	$effect(() => {
		console.time('update matches')
		narrowingState.candidates.remainingIds = matches({
			descriptors: narrowingState.descriptors,
			within: narrowingState.candidates.allIds,
			choices: narrowingState.choices,
		});
		console.timeEnd('update matches');
	});

	const focusedMetadata = $derived(
		tables.Metadata.getFromState(narrowingState.focusedMetadataId ?? '')
	);

	const focusedMetadataValue = $derived(
		observation?.metadataOverrides[narrowingState.focusedMetadataId ?? '']
	);

	$effect(() => {
		if (!observation) return;
		// Only get values that are relevant to the narrowing view
		narrowingState.metadataValues = transformObject(
			observation.metadataOverrides,
			(id, value) => {
				const def = definitions.find((d) => d.id === id);
				if (!def) return;
				if (def.type !== 'enum') return;
				return [id, value];
			}
		);
	});

	$effect(() => {
		if (!options) return;
		if (!narrowingState.candidates.all.length) return;

		narrowingState.descriptors = computeDescriptors({
			allCandidates: narrowingState.candidates.all,
			options,
		});
	});

	let toggleFocusSearchBar = $state<() => void>();

	const tab = $derived.by(() => {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe':
				return 'describe';
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/choices':
				return 'choices';
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates':
				return 'candidates';
			default:
				// Unreachable
				return 'describe';
		}
	});

	const tooManyRemainingCandidates = $derived(
		narrowingState.candidates.remaining.length > maximumListableCandidates
	);

	defineKeyboardShortcuts('classification', {
		tab: {
			help: 'Basculer entre les onglets Décrire, Choix et Candidats',
			async do() {
				switch (page.route.id) {
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe': {
						if (tooManyRemainingCandidates) {
							toasts.error(
								`Impossible de lister les candidats, il y en a plus de ${maximumListableCandidates.toLocaleString()}`
							);
							return;
						}

						return goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/choices`,
							page.params
						);
					}
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/choices': {
						return goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates`,
							page.params
						);
					}
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates': {
						return goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe`,
							page.params
						);
					}
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

<OptionsLoader>
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
							tables.Image.getFromState(fullscreenState.currentImage ?? '') ??
							images[0],
						(image) => {
							fullscreenState.currentImage = image?.id;
						}
					}
				/>
			</section>
			<section class="choices" {@attach scrollfader}>
				<ol>
					{#if focusedMetadata && focusedMetadataValue}
						<li class="focused" aria-labelledby="narrower-focused-metadata">
							<div class="metadata" id="narrower-focused-metadata">
								<OverflowableText text={focusedMetadata.label} />
							</div>
							<div class="input">
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
							<div class="todo"></div>
							<div class="confidence">
								<ConfidencePercentage value={focusedMetadataValue.confidence} />
							</div>

							<div class="remove">
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
				</ol>
			</section>
			<section class="actions">
				<div class="settings">
					<NarrowableGroupPicker />
				</div>
				<ButtonInk
					onclick={async () => {
						if (!observation) return;
						const obs = await tables.Observation.raw.get(observation.id);
						if (!obs) return;
						narrowingState.choicesHistory = [];
						// Wipe all metadata values that are in the current metadata group
						await tables.Observation.update(
							observation.id,
							'metadataOverrides',
							transformObject(obs.metadataOverrides, (id, value) => {
								const def = definitions.find((d) => d.id === id);
								if (!def) return [id, value];
								if (
									def.group !==
									uiState.currentSession.fullscreenClassifier.narrowableGroup
								)
									return [id, value];

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

		<div class="content-and-footer" class:no-narrowable-group={!narrowableGroup}>
			{#if !narrowableGroup}
				<Logo variant="empty" />
				<p>Choisir un groupe de métadonnées avec lequel classifier par élimination</p>
				<NarrowableGroupPicker />
			{:else}
				<div class="progress" data-testid="remaining-candidates">
					<ProgressBar progress={narrowingState.candidates.ratio} />
					<div class="remaining-count">
						{plural(narrowingState.candidates.remaining.length, [
							'# restant',
							'# restants',
						])}
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
						options={['describe', 'choices', 'candidates']}
						disabled={(key) => {
							if (key === 'candidates' && tooManyRemainingCandidates) {
								return `Plus de ${maximumListableCandidates.toLocaleString()} candidats restants`;
							}
							return false;
						}}
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
						{#snippet option_describe()}
							<div
								class="tab"
								use:tooltip={{ text: "Décrire l'observation", keyboard: 'tab' }}
							>
								Décrire
							</div>
						{/snippet}
						{#snippet option_choices()}
							<div
								class="tab"
								use:tooltip={{
									text: 'Voir les descriptions choisies',
									keyboard: 'tab',
								}}
							>
								Choix
								<code class="candidates-count">
									{Object.keys(metadataValues).length}
								</code>
							</div>
						{/snippet}
						{#snippet option_candidates({ disabled })}
							<div
								class="tab"
								use:tooltip={disabled
									? undefined
									: { text: 'Voir les candidats possibles', keyboard: 'tab' }}
							>
								Candidats
								<code class="candidates-count">
									{narrowingState.candidates.remaining.length}
								</code>
							</div>
						{/snippet}
					</SegmentedGroup>
				</footer>
			{/if}
		</div>
	</div>
</OptionsLoader>

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
		scrollbar-gutter: stable;

		ol {
			list-style: none;
			padding: 0;
			height: 100%;
			display: flex;
			flex-direction: column;
			gap: 1em;
		}

		li:not(.empty) {
			gap: 1em;
			padding: 0 0.5em;

			&,
			> * {
				display: flex;
				align-items: center;
			}

			&.focused {
				border-bottom: 1px solid var(--gray);
				padding: 0.5em;
			}

			.filter-count {
				flex-shrink: 0;
			}

			.metadata {
				min-width: 0;
				max-width: 30ch;
				color: var(--gay);
				text-transform: uppercase;
				letter-spacing: 0.25ch;
				font-size: 0.85em;
			}

			.input {
				flex-shrink: 0;
				margin-left: auto;
				width: 20ch;
			}
		}

		ol:not(:has(.focused)) li:first-child {
			padding-top: 0.5em;
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

	aside .actions {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
		align-items: end;
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

	.content-and-footer.no-narrowable-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1em;
		padding: 2em;

		/* Logo size */
		--size: 5em;
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
