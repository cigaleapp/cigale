<script lang="ts">
	import type { Snippet } from 'svelte';

	import type * as DB from '$lib/database.js';

	import { getSettings } from './settings.svelte.js';

	interface Props {
		children: Snippet<[DB.Metadata]>;
		testid?: string;
		definitions: DB.Metadata[];
	}

	const { children, testid, definitions }: Props = $props();

	const { showTechnicalMetadata } = $derived(getSettings());
</script>

<div class="liste" data-testid={testid}>
	{#each definitions as def (def.id)}
		{#if def.label || showTechnicalMetadata}
			{@render children(def)}
		{/if}
	{/each}
</div>

<style>
	.liste {
		gap: var(--metadata-list-gap, 1.5em);
		display: flex;
		flex-direction: column;
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}
</style>
