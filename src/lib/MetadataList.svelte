<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { Snippet } from 'svelte';

	import VirtualList from '@sveltejs/svelte-virtual-list';

	import IconExpand from '~icons/ri/arrow-down-s-line';

	import { metadataDefinitionComparator } from './protocols.js';
	import { getSettings } from './settings.svelte.js';

	interface Props {
		children: Snippet<[DB.Metadata]>;
		testid?: string;
		definitions: DB.Metadata[];
		/** List of metadata IDs in order */
		ordering: DB.Protocol['metadataOrder'] | undefined;
		groups: DB.Protocol['metadataGroups'] | undefined;
	}

	const { children, testid, definitions, ordering, groups = [] }: Props = $props();

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

	$inspect({
		groupedDefinitions,
	});
</script>

<div class="liste" data-testid={testid}>
	<VirtualList items={groupedDefinitions} let:item>
		{@const { group, definitions, iterationKey } = item}
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
						{@render children(def)}
					{/if}
				{/each}
			{/snippet}
		</div>
	</VirtualList>
</div>

<style>
	.liste,
	.grouped-metadata {
		gap: var(--metadata-list-gap, 1.5em);
		display: flex;
		flex-direction: column;
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
		rotate: -180deg;
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
