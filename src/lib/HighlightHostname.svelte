<script lang="ts">
	/**
	 * @typedef {object} Props
	 * @property {string|URL} url
	 * @property {boolean} [linkify] wrap with an <a> tag
	 */

	/** @type {Props} */
	const { url, linkify } = $props();

	const hostname = $derived(URL.canParse(url) ? new URL(url).hostname : '');
	const [before, after] = $derived(url.toString().split(hostname, 2));
</script>

{#if linkify}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a href={url.toString()}>
		{@render inside()}
	</a>
{:else}
	{@render inside()}
{/if}

{#snippet inside()}
	{before}<strong>{hostname}</strong>{after}
{/snippet}
