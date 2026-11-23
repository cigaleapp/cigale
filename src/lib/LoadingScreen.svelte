<script lang="ts">
	import type { Snippet } from 'svelte';

	import { fade } from 'svelte/transition';

	import { errorMessage } from './i18n.js';
	import Logo from './Logo.svelte';

	interface Props {
		loading?: boolean | string | undefined;
		/** A string is shown as-is; any other truthy value is formatted with `errorMessage`. */
		failure?: unknown;
		empty?: boolean | string | undefined;
		children?: Snippet;
	}

	const { loading = false, failure = '', empty = '', children }: Props = $props();

	const failureText = $derived(
		typeof failure === 'string' ? failure : failure ? errorMessage(failure) : ''
	);

	function fallbackString(value: string | boolean, fallback: string): string {
		return typeof value === 'string' ? value : fallback;
	}
</script>

{#if failureText}
	<div class="error" in:fade={{ duration: 200 }}>
		<Logo variant="error" />
		{failureText}
	</div>
{:else if loading}
	<div class="loading" in:fade={{ duration: 200 }}>
		<Logo loading />
		{fallbackString(loading, 'Chargement…')}
	</div>
{:else if empty}
	<div class="empty" in:fade={{ duration: 200 }}>
		<Logo variant="empty" />
		{fallbackString(empty, 'Rien à voir ici')}
	</div>
{:else if children}
	{@render children()}
{/if}

<style>
	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;

		height: 100%;
		width: 100%;

		--size: 5rem; /* Logo size */

		color: var(--fg-neutral);
	}
</style>
