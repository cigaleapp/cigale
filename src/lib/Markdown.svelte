<script lang="ts">
	import { marked } from 'marked';

	import { isDebugMode } from '$lib/settings.svelte.js';

	interface Props {
		source: string;
	}

	const { source }: Props = $props();
</script>

{#await marked(source) then html}
	<div data-rendered-markdown="">{@html html}</div>
{:catch error}
	{#if isDebugMode()}
		<p class="error">Markdown invalide: {error}</p>
	{/if}
	{source}
{/await}

<style>
	:global([data-rendered-markdown] code, [data-rendered-markdown] pre) {
		font-size: 0.8em;
	}
</style>
