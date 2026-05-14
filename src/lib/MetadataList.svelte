<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { type Snippet } from 'svelte';

	import IconExpand from '~icons/ri/arrow-right-s-line';
	import VirtualList from '$lib/VirtualList.svelte';

	import { metadataDefinitionComparator } from './protocols.js';
	import { getSettings } from './settings.svelte.js';

	interface Props {
		children: Snippet<[DB.Metadata, DB.MetadataValue, { collapsed: boolean }]>;
		testid?: string;
		/** Virtualize the list of metadatas. **Requires the parent element to have a defined height**. If there's grouping, this will be ignored and the list will not be virtualized, because it's not possible to. */
		virtualize?: boolean;
		/** Bind to scroll of the list. */
		scroll?: { y: number };
		definitions: DB.Metadata[];
		values: DB.MetadataValues;
		/** List of metadata IDs in order */
		ordering: DB.Protocol['metadataOrder'] | undefined;
		groups: DB.Protocol['metadataGroups'] | undefined;
	}

	let {
		children,
		virtualize = false,
		values,
		testid,
		definitions,
		ordering,
		groups = [],
		scroll = $bindable({ y: 0 }),
	}: Props = $props();

	const { showTechnicalMetadata } = $derived(getSettings());

	const compareDefinitions = $derived(metadataDefinitionComparator({ metadataOrder: ordering }));

	const groupedDefinitions = $derived(
		[
			...groups.map((group) => ({
				iterationKey: `group-${group.id}`,
				group,
				definitions: definitions
					.filter((d) => d.group === group?.id)
					.toSorted(compareDefinitions),
			})),
			...definitions
				.filter((def) => !def.group)
				.map((def) => ({
					iterationKey: `definition-${def.id}`,
					group: null,
					definitions: [def],
				})),
		]
			.filter(({ definitions }) => definitions.length > 0)
			.toSorted((a, b) => {
				const comparisons = a.definitions
					.flatMap((defA) => b.definitions.map((defB) => [defA, defB] as const))
					.map(([defA, defB]) => compareDefinitions(defA, defB))
					.filter((c) => c !== 0);

				if (comparisons.every((c) => c < 0)) return -1;
				if (comparisons.every((c) => c > 0)) return 1;
				return 0;
			})
	);

	/* Virtualize only if there are no groups, since item size height is drastically dynamic when collapsing/expanding groups, there's too much glitching when trying to virtualize in that case */
	const _virtualize = $derived(virtualize && groups.length === 0);
</script>

<div class="liste" data-testid={testid}>
	{#snippet metadata(item: (typeof groupedDefinitions)[number])}
		{@const { group, definitions } = item}
		<div class="definition-group">
			{#if group}
				<details open={!group.collapsed}>
					<summary>
						<div class="icon">
							<IconExpand />
						</div>
						{group.name}
					</summary>
					<p class="description">{group.description}</p>
					<div class="grouped-metadata">{@render defs()}</div>
				</details>
			{:else}
				{@render defs()}
			{/if}

			{#snippet defs()}
				{#each definitions as def (def.id)}
					{#if def.label || showTechnicalMetadata}
						{@render children(def, values[def.id], {
							collapsed: group?.collapsed ?? false,
						})}
					{/if}
				{/each}
			{/snippet}
		</div>
	{/snippet}

	{#if _virtualize}
		<VirtualList bind:scroll items={groupedDefinitions} item={metadata} />
	{:else}
		{#each groupedDefinitions as item (item.iterationKey)}
			{@render metadata(item)}
		{/each}
	{/if}
</div>

<style>
	.liste,
	.grouped-metadata {
		display: flex;
		flex-direction: column;
	}

	/* FIXME: :first-child doesn't work because of virtualization so we have extra whitespace on top of the list */
	.definition-group {
		--pad: calc(var(--metadata-list-gap, 0) / 2);
		padding: var(--pad) 0;
	}

	.grouped-metadata {
		gap: var(--metadata-list-gap, 1.5em);
	}

	.liste {
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		/* overflow-y: auto; */
		height: 100%;
	}

	.grouped-metadata {
		border-left: 2px solid var(--gray);
		padding-left: 1em;
		/** XXX: Align to center of collapse/expand icon in summary */
		margin-left: 10px;
	}

	details summary + p {
		margin-top: -0.5em;
		margin-bottom: 1em;
	}

	details:open .icon {
		rotate: 90deg;
	}

	summary {
		display: flex;
		align-items: center;
		gap: 0.5em;

		font-size: 1.2em;
		margin-bottom: 0.5em;

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			transition: rotate 0.1s ease;
		}

		&::marker {
			display: none;
		}
	}
</style>
