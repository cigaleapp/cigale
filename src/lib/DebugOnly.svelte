<script lang="ts">
	import { isDebugMode } from '$lib/settings.svelte.js';

	interface Props {
		inline?: boolean;
		data?: unknown;
	}

	const { inline, data }: Props = $props();
</script>

{#if isDebugMode()}
	<svelte:element this={inline ? 'code' : 'pre'} class="debugonly"
		>{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</svelte:element
	>
{/if}

<style>
	.debugonly {
		font-size: 0.8em;
		font-family: var(--font-mono);
		font-weight: 200;
	}
</style>
