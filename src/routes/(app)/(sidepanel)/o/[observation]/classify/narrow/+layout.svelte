<script lang="ts" module>
	export const narrowingState = new NarrowingState();

	export const maximumListableCandidates = 5_000;
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconRemove from '~icons/ri/close-line';
	import IconRestart from '~icons/ri/restart-line';
	import IconSearch from '~icons/ri/search-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import { percent, plural } from '$lib/i18n.js';
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
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { compareBy, transformObject } from '$lib/utils.js';
	import VirtualList from '$lib/VirtualList.svelte';

	import { fullscreenState } from '../../+layout@(app).svelte';
	import Subject from '../Subject.svelte';
	import CandidateDetailsModal from './CandidateDetailsModal.svelte';
	import { distanceToChoices } from './candidates.js';
	import NarrowableGroupPicker from './NarrowableGroupPicker.svelte';
	import OptionsLoader from './OptionsLoader.svelte';
	import { NarrowingState } from './state.svelte.js';

	const { children } = $props();

	const observation = $derived(narrowingState.observation);

	const images = $derived(
		tables.Image.state.filter((image) => observation?.images.includes(image.id))
	);

	const narrowableGroup = $derived(narrowingState.narrowableGroup);

	let expandedSubject = $state(false);

	const definitions = $derived(narrowingState.definitions);

	const eliminated = $derived(
		narrowingState.allCandidates.filter((c) => !narrowingState.remainingCandidateIds.has(c.key))
	);

	const metadataValues = $derived(narrowingState.metadataValues);

	const focusedMetadata = $derived(
		tables.Metadata.getFromState(narrowingState.focusedMetadataId ?? '')
	);

	const focusedMetadataValue = $derived(
		observation?.metadataOverrides[narrowingState.focusedMetadataId ?? '']
	);

	let toggleFocusSearchBar = $state<() => void>();

	let candidatesTab = $state<'all' | 'remaining' | 'eliminated'>('all');
	const shownCandidates = $derived.by(() => {
		switch (candidatesTab) {
			case 'all':
				return narrowingState.allCandidates;
			case 'remaining':
				return narrowingState.remainingCandidates;
			case 'eliminated':
				return eliminated;
		}
	});

	const tab = $derived.by(() => {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/describe':
				return 'describe';
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/choices':
				return 'choices';
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates':
				return 'candidates';
			default:
				// Unreachable
				return 'describe';
		}
	});

	const tooManyRemainingCandidates = $derived(
		narrowingState.remainingCandidateIds.size > maximumListableCandidates
	);

	defineKeyboardShortcuts('classification', {
		tab: {
			help: 'Basculer entre les onglets Décrire, Choix et Candidats',
			async do() {
				switch (page.route.id) {
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/describe': {
						if (tooManyRemainingCandidates) {
							toasts.error(
								`Impossible de lister les candidats, il y en a plus de ${maximumListableCandidates.toLocaleString()}`
							);
							return;
						}

						return goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/choices`,
							page.params
						);
					}
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/choices': {
						return goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates`,
							page.params
						);
					}
					case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates': {
						return goto(
							`/(app)/(sidepanel)/o/[observation]/classify/narrow/describe`,
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

<CandidateDetailsModal bind:open={narrowingState.openCandidateDetails} />

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
			{#if focusedMetadata && focusedMetadataValue}
				<section class="focused" aria-labelledby="narrower-focused-metadata">
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
									recursive: true,
								});
							}}
						>
							<IconRemove />
						</ButtonIcon>
					</div>
				</section>
			{/if}

			<section class="explainer">
				<h2>Candidats</h2>

				<SegmentedGroup
					options={['all', 'remaining', 'eliminated']}
					bind:current={candidatesTab}
				>
					{#snippet option_all()}
						Tous
					{/snippet}
					{#snippet option_remaining()}
						Restants
					{/snippet}
					{#snippet option_eliminated()}
						Éliminés
					{/snippet}
				</SegmentedGroup>
			</section>

			<section class="candidates">
				<VirtualList
					empty="Aucun candidat à afficher"
					items={shownCandidates.toSorted(
						compareBy((c) =>
							distanceToChoices({
								descriptors: narrowingState.descriptors,
								candidate: c.key,
								choices: narrowingState.choices,
							})
						)
					)}
				>
					{#snippet item(option)}
						{const { images, label, key } = option}
						{const distance = distanceToChoices({
							descriptors: narrowingState.descriptors,
							candidate: option.key,
							choices: narrowingState.choices,
						})}
						{const closeness = 1 - distance / narrowingState.choices.size}
						{const crossout =
							!narrowingState.remainingCandidateIds.has(key) &&
							candidatesTab !== 'eliminated'}
						<button
							class="candidate"
							style:--closeness={candidatesTab === 'remaining' ? 0 : closeness}
							onclick={() => narrowingState.openCandidateDetails?.(option)}
						>
							<div class="image">
								{#if images && images.length > 0}
									<img src={images[0]} alt="" />
								{:else}
									?
								{/if}
							</div>
							<span class="label">
								{#if crossout}
									<s>{label}</s>
								{:else}
									{label}
								{/if}
							</span>
							{#if !Number.isNaN(closeness) && candidatesTab !== 'remaining'}
								<code
									class="closeness"
									use:tooltip={'Correspondance avec les choix effectués'}
								>
									{percent(closeness, 0, { pad: 'nbsp' })}
								</code>
							{/if}
						</button>
					{/snippet}
				</VirtualList>
			</section>
			<section class="actions">
				<div class="settings">
					<NarrowableGroupPicker />
				</div>
				<ButtonInk
					loading="Recommencer"
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
								if (def.group !== narrowingState.narrowableGroup)
									return [id, value];

								return undefined;
							})
						);

						narrowingState.resetScrollAndSearch();
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
					<ProgressBar progress={narrowingState.candidatesRatio} />
					<div class="remaining-count">
						{plural(narrowingState.remainingCandidateIds.size, [
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
									{narrowingState.remainingCandidateIds.size}
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
		/* overflow: hidden; */
	}

	aside {
		width: max(600px, 33%);
		flex-shrink: 0;
		display: grid;
		flex-direction: column;
		border-right: 1px solid var(--gray);
		transition: width 250ms ease;
		height: 100%;

		&:not(:has(.focused)) {
			grid-template-rows: max-content max-content auto max-content;
		}
		&:has(.focused) {
			grid-template-rows: max-content max-content max-content auto max-content;
		}
	}

	section.explainer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5em 0.5em;
	}

	section.focused {
		gap: 1em;
		padding: 0 0.5em;
		padding-top: 1em;

		&,
		> * {
			display: flex;
			align-items: center;
		}

		&.focused {
			/* border-bottom: 1px solid var(--gray); */
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

	section.candidates {
		overflow: auto;

		.candidate {
			padding: 0.75em;
			border-bottom: 1px solid var(--gray);
			font-size: 1rem;
			width: 100%;
			text-align: left;
			display: flex;
			align-items: center;
			gap: 1em;

			--highlight: rgb(from var(--bg-primary) r g b / 20%);

			background-image: linear-gradient(
				to right,
				var(--highlight) calc(var(--closeness) * 100%),
				transparent calc(var(--closeness) * 100%)
			);
		}

		.candidate:has(s) {
			color: var(--gray);
		}

		.candidate:is(:focus-visible, :hover) {
			background: rgb(from var(--bg-primary) r g b / 60%);
			color: var(--fg-primary);
		}

		.candidate .image {
			width: 2.5em;
			height: 2.5em;
			flex-shrink: 0;
			border-radius: var(--corner-radius);
			overflow: hidden;
			border: 1px solid var(--gray);
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.candidate .closeness {
			margin-left: auto;
			font-size: 0.85em;
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
		min-height: 100px;
		max-height: 40vh;
		height: 100%;
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
		z-index: 10;

		.remaining-count {
			position: absolute;
			top: var(--height);
			right: 0;
			text-align: right;
			color: var(--fg-primary);
			background: var(--bg-neutral);
			padding: 0.25em 0.5em;
			border-bottom-left-radius: var(--corner-radius);
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
