<script lang="ts">
	import { isDebugMode, setSetting } from '$lib/settings.svelte.js';

	import ButtonInk from './ButtonInk.svelte';

	interface Props {
		inline?: boolean;
		data?: unknown;
	}

	const { inline, data }: Props = $props();

	const formatted = $derived(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
</script>

{#if isDebugMode()}
	{#if inline}
		<code class="debugonly">{formatted}</code>
	{:else}
		<div class="debugonly">
			<pre>{formatted}</pre>

			<p clas="explainer">Tu vois ceci car le mode debug est activé.</p>
			<ButtonInk
				onclick={async () => {
					await setSetting('debugMode', false);
				}}
			>
				Désactiver
			</ButtonInk>
		</div>
	{/if}
{/if}

<style>
	.debugonly {
		font-size: 0.8em;
		font-weight: 200;
	}

	.explainer {
		text-align: center;
		margin-top: 0.5em;
	}
</style>
