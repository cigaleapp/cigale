<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { TypedMetadataValue } from '$lib/metadata/types.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { dequal } from 'dequal';
	import { debounce } from 'es-toolkit';
	import { SvelteSet } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconExpand from '~icons/ri/arrow-right-s-line';
	import IconDelete from '~icons/ri/close-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import IfInViewport from '$lib/IfInViewport.svelte';
	import Metadata from '$lib/Metadata.svelte';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata/storage.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import RadialProgress from '$lib/RadialProgress.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { proxifyIfLocalhost } from '$lib/utils.js';

	import { narrowingState } from './+layout.svelte';
	import { matches } from './candidates.js';

	interface Props {
		definition: DB.Metadata;
		metadataValues: Record<NamespacedMetadataID, TypedMetadataValue<'enum'>>;
		remainingMetadataValues: Record<NamespacedMetadataID, Set<string>>;
		collapsible?: boolean;
		expanded?: Set<NamespacedMetadataID>;
		options: Record<NamespacedMetadataID, Map<string, DB.MetadataEnumVariant>>;
		/** Miliseconds to debounce on change for. Debounces to trailing edge. */
		onchangeDelay: number;
	}

	const {
		definition,
		metadataValues,
		remainingMetadataValues,
		collapsible = false,
		expanded = new SvelteSet(),
		options,
		onchangeDelay,
	}: Props = $props();

	/** Needed for scroll compensation when a new descriptor becomes selected (and therefor collapsed) */
	const collapsedDescriptorHeight = 75; /* px */

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const selected = $derived(
		options[definition.id]?.get(metadataValues[definition.id]?.value ?? '')?.label ?? ''
	);

	const moreSelections = $derived(
		Object.keys(metadataValues[definition.id]?.alternatives ?? {}).length
	);

	async function onChange({
		value,
		alternatives,
	}: {
		value: string | undefined;
		alternatives: Record<NamespacedMetadataID, string> | undefined;
	}) {
		if (!observation) return;
		if (
			metadataValues[definition.id]?.value === value &&
			dequal(
				new Set(Object.keys(metadataValues[definition.id]?.alternatives ?? {})),
				new Set(Object.keys(alternatives ?? {}))
			)
		)
			return;

		const choiceIndex = narrowingState.choicesHistory.indexOf(definition.id);

		if (value && choiceIndex === -1) {
			narrowingState.choicesHistory.push(definition.id);
		} else if (!value && choiceIndex !== -1) {
			narrowingState.choicesHistory.splice(choiceIndex, 1);
		}

		// Add new value to end unless we're removing it (undefined case)
		if (value) {
			await storeMetadataValue({
				db: databaseHandle(),
				subjectId: observation.id,
				metadataId: definition.id,
				type: 'enum',
				manuallyModified: true,
				sessionId: uiState.currentSession?.id,
				// updateReactiveState: false,
				value,
				alternatives,
			});
		} else {
			await deleteMetadataValue({
				db: databaseHandle(),
				subjectId: observation.id,
				metadataId: definition.id,
				sessionId: uiState.currentSession?.id,
				// updateReactiveState: false,
			});
		}
	}

	const debouncedOnChange = debounce(onChange, onchangeDelay);
</script>

{#if collapsible}
	<details
		style:--collapsed-descriptor-height={collapsedDescriptorHeight}
		bind:open={
			() => expanded.has(definition.id),
			(open) => {
				if (open) expanded.add(definition.id);
				else expanded.delete(definition.id);
			}
		}
	>
		<summary>
			<div class="icon">
				<IconExpand />
			</div>
			<img loading="lazy" src={proxifyIfLocalhost(definition.images?.[0])} alt="" />
			<span class="label">{definition.label}</span>
			<div class="selected">
				<OverflowableText text={selected} />
				{#if moreSelections > 0}
					<span
						class="more-selections"
						use:tooltip={plural(moreSelections, [
							'# autre option sélectionnée',
							'# autres options sélectionnées',
						])}
					>
						+ {moreSelections}
					</span>
				{/if}
			</div>
			<ButtonIcon
				onclick={async () => {
					if (!observation) return;

					await deleteMetadataValue({
						db: databaseHandle(),
						subjectId: observation.id,
						metadataId: definition.id,
						sessionId: uiState.currentSession?.id,
					});

					narrowingState.choicesHistory = narrowingState.choicesHistory.filter(
						(id) => id !== definition.id
					);
					expanded.delete(definition.id);
				}}
			>
				<IconDelete />
			</ButtonIcon>
		</summary>

		{@render metadata()}
	</details>
{:else}
	{@render metadata()}
{/if}

{#snippet metadata()}
	<Metadata
		removeByDeselect
		addToAlternativesBySelect
		options={[...(options[definition.id]?.values() ?? [])]}
		optionIsDisabled={(option) => {
			if (!option) return false;
			const remaining = remainingMetadataValues[definition.id];
			if (!remaining) return false;
			if (remaining.size === 0) return false;
			return !remaining.has(option.key);
		}}
		requiredness="none"
		{definition}
		value={metadataValues[definition.id]}
		onchange={debouncedOnChange}
		// TODO: flush debouncedOnChange when mouse quits the metadata component?
	>
		{#snippet enumOptionsExtraContent({ option: { key }, selected })}
			<IfInViewport
				computation={() => {
					const choices = structuredClone(narrowingState.choices);
					// eslint-disable-next-line svelte/prefer-svelte-reactivity
					choices.set(definition.id, (choices.get(definition.id) ?? new Set()).add(key));

					return matches({
						descriptors: narrowingState.descriptors,
						within: narrowingState.candidates.allIds,
						choices,
					}).size;
				}}
			>
				{#snippet children(countAfter)}
					{@const countBefore = narrowingState.candidates.remainingIds.size}
					{@const ratio = countAfter / countBefore}
					<div
						class="narrowing-power"
						use:tooltip={'Candidats restants après ce choix'}
						in:fade={{ duration: 100 }}
					>
						{#if !selected && ratio > 0 && ratio < 1}
							<div class="ratio" transition:fade={{ duration: 100 }}>
								<RadialProgress progress={1 - ratio} />
							</div>
						{/if}
						{#if !selected}
							<span
								transition:fade={{ duration: 100 }}
								class="filter-count"
								style:width="{narrowingState.candidates.all.length.toString()
									.length + 1}ch"
							>
								{#if countAfter > countBefore}
									+{countAfter - countBefore}
								{:else}
									{countAfter}
								{/if}
							</span>
						{/if}
					</div>
				{/snippet}
			</IfInViewport>
		{/snippet}
	</Metadata>
{/snippet}

<style>
	details {
		height: var(--collapsed-descriptor-height);

		summary {
			display: flex;
			align-items: center;
			gap: 1rem;

			.selected {
				margin-left: auto;
				font-size: 0.9em;
				color: var(--gay);
				max-width: 50%;
				display: flex;
				align-items: center;
				gap: 1em;

				.more-selections {
					text-wrap: nowrap;
					font-weight: bold;
				}
			}
		}

		&[open] summary {
			margin-bottom: 1em;
		}

		&[open] .icon {
			rotate: 90deg;
		}

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
		}

		img {
			width: 2.5em;
			height: 2.5em;
			object-fit: contain;
			border-radius: var(--corner-radius);
			overflow: hidden;
		}
	}

	.narrowing-power {
		display: flex;
		align-items: center;
		gap: 0.5em;
		z-index: 10;
	}
</style>
