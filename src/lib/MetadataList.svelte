<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		testid?: string;
	}

	let { children, testid }: Props = $props();
</script>

<div class="liste" data-testid={testid}>
	{@render children()}
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
